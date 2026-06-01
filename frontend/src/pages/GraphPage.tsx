import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
import { Network } from 'lucide-react';

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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  const loadGraph = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    api.getProjectGraph(projectId).then((data) => {
      // Setup reactflow nodes
      const rfNodes = data.nodes.map(n => ({
        id: n.id,
        position: { x: 0, y: 0 }, // will be calculated by dagre
        data: { label: n.data.label },
        style: { 
          background: 'var(--bg-secondary)', 
          color: 'var(--text-primary)', 
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '10px',
          width: nodeWidth,
          textAlign: 'center' as const,
          boxShadow: 'var(--shadow-sm)',
          fontSize: '12px'
        }
      }));

      const rfEdges = data.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: e.type, // 'smoothstep' etc
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-secondary)' },
        style: { stroke: 'var(--text-secondary)' }
      }));

      // Apply dagre layout
      const layouted = getLayoutedElements(rfNodes, rfEdges, 'TB');
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
      setLoading(false);
    }).catch(console.error);
  }, [projectId]);

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
          <button onClick={() => onLayout('TB')} className="btn-outline">
            <Network size={16} /> Сверху вниз
          </button>
          <button onClick={() => onLayout('LR')} className="btn-outline">
            <Network size={16} /> Слева направо
          </button>
        </div>
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
