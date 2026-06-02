from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models import all as models
from app.schemas import all as schemas

router = APIRouter(tags=["changelog"])

@router.get("/projects/{project_id}/changelog", response_model=List[schemas.ChangeLogResponse])
def get_project_changelog(
    project_id: str,
    entity_type: Optional[str] = Query(None, description="Filter by entity type (e.g. Artifact, Relation, Project)"),
    operation: Optional[str] = Query(None, description="Filter by operation (e.g. CREATE, UPDATE, DELETE, IMPORT)"),
    db: Session = Depends(get_db)
):
    query = db.query(models.ChangeLog).filter(models.ChangeLog.project_id == project_id)
    
    if entity_type:
        query = query.filter(models.ChangeLog.entity_type == entity_type)
    if operation:
        query = query.filter(models.ChangeLog.operation == operation)
        
    query = query.order_by(models.ChangeLog.created_at.desc())
    
    return query.all()
