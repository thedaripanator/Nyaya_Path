import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
import hmac
from app.config import ML_SERVICE_API_KEY
from app.routes.citizen_routes import router as citizen_router
from app.routes.lawyer_routes import router as lawyer_router
from app.routes.document_routes import router as document_router

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nyaya_path")

# Initialize FastAPI application
app = FastAPI(
    title="Nyaya-Path ML/AI Service",
    description="AI-powered legal information and research system for Indian Law using LangChain, Qdrant, and Gemini.",
    version="1.0.0",
)

# Configure CORS Middleware for development & frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(citizen_router)
app.include_router(lawyer_router)
app.include_router(document_router)


@app.middleware("http")
async def require_backend_service_token(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        supplied = request.headers.get("X-Service-Token", "")
        if not ML_SERVICE_API_KEY or ML_SERVICE_API_KEY.startswith("PUT_") or not hmac.compare_digest(supplied, ML_SERVICE_API_KEY):
            return JSONResponse(status_code=401, content={"detail": "Unauthorized service request"})
    return await call_next(request)


@app.get("/", summary="Root status check")
async def root():
    """Returns basic service identifier and running status."""
    return {
        "message": "Nyaya-Path ML Service",
        "status": "running",
    }


@app.get("/health", summary="Health check endpoint")
async def health():
    """Returns application health status."""
    return {
        "status": "healthy",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
