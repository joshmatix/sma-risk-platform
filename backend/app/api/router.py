"""API router."""

from fastapi import APIRouter

from app.api.endpoints import simulate

api_router = APIRouter()
api_router.include_router(simulate.router, prefix="/simulate", tags=["simulate"])
