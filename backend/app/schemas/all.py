from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    name: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ArtifactTypeResponse(BaseModel):
    code: str
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

    class Config:
        from_attributes = True

class RelationTypeResponse(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    directed: bool
    affects_impact: bool
    source_types_json: Optional[List[str]] = None
    target_types_json: Optional[List[str]] = None
    color: Optional[str] = None

    class Config:
        from_attributes = True

class ArtifactBase(BaseModel):
    type_id: str
    code: str
    title: str
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ArtifactCreate(ArtifactBase):
    pass

class ArtifactUpdate(ArtifactBase):
    type_id: Optional[str] = None
    code: Optional[str] = None
    title: Optional[str] = None

class ArtifactResponse(ArtifactBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RelationBase(BaseModel):
    source_artifact_id: str
    target_artifact_id: str
    relation_type_id: str
    label: Optional[str] = None
    weight: Optional[float] = 1.0
    comment: Optional[str] = None

class RelationCreate(RelationBase):
    pass

class RelationResponse(RelationBase):
    id: str
    project_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class CodeFragmentBase(BaseModel):
    language: Optional[str] = None
    file_path: Optional[str] = None
    content: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None

class CodeFragmentCreate(CodeFragmentBase):
    artifact_id: str

class CodeFragmentUpdate(CodeFragmentBase):
    pass

class CodeFragmentResponse(CodeFragmentBase):
    id: str
    artifact_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GraphNode(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    type: str

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class ImpactRequest(BaseModel):
    artifact_id: str
    direction: str = "both"
    max_depth: int = 3
    include_relation_types: Optional[List[str]] = None

class ImpactItemArtifact(BaseModel):
    code: str
    type: str
    title: str

class ImpactItem(BaseModel):
    artifact: ImpactItemArtifact
    depth: int
    score: float
    path: str

class ImpactResponse(BaseModel):
    source: Dict[str, str]
    items: List[ImpactItem]

class ChangeLogResponse(BaseModel):
    id: str
    project_id: str
    entity_type: str
    entity_id: str
    operation: str
    old_value_json: Optional[Dict[str, Any]] = None
    new_value_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
