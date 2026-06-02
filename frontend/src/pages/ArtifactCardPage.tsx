 
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trash2, Plus, Code, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Editor } from '@monaco-editor/react';
import { api } from '../api/client';
import type { Artifact, ArtifactRelation, ArtifactType, RelationType, CodeFragment } from '../types';

export default function ArtifactCardPage() {
  const { projectId, artifactId } = useParams();
  
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [type, setType] = useState<ArtifactType | null>(null);
  const [allRelations, setAllRelations] = useState<ArtifactRelation[]>([]);
  const [relationTypes, setRelationTypes] = useState<RelationType[]>([]);
  const [projectArtifacts, setProjectArtifacts] = useState<Artifact[]>([]);
  const [codeFrag, setCodeFrag] = useState<CodeFragment | null>(null);
  const [editorContent, setEditorContent] = useState('');

  // Relation Form State
  const [showRelForm, setShowRelForm] = useState(false);
  const [relForm, setRelForm] = useState({ target_id: '', relation_type_id: '' });

  const loadData = async () => {
    if (!projectId || !artifactId) return;
    try {
      const [art, rels, relTyps, projArts, codes, typs] = await Promise.all([
        api.getArtifact(artifactId),
        api.getProjectRelations(projectId),
        api.getRelationTypes(),
        api.getProjectArtifacts(projectId),
        api.getArtifactCode(artifactId),
        api.getArtifactTypes()
      ]);
      setArtifact(art);
      const artType = typs.find(t => t.code === art.type_id) || null;
      setType(artType);
      
      setAllRelations(rels);
      setRelationTypes(relTyps);
      setProjectArtifacts(projArts);
      
      if (codes.length > 0) {
        setCodeFrag(codes[0]);
        setEditorContent(codes[0].content);
      }
    } catch (e) {
      console.error(e);
      toast.error('Ошибка загрузки данных артефакта');
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, artifactId]);

  const handleDeleteRelation = async (relId: string) => {
    try {
      await api.deleteRelation(relId);
      toast.success('Связь удалена');
      loadData();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Ошибка удаления связи');
    }
  };

  const handleCreateRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !artifactId) return;
    try {
      await api.createRelation(projectId, {
        source_artifact_id: artifactId,
        target_artifact_id: relForm.target_id,
        relation_type_id: relForm.relation_type_id
      });
      toast.success('Связь создана');
      setShowRelForm(false);
      setRelForm({ target_id: '', relation_type_id: '' });
      loadData();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Ошибка создания связи');
    }
  };

  const handleSaveCode = async () => {
    if (!artifactId) return;
    try {
      await api.saveArtifactCode(artifactId, {
        language: 'python',
        content: editorContent,
        file_path: codeFrag?.file_path || 'main.py'
      });
      toast.success('Код сохранен');
      loadData();
    } catch (e: unknown) {
      toast.error('Ошибка сохранения кода');
    }
  };

  if (!artifact) return <div style={{padding: 20}}>Загрузка...</div>;

  const outgoing = allRelations.filter(r => r.source_artifact_id === artifactId);
  const incoming = allRelations.filter(r => r.target_artifact_id === artifactId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link to={`/project/${projectId}/artifacts`} className="btn-outline" style={{padding: '5px', textDecoration: 'none'}}>
          <ArrowLeft size={18} />
        </Link>
        <h2>Артефакт: {artifact.code}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card">
          <h3>Детали</h3>
          <p><strong>Название:</strong> {artifact.title}</p>
          <p>
            <strong>Тип:</strong>{' '}
            <span className="badge" style={{ background: type?.color || '#333' }}>
              {type?.name || artifact.type_id}
            </span>
          </p>
          <p><strong>Статус:</strong> {artifact.status || 'draft'}</p>
          <p><strong>Приоритет:</strong> {artifact.priority || 'medium'}</p>
          <p><strong>Описание:</strong> {artifact.description}</p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>Связи (Отношения)</h3>
            <button className="btn-primary" onClick={() => setShowRelForm(!showRelForm)} style={{padding: '4px 8px', fontSize: 12}}>
              <Plus size={14} /> Добавить связь
            </button>
          </div>

          {showRelForm && (
            <form onSubmit={handleCreateRelation} style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '10px', background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 8 }}>
              <select required value={relForm.relation_type_id} onChange={e => setRelForm({...relForm, relation_type_id: e.target.value})} style={{ flex: 1, padding: 4, background: '#222', color: 'white' }}>
                <option value="" disabled>Тип связи</option>
                {relationTypes.map(rt => <option key={rt.code} value={rt.code}>{rt.name}</option>)}
              </select>
              <select required value={relForm.target_id} onChange={e => setRelForm({...relForm, target_id: e.target.value})} style={{ flex: 1, padding: 4, background: '#222', color: 'white' }}>
                <option value="" disabled>Целевой артефакт</option>
                {projectArtifacts.filter(a => a.id !== artifactId).map(a => (
                  <option key={a.id} value={a.id}>[{a.code}] {a.title}</option>
                ))}
              </select>
              <button type="submit" className="btn-primary" style={{padding: '4px 12px'}}>Ок</button>
            </form>
          )}

          <div style={{marginTop: '1rem'}}>
            <h4 style={{color: 'var(--text-secondary)'}}>Исходящие (зависит от):</h4>
            <ul style={{ paddingLeft: 20, marginBottom: '10px' }}>
              {outgoing.map(r => {
                const rt = relationTypes.find(t => t.code === r.relation_type_id);
                const tgt = projectArtifacts.find(a => a.id === r.target_artifact_id);
                return (
                  <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span>
                      <span style={{color: 'var(--accent-primary)'}}>{rt?.name}</span> →{' '}
                      <Link to={`/project/${projectId}/artifact/${tgt?.id}`} style={{color: 'white'}}>
                        [{tgt?.code}] {tgt?.title}
                      </Link>
                    </span>
                    <button onClick={() => handleDeleteRelation(r.id)} style={{background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer'}}><Trash2 size={14}/></button>
                  </li>
                );
              })}
              {outgoing.length === 0 && <span style={{fontSize: 12, color: 'gray'}}>Нет исходящих связей</span>}
            </ul>

            <h4 style={{color: 'var(--text-secondary)'}}>Входящие (влияют на):</h4>
            <ul style={{ paddingLeft: 20 }}>
              {incoming.map(r => {
                const rt = relationTypes.find(t => t.code === r.relation_type_id);
                const src = projectArtifacts.find(a => a.id === r.source_artifact_id);
                return (
                  <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span>
                      <Link to={`/project/${projectId}/artifact/${src?.id}`} style={{color: 'white'}}>
                        [{src?.code}] {src?.title}
                      </Link>{' '}
                      → <span style={{color: 'var(--accent-primary)'}}>{rt?.name}</span>
                    </span>
                    <button onClick={() => handleDeleteRelation(r.id)} style={{background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer'}}><Trash2 size={14}/></button>
                  </li>
                );
              })}
              {incoming.length === 0 && <span style={{fontSize: 12, color: 'gray'}}>Нет входящих связей</span>}
            </ul>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Code size={18} /> Связанный код (Monaco Editor)</h3>
          <button className="btn-primary" onClick={handleSaveCode}>Сохранить код</button>
        </div>
        <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Editor
            height="400px"
            theme="vs-dark"
            defaultLanguage="python"
            value={editorContent}
            onChange={val => setEditorContent(val || '')}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        </div>
      </div>
    </div>
  );
}
