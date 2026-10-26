import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.lawyer.lawyer_rag import ask_lawyer
from app.services.lawyer.case_search import search_similar_cases
from app.services.lawyer.case_comparison import compare_cases

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/lawyer", tags=["Lawyer Assistant"])


# --- Request & Response Models ---

class LawyerAskRequest(BaseModel):
    question: str = Field(..., min_length=2, description="Legal research query")
    k: Optional[int] = Field(default=5, ge=1, le=20, description="Number of context documents to retrieve")
    owner_id: Optional[str] = Field(default=None, description="Optional lawyer ID for retrieving private uploads")


class LawyerAskResponseData(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]


class LawyerAskResponse(BaseModel):
    success: bool
    data: LawyerAskResponseData


class CaseSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Case search query or description of facts")
    k: Optional[int] = Field(default=10, ge=1, le=50, description="Max cases to retrieve")
    owner_id: Optional[str] = Field(default=None, description="Optional lawyer ID to include private documents")


class CaseSearchResponseData(BaseModel):
    cases: List[Dict[str, Any]]


class CaseSearchResponse(BaseModel):
    success: bool
    data: CaseSearchResponseData


class CaseCompareRequest(BaseModel):
    case_a: str = Field(..., description="First case name or search query")
    case_b: str = Field(..., description="Second case name or search query")
    comparison_query: Optional[str] = Field(default=None, description="Specific comparative question")
    k: Optional[int] = Field(default=5, ge=1, le=20)
    owner_id: Optional[str] = Field(default=None)


class CaseCompareResponseData(BaseModel):
    comparison: str
    sources_case_a: List[Dict[str, Any]]
    sources_case_b: List[Dict[str, Any]]


class CaseCompareResponse(BaseModel):
    success: bool
    data: CaseCompareResponseData


# --- Endpoints ---

@router.post(
    "/ask",
    response_model=LawyerAskResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask an in-depth legal research query (Lawyer Mode)",
)
def handle_lawyer_ask(request: LawyerAskRequest):
    """
    Executes in-depth legal research query using 7-part structured response:
    Legal Issue, Applicable Laws, Relevant Cases, Court's Decision,
    Court's Reasoning, Similar Cases, and Sources.
    """
    try:
        filter_dict = {"_public_or_owner": request.owner_id} if request.owner_id else None

        result = ask_lawyer(
            question=request.question,
            k=request.k,
            filter_dict=filter_dict,
        )

        return LawyerAskResponse(
            success=True,
            data=LawyerAskResponseData(
                answer=result["answer"],
                sources=result["sources"],
            ),
        )
    except Exception as e:
        logger.error(f"Error handling lawyer ask request: {e}", exc_info=True)
        logger.exception("Lawyer ask failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while executing lawyer research.",
        )


@router.post(
    "/search-cases",
    response_model=CaseSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Semantic legal case and precedent search",
)
def handle_search_cases(request: CaseSearchRequest):
    """
    Retrieves semantically relevant Indian court judgments based on natural language query,
    legal issues, or case facts.
    """
    try:
        filter_dict = {"_public_or_owner": request.owner_id} if request.owner_id else None

        cases = search_similar_cases(
            query=request.query,
            k=request.k,
            filter_dict=filter_dict,
        )

        return CaseSearchResponse(
            success=True,
            data=CaseSearchResponseData(cases=cases),
        )
    except Exception as e:
        logger.error(f"Error handling case search request: {e}", exc_info=True)
        logger.exception("Case search failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while searching cases.",
        )


@router.post(
    "/compare-cases",
    response_model=CaseCompareResponse,
    status_code=status.HTTP_200_OK,
    summary="Compare two judgments/cases side by side",
)
def handle_compare_cases(request: CaseCompareRequest):
    """
    Generates a structured comparative analysis of two cases across facts,
    applicable laws, decisions, reasoning, similarities, and differences.
    """
    try:
        filter_dict = {"_public_or_owner": request.owner_id} if request.owner_id else None

        result = compare_cases(
            case_a_query=request.case_a,
            case_b_query=request.case_b,
            comparison_query=request.comparison_query,
            k=request.k,
            filter_dict=filter_dict,
        )

        return CaseCompareResponse(
            success=True,
            data=CaseCompareResponseData(
                comparison=result["comparison"],
                sources_case_a=result["sources_case_a"],
                sources_case_b=result["sources_case_b"],
            ),
        )
    except Exception as e:
        logger.error(f"Error handling case comparison request: {e}", exc_info=True)
        logger.exception("Case comparison failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while comparing cases.",
        )
