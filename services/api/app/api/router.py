from fastapi import APIRouter

from app.api.routes import assessments, health, methodologies, passports, properties

api_router = APIRouter()
api_router.include_router(health.router, tags=["system"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(methodologies.router, prefix="/methodologies", tags=["methodologies"])

api_router.include_router(passports.router, prefix="/passports", tags=["passports"])
