"""Lawyer services package."""
from app.services.lawyer.lawyer_prompt import get_lawyer_prompt_template
from app.services.lawyer.citation_service import extract_citations
from app.services.lawyer.case_search import search_similar_cases
from app.services.lawyer.case_comparison import compare_cases
from app.services.lawyer.lawyer_rag import ask_lawyer

__all__ = [
    "get_lawyer_prompt_template",
    "extract_citations",
    "search_similar_cases",
    "compare_cases",
    "ask_lawyer",
]
