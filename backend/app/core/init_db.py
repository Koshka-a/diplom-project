from sqlalchemy.orm import Session
from app.models import all as models

def init_db(db: Session):
    # Default artifact types
    artifact_types = [
        {"code": "DomainConcept", "name": "Понятие предметной области", "category": "domain", "color": "#4F46E5"},
        {"code": "Requirement", "name": "Требование", "category": "requirements", "color": "#10B981"},
        {"code": "Module", "name": "Модуль", "category": "implementation", "color": "#3B82F6"},
        {"code": "Component", "name": "Компонент", "category": "implementation", "color": "#6366F1"},
        {"code": "File", "name": "Файл", "category": "implementation", "color": "#8B5CF6"},
        {"code": "Function", "name": "Функция", "category": "implementation", "color": "#EC4899"},
        {"code": "TestCase", "name": "Тестовый сценарий", "category": "testing", "color": "#F59E0B"},
        {"code": "Document", "name": "Документ", "category": "documentation", "color": "#64748B"},
    ]

    for type_data in artifact_types:
        if not db.query(models.ArtifactType).filter_by(code=type_data["code"]).first():
            db.add(models.ArtifactType(**type_data))

    # Default relation types
    relation_types = [
        {"code": "is_a", "name": "Род-вид / специализация", "directed": True, "affects_impact": False, "color": "#9CA3AF"},
        {"code": "part_of", "name": "Часть-целое", "directed": True, "affects_impact": True, "color": "#4B5563"},
        {"code": "depends_on", "name": "Зависит от", "directed": True, "affects_impact": True, "color": "#EF4444"},
        {"code": "realizes", "name": "Реализует", "directed": True, "affects_impact": True, "color": "#10B981"},
        {"code": "implemented_in", "name": "Реализовано в", "directed": True, "affects_impact": True, "color": "#3B82F6"},
        {"code": "describes", "name": "Описывает", "directed": True, "affects_impact": False, "color": "#64748B"},
        {"code": "verifies", "name": "Проверяет", "directed": True, "affects_impact": True, "color": "#F59E0B"},
        {"code": "affects", "name": "Влияет на", "directed": True, "affects_impact": True, "color": "#EF4444"},
    ]

    for rel_data in relation_types:
        if not db.query(models.RelationType).filter_by(code=rel_data["code"]).first():
            db.add(models.RelationType(**rel_data))

    db.commit()
