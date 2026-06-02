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

def test_artifact_deletion_cascade():
    # Load demo data
    response = client.post("/demo/load")
    assert response.status_code == 200
    project_id = response.json()["project_id"]

    # Get REQ-001
    artifacts_resp = client.get(f"/projects/{project_id}/artifacts/")
    artifacts = artifacts_resp.json()
    req_001 = next(a for a in artifacts if a["code"] == "REQ-001")
    
    # Get all relations before delete
    rels_resp = client.get(f"/projects/{project_id}/relations")
    rels_before = rels_resp.json()
    req_rels_before = [r for r in rels_before if r["source_artifact_id"] == req_001["id"] or r["target_artifact_id"] == req_001["id"]]
    assert len(req_rels_before) > 0, "REQ-001 should have relations"

    # Delete REQ-001
    del_resp = client.delete(f"/artifacts/{req_001['id']}")
    assert del_resp.status_code == 200

    # Get all relations after delete
    rels_resp2 = client.get(f"/projects/{project_id}/relations")
    rels_after = rels_resp2.json()
    req_rels_after = [r for r in rels_after if r["source_artifact_id"] == req_001["id"] or r["target_artifact_id"] == req_001["id"]]
    assert len(req_rels_after) == 0, "All relations to/from REQ-001 must be deleted"
    
    # Verify impact analysis doesn't fail if we analyze another node that used to connect to REQ-001
    # MOD-001 realizes REQ-001, so let's impact analyze MOD-001
    mod_001 = next(a for a in artifacts if a["code"] == "MOD-001")
    impact_resp = client.post(f"/projects/{project_id}/impact/", json={
        "artifact_id": mod_001["id"],
        "direction": "both",
        "max_depth": 3
    })
    assert impact_resp.status_code == 200
    impacted_codes = [item["artifact"]["code"] for item in impact_resp.json()["items"]]
    assert "REQ-001" not in impacted_codes, "Deleted artifact should not appear in impact"

def test_invalid_relation_type():
    # Load demo data
    response = client.post("/demo/load")
    project_id = response.json()["project_id"]

    # Get artifacts
    artifacts = client.get(f"/projects/{project_id}/artifacts/").json()
    file_art = next(a for a in artifacts if a["type_id"] == "File")
    module_art = next(a for a in artifacts if a["type_id"] == "Module")
    
    # Try to create File describes Module
    # describes only allows Document as source
    rel_response = client.post(f"/projects/{project_id}/relations", json={
        "source_artifact_id": file_art["id"],
        "target_artifact_id": module_art["id"],
        "relation_type_id": "describes",
        "weight": 1.0
    })
    
    assert rel_response.status_code == 400
    assert "Связь" not in rel_response.json()["detail"] or "не поддерживает" in rel_response.json()["detail"]
