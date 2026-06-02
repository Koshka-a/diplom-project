from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import all as models
from app.schemas import all as schemas
from app.services import artifact_service
from app.services.changelog_service import log_change

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

@router.get("/{artifact_id}", response_model=schemas.ArtifactResponse)
def get_artifact(artifact_id: str, db: Session = Depends(get_db)):
    return artifact_service.get_artifact(db, artifact_id)

@router.patch("/{artifact_id}", response_model=schemas.ArtifactResponse)
def update_artifact(artifact_id: str, artifact: schemas.ArtifactUpdate, db: Session = Depends(get_db)):
    return artifact_service.update_artifact(db, artifact_id, artifact)

@router.delete("/{artifact_id}")
def delete_artifact(artifact_id: str, db: Session = Depends(get_db)):
    return artifact_service.delete_artifact(db, artifact_id)

@router.get("/{artifact_id}/code", response_model=List[schemas.CodeFragmentResponse])
def get_code_fragments(artifact_id: str, db: Session = Depends(get_db)):
    fragments = db.query(models.CodeFragment).filter(models.CodeFragment.artifact_id == artifact_id).all()
    return fragments

@router.post("/{artifact_id}/code", response_model=schemas.CodeFragmentResponse)
def create_or_update_code_fragment(artifact_id: str, fragment: schemas.CodeFragmentUpdate, db: Session = Depends(get_db)):
    db_artifact = artifact_service.get_artifact(db, artifact_id)
    
    db_fragment = db.query(models.CodeFragment).filter(models.CodeFragment.artifact_id == artifact_id).first()
    
    if db_fragment:
        update_data = fragment.model_dump(exclude_unset=True)
        old_state = {k: getattr(db_fragment, k) for k in update_data.keys()}
        for key, value in update_data.items():
            setattr(db_fragment, key, value)
        log_change(db, db_artifact.project_id, "CodeFragment", db_fragment.id, "UPDATE", old_state, update_data)
    else:
        create_data = fragment.model_dump()
        create_data["artifact_id"] = artifact_id
        db_fragment = models.CodeFragment(**create_data)
        db.add(db_fragment)
        db.commit()
        log_change(db, db_artifact.project_id, "CodeFragment", db_fragment.id, "CREATE", None, create_data)
        
    db.commit()
    db.refresh(db_fragment)
    return db_fragment
