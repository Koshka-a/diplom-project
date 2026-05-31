from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import all as models
from app.schemas import all as schemas

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

@router.get("/{artifact_id}", response_model=schemas.ArtifactResponse)
def get_artifact(artifact_id: str, db: Session = Depends(get_db)):
    db_artifact = db.query(models.Artifact).filter(models.Artifact.id == artifact_id).first()
    if not db_artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return db_artifact

@router.patch("/{artifact_id}", response_model=schemas.ArtifactResponse)
def update_artifact(artifact_id: str, artifact: schemas.ArtifactUpdate, db: Session = Depends(get_db)):
    db_artifact = db.query(models.Artifact).filter(models.Artifact.id == artifact_id).first()
    if not db_artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    update_data = artifact.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_artifact, key, value)
    
    db.commit()
    db.refresh(db_artifact)
    return db_artifact

@router.delete("/{artifact_id}")
def delete_artifact(artifact_id: str, db: Session = Depends(get_db)):
    db_artifact = db.query(models.Artifact).filter(models.Artifact.id == artifact_id).first()
    if not db_artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    db.delete(db_artifact)
    db.commit()
    return {"message": "Artifact deleted"}

@router.get("/{artifact_id}/code", response_model=List[schemas.CodeFragmentResponse])
def get_code_fragments(artifact_id: str, db: Session = Depends(get_db)):
    fragments = db.query(models.CodeFragment).filter(models.CodeFragment.artifact_id == artifact_id).all()
    return fragments

@router.post("/{artifact_id}/code", response_model=schemas.CodeFragmentResponse)
def create_or_update_code_fragment(artifact_id: str, fragment: schemas.CodeFragmentUpdate, db: Session = Depends(get_db)):
    db_artifact = db.query(models.Artifact).filter(models.Artifact.id == artifact_id).first()
    if not db_artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    db_fragment = db.query(models.CodeFragment).filter(models.CodeFragment.artifact_id == artifact_id).first()
    
    if db_fragment:
        update_data = fragment.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_fragment, key, value)
    else:
        create_data = fragment.model_dump()
        create_data["artifact_id"] = artifact_id
        db_fragment = models.CodeFragment(**create_data)
        db.add(db_fragment)
        
    db.commit()
    db.refresh(db_fragment)
    return db_fragment
