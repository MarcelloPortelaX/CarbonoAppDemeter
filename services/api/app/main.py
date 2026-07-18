from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Database lifecycle will be enabled after the first migration is applied.
    yield


app = FastAPI(
    title="Demeter Carbono API",
    version="0.1.0",
    description="Triagem e passaporte ambiental. Não emite créditos de carbono.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api/v1")
