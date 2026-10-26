import os
import logging
from pathlib import Path
from typing import List
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, PyMuPDFLoader, TextLoader

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> List[Document]:
    """
    Extracts text from a PDF file using LangChain's PyPDFLoader.
    Preserves page and source metadata for legal citations.

    Args:
        file_path: Absolute or relative path to the PDF file.

    Returns:
        List of LangChain Document objects containing page content and metadata.
    """
    path_obj = Path(file_path)
    if not path_obj.exists():
        raise FileNotFoundError(f"PDF file not found at: {file_path}")

    documents: List[Document] = []

    try:
        loader = PyPDFLoader(str(path_obj))
        documents = loader.load()
    except Exception as e:
        logger.warning(
            f"PyPDFLoader encountered an issue with {file_path}: {e}. Retrying with PyMuPDFLoader..."
        )
        try:
            loader = PyMuPDFLoader(str(path_obj))
            documents = loader.load()
        except Exception as e_mu:
            logger.error(f"Failed to load PDF {file_path} with both loaders: {e_mu}")
            raise e_mu

    # Standardize and clean metadata
    normalized_docs: List[Document] = []
    for doc in documents:
        page_num = doc.metadata.get("page", 0)
        # LangChain PyPDFLoader pages are 0-indexed; convert to 1-indexed for legal citation clarity
        page_display = page_num + 1 if isinstance(page_num, int) else page_num

        meta = {
            **doc.metadata,
            "source": path_obj.name,
            "source_path": str(path_obj.resolve()),
            "page": page_display,
            "document_type": "legal_judgment",
        }
        normalized_docs.append(Document(page_content=doc.page_content, metadata=meta))

    logger.info(f"Extracted {len(normalized_docs)} pages from {path_obj.name}")
    return normalized_docs


def extract_text_from_file(file_path: str) -> List[Document]:
    """
    Generic loader supporting both PDF and plain text documents (common in Kaggle dataset).
    """
    path_obj = Path(file_path)
    if not path_obj.exists():
        raise FileNotFoundError(f"File not found at: {file_path}")

    suffix = path_obj.suffix.lower()
    if suffix == ".pdf":
        return extract_text_from_pdf(file_path)
    elif suffix in [".txt", ".text"]:
        loader = TextLoader(str(path_obj), encoding="utf-8")
        docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = path_obj.name
            doc.metadata["source_path"] = str(path_obj.resolve())
            doc.metadata["page"] = 1
            doc.metadata["document_type"] = "legal_judgment"
        return docs
    else:
        raise ValueError(f"Unsupported file type: {suffix}. Supported: .pdf, .txt")
