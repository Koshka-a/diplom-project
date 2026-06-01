import axios from 'axios';
import type { Project, Artifact, ArtifactRelation, ArtifactType, RelationType, GraphData, ImpactResponse, CodeFragment } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Demo
  loadDemo: async () => {
    const res = await client.post('/demo/load');
    return res.data;
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await client.get('/projects/');
    return res.data;
  },
  createProject: async (data: { name: string; description?: string }): Promise<Project> => {
    const res = await client.post('/projects/', data);
    return res.data;
  },
  getProject: async (id: string): Promise<Project> => {
    const res = await client.get(`/projects/${id}`);
    return res.data;
  },
  deleteProject: async (id: string) => {
    const res = await client.delete(`/projects/${id}`);
    return res.data;
  },

  // Artifact Types & Relation Types
  getArtifactTypes: async (): Promise<ArtifactType[]> => {
    const res = await client.get('/artifact-types');
    return res.data;
  },
  getRelationTypes: async (): Promise<RelationType[]> => {
    const res = await client.get('/relation-types');
    return res.data;
  },

  // Artifacts
  getProjectArtifacts: async (projectId: string): Promise<Artifact[]> => {
    const res = await client.get(`/projects/${projectId}/artifacts/`);
    return res.data;
  },
  createArtifact: async (projectId: string, data: Partial<Artifact>): Promise<Artifact> => {
    const res = await client.post(`/projects/${projectId}/artifacts/`, data);
    return res.data;
  },
  getArtifact: async (id: string): Promise<Artifact> => {
    const res = await client.get(`/artifacts/${id}`);
    return res.data;
  },
  updateArtifact: async (id: string, data: Partial<Artifact>): Promise<Artifact> => {
    const res = await client.patch(`/artifacts/${id}`, data);
    return res.data;
  },
  deleteArtifact: async (id: string) => {
    const res = await client.delete(`/artifacts/${id}`);
    return res.data;
  },

  // Code Fragments
  getArtifactCode: async (artifactId: string): Promise<CodeFragment[]> => {
    const res = await client.get(`/artifacts/${artifactId}/code`);
    return res.data;
  },
  saveArtifactCode: async (artifactId: string, data: Partial<CodeFragment>): Promise<CodeFragment> => {
    const res = await client.post(`/artifacts/${artifactId}/code`, data);
    return res.data;
  },

  // Relations
  getProjectRelations: async (projectId: string): Promise<ArtifactRelation[]> => {
    const res = await client.get(`/projects/${projectId}/relations`);
    return res.data;
  },
  createRelation: async (projectId: string, data: Partial<ArtifactRelation>): Promise<ArtifactRelation> => {
    const res = await client.post(`/projects/${projectId}/relations`, data);
    return res.data;
  },
  deleteRelation: async (id: string) => {
    const res = await client.delete(`/relations/${id}`);
    return res.data;
  },

  // Graph & Impact
  getProjectGraph: async (projectId: string): Promise<GraphData> => {
    const res = await client.get(`/projects/${projectId}/graph/`);
    return res.data;
  },
  getImpactAnalysis: async (projectId: string, req: { artifact_id: string; direction: string; max_depth: number; include_relation_types?: string[] }): Promise<ImpactResponse> => {
    const res = await client.post(`/projects/${projectId}/impact/`, req);
    return res.data;
  },
  
  // Export
  exportJsonUrl: (projectId: string) => `${API_URL}/projects/${projectId}/export/json`,
  exportTurtleUrl: (projectId: string) => `${API_URL}/projects/${projectId}/export/turtle`,
};
