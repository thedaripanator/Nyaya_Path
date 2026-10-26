import logging
from typing import List, Optional, Dict, Any
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import CHUNK_SIZE, CHUNK_OVERLAP

logger = logging.getLogger(__name__)


def get_text_splitter(
    chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP
) -> RecursiveCharacterTextSplitter:
    """
    Returns configured RecursiveCharacterTextSplitter optimized for legal text.
    Legal texts often separate paragraphs with double newlines, numbered lists, and sections.
    """
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".\n", ". ", "; ", ", ", " "],
        length_function=len,
    )


def chunk_documents(
    documents: List[Document],
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
    additional_metadata: Optional[Dict[str, Any]] = None,
) -> List[Document]:
    """
    Splits documents into smaller chunks while preserving and enriching metadata.

    Args:
        documents: List of LangChain Document objects.
        chunk_size: Maximum characters per chunk (default from config: 1000).
        chunk_overlap: Character overlap between consecutive chunks (default: 150).
        additional_metadata: Optional dictionary of metadata to attach to every chunk.

    Returns:
        List of chunked Document objects with preserved and enriched metadata.
    """
    if not documents:
        return []

    splitter = get_text_splitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    split_docs = splitter.split_documents(documents)

    enriched_docs: List[Document] = []
    for idx, doc in enumerate(split_docs):
        # Base metadata defaults
        meta = {
            "document_type": "legal_judgment",
            "chunk_index": idx,
            **doc.metadata,
        }

        # Apply additional metadata if provided (e.g., case_name, court, source_type, owner_id)
        if additional_metadata:
            meta.update(additional_metadata)

        enriched_docs.append(Document(page_content=doc.page_content, metadata=meta))

    logger.info(
        f"Chunked {len(documents)} input document(s) into {len(enriched_docs)} chunks."
    )
    return enriched_docs
