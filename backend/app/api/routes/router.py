
from fastapi import APIRouter

from backend.app.api.routes import (
    health, 
    kpis,
    aggregations,
    trends,
    reports,
    enrollments,
    auth,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(kpis.router)
api_router.include_router(aggregations.router)
api_router.include_router(trends.router)
api_router.include_router(reports.router)
api_router.include_router(enrollments.router)
api_router.include_router(auth.router)