import logging
import shutil
import uuid
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from app.config import UPLOADS_DIR
from app.services.common.pdf_processor import extract_text_from_pdf
from app.services.common.text_chunker import chunk_documents
from app.services.common.qdrant_service import add_documents

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Document Management"])


class DocumentUploadResponseData(BaseModel):
    filename: str
    chunks_indexed: int
    case_name: Optional[str] = None
    court: Optional[str] = None
    year: Optional[str] = None
    citation: Optional[str] = None
    owner_id: Optional[str] = None
    source_type: str = "lawyer_upload"
    document_type: str = "uploaded_judgment"


class DocumentUploadResponse(BaseModel):
    success: bool
    message: str
    data: DocumentUploadResponseData


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and index a legal PDF judgment (Lawyer Upload)",
)
async def upload_document(
    file: UploadFile = File(..., description="PDF file of the court judgment or legal brief"),
    case_name: Optional[str] = Form(default=None, description="Optional case name/title"),
    court: Optional[str] = Form(default="Supreme Court of India", description="Court name"),
    year: Optional[str] = Form(default=None, description="Decision year"),
    citation: Optional[str] = Form(default=None, description="Case citation (e.g. 2021 INSC 123)"),
    owner_id: Optional[str] = Form(default=None, description="Lawyer ID for document isolation and access control"),
):
    """
    Handles PDF document upload for lawyer research:
    1. Validates and saves PDF in data/uploads/lawyer_documents/
    2. Extracts text pages preserving page numbers.
    3. Chunks text with recursive splitting.
    4. Attaches isolation metadata (source_type='lawyer_upload', owner_id).
    5. Embeds and indexes chunks into Qdrant vector database.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported for upload.",
        )

    # Sanitize and prepare destination path
    original_filename = Path(file.filename).name
    safe_filename = f"{uuid.uuid4().hex}_{original_filename}"
    target_path = UPLOADS_DIR / safe_filename

    try:
        # Save uploaded file to disk
        if file.size and file.size > 15 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="PDF exceeds the 15 MB upload limit.")
        with target_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"Saved uploaded PDF to {target_path}")

        # 1. Extract text and page numbers
        extracted_pages = extract_text_from_pdf(str(target_path))
        if not extracted_pages:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No readable text could be extracted from the uploaded PDF.",
            )

        # 2. Chunk documents and attach isolation metadata
        additional_metadata: Dict[str, Any] = {
            "source": safe_filename,
            "source_type": "lawyer_upload",
            "document_type": "uploaded_judgment",
            "case_name": case_name or Path(safe_filename).stem.replace("_", " "),
            "court": court or "Supreme Court of India",
            "year": year,
            "citation": citation,
            "owner_id": owner_id,
        }

        chunks = chunk_documents(
            documents=extracted_pages,
            additional_metadata=additional_metadata,
        )

        # 3. Add to Qdrant vector store
        add_documents(chunks)
        logger.info(
            f"Successfully indexed {len(chunks)} chunks for {safe_filename} into Qdrant."
        )

        return DocumentUploadResponse(
            success=True,
            message="Document processed and indexed successfully into legal vector store.",
            data=DocumentUploadResponseData(
                filename=safe_filename,
                chunks_indexed=len(chunks),
                case_name=additional_metadata.get("case_name"),
                court=additional_metadata.get("court"),
                year=additional_metadata.get("year"),
                citation=additional_metadata.get("citation"),
                owner_id=additional_metadata.get("owner_id"),
                source_type="lawyer_upload",
                document_type="uploaded_judgment",
            ),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing uploaded document {file.filename}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the document.",
        )
