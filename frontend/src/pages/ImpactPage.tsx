import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Artifact, ImpactResponse } from '../types';

export default function ImpactPage() {
  const { projectId } = useParams();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState('');
  const [maxDepth, setMaxDepth] = useState(3);
  const [direction, setDirection] = useState('both');
  const [impactResult, setImpactResult] = useState<ImpactResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    api.getProjectArtifacts(projectId).then(setArtifacts).catch(console.error);
  }, [projectId]);

  const handleAnalyze = async () => {
    if (!projectId || !selectedArtifact) return;
    setLoading(true);
    try {
      const res = await api.getImpactAnalysis(projectId, {
        artifact_id: selectedArtifact,
        direction,
        max_depth: maxDepth
      });
      setImpactResult(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="header">
        <h2>Анализ влияния изменений</h2>
      </div>
      
      <div className="content-body">
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
              <label>Исходный артефакт</label>
              <select className="input" value={selectedArtifact} onChange={(e) => setSelectedArtifact(e.target.value)}>
                <option value="">Выберите артефакт...</option>
                {artifacts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.title}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group" style={{ marginBottom: 0, width: 120 }}>
              <label>Глубина обхода</label>
              <input type="number" className="input" value={maxDepth} onChange={(e) => setMaxDepth(parseInt(e.target.value))} min={1} max={10} />
            </div>

            <div className="input-group" style={{ marginBottom: 0, width: 150 }}>
              <label>Направление</label>
              <select className="input" value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="both">В обе стороны</option>
                <option value="forward">Исходящие</option>
                <option value="backward">Входящие</option>
              </select>
            </div>

            <button className="btn btn-primary" onClick={handleAnalyze} disabled={!selectedArtifact || loading} style={{ height: 42 }}>
              {loading ? 'Анализ...' : 'Запустить анализ'}
            </button>
          </div>
        </div>

        {impactResult && (
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              Результаты для {impactResult.source.code}: {impactResult.source.title}
            </h3>
            
            {impactResult.items.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Затронутых элементов не найдено.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <tr>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Код</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Тип</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Название</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Уровень</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Вес влияния</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Путь (Trace)</th>
                  </tr>
                </thead>
                <tbody>
                  {impactResult.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{item.artifact.code}</td>
                      <td style={{ padding: '1rem' }}><span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>{item.artifact.type}</span></td>
                      <td style={{ padding: '1rem' }}>{item.artifact.title}</td>
                      <td style={{ padding: '1rem' }}>{item.depth}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 50, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${item.score * 100}%`, height: '100%', background: item.score > 0.7 ? 'var(--danger)' : item.score > 0.4 ? 'var(--warning)' : 'var(--success)' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem' }}>{item.score}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {item.path.join(' → ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
