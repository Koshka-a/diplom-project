from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from rdflib import Graph, URIRef, Literal, Namespace
from rdflib.namespace import RDF, RDFS
import urllib.parse
from datetime import datetime

from app.core.database import get_db
from app.models import all as models
from app.services import project_service, artifact_service
from app.services.changelog_service import log_change
import json

router = APIRouter(prefix="/projects", tags=["export"])

@router.get("/{project_id}/export/json")
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
                "metadata_json": a.metadata_json
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
    
    # Record export
    db.add(models.ExportRecord(project_id=project_id, format="json", file_name=f"project_{project_id}.json"))
    db.commit()
    log_change(db, project_id, "Project", project_id, "EXPORT", None, {"format": "json"})
    
    return data

@router.get("/{project_id}/export/turtle", response_class=PlainTextResponse)
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
        # url encode to make safe URI
        safe_code = urllib.parse.quote(a.code)
        res = WP[safe_code]
        artifact_map[a.id] = res
        
        g.add((res, RDF.type, WP[a.type_id]))
        g.add((res, RDFS.label, Literal(a.title)))
        if a.description:
            g.add((res, RDFS.comment, Literal(a.description)))
        
        if a.status:
            g.add((res, WP.status, Literal(a.status)))
        if a.priority:
            g.add((res, WP.priority, Literal(a.priority)))

    for r in relations:
        source_res = artifact_map.get(r.source_artifact_id)
        target_res = artifact_map.get(r.target_artifact_id)
        if source_res and target_res:
            g.add((source_res, WP[r.relation_type_id], target_res))
            if r.label:
                g.add((source_res, RDFS.label, Literal(r.label)))

    # Record export
    db.add(models.ExportRecord(project_id=project_id, format="turtle", file_name=f"project_{project_id}.ttl"))
    db.commit()
    log_change(db, project_id, "Project", project_id, "EXPORT", None, {"format": "turtle"})

    return g.serialize(format="turtle")

@router.post("/import/json")
def import_json(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = file.file.read()
        data = json.loads(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
        
    if "project" not in data or "artifacts" not in data:
        raise HTTPException(status_code=400, detail="JSON structure invalid")
        
    # Validations
    type_codes = {t.code for t in db.query(models.ArtifactType).all()}
    rel_type_codes = {t.code for t in db.query(models.RelationType).all()}
    
    seen_codes = set()
    for a_data in data.get("artifacts", []):
        if a_data.get("type_id") not in type_codes:
            raise HTTPException(status_code=400, detail=f"Invalid artifact type_id: {a_data.get('type_id')}")
        if a_data.get("code") in seen_codes:
            raise HTTPException(status_code=400, detail=f"Duplicate artifact code in import: {a_data.get('code')}")
        seen_codes.add(a_data.get("code"))
        
    for r_data in data.get("relations", []):
        if r_data.get("relation_type_id") not in rel_type_codes:
            raise HTTPException(status_code=400, detail=f"Invalid relation_type_id: {r_data.get('relation_type_id')}")
        if not r_data.get("source_artifact_id") or not r_data.get("target_artifact_id"):
             raise HTTPException(status_code=400, detail="Relation missing source or target artifact")
        
    # Create project
    proj_data = data["project"]
    proj_data.pop("id", None)
    if "name" not in proj_data: proj_data["name"] = "Imported Project"
    
    db_proj = models.Project(**proj_data)
    db.add(db_proj)
    db.commit()
    db.refresh(db_proj)
    
    artifact_id_map = {}
    for a_data in data.get("artifacts", []):
        old_id = a_data.pop("id", None)
        a_data["project_id"] = db_proj.id
        db_a = models.Artifact(**a_data)
        db.add(db_a)
        db.commit()
        db.refresh(db_a)
        if old_id:
            artifact_id_map[old_id] = db_a.id
            
    for r_data in data.get("relations", []):
        old_id = r_data.pop("id", None)
        r_data["project_id"] = db_proj.id
        r_data["source_artifact_id"] = artifact_id_map.get(r_data.get("source_artifact_id"))
        r_data["target_artifact_id"] = artifact_id_map.get(r_data.get("target_artifact_id"))
        
        if r_data.get("source_artifact_id") and r_data.get("target_artifact_id"):
            db_r = models.ArtifactRelation(**r_data)
            db.add(db_r)
        else:
            # If the original ID couldn't be mapped
            raise HTTPException(status_code=400, detail="Relation references unknown artifact ID")
    
    db.commit()
    
    # Логируем сам факт импорта
    log_change(db, db_proj.id, "Project", db_proj.id, "IMPORT", None, {"name": db_proj.name, "artifacts_count": len(data.get("artifacts", []))})
    
    return {"message": "Project imported successfully", "project_id": db_proj.id}
