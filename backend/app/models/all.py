from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey, Integer, Float, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
import datetime
import uuid

from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    artifacts = relationship("Artifact", back_populates="project", cascade="all, delete-orphan")
    relations = relationship("ArtifactRelation", back_populates="project", cascade="all, delete-orphan")

class ArtifactType(Base):
    __tablename__ = "artifact_types"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)

class Artifact(Base):
    __tablename__ = "artifacts"
    __table_args__ = (UniqueConstraint('project_id', 'code', name='uix_project_code'),)

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    type_id = Column(String, ForeignKey("artifact_types.code"), nullable=False)
    code = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="artifacts")
    type = relationship("ArtifactType")
    code_fragments = relationship("CodeFragment", back_populates="artifact", cascade="all, delete-orphan")

class RelationType(Base):
    __tablename__ = "relation_types"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    directed = Column(Boolean, default=True)
    affects_impact = Column(Boolean, default=False)
    source_types_json = Column(JSON, nullable=True)
    target_types_json = Column(JSON, nullable=True)
    color = Column(String, nullable=True)

class ArtifactRelation(Base):
    __tablename__ = "artifact_relations"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    source_artifact_id = Column(String, ForeignKey("artifacts.id"), nullable=False)
    target_artifact_id = Column(String, ForeignKey("artifacts.id"), nullable=False)
    relation_type_id = Column(String, ForeignKey("relation_types.code"), nullable=False)
    label = Column(String, nullable=True)
    weight = Column(Float, default=1.0)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="relations")
    source_artifact = relationship("Artifact", foreign_keys=[source_artifact_id])
    target_artifact = relationship("Artifact", foreign_keys=[target_artifact_id])
    relation_type = relationship("RelationType")

class CodeFragment(Base):
    __tablename__ = "code_fragments"

    id = Column(String, primary_key=True, default=generate_uuid)
    artifact_id = Column(String, ForeignKey("artifacts.id"), nullable=False)
    language = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    start_line = Column(Integer, nullable=True)
    end_line = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    artifact = relationship("Artifact", back_populates="code_fragments")

class ChangeLog(Base):
    __tablename__ = "change_log"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    operation = Column(String, nullable=False)
    old_value_json = Column(JSON, nullable=True)
    new_value_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExportRecord(Base):
    __tablename__ = "export_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    format = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
