from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas import all as schemas
from app.services import artifact_service

router = APIRouter(prefix="/projects/{project_id}/artifacts", tags=["artifacts"])

@router.get("/", response_model=List[schemas.ArtifactResponse])
def get_project_artifacts(project_id: str, db: Session = Depends(get_db)):
    return artifact_service.get_project_artifacts(db, project_id)

@router.post("/", response_model=schemas.ArtifactResponse)
def create_project_artifact(project_id: str, artifact: schemas.ArtifactCreate, db: Session = Depends(get_db)):
    return artifact_service.create_project_artifact(db, project_id, artifact)
