from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.init_db import init_db
from app.core.database import Base, engine, SessionLocal
from app.models import all as models

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize reference data
db = SessionLocal()
init_db(db)
db.close()

app = FastAPI(title="Workplace Lifecycle API")

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

