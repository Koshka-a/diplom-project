from sqlalchemy.orm import Session
from fastapi import HTTPException
from collections import defaultdict
from app.models import all as models
from app.schemas import all as schemas

def analyze_impact(db: Session, project_id: str, request: schemas.ImpactRequest):
    source_artifact = db.query(models.Artifact).filter(models.Artifact.id == request.artifact_id, models.Artifact.project_id == project_id).first()
    if not source_artifact:
        raise HTTPException(status_code=404, detail="Source artifact not found")

    relations_query = db.query(models.ArtifactRelation).filter(models.ArtifactRelation.project_id == project_id)
    if request.include_relation_types:
        relations_query = relations_query.filter(models.ArtifactRelation.relation_type_id.in_(request.include_relation_types))
    
    relations = relations_query.all()
    
    # Build graph
    graph = defaultdict(list)
    for rel in relations:
        if request.direction in ["forward", "both"]:
            graph[rel.source_artifact_id].append({
                "target": rel.target_artifact_id,
                "type": rel.relation_type_id,
                "weight": rel.weight or 1.0
            })
        if request.direction in ["backward", "both"]:
            graph[rel.target_artifact_id].append({
                "target": rel.source_artifact_id,
                "type": rel.relation_type_id,
                "weight": rel.weight or 1.0
            })

    queue = [(source_artifact.id, 0, [])]
    visited = {source_artifact.id}
    result = []
    
    # Pre-fetch artifacts for quick lookup
    all_artifacts = {a.id: a for a in db.query(models.Artifact).filter(models.Artifact.project_id == project_id).all()}

    while queue:
        current_id, depth, path = queue.pop(0)
        
        if depth >= request.max_depth:
            continue
            
        for edge in graph[current_id]:
            next_id = edge["target"]
            if next_id in visited:
                continue
                
            visited.add(next_id)
            next_path = path + [edge["type"]]
            
            # score = max(0.2, 1 - 0.25 * depth) * relation_weight
            score = max(0.2, 1 - 0.25 * (depth + 1)) * edge["weight"]
            
            target_artifact = all_artifacts.get(next_id)
            if target_artifact:
                result.append({
                    "artifact": {
                        "code": target_artifact.code,
                        "type": target_artifact.type_id,
                        "title": target_artifact.title
                    },
                    "depth": depth + 1,
                    "score": round(score, 2),
                    "path": [source_artifact.code] + next_path + [target_artifact.code]
                })
                
                queue.append((next_id, depth + 1, next_path))

    return {
        "source": {
            "code": source_artifact.code,
            "title": source_artifact.title
        },
        "items": result
    }
