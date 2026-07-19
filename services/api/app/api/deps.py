from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.persistence.database import session_scope
from app.application.postgres_repository import PostgresRepository

async def get_db():
    async for session in session_scope():
        yield session

def get_repository(session: AsyncSession = Depends(get_db)) -> PostgresRepository:
    return PostgresRepository(session)
