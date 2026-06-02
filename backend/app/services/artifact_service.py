from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import all as models
from app.schemas import all as schemas
from app.services.changelog_service import log_change

def get_project_artifacts(db: Session, project_id: str):
    return db.query(models.Artifact).filter(models.Artifact.project_id == project_id).all()

def create_project_artifact(db: Session, project_id: str, artifact: schemas.ArtifactCreate):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    type_exists = db.query(models.ArtifactType).filter(models.ArtifactType.code == artifact.type_id).first()
    if not type_exists:
        raise HTTPException(status_code=400, detail="Invalid artifact type_id")

    code_exists = db.query(models.Artifact).filter(
        models.Artifact.project_id == project_id, 
        models.Artifact.code == artifact.code
    ).first()
    if code_exists:
        raise HTTPException(status_code=409, detail="Artifact with this code already exists in the project")
        
    db_artifact = models.Artifact(**artifact.model_dump(), project_id=project_id)
    db.add(db_artifact)
    db.commit()
    db.refresh(db_artifact)
    log_change(db, project_id, "Artifact", db_artifact.id, "CREATE", None, {"code": db_artifact.code})
    return db_artifact

def get_artifact(db: Session, artifact_id: str):
    db_artifact = db.query(models.Artifact).filter(models.Artifact.id == artifact_id).first()
    if not db_artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return db_artifact

def update_artifact(db: Session, artifact_id: str, artifact: schemas.ArtifactUpdate):
    db_artifact = get_artifact(db, artifact_id)
    
    if artifact.type_id is not None:
        type_exists = db.query(models.ArtifactType).filter(models.ArtifactType.code == artifact.type_id).first()
        if not type_exists:
            raise HTTPException(status_code=400, detail="Invalid artifact type_id")

    if artifact.code is not None and artifact.code != db_artifact.code:
        code_exists = db.query(models.Artifact).filter(
            models.Artifact.project_id == db_artifact.project_id, 
            models.Artifact.code == artifact.code
        ).first()
        if code_exists:
            raise HTTPException(status_code=409, detail="Artifact with this code already exists in the project")
            
    update_data = artifact.model_dump(exclude_unset=True)
    old_state = {k: getattr(db_artifact, k) for k in update_data.keys()}
    for key, value in update_data.items():
        setattr(db_artifact, key, value)
    
    db.commit()
    db.refresh(db_artifact)
    log_change(db, db_artifact.project_id, "Artifact", db_artifact.id, "UPDATE", old_state, update_data)
    return db_artifact

def delete_artifact(db: Session, artifact_id: str):
    db_artifact = get_artifact(db, artifact_id)
    project_id = db_artifact.project_id
    code = db_artifact.code
    db.delete(db_artifact)
    db.commit()
    log_change(db, project_id, "Artifact", artifact_id, "DELETE", {"code": code}, None)
    return {"message": "Artifact deleted"}
