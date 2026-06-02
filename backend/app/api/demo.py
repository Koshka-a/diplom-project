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
        {"code": "MOD-002", "type_id": "Module", "title": "Crypto"},
        {"code": "FILE-001", "type_id": "File", "title": "auth.py"},
        {"code": "FUNC-001", "type_id": "Function", "title": "login_user"},
        {"code": "TEST-001", "type_id": "TestCase", "title": "Проверка успешной авторизации"},
        {"code": "DOC-001", "type_id": "Document", "title": "Описание механизма авторизации"},
        {"code": "DEF-001", "type_id": "Defect", "title": "Уязвимость при хранении токена"},
        {"code": "DEC-001", "type_id": "Decision", "title": "Использовать JWT для сессий"},
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
        {"source": "MOD-002", "target": "MOD-001", "type": "depends_on"},
        {"source": "DEF-001", "target": "MOD-001", "type": "affects"},
        {"source": "DEC-001", "target": "REQ-002", "type": "refines"},
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

    # Add code fragments to make the editor look nice
    code_snippets = {
        "ENT-001": "class User:\n    id: int\n    username: str\n    email: str",
        "ENT-002": "class Account:\n    user_id: int\n    hashed_password: str",
        "ENT-003": "class Session:\n    token: str\n    expires_at: datetime",
        "REQ-001": "# REQUIREMENT: The user must be able to authorize using email and password.",
        "REQ-002": "# REQUIREMENT: The system must store active sessions for 24 hours.",
        "MOD-001": "module Auth {\n  export function login() {}\n  export function logout() {}\n}",
        "MOD-002": "module Crypto {\n  export function hash() {}\n}",
        "FILE-001": "import hashlib\n\ndef check_password(plain, hashed):\n    return hashlib.sha256(plain.encode()).hexdigest() == hashed",
        "FUNC-001": "def login_user(email: str, password: str):\n    user = db.get_user(email)\n    if check_password(password, user.hashed_password):\n        return create_session(user.id)",
        "TEST-001": "def test_login():\n    token = login_user('test@test.com', 'password123')\n    assert token is not None",
        "DOC-001": "# Authorization Flow\n1. User enters email/pwd\n2. System hashes pwd\n3. System checks DB\n4. System returns token",
        "DEF-001": "Issue: Tokens are currently stored in localStorage, making them vulnerable to XSS.",
        "DEC-001": "ADR 01: Use JWT for stateless session validation to scale horizontally.",
    }

    for code, content in code_snippets.items():
        art_id = artifact_map.get(code)
        if art_id:
            cf = models.CodeFragment(
                artifact_id=art_id,
                content=content,
                language="python" if "def " in content or "class " in content else "markdown",
                file_path=f"{code.lower()}.py"
            )
            db.add(cf)
    db.commit()

    return {"message": "Demo data loaded", "project_id": project_id}
