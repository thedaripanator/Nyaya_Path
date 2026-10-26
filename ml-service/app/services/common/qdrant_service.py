import logging
from typing import List, Dict, Any, Optional, Tuple
from langchain_core.documents import Document
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest_models
from app.config import (
    QDRANT_URL,
    QDRANT_API_KEY,
    QDRANT_LOCAL_MODE,
    QDRANT_COLLECTION,
    QDRANT_STORAGE_DIR,
)
from app.services.common.embedding_service import get_embedding_model

logger = logging.getLogger(__name__)

# Cached client and vector store instances
_qdrant_client_instance: Optional[QdrantClient] = None
_vector_store_instance = None


def get_qdrant_client() -> QdrantClient:
    """
    Returns a QdrantClient.
    Connects to configured Qdrant. Local embedded storage is used only when
    QDRANT_LOCAL_MODE is explicitly enabled for development.
    """
    global _qdrant_client_instance
    if _qdrant_client_instance is not None:
        return _qdrant_client_instance

    # Local disk is an explicit development option; production should use hosted Qdrant.
    if QDRANT_LOCAL_MODE:
        QDRANT_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        _qdrant_client_instance = QdrantClient(path=str(QDRANT_STORAGE_DIR))
        return _qdrant_client_instance

    try:
        logger.info(f"Connecting to Qdrant at {QDRANT_URL}...")
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY or None, timeout=10.0)
        # Test connection
        client.get_collections()
        logger.info(f"Successfully connected to Qdrant server at {QDRANT_URL}")
        _qdrant_client_instance = client
        return _qdrant_client_instance
    except Exception as e:
        logger.error("Could not connect to configured Qdrant at %s: %s", QDRANT_URL, e)

    raise RuntimeError(f"Hosted Qdrant is unavailable at {QDRANT_URL}; set QDRANT_LOCAL_MODE=true only for local development.")


def ensure_collection_exists(client: QdrantClient, collection_name: str, vector_size: int):
    """
    Ensures that the target Qdrant collection exists. Creates it with Cosine distance if missing.
    """
    try:
        collections = client.get_collections().collections
        existing_names = [col.name for col in collections]
        if collection_name not in existing_names:
            logger.info(
                f"Collection '{collection_name}' not found. Creating collection with vector size {vector_size}..."
            )
            client.create_collection(
                collection_name=collection_name,
                vectors_config=rest_models.VectorParams(
                    size=vector_size,
                    distance=rest_models.Distance.COSINE,
                ),
            )
            logger.info(f"Collection '{collection_name}' created successfully.")
    except Exception as e:
        logger.warning(f"Error checking/creating collection '{collection_name}': {e}")


def get_vector_store():
    """
    Returns the LangChain Qdrant vector store using the shared embedding model.
    """
    global _vector_store_instance
    if _vector_store_instance is not None:
        return _vector_store_instance

    client = get_qdrant_client()
    embedding_model = get_embedding_model()

    # Determine vector dimension dynamically
    test_vec = embedding_model.embed_query("Nyaya Path legal test")
    vector_size = len(test_vec)

    ensure_collection_exists(client, QDRANT_COLLECTION, vector_size)

    # Use modern langchain_qdrant with fallback to langchain_community
    try:
        from langchain_qdrant import QdrantVectorStore

        _vector_store_instance = QdrantVectorStore(
            client=client,
            collection_name=QDRANT_COLLECTION,
            embedding=embedding_model,
        )
    except ImportError:
        logger.warning("langchain-qdrant not found; falling back to langchain_community.vectorstores.Qdrant")
        from langchain_community.vectorstores import Qdrant

        _vector_store_instance = Qdrant(
            client=client,
            collection_name=QDRANT_COLLECTION,
            embeddings=embedding_model,
        )

    return _vector_store_instance


def _field_match(key: str, value: Any) -> rest_models.Filter:
    """Match a payload field whether it is stored at root or under metadata."""
    keys = [key] if key.startswith("metadata.") else [key, f"metadata.{key}"]
    return rest_models.Filter(
        should=[
            rest_models.FieldCondition(key=k, match=rest_models.MatchValue(value=value))
            for k in keys
        ]
    )


def _build_qdrant_filter(filter_dict: Optional[Dict[str, Any]]) -> Optional[rest_models.Filter]:
    """
    Builds a Qdrant rest_models.Filter from a dictionary of metadata key-values.
    Supports filtering by source_type, owner_id, court, year, etc.

    Special key:
      _public_or_owner: include public kaggle judgments OR this lawyer's uploads.
    """
    if not filter_dict:
        return None

    owner_id = filter_dict.get("_public_or_owner")
    if owner_id:
        should = [_field_match("source_type", "kaggle")]
        if str(owner_id).strip():
            should.append(_field_match("owner_id", str(owner_id)))
        return rest_models.Filter(should=should)

    must_filters = []
    for key, value in filter_dict.items():
        if value is None or str(key).startswith("_"):
            continue
        must_filters.append(_field_match(key, value))

    if not must_filters:
        return None

    return rest_models.Filter(must=must_filters)


def add_documents(documents: List[Document]) -> List[str]:
    """
    Adds a list of LangChain Document objects to the Qdrant collection.

    Args:
        documents: List of LangChain Documents with content and metadata.

    Returns:
        List of generated IDs for the inserted documents.
    """
    if not documents:
        return []

    vector_store = get_vector_store()
    ids = vector_store.add_documents(documents)
    logger.info(f"Added {len(documents)} document chunk(s) to Qdrant collection '{QDRANT_COLLECTION}'.")
    return ids


def search_documents(
    query: str,
    k: int = 5,
    filter_dict: Optional[Dict[str, Any]] = None,
) -> List[Document]:
    """
    Searches for documents semantically similar to the given query.

    Args:
        query: Query string.
        k: Number of relevant chunks to retrieve.
        filter_dict: Optional dictionary for metadata filtering (e.g. {"source_type": "kaggle"}).

    Returns:
        List of matching LangChain Document objects.
    """
    vector_store = get_vector_store()
    qdrant_filter = _build_qdrant_filter(filter_dict)

    try:
        if qdrant_filter:
            results = vector_store.similarity_search(query, k=k, filter=qdrant_filter)
        else:
            results = vector_store.similarity_search(query, k=k)
    except Exception as e:
        if qdrant_filter:
            logger.error("Filtered search failed; refusing an unfiltered retry to protect document privacy.")
            raise RuntimeError("Private legal document search failed safely.") from e
        results = vector_store.similarity_search(query, k=k)

    return results


def search_documents_with_scores(
    query: str,
    k: int = 5,
    filter_dict: Optional[Dict[str, Any]] = None,
) -> List[Tuple[Document, float]]:
    """
    Searches for documents with relevance/similarity scores.

    Args:
        query: Query string.
        k: Number of relevant chunks to retrieve.
        filter_dict: Optional dictionary for metadata filtering.

    Returns:
        List of tuples: (Document, score).
    """
    vector_store = get_vector_store()
    qdrant_filter = _build_qdrant_filter(filter_dict)

    try:
        if qdrant_filter:
            results = vector_store.similarity_search_with_score(query, k=k, filter=qdrant_filter)
        else:
            results = vector_store.similarity_search_with_score(query, k=k)
    except Exception as e:
        if qdrant_filter:
            logger.error("Filtered scored search failed; refusing an unfiltered retry to protect document privacy.")
            raise RuntimeError("Private legal document search failed safely.") from e
        results = vector_store.similarity_search_with_score(query, k=k)

    return results
