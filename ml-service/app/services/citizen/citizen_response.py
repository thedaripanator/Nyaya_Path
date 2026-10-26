import logging
from typing import List, Dict, Any
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


def format_citizen_sources(documents: List[Document]) -> List[Dict[str, Any]]:
    """
    Formats source documents into simple, citizen-friendly references.
    Omits cryptic technical jargon while maintaining authenticity and transparency.

    Returns:
    [
        {
            "source": "Judgment_file.pdf",
            "page": 3,
            "case_name": "State vs. ABC",
            "year": "2021",
            "court": "Supreme Court of India"
        }
    ]
    """
    simplified_sources: List[Dict[str, Any]] = []
    seen = set()

    for doc in documents:
        meta = doc.metadata or {}
        source = meta.get("source") or meta.get("source_path") or "Indian Legal Record"
        page = meta.get("page")
        case_name = meta.get("case_name") or meta.get("title")
        year = meta.get("year")
        court = meta.get("court", "Supreme Court of India")

        sig = (source, page, case_name)
        if sig in seen:
            continue
        seen.add(sig)

        item: Dict[str, Any] = {"source": str(source)}
        if page is not None:
            item["page"] = str(page)
        if case_name:
            item["case_name"] = str(case_name)
        if year:
            item["year"] = str(year)
        if court:
            item["court"] = str(court)

        simplified_sources.append(item)

    return simplified_sources
