from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import all as models
from app.schemas import all as schemas
from app.services.changelog_service import log_change

def check_cycles(db: Session, project_id: str, source_id: str, target_id: str, relation_type_code: str):
    if relation_type_code not in ["part_of", "is_a"]:
        return

    # Check if target -> source path exists using the same relation type
    # A simple BFS or DFS
    visited = set()
    queue = [target_id]

    while queue:
        current_id = queue.pop(0)
        if current_id == source_id:
            raise HTTPException(status_code=400, detail="Связь создает цикл в иерархии")
            
        visited.add(current_id)
        
        # Get outgoing relations of the same type from current_id
        outgoing_relations = db.query(models.ArtifactRelation).filter(
            models.ArtifactRelation.project_id == project_id,
            models.ArtifactRelation.source_artifact_id == current_id,
            models.ArtifactRelation.relation_type_id == relation_type_code
        ).all()

        for rel in outgoing_relations:
            if rel.target_artifact_id not in visited:
                queue.append(rel.target_artifact_id)

def create_relation(db: Session, project_id: str, relation: schemas.RelationCreate):
    # Check if relation type exists
    rel_type = db.query(models.RelationType).filter(models.RelationType.code == relation.relation_type_id).first()
    if not rel_type:
        raise HTTPException(status_code=400, detail="Invalid relation type")

    # Check if source and target exist
    source = db.query(models.Artifact).filter(models.Artifact.id == relation.source_artifact_id, models.Artifact.project_id == project_id).first()
    target = db.query(models.Artifact).filter(models.Artifact.id == relation.target_artifact_id, models.Artifact.project_id == project_id).first()
    
    if not source or not target:
        raise HTTPException(status_code=404, detail="Source or target artifact not found")

    if source.id == target.id:
        raise HTTPException(status_code=400, detail="Связь с самим собой запрещена")

    if rel_type.source_types_json and source.type_id not in rel_type.source_types_json:
        raise HTTPException(status_code=400, detail=f"Тип связи {rel_type.code} не поддерживает источник типа {source.type_id}")
    
    if rel_type.target_types_json and target.type_id not in rel_type.target_types_json:
        raise HTTPException(status_code=400, detail=f"Тип связи {rel_type.code} не поддерживает цель типа {target.type_id}")

    # Check for exact duplicate
    duplicate = db.query(models.ArtifactRelation).filter(
        models.ArtifactRelation.project_id == project_id,
        models.ArtifactRelation.source_artifact_id == source.id,
        models.ArtifactRelation.target_artifact_id == target.id,
        models.ArtifactRelation.relation_type_id == relation.relation_type_id
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Такая связь уже существует")

    check_cycles(db, project_id, relation.source_artifact_id, relation.target_artifact_id, relation.relation_type_id)

    db_relation = models.ArtifactRelation(
        project_id=project_id,
        **relation.model_dump()
    )
    db.add(db_relation)
    db.commit()
    db.refresh(db_relation)
    log_change(db, project_id, "Relation", db_relation.id, "CREATE", None, {"source": source.code, "target": target.code, "type": rel_type.code})
    return db_relation
