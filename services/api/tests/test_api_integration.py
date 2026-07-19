import os
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.main import app

pytestmark = [
    pytest.mark.integration,
    pytest.mark.asyncio,
]



TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    pytest.skip(
        "TEST_DATABASE_URL is required for integration tests",
        allow_module_level=True,
    )

from sqlalchemy.pool import NullPool

engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
async def clear_db():
    if not TEST_DATABASE_URL.endswith("_test"):
        raise RuntimeError("TEST_DATABASE_URL must end with '_test' to prevent wiping dev databases.")
    async with engine.begin() as conn:
        # Clear tables before each test to ensure isolation.
        await conn.execute(text("TRUNCATE TABLE audit_events_v2, evidence, calculation_runs, boundary_versions, assessments, properties CASCADE;"))
    yield

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


async def test_create_boundary():
    property_id = str(uuid4())
    payload = {"id": property_id, "name": "Integration Farm", "municipality": "Test City", "land_use": "agriculture"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        await ac.post("/api/v1/properties", json=payload)

        # 1. Submitting without boundary_id should fail
        res_no_id = await ac.post(f"/api/v1/properties/{property_id}/boundaries", json={"points": [{"latitude": 0.0, "longitude": 0.0}, {"latitude": 0.1, "longitude": 0.0}, {"latitude": 0.1, "longitude": 0.1}, {"latitude": 0.0, "longitude": 0.1}]})
        assert res_no_id.status_code == 422

        # 2. Submitting valid boundary
        b_id1 = str(uuid4())
        good_boundary = {
            "boundary_id": b_id1,
            "points": [{"latitude": 0.0, "longitude": 0.0}, {"latitude": 0.1, "longitude": 0.0}, {"latitude": 0.1, "longitude": 0.1}, {"latitude": 0.0, "longitude": 0.1}]
        }
        res_good = await ac.post(f"/api/v1/properties/{property_id}/boundaries", json=good_boundary)
        assert res_good.status_code == 200
        data_good = res_good.json()
        assert data_good["version"] == 1
        assert data_good["area_ha"] > 0
        assert data_good["perimeter_km"] > 0

        # Check DB for MULTIPOLYGON and SRID 4326
        async with engine.begin() as conn:
            row = (await conn.execute(text("SELECT ST_GeometryType(geometry), ST_SRID(geometry) FROM boundary_versions WHERE id = :id"), {"id": b_id1})).fetchone()
            assert row[0] == 'ST_MultiPolygon'
            assert row[1] == 4326

        # 3. Submitting the identical boundary again should return version 1 (idempotency by boundary_id AND geometry)
        res_dup = await ac.post(f"/api/v1/properties/{property_id}/boundaries", json=good_boundary)
        assert res_dup.status_code == 200
        assert res_dup.json()["version"] == 1

        # 4. Submitting same boundary_id but different geometry (409 Conflict)
        conflict_boundary = {
            "boundary_id": b_id1,
            "points": [{"latitude": 1.0, "longitude": 1.0}, {"latitude": 1.1, "longitude": 1.0}, {"latitude": 1.1, "longitude": 1.1}, {"latitude": 1.0, "longitude": 1.1}]
        }
        res_conflict = await ac.post(f"/api/v1/properties/{property_id}/boundaries", json=conflict_boundary)
        assert res_conflict.status_code == 409

        # 5. Submitting a new boundary_id creates a new version
        b_id2 = str(uuid4())
        new_boundary = {
            "boundary_id": b_id2,
            "points": [{"latitude": 1.0, "longitude": 1.0}, {"latitude": 1.1, "longitude": 1.0}, {"latitude": 1.1, "longitude": 1.1}, {"latitude": 1.0, "longitude": 1.1}]
        }
        res_new = await ac.post(f"/api/v1/properties/{property_id}/boundaries", json=new_boundary)
        assert res_new.status_code == 200
        assert res_new.json()["version"] == 2


async def test_confirm_boundary():
    property_id = str(uuid4())
    prop_payload = {"id": property_id, "name": "Integration Farm", "municipality": "Test City", "land_use": "agriculture"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        await ac.post("/api/v1/properties", json=prop_payload)
        
        b_id1 = str(uuid4())
        await ac.post(f"/api/v1/properties/{property_id}/boundaries", json={
            "boundary_id": b_id1,
            "points": [{"latitude": 0.0, "longitude": 0.0}, {"latitude": 0.1, "longitude": 0.0}, {"latitude": 0.1, "longitude": 0.1}, {"latitude": 0.0, "longitude": 0.1}]
        })
        b_id2 = str(uuid4())
        await ac.post(f"/api/v1/properties/{property_id}/boundaries", json={
            "boundary_id": b_id2,
            "points": [{"latitude": 1.0, "longitude": 1.0}, {"latitude": 1.1, "longitude": 1.0}, {"latitude": 1.1, "longitude": 1.1}, {"latitude": 1.0, "longitude": 1.1}]
        })

        # Nonexistent boundary
        res_404 = await ac.post(f"/api/v1/properties/{property_id}/boundaries/{str(uuid4())}/confirm")
        assert res_404.status_code == 404

        # Boundary belonging to another property
        other_prop_id = str(uuid4())
        await ac.post("/api/v1/properties", json={"id": other_prop_id, "name": "Other", "municipality": "Other", "land_use": "agriculture"})
        res_404_other = await ac.post(f"/api/v1/properties/{other_prop_id}/boundaries/{b_id1}/confirm")
        assert res_404_other.status_code == 404

        # Valid confirmation
        res_conf = await ac.post(f"/api/v1/properties/{property_id}/boundaries/{b_id1}/confirm")
        assert res_conf.status_code == 200
        assert res_conf.json()["is_confirmed"]

        # Repeat confirmation (idempotent)
        res_conf2 = await ac.post(f"/api/v1/properties/{property_id}/boundaries/{b_id1}/confirm")
        assert res_conf2.status_code == 200

        # Confirm new version unconfirms previous
        res_conf3 = await ac.post(f"/api/v1/properties/{property_id}/boundaries/{b_id2}/confirm")
        assert res_conf3.status_code == 200
        
        async with engine.begin() as conn:
            row1 = (await conn.execute(text("SELECT is_confirmed FROM boundary_versions WHERE id = :id"), {"id": b_id1})).fetchone()
            row2 = (await conn.execute(text("SELECT is_confirmed FROM boundary_versions WHERE id = :id"), {"id": b_id2})).fetchone()
            assert not row1[0]
            assert row2[0]

async def test_assessment_idempotency():
    property_id = str(uuid4())
    prop_payload = {"id": property_id, "name": "Integration Farm", "municipality": "Test City", "land_use": "agriculture"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        await ac.post("/api/v1/properties", json=prop_payload)
        
        ass_payload = {
            "has_possession_proof": True,
            "intends_restoration": True,
            "recent_clearing": False
        }
        
        # Test 404 on nonexistent property
        fake_id = str(uuid4())
        res_404 = await ac.post(f"/api/v1/assessments/properties/{fake_id}", json=ass_payload)
        assert res_404.status_code == 404
        
        # Test 422 on invalid payload
        res_422 = await ac.post(f"/api/v1/assessments/properties/{property_id}", json={"has_possession_proof": "not_boolean"})
        assert res_422.status_code == 422
        
        # Test Passport before assessment -> 409
        res_pass_before = await ac.get(f"/api/v1/passports/properties/{property_id}")
        assert res_pass_before.status_code == 409

        # Test successful submission
        res1 = await ac.post(f"/api/v1/assessments/properties/{property_id}", json=ass_payload)
        assert res1.status_code in [200, 201]
        data1 = res1.json()
        
        # Exact same input should return the exact same persisted object
        res2 = await ac.post(f"/api/v1/assessments/properties/{property_id}", json=ass_payload)
        assert res2.status_code in [200, 201]
        data2 = res2.json()
        
        assert data1["id"] == data2["id"]
        assert data1["created_at"] == data2["created_at"]
        
        # Test Passport after assessment -> 200
        res_pass_after = await ac.get(f"/api/v1/passports/properties/{property_id}")
        assert res_pass_after.status_code == 200
        
        async with engine.begin() as conn:
            row = (await conn.execute(text("SELECT count(*) FROM assessments WHERE property_id = :id"), {"id": property_id})).scalar()
            assert row == 1
