import logging
from typing import Optional
from app.config import EMBEDDING_MODEL

logger = logging.getLogger(__name__)

# Cached embedding model instance
_embedding_model_instance = None


def get_embedding_model():
    """
    Returns a singleton instance of HuggingFaceEmbeddings using sentence-transformers.
    Uses the model specified in the configuration (default: all-MiniLM-L6-v2).
    """
    global _embedding_model_instance
    if _embedding_model_instance is None:
        logger.info(f"Initializing embedding model: {EMBEDDING_MODEL}")
        try:
            # Modern langchain-huggingface package
            from langchain_huggingface import HuggingFaceEmbeddings

            _embedding_model_instance = HuggingFaceEmbeddings(
                model_name=EMBEDDING_MODEL,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
        except ImportError:
            # Fallback to langchain_community
            logger.warning(
                "langchain-huggingface not available; falling back to langchain_community.embeddings"
            )
            from langchain_community.embeddings import HuggingFaceEmbeddings

            _embedding_model_instance = HuggingFaceEmbeddings(
                model_name=EMBEDDING_MODEL,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
        logger.info("Embedding model initialized successfully.")

    return _embedding_model_instance
