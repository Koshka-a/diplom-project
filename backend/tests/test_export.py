import pytest
from fastapi.testclient import TestClient
import json
import io

from app.main import app

client = TestClient(app)

def test_export_import():
    # 1. Load demo data
    response = client.post("/demo/load")
    assert response.status_code == 200
    original_project_id = response.json()["project_id"]
    
    # 2. Get artifacts and add some metadata to one of them to test metadata_json mapping
    artifacts = client.get(f"/projects/{original_project_id}/artifacts/").json()
    assert len(artifacts) > 0
    
    art_to_update = artifacts[0]
    update_resp = client.patch(f"/artifacts/{art_to_update['id']}", json={
        "metadata_json": {"test_key": "test_value", "number": 42}
    })
    assert update_resp.status_code == 200
    
    # 3. Get original relations count
    relations = client.get(f"/projects/{original_project_id}/relations").json()
    original_relations_count = len(relations)
    
    # 4. Export JSON
    export_resp = client.get(f"/projects/{original_project_id}/export/json")
    assert export_resp.status_code == 200
    export_data = export_resp.json()
    
    # Verify export structure
    assert "project" in export_data
    assert "artifacts" in export_data
    assert "relations" in export_data
    assert len(export_data["artifacts"]) == len(artifacts)
    assert len(export_data["relations"]) == original_relations_count
    
    # Verify metadata_json in exported data
    exported_art = next(a for a in export_data["artifacts"] if a["id"] == art_to_update["id"])
    assert "metadata_json" in exported_art
    assert exported_art["metadata_json"]["test_key"] == "test_value"
    
    # 5. Import JSON back
    # Convert JSON dict back to bytes to simulate file upload
    file_content = json.dumps(export_data).encode("utf-8")
    import_resp = client.post(
        "/projects/import/json",
        files={"file": ("export.json", io.BytesIO(file_content), "application/json")}
    )
    
    assert import_resp.status_code == 200
    new_project_id = import_resp.json()["project_id"]
    assert new_project_id != original_project_id
    
    # 6. Verify imported data
    imported_artifacts = client.get(f"/projects/{new_project_id}/artifacts/").json()
    imported_relations = client.get(f"/projects/{new_project_id}/relations").json()
    
    assert len(imported_artifacts) == len(artifacts)
    assert len(imported_relations) == original_relations_count
    
    # Check that metadata was preserved in the imported artifact
    imported_art = next(a for a in imported_artifacts if a["code"] == art_to_update["code"])
    assert imported_art["metadata_json"]["test_key"] == "test_value"
    assert imported_art["metadata_json"]["number"] == 42
    
def test_import_validation():
    # Test duplicate code
    bad_data = {
        "project": {"name": "Test"},
        "artifacts": [
            {"type_id": "Requirement", "code": "REQ-001", "title": "Req 1"},
            {"type_id": "Requirement", "code": "REQ-001", "title": "Req 2"} # Duplicate
        ],
        "relations": []
    }
    file_content = json.dumps(bad_data).encode("utf-8")
    import_resp = client.post(
        "/projects/import/json",
        files={"file": ("bad.json", io.BytesIO(file_content), "application/json")}
    )
    assert import_resp.status_code == 400
    assert "Duplicate artifact code" in import_resp.json()["detail"]
    
    # Test invalid type
    bad_data2 = {
        "project": {"name": "Test"},
        "artifacts": [
            {"type_id": "InvalidType", "code": "REQ-001", "title": "Req 1"}
        ],
        "relations": []
    }
    file_content2 = json.dumps(bad_data2).encode("utf-8")
    import_resp2 = client.post(
        "/projects/import/json",
        files={"file": ("bad2.json", io.BytesIO(file_content2), "application/json")}
    )
    assert import_resp2.status_code == 400
    assert "Invalid artifact type_id" in import_resp2.json()["detail"]
