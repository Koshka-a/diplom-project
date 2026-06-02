import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db, Base
from app.core.init_db import init_db
from app.models import all as models

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
    db = TestingSessionLocal()
    init_db(db)
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_delete_project_cleanup():
    # 1. Создать проект
    proj_resp = client.post("/projects/", json={"name": "Test Delete Project"})
    assert proj_resp.status_code == 200
    project_id = proj_resp.json()["id"]
    
    # 2. Создать артефакт (запишется в лог)
    art_resp = client.post(f"/projects/{project_id}/artifacts/", json={
        "type_id": "Requirement",
        "code": "REQ-100",
        "title": "Test Req"
    })
    assert art_resp.status_code == 200
    
    # 3. Экспортировать (создаст export record)
    exp_resp = client.get(f"/projects/{project_id}/export/json")
    assert exp_resp.status_code == 200
    
    # Убеждаемся, что логи и записи существуют
    logs_resp = client.get(f"/projects/{project_id}/changelog")
    assert logs_resp.status_code == 200
    assert len(logs_resp.json()) > 0
    
    # Нам нужно прямо в базу слазить
    db = TestingSessionLocal()
    try:
        exports_count = db.query(models.ExportRecord).filter(models.ExportRecord.project_id == project_id).count()
        assert exports_count > 0
        
        # 4. Удалить проект
        del_resp = client.delete(f"/projects/{project_id}")
        assert del_resp.status_code == 200
        
        # 5. Проверить, что ничего не осталось
        artifacts_count = db.query(models.Artifact).filter(models.Artifact.project_id == project_id).count()
        logs_count = db.query(models.ChangeLog).filter(models.ChangeLog.project_id == project_id).count()
        exports_count_after = db.query(models.ExportRecord).filter(models.ExportRecord.project_id == project_id).count()
        
        assert artifacts_count == 0
        assert logs_count == 0
        assert exports_count_after == 0
    finally:
        db.close()
