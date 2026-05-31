import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Artifact, ArtifactType } from '../types';

export default function ArtifactsPage() {
  const { projectId } = useParams();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [types, setTypes] = useState<ArtifactType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      api.getProjectArtifacts(projectId),
      api.getArtifactTypes()
    ]).then(([a, t]) => {
      setArtifacts(a);
      setTypes(t);
      setLoading(false);
    }).catch(console.error);
  }, [projectId]);

  if (loading) return <div className="content-body">Загрузка...</div>;

  const getTypeStyle = (typeId: string) => {
    const t = types.find(t => t.code === typeId);
    return {
      backgroundColor: t?.color ? `${t.color}20` : 'var(--bg-tertiary)',
      color: t?.color || 'var(--text-primary)',
      border: `1px solid ${t?.color}40`
    };
  };

  return (
    <>
      <div className="header">
        <h2>Реестр артефактов</h2>
        <button className="btn btn-primary">Создать артефакт</button>
      </div>
      
      <div className="content-body">
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Код</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Тип</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Название</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {artifacts.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{a.code}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge" style={getTypeStyle(a.type_id)}>
                      {a.type_id}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{a.title}</td>
                  <td style={{ padding: '1rem' }}>
                    {a.status && <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{a.status}</span>}
                  </td>
                </tr>
              ))}
              {artifacts.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Нет артефактов</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
