from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import all as models
from app.schemas import all as schemas
from app.services.changelog_service import log_change

def get_projects(db: Session):
    return db.query(models.Project).all()

def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    log_change(db, db_project.id, "Project", db_project.id, "CREATE", None, {"name": db_project.name})
    return db_project

def get_project(db: Session, project_id: str):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

def delete_project(db: Session, project_id: str):
    db_project = get_project(db, project_id)
    project_name = db_project.name
    db.delete(db_project)
    db.commit()
    # It's hard to log change to a deleted project since it cascades, but we'll log it if needed. 
    # Actually, if project is deleted, change log is deleted too (cascade). So no need to log.
    return {"message": "Project deleted"}
