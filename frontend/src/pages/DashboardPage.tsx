import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Project, Artifact, ArtifactRelation } from '../types';

export default function DashboardPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [relations, setRelations] = useState<ArtifactRelation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      api.getProject(projectId),
      api.getProjectArtifacts(projectId),
      api.getProjectRelations(projectId)
    ]).then(([p, a, r]) => {
      setProject(p);
      setArtifacts(a);
      setRelations(r);
      setLoading(false);
    }).catch(console.error);
  }, [projectId]);

  if (loading) return <div className="content-body">Загрузка...</div>;
  if (!project) return <div className="content-body">Проект не найден</div>;

  return (
    <>
      <div className="header">
        <h2>{project.name}</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href={api.exportJsonUrl(project.id)} target="_blank" rel="noreferrer" className="btn btn-secondary">JSON Экспорт</a>
          <a href={api.exportTurtleUrl(project.id)} target="_blank" rel="noreferrer" className="btn btn-secondary">RDF/Turtle Экспорт</a>
        </div>
      </div>
      
      <div className="content-body">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{project.description || "Нет описания"}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Артефакты</h3>
            <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{artifacts.length}</span>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Связи</h3>
            <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)' }}>{relations.length}</span>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Требования</h3>
            <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--warning)' }}>
              {artifacts.filter(a => a.type_id === 'Requirement').length}
            </span>
          </div>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Изолированные элементы</h3>
            <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--danger)' }}>
              {artifacts.filter(a => 
                !relations.find(r => r.source_artifact_id === a.id || r.target_artifact_id === a.id)
              ).length}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
