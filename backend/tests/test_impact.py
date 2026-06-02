import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db
from app.core.init_db import init_db

# Setup in-memory DB for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Initialize reference data
db = TestingSessionLocal()
init_db(db)
db.close()

client = TestClient(app)

def test_load_demo_and_impact():
    # Load demo data
    response = client.post("/demo/load")
    assert response.status_code == 200
    project_id = response.json()["project_id"]

    # Get impact for REQ-001 (Пользователь должен авторизоваться)
    # It should have relations to Domain concepts, Modules, Tests, etc.
    
    # We need the artifact ID. Let's fetch all artifacts and find REQ-001
    artifacts_resp = client.get(f"/projects/{project_id}/artifacts/")
    artifacts = artifacts_resp.json()
    req_001 = next(a for a in artifacts if a["code"] == "REQ-001")
    
    impact_resp = client.post(f"/projects/{project_id}/impact/", json={
        "artifact_id": req_001["id"],
        "direction": "both",
        "max_depth": 3
    })
    
    assert impact_resp.status_code == 200
    impact_data = impact_resp.json()
    assert impact_data["source"]["code"] == "REQ-001"
    
    impacted_codes = [item["artifact"]["code"] for item in impact_data["items"]]
    assert "ENT-001" in impacted_codes
    assert "MOD-001" in impacted_codes
    assert "TEST-001" in impacted_codes
