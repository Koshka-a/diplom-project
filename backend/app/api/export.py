from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from rdflib import Graph, URIRef, Literal, Namespace
from rdflib.namespace import RDF, RDFS

from app.core.database import get_db
from app.models import all as models
import json

router = APIRouter(prefix="/projects/{project_id}/export", tags=["export"])

@router.get("/json")
def export_json(project_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    artifacts = db.query(models.Artifact).filter(models.Artifact.project_id == project_id).all()
    relations = db.query(models.ArtifactRelation).filter(models.ArtifactRelation.project_id == project_id).all()

    data = {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description
        },
        "artifacts": [
            {
                "id": a.id,
                "type_id": a.type_id,
                "code": a.code,
                "title": a.title,
                "description": a.description,
                "status": a.status,
                "priority": a.priority,
                "metadata": a.metadata_json
            } for a in artifacts
        ],
        "relations": [
            {
                "id": r.id,
                "source_artifact_id": r.source_artifact_id,
                "target_artifact_id": r.target_artifact_id,
                "relation_type_id": r.relation_type_id,
                "label": r.label,
                "weight": r.weight,
                "comment": r.comment
            } for r in relations
        ]
    }
    return data

@router.get("/turtle", response_class=PlainTextResponse)
def export_turtle(project_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    artifacts = db.query(models.Artifact).filter(models.Artifact.project_id == project_id).all()
    relations = db.query(models.ArtifactRelation).filter(models.ArtifactRelation.project_id == project_id).all()

    g = Graph()
    WP = Namespace("urn:workplace:")
    g.bind("wp", WP)

    artifact_map = {}

    for a in artifacts:
        res = WP[a.code]
        artifact_map[a.id] = res
        
        g.add((res, RDF.type, WP[a.type_id]))
        g.add((res, RDFS.label, Literal(a.title)))
        
        if a.status:
            g.add((res, WP.status, Literal(a.status)))
        if a.priority:
            g.add((res, WP.priority, Literal(a.priority)))

    for r in relations:
        source_res = artifact_map.get(r.source_artifact_id)
        target_res = artifact_map.get(r.target_artifact_id)
        if source_res and target_res:
            g.add((source_res, WP[r.relation_type_id], target_res))

    return g.serialize(format="turtle")
