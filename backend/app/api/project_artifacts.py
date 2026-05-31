from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import all as models
from app.schemas import all as schemas

router = APIRouter(prefix="/projects/{project_id}/artifacts", tags=["artifacts"])

@router.get("/", response_model=List[schemas.ArtifactResponse])
def get_project_artifacts(project_id: str, db: Session = Depends(get_db)):
    artifacts = db.query(models.Artifact).filter(models.Artifact.project_id == project_id).all()
    return artifacts

@router.post("/", response_model=schemas.ArtifactResponse)
def create_project_artifact(project_id: str, artifact: schemas.ArtifactCreate, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db_artifact = models.Artifact(**artifact.model_dump(), project_id=project_id)
    db.add(db_artifact)
    db.commit()
    db.refresh(db_artifact)
    return db_artifact
