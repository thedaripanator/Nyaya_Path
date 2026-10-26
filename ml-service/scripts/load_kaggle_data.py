import os
import sys
import re
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional

# Add ml-service root to python sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from langchain_core.documents import Document
from app.config import KAGGLE_DATA_DIR
from app.services.common.pdf_processor import extract_text_from_file
from app.services.common.text_chunker import chunk_documents
from app.services.common.qdrant_service import (
    get_qdrant_client,
    add_documents,
    get_vector_store,
)
from app.config import QDRANT_COLLECTION

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("load_kaggle_data")


def parse_legal_metadata_from_file(file_path: Path, first_page_text: str = "") -> Dict[str, Any]:
    """
    Extracts heuristic legal metadata (case name, year, court, citation)
    from filename and first page content.
    """
    filename = file_path.name
    stem = file_path.stem

    # Extract Year from filename (e.g. 1950, 2021)
    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", stem)
    year = year_match.group(1) if year_match else "Unknown Year"

    # Clean case title from filename
    cleaned_title = re.sub(r"[\-_]", " ", stem)
    # Remove year from title if present
    cleaned_title = re.sub(r"\b(19\d{2}|20\d{2})\b", "", cleaned_title).strip()
    if not cleaned_title or len(cleaned_title) < 3:
        cleaned_title = stem

    citation = None
    judges = None

    # Inspect first 1000 characters of text for citation patterns
    if first_page_text:
        cit_match = re.search(r"(\b\d{4}\s+(?:AIR|SCC|INSC|SCR)\s+\d+\b)", first_page_text, re.IGNORECASE)
        if cit_match:
            citation = cit_match.group(1)

        bench_match = re.search(r"(?:Hon'ble\s+|Before\s+|CORAM\s*:\s*)([^\n]+)", first_page_text, re.IGNORECASE)
        if bench_match:
            judges = bench_match.group(1).strip()[:100]

    return {
        "case_name": cleaned_title,
        "court": "Supreme Court of India",
        "year": year,
        "citation": citation,
        "judges": judges,
        "source": filename,
        "source_path": str(file_path.resolve()),
        "source_type": "kaggle",
        "document_type": "legal_judgment",
    }


def get_indexed_sources(client, collection_name: str) -> set:
    """
    Retrieves set of already indexed document filenames to prevent duplicate ingestion.
    """
    indexed_sources = set()
    try:
        from qdrant_client.http import models as rest_models

        # Scroll points to check existing sources
        limit = 1000
        offset = None
        while True:
            scroll_result = client.scroll(
                collection_name=collection_name,
                limit=limit,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )
            points, next_offset = scroll_result
            for point in points:
                payload = point.payload or {}
                # Langchain Qdrant stores metadata in 'metadata' key
                meta = payload.get("metadata", payload)
                src = meta.get("source")
                if src:
                    indexed_sources.add(src)

            if next_offset is None or not points:
                break
            offset = next_offset

        logger.info(f"Found {len(indexed_sources)} already-indexed sources in Qdrant collection '{collection_name}'.")
    except Exception as e:
        logger.warning(f"Could not retrieve existing index list (collection may be empty/new): {e}")

    return indexed_sources


def load_kaggle_data(
    data_dir: Path = KAGGLE_DATA_DIR,
    sample_limit: Optional[int] = None,
    batch_size: int = 50,
):
    """
    Ingests Kaggle Supreme Court judgments into Qdrant vector database.
    """
    if not data_dir.exists():
        logger.error(f"Directory {data_dir} does not exist. Creating it.")
        data_dir.mkdir(parents=True, exist_ok=True)
        return

    # Find all supported files (.pdf, .txt)
    supported_extensions = {".pdf", ".txt", ".text"}
    all_files = [f for f in data_dir.glob("**/*") if f.is_file() and f.suffix.lower() in supported_extensions]

    if not all_files:
        logger.warning(
            f"No legal documents (.pdf or .txt) found in {data_dir}.\n"
            "Please download the Kaggle Indian Supreme Court Judgments dataset and place files there.\n"
            "Dataset URL: https://www.kaggle.com/datasets/vangap/indian-supreme-court-judgments"
        )
        return

    logger.info(f"Discovered {len(all_files)} document(s) in {data_dir}")

    # Check already indexed sources for idempotency
    vector_store = get_vector_store()
    client = get_qdrant_client()
    indexed_sources = get_indexed_sources(client, QDRANT_COLLECTION)

    files_to_process = [f for f in all_files if f.name not in indexed_sources]
    skipped_count = len(all_files) - len(files_to_process)
    if skipped_count > 0:
        logger.info(f"Skipping {skipped_count} documents that are already indexed.")

    if sample_limit:
        files_to_process = files_to_process[:sample_limit]
        logger.info(f"Applying sample limit: processing {len(files_to_process)} document(s).")

    if not files_to_process:
        logger.info("No new documents to process.")
        return

    total_chunks_indexed = 0

    for idx, file_path in enumerate(files_to_process, start=1):
        logger.info(f"[{idx}/{len(files_to_process)}] Processing: {file_path.name}")
        try:
            # 1. Extract text
            raw_docs = extract_text_from_file(str(file_path))
            if not raw_docs:
                logger.warning(f"No text extracted from {file_path.name}, skipping.")
                continue

            first_text = raw_docs[0].page_content if raw_docs else ""
            metadata = parse_legal_metadata_from_file(file_path, first_text)

            # 2. Chunk documents
            chunks = chunk_documents(raw_docs, additional_metadata=metadata)

            # 3. Add chunks in bounded batches to limit peak memory and request size.
            for start in range(0, len(chunks), max(1, batch_size)):
                add_documents(chunks[start:start + max(1, batch_size)])
            total_chunks_indexed += len(chunks)
            logger.info(f"Successfully indexed {len(chunks)} chunks for {file_path.name}")

        except Exception as e:
            logger.error(f"Failed to process {file_path.name}: {e}", exc_info=True)

    logger.info(
        f"Kaggle ingestion completed! Processed {len(files_to_process)} file(s), "
        f"indexed a total of {total_chunks_indexed} chunk(s)."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest Kaggle Supreme Court Judgments into Qdrant")
    parser.add_argument(
        "--sample",
        type=int,
        default=None,
        help="Process only a small sample of documents (e.g. --sample 5)",
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default=os.getenv("KAGGLE_DATA_DIR", str(KAGGLE_DATA_DIR)),
        help="Path to the directory containing judgments",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Batch size for vector ingestion",
    )

    args = parser.parse_args()
    load_kaggle_data(
        data_dir=Path(args.data_dir),
        sample_limit=args.sample,
        batch_size=args.batch_size,
    )
