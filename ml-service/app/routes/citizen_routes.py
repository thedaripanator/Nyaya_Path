import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.citizen.citizen_rag import ask_citizen

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/citizen", tags=["Citizen Assistant"])


class CitizenAskRequest(BaseModel):
    question: str = Field(..., min_length=2, description="Legal question asked by the citizen")
    k: Optional[int] = Field(default=5, ge=1, le=20, description="Number of context documents to retrieve")
    language: Optional[str] = Field(default="English", description="Response language")


class CitizenAskResponseData(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]


class CitizenAskResponse(BaseModel):
    success: bool
    data: CitizenAskResponseData


@router.post(
    "/ask",
    response_model=CitizenAskResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask a legal question in plain language (Citizen Mode)",
)
async def handle_citizen_ask(request: CitizenAskRequest):
    """
    Answers legal questions for everyday citizens using simple explanations,
    demystifying legal jargon, and grounding answers strictly in court judgments.
    Ensures document isolation by searching public legal records.
    """
    try:
        # Public knowledge base filter ensures private lawyer uploads are not leaked to citizens
        filter_dict = {"source_type": "kaggle"}

        result = ask_citizen(
            question=request.question,
            k=request.k,
            filter_dict=filter_dict,
            language=request.language or "English",
        )

        return CitizenAskResponse(
            success=True,
            data=CitizenAskResponseData(
                answer=result["answer"],
                sources=result["sources"],
            ),
        )
    except Exception as e:
        logger.error(f"Error handling citizen ask request: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the citizen request.",
        )
