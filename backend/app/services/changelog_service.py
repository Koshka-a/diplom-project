from sqlalchemy.orm import Session
from app.models import all as models
from typing import Dict, Any, Optional

def log_change(db: Session, project_id: str, entity_type: str, entity_id: str, operation: str, old_val: Optional[Dict[str, Any]] = None, new_val: Optional[Dict[str, Any]] = None):
    log = models.ChangeLog(
        project_id=project_id,
        entity_type=entity_type,
        entity_id=entity_id,
        operation=operation,
        old_value_json=old_val,
        new_value_json=new_val
    )
    db.add(log)
    db.commit()
