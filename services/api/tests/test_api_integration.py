import os
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.main import app

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql+asyncpg://demeter:demeter@localhost:5432/demeter_carbono")

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
async def clear_db():
    async with engine.begin() as conn:
        # Clear tables before each test to ensure isolation.
        await conn.execute(text("TRUNCATE TABLE audit_events_v2, evidence, calculation_runs, boundary_versions, properties CASCADE;"))
    yield

@pytest.mark.asyncio
async def test_create_property_idempotent():
    property_id = str(uuid4())
    payload = {
        "id": property_id,
        "name": "Integration Farm",
        "municipality": "Test City",
        "land_use": "agriculture"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create property
        response = await ac.post("/api/v1/properties", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == property_id
        assert data["name"] == "Integration Farm"

        # 2. Resubmit identical creation request (Idempotency)
        response_retry = await ac.post("/api/v1/properties", json=payload)
        # Assuming the backend returns 201 or 200 on conflict resolution and the exact same object
        assert response_retry.status_code == 201
        data_retry = response_retry.json()
        assert data_retry["id"] == property_id

        # Ensure only 1 property exists
        list_response = await ac.get("/api/v1/properties")
        assert len(list_response.json()) == 1

@pytest.mark.asyncio
async def test_create_boundary():
    property_id = str(uuid4())
    payload = {
        "id": property_id,
        "name": "Integration Farm",
        "municipality": "Test City",
        "land_use": "agriculture"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        await ac.post("/api/v1/properties", json=payload)

        # 1. Submitting < 3 points should fail
        bad_boundary = {
            "points": [
                {"latitude": 10.0, "longitude": 20.0},
                {"latitude": 10.1, "longitude": 20.1}
            ]
        }
        res_bad = await ac.post(f"/api/v1/properties/{property_id}/boundaries", json=bad_boundary)
        assert res_bad.status_code == 422

        # 2. Submitting valid boundary
        good_boundary = {
            "points": [
                {"latitude": 0.0, "longitude": 0.0},
                {"latitude": 0.1, "longitude": 0.0},
                {"latitude": 0.1, "longitude": 0.1},
                {"latitude": 0.0, "longitude": 0.1}
            ]
        }
        res_good = await ac.post(f"/api/v1/properties/{property_id}/boundaries", json=good_boundary)
        assert res_good.status_code == 200
        data_good = res_good.json()
        assert data_good["version"] == 1
        assert data_good["property_id"] == property_id

        # 3. Submitting the identical boundary again should return version 1 (idempotency by hash)
        res_dup = await ac.post(f"/api/v1/properties/{property_id}/boundaries", json=good_boundary)
        assert res_dup.status_code == 200
        assert res_dup.json()["version"] == 1

        # 4. Submitting a new boundary should increment version
        new_boundary = {
            "points": [
                {"latitude": 1.0, "longitude": 1.0},
                {"latitude": 1.1, "longitude": 1.0},
                {"latitude": 1.1, "longitude": 1.1},
                {"latitude": 1.0, "longitude": 1.1}
            ]
        }
        res_new = await ac.post(f"/api/v1/properties/{property_id}/boundaries", json=new_boundary)
        assert res_new.status_code == 200
        assert res_new.json()["version"] == 2
