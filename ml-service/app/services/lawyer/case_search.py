import logging
from typing import List, Dict, Any, Optional
from app.services.common.qdrant_service import search_documents_with_scores

logger = logging.getLogger(__name__)


def search_similar_cases(
    query: str,
    k: int = 10,
    filter_dict: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Performs semantic case search across the legal knowledge base in Qdrant.

    Args:
        query: Legal research query or case fact description.
        k: Maximum number of relevant case chunks to retrieve.
        filter_dict: Optional metadata filter (e.g. source_type, owner_id).

    Returns:
        List of structured case results:
        [
            {
                "case_name": str,
                "court": str,
                "year": str,
                "citation": str or None,
                "relevant_text": str,
                "page": str or int,
                "source": str,
                "similarity_score": float,
            },
            ...
        ]
    """
    logger.info(f"Executing semantic case search for query: '{query}' (k={k})")
    doc_scores = search_documents_with_scores(query=query, k=k, filter_dict=filter_dict)

    cases: List[Dict[str, Any]] = []
    for doc, score in doc_scores:
        meta = doc.metadata or {}
        case_item = {
            "case_name": meta.get("case_name") or meta.get("title") or "Unknown Case",
            "court": meta.get("court", "Supreme Court of India"),
            "year": meta.get("year", "N/A"),
            "citation": meta.get("citation"),
            "relevant_text": doc.page_content.strip(),
            "page": meta.get("page", 1),
            "source": meta.get("source", "Unknown Source"),
            "similarity_score": round(float(score), 4) if score is not None else None,
        }
        cases.append(case_item)

    logger.info(f"Retrieved {len(cases)} case results.")
    return cases
