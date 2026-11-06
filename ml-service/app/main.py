
import logging
import hmac

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import ML_SERVICE_API_KEY

from app.routes.citizen_routes import router as citizen_router
from app.routes.lawyer_routes import router as lawyer_router
from app.routes.document_routes import router as document_router
from app.routes.explanation_routes import router as explanation_router
from app.routes.translation_routes import router as translation_router


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger("nyaya_path")


# Initialize FastAPI application
app = FastAPI(
    title="Nyaya-Path ML/AI Service",
    description=(
        "AI-powered legal information and research system "
        "using LangChain, Qdrant, Gemini and Qwen3."
    ),
    version="1.1.0",
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register existing and new routes
app.include_router(citizen_router)
app.include_router(lawyer_router)
app.include_router(document_router)
app.include_router(explanation_router)
app.include_router(translation_router)


# Backend service authentication
@app.middleware("http")
async def require_backend_service_token(request: Request, call_next):

    if request.url.path.startswith("/api/"):

        supplied = request.headers.get("X-Service-Token", "")

        if (
            not ML_SERVICE_API_KEY
            or ML_SERVICE_API_KEY.startswith("PUT_")
            or not hmac.compare_digest(
                supplied,
                ML_SERVICE_API_KEY
            )
        ):
            return JSONResponse(
                status_code=401,
                content={"detail": "Unauthorized service request"}
            )

    return await call_next(request)


@app.get("/", summary="Root status check")
async def root():
    return {
        "message": "Nyaya-Path ML Service",
        "status": "running",
    }


@app.get("/health", summary="Health check endpoint")
async def health():
    return {
        "status": "healthy",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
