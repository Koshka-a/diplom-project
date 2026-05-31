export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ArtifactType {
  code: string;
  name: string;
  category?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface RelationType {
  code: string;
  name: string;
  description?: string;
  directed: boolean;
  affects_impact: boolean;
  color?: string;
}

export interface Artifact {
  id: string;
  project_id: string;
  type_id: string;
  code: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  metadata_json?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ArtifactRelation {
  id: string;
  project_id: string;
  source_artifact_id: string;
  target_artifact_id: string;
  relation_type_id: string;
  label?: string;
  weight?: number;
  comment?: string;
  created_at: string;
}

export interface CodeFragment {
  id: string;
  artifact_id: string;
  language?: string;
  file_path?: string;
  content: string;
  start_line?: number;
  end_line?: number;
}

export interface GraphNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ImpactItemArtifact {
  code: string;
  type: string;
  title: string;
}

export interface ImpactItem {
  artifact: ImpactItemArtifact;
  depth: number;
  score: number;
  path: string[];
}

export interface ImpactResponse {
  source: {
    code: string;
    title: string;
  };
  items: ImpactItem[];
}
