from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import all as models
from app.services.changelog_service import log_change

router = APIRouter(prefix="/demo", tags=["demo"])

@router.post("/load")
def load_demo_data(db: Session = Depends(get_db)):
    # Create project
    project = models.Project(
        name="Веб-калькулятор",
        description="Учебное веб-приложение для выполнения арифметических операций, проверки ошибок ввода и хранения истории вычислений."
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    project_id = project.id

    log_change(
        db, 
        project_id=project_id, 
        entity_type="Project", 
        entity_id=project_id, 
        operation="CREATE", 
        old_val=None, 
        new_val={"name": project.name, "description": project.description}
    )

    artifacts_data = [
        # DomainConcepts
        {"code": "ENT-001", "title": "Пользователь", "type_id": "DomainConcept", "description": "Человек, который вводит арифметические выражения и получает результат вычисления.", "status": "Active", "priority": "Medium"},
        {"code": "ENT-002", "title": "Арифметическое выражение", "type_id": "DomainConcept", "description": "Строка или набор операндов и операций, введённых пользователем.", "status": "Active", "priority": "High"},
        {"code": "ENT-003", "title": "Операция", "type_id": "DomainConcept", "description": "Арифметическое действие: сложение, вычитание, умножение, деление.", "status": "Active", "priority": "High"},
        {"code": "ENT-004", "title": "Результат вычисления", "type_id": "DomainConcept", "description": "Значение, полученное после обработки арифметического выражения.", "status": "Active", "priority": "High"},
        {"code": "ENT-005", "title": "История вычислений", "type_id": "DomainConcept", "description": "Список ранее выполненных вычислений пользователя.", "status": "Draft", "priority": "Medium"},
        
        # Requirements
        {"code": "REQ-001", "title": "Выполнение базовых арифметических операций", "type_id": "Requirement", "description": "Система должна выполнять сложение, вычитание, умножение и деление.", "status": "Active", "priority": "High"},
        {"code": "REQ-002", "title": "Проверка деления на ноль", "type_id": "Requirement", "description": "При попытке деления на ноль система должна показать понятное сообщение об ошибке.", "status": "Active", "priority": "Critical"},
        {"code": "REQ-003", "title": "Отображение результата вычисления", "type_id": "Requirement", "description": "После ввода выражения система должна показать результат пользователю.", "status": "Active", "priority": "High"},
        {"code": "REQ-004", "title": "Сохранение истории вычислений", "type_id": "Requirement", "description": "Система должна сохранять последние выполненные вычисления.", "status": "Draft", "priority": "Medium"},
        {"code": "REQ-005", "title": "Очистка текущего выражения", "type_id": "Requirement", "description": "Пользователь должен иметь возможность очистить введённое выражение.", "status": "Active", "priority": "Medium"},

        # Modules
        {"code": "MOD-001", "title": "CalculatorCore", "type_id": "Module", "description": "Модуль вычисления арифметических выражений.", "status": "Active", "priority": "High"},
        {"code": "MOD-002", "title": "CalculatorUI", "type_id": "Module", "description": "Модуль пользовательского интерфейса калькулятора.", "status": "Active", "priority": "High"},
        {"code": "MOD-003", "title": "HistoryStorage", "type_id": "Module", "description": "Модуль хранения истории вычислений.", "status": "Draft", "priority": "Medium"},

        # Files
        {"code": "FILE-001", "title": "calculator.ts", "type_id": "File", "description": "Файл с логикой вычисления арифметических выражений.", "status": "Active", "priority": "High"},
        {"code": "FILE-002", "title": "CalculatorPage.tsx", "type_id": "File", "description": "Компонент страницы калькулятора.", "status": "Active", "priority": "High"},
        {"code": "FILE-003", "title": "historyStorage.ts", "type_id": "File", "description": "Файл работы с историей вычислений.", "status": "Draft", "priority": "Medium"},

        # Functions
        {"code": "FUNC-001", "title": "evaluateExpression", "type_id": "Function", "description": "Вычисляет арифметическое выражение.", "status": "Active", "priority": "High"},
        {"code": "FUNC-002", "title": "divide", "type_id": "Function", "description": "Выполняет операцию деления.", "status": "Active", "priority": "Critical"},
        {"code": "FUNC-003", "title": "renderResult", "type_id": "Function", "description": "Отображает результат вычисления на странице.", "status": "Active", "priority": "High"},
        {"code": "FUNC-004", "title": "saveCalculation", "type_id": "Function", "description": "Сохраняет вычисление в историю.", "status": "Draft", "priority": "Medium"},
        {"code": "FUNC-005", "title": "clearExpression", "type_id": "Function", "description": "Очищает текущее выражение.", "status": "Active", "priority": "Medium"},

        # TestCases
        {"code": "TEST-001", "title": "Проверка базовых операций", "type_id": "TestCase", "description": "Проверяет сложение, вычитание, умножение и деление.", "status": "Active", "priority": "High"},
        {"code": "TEST-002", "title": "Проверка деления на ноль", "type_id": "TestCase", "description": "Проверяет, что система корректно обрабатывает попытку деления на ноль.", "status": "Active", "priority": "Critical"},
        {"code": "TEST-003", "title": "Проверка сохранения истории", "type_id": "TestCase", "description": "Проверяет добавление вычисления в историю.", "status": "Draft", "priority": "Medium"},

        # Document and Decision
        {"code": "DOC-001", "title": "Спецификация калькулятора", "type_id": "Document", "description": "Документ с описанием требований и поведения веб-калькулятора.", "status": "Active", "priority": "Medium"},
        {"code": "DEC-001", "title": "Решение использовать клиентские вычисления", "type_id": "Decision", "description": "Вычисления выполняются на клиенте без отдельного серверного расчёта.", "status": "Active", "priority": "Medium"},
    ]

    artifact_map = {}
    for adata in artifacts_data:
        artifact = models.Artifact(project_id=project_id, **adata)
        db.add(artifact)
        db.commit()
        db.refresh(artifact)
        artifact_map[adata["code"]] = artifact.id

        log_change(
            db, 
            project_id=project_id, 
            entity_type="Artifact", 
            entity_id=artifact.id, 
            operation="CREATE", 
            old_val=None, 
            new_val={"code": adata["code"], "title": adata["title"]}
        )

    relations_data = [
        {"source": "ENT-002", "target": "ENT-003", "type": "depends_on"},
        {"source": "ENT-004", "target": "ENT-002", "type": "depends_on"},
        {"source": "ENT-005", "target": "ENT-004", "type": "depends_on"},
        {"source": "REQ-001", "target": "ENT-002", "type": "depends_on"},
        {"source": "REQ-001", "target": "ENT-003", "type": "depends_on"},
        {"source": "REQ-002", "target": "ENT-003", "type": "depends_on"},
        {"source": "REQ-003", "target": "ENT-004", "type": "depends_on"},
        {"source": "REQ-004", "target": "ENT-005", "type": "depends_on"},
        {"source": "MOD-001", "target": "REQ-001", "type": "realizes"},
        {"source": "MOD-001", "target": "REQ-002", "type": "realizes"},
        {"source": "MOD-002", "target": "REQ-003", "type": "realizes"},
        {"source": "MOD-003", "target": "REQ-004", "type": "realizes"},
        {"source": "FILE-001", "target": "MOD-001", "type": "part_of"},
        {"source": "FILE-002", "target": "MOD-002", "type": "part_of"},
        {"source": "FILE-003", "target": "MOD-003", "type": "part_of"},
        {"source": "FUNC-001", "target": "FILE-001", "type": "part_of"},
        {"source": "FUNC-002", "target": "FILE-001", "type": "part_of"},
        {"source": "FUNC-003", "target": "FILE-002", "type": "part_of"},
        {"source": "FUNC-004", "target": "FILE-003", "type": "part_of"},
        {"source": "FUNC-005", "target": "FILE-002", "type": "part_of"},
        {"source": "TEST-001", "target": "REQ-001", "type": "verifies"},
        {"source": "TEST-002", "target": "REQ-002", "type": "verifies"},
        {"source": "TEST-003", "target": "REQ-004", "type": "verifies"},
        {"source": "DOC-001", "target": "REQ-001", "type": "describes"},
        {"source": "DOC-001", "target": "REQ-002", "type": "describes"},
        {"source": "DOC-001", "target": "REQ-004", "type": "describes"},
        {"source": "DEC-001", "target": "REQ-001", "type": "refines"},
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

    code_snippets = {
        "FUNC-002": (
            "export function divide(a: number, b: number): number {\n"
            "  if (b === 0) {\n"
            "    throw new Error(\"Division by zero\");\n"
            "  }\n\n"
            "  return a / b;\n"
            "}"
        ),
        "FUNC-001": (
            "export function evaluateExpression(a: number, b: number, operation: string): number {\n"
            "  switch (operation) {\n"
            "    case \"+\":\n"
            "      return a + b;\n"
            "    case \"-\":\n"
            "      return a - b;\n"
            "    case \"*\":\n"
            "      return a * b;\n"
            "    case \"/\":\n"
            "      return divide(a, b);\n"
            "    default:\n"
            "      throw new Error(\"Unknown operation\");\n"
            "  }\n"
            "}"
        ),
    }

    for code, content in code_snippets.items():
        art_id = artifact_map.get(code)
        if art_id:
            cf = models.CodeFragment(
                artifact_id=art_id,
                content=content,
                language="typescript",
                file_path=None
            )
            db.add(cf)
    db.commit()

    return {"message": "Demo data loaded", "project_id": project_id}
