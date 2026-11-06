import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of ml-service
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# Qdrant Vector Database Configuration
QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION", "nyaya_path")

# Hugging Face Embeddings Configuration
EMBEDDING_MODEL: str = os.getenv(
    "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
)

# Local Qwen3 model configuration
MODEL_API_URL: str = os.getenv(
    "MODEL_API_URL",
    "http://localhost:8080/v1/chat/completions"
)

# LLM Configuration (Google Gemini)
GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
ML_SERVICE_API_KEY: str = os.getenv("ML_SERVICE_API_KEY", "")
QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
QDRANT_LOCAL_MODE: bool = os.getenv("QDRANT_LOCAL_MODE", "false").lower() == "true"

# Text chunking configuration
CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))

# Directory Paths
DATA_DIR: Path = BASE_DIR / "data"
UPLOADS_DIR: Path = DATA_DIR / "uploads" / "lawyer_documents"
KAGGLE_DATA_DIR: Path = DATA_DIR / "kaggle" / "supreme_court_judgments"
QDRANT_STORAGE_DIR: Path = DATA_DIR / "qdrant_storage"

# Ensure directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
KAGGLE_DATA_DIR.mkdir(parents=True, exist_ok=True)
QDRANT_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
