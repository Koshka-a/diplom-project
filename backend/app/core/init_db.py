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
        {"code": "Defect", "name": "Дефект", "category": "issue", "color": "#EF4444"},
        {"code": "Decision", "name": "Архитектурное решение", "category": "architecture", "color": "#F97316"},
        {"code": "ChangeRequest", "name": "Запрос на изменение", "category": "management", "color": "#D946EF"},
    ]

    for type_data in artifact_types:
        existing = db.query(models.ArtifactType).filter_by(code=type_data["code"]).first()
        if not existing:
            db.add(models.ArtifactType(**type_data))
        else:
            for k, v in type_data.items():
                setattr(existing, k, v)

    # Default relation types
    relation_types = [
        {"code": "is_a", "name": "Род-вид / специализация", "directed": True, "affects_impact": False, "color": "#9CA3AF", "source_types_json": ["DomainConcept", "Requirement", "Module", "Component", "File", "Function", "TestCase", "Document", "Defect", "Decision", "ChangeRequest"], "target_types_json": ["DomainConcept", "Requirement", "Module", "Component", "File", "Function", "TestCase", "Document", "Defect", "Decision", "ChangeRequest"]},
        {"code": "part_of", "name": "Часть-целое", "directed": True, "affects_impact": True, "color": "#4B5563", "source_types_json": ["Module", "Component", "File", "Function", "DomainConcept", "Requirement"], "target_types_json": ["Module", "Component", "File", "DomainConcept", "Requirement"]},
        {"code": "depends_on", "name": "Зависит от", "directed": True, "affects_impact": True, "color": "#EF4444", "source_types_json": ["Module", "Component", "Function", "File", "Requirement", "DomainConcept"], "target_types_json": ["Module", "Component", "Function", "File", "Requirement", "DomainConcept"]},
        {"code": "realizes", "name": "Реализует", "directed": True, "affects_impact": True, "color": "#10B981", "source_types_json": ["Module", "Component", "Function", "File"], "target_types_json": ["Requirement", "Decision"]},
        {"code": "implemented_in", "name": "Реализовано в", "directed": True, "affects_impact": True, "color": "#3B82F6", "source_types_json": ["Requirement", "Decision"], "target_types_json": ["Module", "Component", "Function", "File"]},
        {"code": "describes", "name": "Описывает", "directed": True, "affects_impact": False, "color": "#64748B", "source_types_json": ["Document"], "target_types_json": ["Requirement", "DomainConcept", "Module", "Component", "Decision", "Defect", "ChangeRequest", "File", "Function", "TestCase", "Document"]},
        {"code": "verifies", "name": "Проверяет", "directed": True, "affects_impact": True, "color": "#F59E0B", "source_types_json": ["TestCase"], "target_types_json": ["Requirement", "Defect", "Function", "Module", "Component", "Decision", "ChangeRequest"]},
        {"code": "affects", "name": "Влияет на", "directed": True, "affects_impact": True, "color": "#EF4444", "source_types_json": ["Defect", "ChangeRequest"], "target_types_json": ["Module", "Component", "Function", "File", "Requirement", "DomainConcept", "Decision"]},
        {"code": "refines", "name": "Уточняет", "directed": True, "affects_impact": True, "color": "#F97316", "source_types_json": ["Decision", "Requirement"], "target_types_json": ["Requirement", "Decision"]},
    ]

    for rel_data in relation_types:
        existing = db.query(models.RelationType).filter_by(code=rel_data["code"]).first()
        if not existing:
            db.add(models.RelationType(**rel_data))
        else:
            for k, v in rel_data.items():
                setattr(existing, k, v)

    db.commit()
