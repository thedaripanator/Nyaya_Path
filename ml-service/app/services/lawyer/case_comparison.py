import logging
from typing import Dict, Any, Optional, List
from langchain_core.prompts import ChatPromptTemplate
from app.services.common.qdrant_service import search_documents
from app.services.common.llm_client import get_chat_llm, is_llm_configured
from app.services.lawyer.citation_service import extract_citations

logger = logging.getLogger(__name__)

COMPARISON_PROMPT_TEMPLATE = """You are an expert Indian Legal Research Assistant for the "Nyaya-Path" platform.
Your task is to compare two Indian legal cases/judgments based STRICTLY and ONLY on the retrieved legal context provided below.

CRITICAL INSTRUCTIONS:
- Base your analysis solely on the provided case excerpts.
- DO NOT invent facts, citations, statutory sections, or holdings.
- If information on any element is missing from the retrieved context, explicitly state "Information not provided in retrieved records."
- Distinguish verified court holdings from judicial commentary.

Analyze and compare the two cases under the following structured sections:

### 1. Case Overviews
- Case A: [Name, Year, Citation, Court]
- Case B: [Name, Year, Citation, Court]

### 2. Facts of the Cases
- Case A Facts:
- Case B Facts:

### 3. Legal Issues
- Legal controversy in Case A:
- Legal controversy in Case B:

### 4. Applicable Statutory Provisions
[List sections of IPC, CrPC, Constitution, etc. cited in either case]

### 5. Court Decisions & Orders
- Decision in Case A:
- Decision in Case B:

### 6. Judicial Reasoning (Ratio Decidendi)
- Judicial reasoning in Case A:
- Judicial reasoning in Case B:

### 7. Key Similarities
[Comparative analysis of principles shared between the cases]

### 8. Key Differences & Distinctions
[Key points of divergence in facts, law, or outcome]

### 9. Sources / Citations
[Document source names, pages, and citations]
"""

COMPARISON_HUMAN_PROMPT = """Retrieved Context for Case A:
-----------------------------
{context_a}
-----------------------------

Retrieved Context for Case B:
-----------------------------
{context_b}
-----------------------------

Comparison Request:
{comparison_query}
"""


def compare_cases(
    case_a_query: str,
    case_b_query: str,
    comparison_query: Optional[str] = None,
    k: int = 5,
    filter_dict: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Retrieves contexts for two cases from Qdrant and generates a comparative legal analysis.

    Args:
        case_a_query: Query or case name for Case A.
        case_b_query: Query or case name for Case B.
        comparison_query: Specific question or comparison focus (optional).
        k: Chunks to retrieve per case.
        filter_dict: Optional metadata filter.

    Returns:
        Dict containing comparison analysis, sources for both cases.
    """
    logger.info(f"Comparing cases: '{case_a_query}' vs '{case_b_query}'")

    docs_a = search_documents(case_a_query, k=k, filter_dict=filter_dict)
    docs_b = search_documents(case_b_query, k=k, filter_dict=filter_dict)

    if not docs_a and not docs_b:
        return {
            "comparison": "No legal records were found in the database for either Case A or Case B.",
            "sources_case_a": [],
            "sources_case_b": [],
        }

    context_a = (
        "\n\n".join([f"[Doc: {d.metadata.get('source')} | Page: {d.metadata.get('page')}]\n{d.page_content}" for d in docs_a])
        if docs_a
        else "No records found for Case A."
    )
    context_b = (
        "\n\n".join([f"[Doc: {d.metadata.get('source')} | Page: {d.metadata.get('page')}]\n{d.page_content}" for d in docs_b])
        if docs_b
        else "No records found for Case B."
    )

    query_text = comparison_query or f"Compare '{case_a_query}' and '{case_b_query}'"

    if not is_llm_configured():
        return {
            "comparison": (
                "No Gemini API key is configured. Please set GOOGLE_API_KEY to run comparison.\n\n"
                f"Retrieved {len(docs_a)} chunk(s) for Case A and {len(docs_b)} chunk(s) for Case B."
            ),
            "sources_case_a": extract_citations(docs_a),
            "sources_case_b": extract_citations(docs_b),
        }

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", COMPARISON_PROMPT_TEMPLATE),
            ("human", COMPARISON_HUMAN_PROMPT),
        ]
    )

    llm = get_chat_llm(temperature=0.1)

    chain = prompt | llm
    response = chain.invoke(
        {
            "context_a": context_a,
            "context_b": context_b,
            "comparison_query": query_text,
        }
    )

    return {
        "comparison": response.content,
        "sources_case_a": extract_citations(docs_a),
        "sources_case_b": extract_citations(docs_b),
    }
