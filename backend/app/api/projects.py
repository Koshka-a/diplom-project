from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas import all as schemas
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return project_service.get_projects(db)

@router.post("/", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return project_service.create_project(db, project)

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    return project_service.get_project(db, project_id)

@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    return project_service.delete_project(db, project_id)
