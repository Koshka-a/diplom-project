from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import all as models

router = APIRouter(prefix="/demo", tags=["demo"])

@router.post("/load")
def load_demo_data(db: Session = Depends(get_db)):
    # Create project
    project = models.Project(name="Демо-проект: Авторизация", description="Демонстрационный проект из ТЗ")
    db.add(project)
    db.commit()
    db.refresh(project)

    project_id = project.id

    artifacts_data = [
        {"code": "ENT-001", "type_id": "DomainConcept", "title": "Пользователь"},
        {"code": "ENT-002", "type_id": "DomainConcept", "title": "Учетная запись"},
        {"code": "ENT-003", "type_id": "DomainConcept", "title": "Сессия"},
        {"code": "REQ-001", "type_id": "Requirement", "title": "Пользователь должен авторизоваться"},
        {"code": "REQ-002", "type_id": "Requirement", "title": "Система должна хранить активную сессию"},
        {"code": "MOD-001", "type_id": "Module", "title": "Auth"},
        {"code": "FILE-001", "type_id": "File", "title": "auth.py"},
        {"code": "FUNC-001", "type_id": "Function", "title": "login_user"},
        {"code": "TEST-001", "type_id": "TestCase", "title": "Проверка успешной авторизации"},
        {"code": "DOC-001", "type_id": "Document", "title": "Описание механизма авторизации"},
    ]

    artifact_map = {}
    for adata in artifacts_data:
        artifact = models.Artifact(project_id=project_id, **adata)
        db.add(artifact)
        db.commit()
        db.refresh(artifact)
        artifact_map[adata["code"]] = artifact.id

    relations_data = [
        {"source": "REQ-001", "target": "ENT-001", "type": "depends_on"},
        {"source": "REQ-001", "target": "ENT-002", "type": "depends_on"},
        {"source": "REQ-002", "target": "ENT-003", "type": "depends_on"},
        {"source": "MOD-001", "target": "REQ-001", "type": "realizes"},
        {"source": "FILE-001", "target": "MOD-001", "type": "part_of"},
        {"source": "FUNC-001", "target": "FILE-001", "type": "part_of"},
        {"source": "FUNC-001", "target": "REQ-001", "type": "realizes"},
        {"source": "TEST-001", "target": "REQ-001", "type": "verifies"},
        {"source": "DOC-001", "target": "REQ-001", "type": "describes"},
    ]

    for rdata in relations_data:
        source_id = artifact_map.get(rdata["source"])
        target_id = artifact_map.get(rdata["target"])
        if source_id and target_id:
            rel = models.ArtifactRelation(
                project_id=project_id,
                source_artifact_id=source_id,
                target_artifact_id=target_id,
                relation_type_id=rdata["type"]
            )
            db.add(rel)
    
    db.commit()

    return {"message": "Demo data loaded", "project_id": project_id}
