 
 
 
 
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

  // Диагностика
  const reqs = artifacts.filter(a => a.type_id === 'Requirement');
  const reqsWithoutImpl = reqs.filter(req => 
    !relations.some(r => r.target_artifact_id === req.id && r.relation_type_id === 'realizes')
  );
  
  const reqsWithoutTests = reqs.filter(req => 
    !relations.some(r => r.target_artifact_id === req.id && r.relation_type_id === 'verifies')
  );

  const filesFuncs = artifacts.filter(a => ['File', 'Function'].includes(a.type_id));
  const filesFuncsWithoutReq = filesFuncs.filter(f => 
    !relations.some(r => r.source_artifact_id === f.id && ['realizes', 'part_of', 'implemented_in'].includes(r.relation_type_id))
  );

  const docs = artifacts.filter(a => a.type_id === 'Document');
  const docsWithoutRels = docs.filter(doc => 
    !relations.some(r => r.source_artifact_id === doc.id || r.target_artifact_id === doc.id)
  );

  const defects = artifacts.filter(a => a.type_id === 'Defect');
  const defectsWithoutImpl = defects.filter(def => 
    !relations.some(r => r.source_artifact_id === def.id && r.relation_type_id === 'affects')
  );

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

        <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Диагностика модели</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: reqsWithoutImpl.length > 0 ? '4px solid var(--warning)' : '4px solid var(--success)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Требования без реализации</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: reqsWithoutImpl.length > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {reqsWithoutImpl.length}
            </span>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: reqsWithoutTests.length > 0 ? '4px solid var(--danger)' : '4px solid var(--success)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Требования без тестов</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: reqsWithoutTests.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {reqsWithoutTests.length}
            </span>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: filesFuncsWithoutReq.length > 0 ? '4px solid var(--warning)' : '4px solid var(--success)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Файлы/функции без связи (realizes/part_of)</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: filesFuncsWithoutReq.length > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {filesFuncsWithoutReq.length}
            </span>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: docsWithoutRels.length > 0 ? '4px solid var(--warning)' : '4px solid var(--success)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Документы без связей</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: docsWithoutRels.length > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {docsWithoutRels.length}
            </span>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: defectsWithoutImpl.length > 0 ? '4px solid var(--danger)' : '4px solid var(--success)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Дефекты без связи с реализацией (affects)</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: defectsWithoutImpl.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {defectsWithoutImpl.length}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
