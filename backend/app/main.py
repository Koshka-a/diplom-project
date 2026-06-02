from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.init_db import init_db
from app.core.database import Base, engine, SessionLocal
from app.core.config import settings
from app.models import all as models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and init db
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    init_db(db)
    db.close()
    yield
    # Shutdown

app = FastAPI(title="Workplace Lifecycle API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Workplace Lifecycle API"}

# Include routers here
from app.api import projects, artifacts, project_artifacts, relations, graph, impact, export, demo

app.include_router(projects.router)
app.include_router(artifacts.router)
app.include_router(project_artifacts.router)
app.include_router(relations.router)
app.include_router(graph.router)
app.include_router(impact.router)
app.include_router(export.router)
app.include_router(demo.router)

