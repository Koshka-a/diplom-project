import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { api } from '../api/client';

export default function GraphPage() {
  const { projectId } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    api.getProjectGraph(projectId).then((data) => {
      // Setup reactflow nodes
      const rfNodes = data.nodes.map(n => ({
        id: n.id,
        position: n.position,
        data: { label: n.data.label },
        style: { 
          background: 'var(--bg-secondary)', 
          color: 'var(--text-primary)', 
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '10px',
          width: 150,
          textAlign: 'center' as const,
          boxShadow: 'var(--shadow-sm)'
        }
      }));

      const rfEdges = data.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: e.type,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-secondary)' },
        style: { stroke: 'var(--text-secondary)' }
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
      setLoading(false);
    }).catch(console.error);
  }, [projectId]);

  if (loading) return <div className="content-body">Загрузка графа...</div>;

  return (
    <>
      <div className="header">
        <h2>Онтология проекта</h2>
      </div>
      
      <div style={{ flex: 1, width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls />
          <MiniMap nodeStrokeColor={() => "var(--border-color)"} nodeColor={() => "var(--bg-secondary)"} maskColor={"rgba(15, 23, 42, 0.5)"} />
          <Background color="var(--border-color)" gap={16} />
        </ReactFlow>
      </div>
    </>
  );
}
