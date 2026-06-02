from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import all as models
from app.schemas import all as schemas
from app.services.relation_service import create_relation as service_create_relation
from app.services.changelog_service import log_change

router = APIRouter(tags=["relations"])

@router.get("/projects/{project_id}/relations", response_model=List[schemas.RelationResponse])
def get_project_relations(project_id: str, db: Session = Depends(get_db)):
    relations = db.query(models.ArtifactRelation).filter(models.ArtifactRelation.project_id == project_id).all()
    return relations

@router.post("/projects/{project_id}/relations", response_model=schemas.RelationResponse)
def create_project_relation(project_id: str, relation: schemas.RelationCreate, db: Session = Depends(get_db)):
    return service_create_relation(db, project_id, relation)

@router.delete("/relations/{relation_id}")
def delete_relation(relation_id: str, db: Session = Depends(get_db)):
    db_relation = db.query(models.ArtifactRelation).filter(models.ArtifactRelation.id == relation_id).first()
    if not db_relation:
        raise HTTPException(status_code=404, detail="Relation not found")
    project_id = db_relation.project_id
    rel_type = db_relation.relation_type_id
    db.delete(db_relation)
    db.commit()
    log_change(db, project_id, "Relation", relation_id, "DELETE", {"type": rel_type}, None)
    return {"message": "Relation deleted"}

@router.get("/relation-types", response_model=List[schemas.RelationTypeResponse])
def get_relation_types(db: Session = Depends(get_db)):
    return db.query(models.RelationType).all()

@router.get("/artifact-types", response_model=List[schemas.ArtifactTypeResponse])
def get_artifact_types(db: Session = Depends(get_db)):
    return db.query(models.ArtifactType).all()
