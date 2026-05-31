from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import all as schemas
from app.services.impact_service import analyze_impact

router = APIRouter(prefix="/projects/{project_id}/impact", tags=["impact"])

@router.post("/", response_model=schemas.ImpactResponse)
def get_impact_analysis(project_id: str, request: schemas.ImpactRequest, db: Session = Depends(get_db)):
    return analyze_impact(db, project_id, request)
