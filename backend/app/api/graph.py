from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import all as models
from app.schemas import all as schemas

router = APIRouter(prefix="/projects/{project_id}/graph", tags=["graph"])

@router.get("/", response_model=schemas.GraphResponse)
def get_project_graph(project_id: str, db: Session = Depends(get_db)):
    artifacts = db.query(models.Artifact).filter(models.Artifact.project_id == project_id).all()
    relations = db.query(models.ArtifactRelation).filter(models.ArtifactRelation.project_id == project_id).all()

    nodes = []
    # Simple layout initialization, React Flow / frontend dagre will handle the actual layout
    for i, artifact in enumerate(artifacts):
        nodes.append({
            "id": artifact.id,
            "type": "customNode",
            "data": {
                "label": f"{artifact.code} {artifact.title}",
                "type": artifact.type_id,
                "status": artifact.status
            },
            "position": {"x": 100 * (i % 5), "y": 100 * (i // 5)}
        })

    edges = []
    for rel in relations:
        edges.append({
            "id": rel.id,
            "source": rel.source_artifact_id,
            "target": rel.target_artifact_id,
            "label": rel.relation_type_id,
            "type": "smoothstep"
        })

    return {"nodes": nodes, "edges": edges}
