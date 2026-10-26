"""Nyaya-Path API Routes Package."""
from app.routes.citizen_routes import router as citizen_router
from app.routes.lawyer_routes import router as lawyer_router
from app.routes.document_routes import router as document_router

__all__ = ["citizen_router", "lawyer_router", "document_router"]
