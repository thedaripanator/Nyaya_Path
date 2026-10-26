import sys
import logging
from pathlib import Path

# Add ml-service root to python sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.config import EMBEDDING_MODEL, QDRANT_COLLECTION
from app.services.common.embedding_service import get_embedding_model
from app.services.common.qdrant_service import get_qdrant_client, get_vector_store

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("create_embeddings")


def verify_embeddings_and_store():
    """
    Validates sentence-transformers embedding generation and Qdrant integration.
    """
    logger.info("Initializing Hugging Face embedding model...")
    embeddings = get_embedding_model()

    test_text = "The Supreme Court of India held that the right to privacy is a fundamental right under Article 21."
    vector = embeddings.embed_query(test_text)

    logger.info(f"Model: {EMBEDDING_MODEL}")
    logger.info(f"Sample text: '{test_text}'")
    logger.info(f"Generated embedding vector dimension: {len(vector)}")
    logger.info(f"First 5 vector components: {vector[:5]}")

    logger.info("Verifying Qdrant vector store connection...")
    client = get_qdrant_client()
    collections = client.get_collections()
    logger.info(f"Available Qdrant collections: {[col.name for col in collections.collections]}")

    store = get_vector_store()
    logger.info(f"Qdrant vector store successfully linked to collection: '{QDRANT_COLLECTION}'")
    print("\nEmbeddings and Vector Store are operating correctly!")


if __name__ == "__main__":
    verify_embeddings_and_store()
