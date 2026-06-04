import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.all import Project, Artifact, ArtifactRelation, CodeFragment, ChangeLog
from app.services.changelog_service import log_change

def seed():
    db = SessionLocal()

    # 1. Create Project
    project = Project(
        name="Веб-калькулятор",
        description="Учебное веб-приложение для выполнения арифметических операций, проверки ошибок ввода и хранения истории вычислений."
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # ChangeLog for project creation
    log_change(
        db, 
        project_id=project.id, 
        entity_type="Project", 
        entity_id=project.id, 
        operation="CREATE", 
        old_val=None, 
        new_val={"name": project.name, "description": project.description}
    )

    print(f"Created Project: {project.id}")

    # 2. Add DomainConcepts
    artifacts_data = [
        # DomainConcepts
        ("ENT-001", "Пользователь", "DomainConcept", "Человек, который вводит арифметические выражения и получает результат вычисления.", "Active", "Medium"),
        ("ENT-002", "Арифметическое выражение", "DomainConcept", "Строка или набор операндов и операций, введённых пользователем.", "Active", "High"),
        ("ENT-003", "Операция", "DomainConcept", "Арифметическое действие: сложение, вычитание, умножение, деление.", "Active", "High"),
        ("ENT-004", "Результат вычисления", "DomainConcept", "Значение, полученное после обработки арифметического выражения.", "Active", "High"),
        ("ENT-005", "История вычислений", "DomainConcept", "Список ранее выполненных вычислений пользователя.", "Draft", "Medium"),
        
        # Requirements
        ("REQ-001", "Выполнение базовых арифметических операций", "Requirement", "Система должна выполнять сложение, вычитание, умножение и деление.", "Active", "High"),
        ("REQ-002", "Проверка деления на ноль", "Requirement", "При попытке деления на ноль система должна показать понятное сообщение об ошибке.", "Active", "Critical"),
        ("REQ-003", "Отображение результата вычисления", "Requirement", "После ввода выражения система должна показать результат пользователю.", "Active", "High"),
        ("REQ-004", "Сохранение истории вычислений", "Requirement", "Система должна сохранять последние выполненные вычисления.", "Draft", "Medium"),
        ("REQ-005", "Очистка текущего выражения", "Requirement", "Пользователь должен иметь возможность очистить введённое выражение.", "Active", "Medium"),

        # Modules
        ("MOD-001", "CalculatorCore", "Module", "Модуль вычисления арифметических выражений.", "Active", "High"),
        ("MOD-002", "CalculatorUI", "Module", "Модуль пользовательского интерфейса калькулятора.", "Active", "High"),
        ("MOD-003", "HistoryStorage", "Module", "Модуль хранения истории вычислений.", "Draft", "Medium"),

        # Files
        ("FILE-001", "calculator.ts", "File", "Файл с логикой вычисления арифметических выражений.", "Active", "High"),
        ("FILE-002", "CalculatorPage.tsx", "File", "Компонент страницы калькулятора.", "Active", "High"),
        ("FILE-003", "historyStorage.ts", "File", "Файл работы с истории вычислений.", "Draft", "Medium"),

        # Functions
        ("FUNC-001", "evaluateExpression", "Function", "Вычисляет арифметическое выражение.", "Active", "High"),
        ("FUNC-002", "divide", "Function", "Выполняет операцию деления.", "Active", "Critical"),
        ("FUNC-003", "renderResult", "Function", "Отображает результат вычисления на странице.", "Active", "High"),
        ("FUNC-004", "saveCalculation", "Function", "Сохраняет вычисление в историю.", "Draft", "Medium"),
        ("FUNC-005", "clearExpression", "Function", "Очищает текущее выражение.", "Active", "Medium"),

        # TestCases
        ("TEST-001", "Проверка базовых операций", "TestCase", "Проверяет сложение, вычитание, умножение и деление.", "Active", "High"),
        ("TEST-002", "Проверка деления на ноль", "TestCase", "Проверяет, что система корректно обрабатывает попытку деления на ноль.", "Active", "Critical"),
        ("TEST-003", "Проверка сохранения истории", "TestCase", "Проверяет добавление вычисления в историю.", "Draft", "Medium"),

        # Document and Decision
        ("DOC-001", "Спецификация калькулятора", "Document", "Документ с описанием требований и поведения веб-калькулятора.", "Active", "Medium"),
        ("DEC-001", "Решение использовать клиентские вычисления", "Decision", "Вычисления выполняются на клиенте без отдельного серверного расчёта.", "Active", "Medium"),
    ]

    artifacts_dict = {}
    for code, title, type_id, desc, status, priority in artifacts_data:
        art = Artifact(
            project_id=project.id,
            type_id=type_id,
            code=code,
            title=title,
            description=desc,
            status=status,
            priority=priority
        )
        db.add(art)
        db.commit()
        db.refresh(art)
        artifacts_dict[code] = art.id
        
        log_change(
            db, 
            project_id=project.id, 
            entity_type="Artifact", 
            entity_id=art.id, 
            operation="CREATE", 
            old_val=None, 
            new_val={"code": code, "title": title}
        )
    
    print("Created Artifacts")

    relations_data = [
        # Domain concepts
        ("ENT-002", "ENT-003", "depends_on"),
        ("ENT-004", "ENT-002", "depends_on"),
        ("ENT-005", "ENT-004", "depends_on"),
        
        # Requirements with Domain concepts
        ("REQ-001", "ENT-002", "depends_on"),
        ("REQ-001", "ENT-003", "depends_on"),
        ("REQ-002", "ENT-003", "depends_on"),
        ("REQ-003", "ENT-004", "depends_on"),
        ("REQ-004", "ENT-005", "depends_on"),
        
        # Modules with Requirements
        ("MOD-001", "REQ-001", "realizes"),
        ("MOD-001", "REQ-002", "realizes"),
        ("MOD-002", "REQ-003", "realizes"),
        ("MOD-003", "REQ-004", "realizes"),
        
        # Files with Modules
        ("FILE-001", "MOD-001", "part_of"),
        ("FILE-002", "MOD-002", "part_of"),
        ("FILE-003", "MOD-003", "part_of"),
        
        # Functions with Files
        ("FUNC-001", "FILE-001", "part_of"),
        ("FUNC-002", "FILE-001", "part_of"),
        ("FUNC-003", "FILE-002", "part_of"),
        ("FUNC-004", "FILE-003", "part_of"),
        ("FUNC-005", "FILE-002", "part_of"),
        
        # TestCases with Requirements
        ("TEST-001", "REQ-001", "verifies"),
        ("TEST-002", "REQ-002", "verifies"),
        ("TEST-003", "REQ-004", "verifies"),
        
        # Document and Decision with Requirements
        ("DOC-001", "REQ-001", "describes"),
        ("DOC-001", "REQ-002", "describes"),
        ("DOC-001", "REQ-004", "describes"),
        ("DEC-001", "REQ-001", "refines"),
    ]

    for src_code, tgt_code, rel_type in relations_data:
        rel = ArtifactRelation(
            project_id=project.id,
            source_artifact_id=artifacts_dict[src_code],
            target_artifact_id=artifacts_dict[tgt_code],
            relation_type_id=rel_type
        )
        db.add(rel)
    db.commit()

    print("Created Relations")

    # Add code fragments
    code_divide = """export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Division by zero");
  }

  return a / b;
}"""
    frag1 = CodeFragment(
        artifact_id=artifacts_dict["FUNC-002"],
        language="typescript",
        content=code_divide
    )
    db.add(frag1)

    code_evaluate = """export function evaluateExpression(a: number, b: number, operation: string): number {
  switch (operation) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return divide(a, b);
    default:
      throw new Error("Unknown operation");
  }
}"""
    frag2 = CodeFragment(
        artifact_id=artifacts_dict["FUNC-001"],
        language="typescript",
        content=code_evaluate
    )
    db.add(frag2)
    db.commit()

    print("Created Code Fragments")
    db.close()

if __name__ == "__main__":
    seed()
