import logging
from typing import List, Dict, Any
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


def extract_citations(documents: List[Document]) -> List[Dict[str, Any]]:
    """
    Extracts and formats source information from retrieved LangChain Documents.

    Target schema:
    {
        "source": "...",
        "page": "...",
        "case_name": "...",
        "citation": "...",
        "year": "..."
    }

    Rule: Only return fields that actually exist and are non-empty in the metadata.
    Avoid duplicates across chunks from the same page and source.
    """
    citations: List[Dict[str, Any]] = []
    seen = set()

    for doc in documents:
        meta = doc.metadata or {}
        citation_item: Dict[str, Any] = {}

        # 1. source
        source_val = meta.get("source") or meta.get("source_path")
        if source_val:
            citation_item["source"] = str(source_val)

        # 2. page
        page_val = meta.get("page")
        if page_val is not None:
            citation_item["page"] = str(page_val)

        # 3. case_name
        case_name_val = meta.get("case_name") or meta.get("title")
        if case_name_val:
            citation_item["case_name"] = str(case_name_val)

        # 4. citation
        citation_val = meta.get("citation")
        if citation_val:
            citation_item["citation"] = str(citation_val)

        # 5. year
        year_val = meta.get("year")
        if year_val:
            citation_item["year"] = str(year_val)

        # Only add if at least one meaningful field exists
        if citation_item:
            # Create a signature for deduplication
            signature = (
                citation_item.get("source"),
                citation_item.get("page"),
                citation_item.get("case_name"),
                citation_item.get("citation"),
            )
            if signature not in seen:
                seen.add(signature)
                citations.append(citation_item)

    return citations
