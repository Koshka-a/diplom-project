import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { api } from '../api/client';
import { Network, Filter } from 'lucide-react';

const typeColors: Record<string, string> = {
  Requirement: '#3b82f6', // blue
  Module: '#10b981', // green
  DomainConcept: '#8b5cf6', // purple
  TestCase: '#eab308', // yellow
  Document: '#0ea5e9', // cyan
  Defect: '#ef4444', // red
  Decision: '#f97316' // orange
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 170;
const nodeHeight = 70;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
    node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

export default function GraphPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightCode = searchParams.get('highlight');
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [allTypes, setAllTypes] = useState<string[]>([]);
  const [rawData, setRawData] = useState<{nodes: any[], edges: any[]} | null>(null);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    navigate(`/project/${projectId}/artifact/${node.id}`);
  }, [navigate, projectId]);

  const loadGraph = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    api.getProjectGraph(projectId).then((data) => {
      setRawData(data);
      
      const types = Array.from(new Set(data.nodes.map((n:any) => n.data.type))) as string[];
      setAllTypes(types);
      setFilterTypes(types); // show all by default
      setLoading(false);
    }).catch(console.error);
  }, [projectId]);

  useEffect(() => {
    if (!rawData) return;
    
    const filteredNodes = rawData.nodes.filter((n:any) => filterTypes.includes(n.data.type));
    const filteredNodeIds = new Set(filteredNodes.map((n:any) => n.id));
    const filteredEdges = rawData.edges.filter((e:any) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));

    const rfNodes = filteredNodes.map((n:any) => {
      const isHighlighted = highlightCode && n.data.label.startsWith(highlightCode);
      const bgColor = typeColors[n.data.type] || 'var(--bg-secondary)';
      
      return {
        id: n.id,
        position: { x: 0, y: 0 },
        data: { label: n.data.label },
        style: { 
          background: isHighlighted ? 'var(--highlight-bg)' : bgColor,
          color: '#fff', 
          border: isHighlighted ? '3px solid var(--primary)' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '10px',
          width: nodeWidth,
          textAlign: 'center' as const,
          boxShadow: isHighlighted ? '0 0 15px var(--primary)' : 'var(--shadow-sm)',
          fontSize: '12px',
          fontWeight: isHighlighted ? 'bold' : 'normal'
        }
      };
    });

    const rfEdges = filteredEdges.map((e:any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: e.type,
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-secondary)' },
      style: { stroke: 'var(--text-secondary)' }
    }));

    const layouted = getLayoutedElements(rfNodes, rfEdges, 'TB');
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
  }, [rawData, filterTypes, highlightCode, setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const onLayout = useCallback((direction: string) => {
    const layouted = getLayoutedElements(nodes, edges, direction);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
  }, [nodes, edges]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Онтология проекта</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onLayout('TB')} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <Network size={14} /> Сверху вниз
          </button>
          <button onClick={() => onLayout('LR')} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <Network size={14} /> Слева направо
          </button>
        </div>
      </div>

      <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={16} color="var(--text-secondary)" />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Фильтры типов:</span>
        {allTypes.map(type => (
          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', cursor: 'pointer', background: typeColors[type] || 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#fff' }}>
            <input 
              type="checkbox" 
              checked={filterTypes.includes(type)}
              onChange={(e) => {
                if (e.target.checked) setFilterTypes(prev => [...prev, type]);
                else setFilterTypes(prev => prev.filter(t => t !== type));
              }}
            />
            {type}
          </label>
        ))}
      </div>
      
      {loading ? (
        <div className="content-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          Загрузка графа...
        </div>
      ) : (
        <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-right"
            minZoom={0.2}
          >
            <Controls />
            <MiniMap 
              nodeStrokeColor={() => "var(--border-color)"} 
              nodeColor={() => "var(--bg-tertiary)"} 
              maskColor={"rgba(15, 23, 42, 0.7)"} 
            />
            <Background color="var(--border-color)" gap={16} />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
