/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
 
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../api/client';
import type { Artifact, ArtifactType } from '../types';

export default function ArtifactsPage() {
  const { projectId } = useParams();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [types, setTypes] = useState<ArtifactType[]>([]);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: '', title: '', type_id: '', description: '', status: 'draft', priority: 'medium' });

  const loadData = async () => {
    if (!projectId) return;
    try {
      const [arts, typs] = await Promise.all([
        api.getProjectArtifacts(projectId),
        api.getArtifactTypes()
      ]);
      setArtifacts(arts);
      setTypes(typs);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось загрузить данные');
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот артефакт? Это также удалит все связанные отношения.')) return;
    try {
      await api.deleteArtifact(id);
      toast.success('Артефакт удален');
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Ошибка удаления');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      if (editingId) {
        await api.updateArtifact(editingId, formData);
        toast.success('Артефакт обновлен');
      } else {
        await api.createArtifact(projectId, formData);
        toast.success('Артефакт создан');
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Ошибка сохранения');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ code: '', title: '', type_id: types[0]?.code || '', description: '', status: 'draft', priority: 'medium' });
    setShowModal(true);
  };

  const openEditModal = (a: Artifact) => {
    setEditingId(a.id);
    setFormData({ code: a.code, title: a.title, type_id: a.type_id, description: a.description || '', status: a.status || 'draft', priority: a.priority || 'medium' });
    setShowModal(true);
  };

  return (
    <>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Реестр артефактов</h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <input 
              type="text" 
              placeholder="Поиск по коду или названию..." 
              className="input" 
              style={{ minWidth: '300px', marginBottom: 0 }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select 
              className="input" 
              style={{ width: '150px', marginBottom: 0 }}
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="">Все типы</option>
              {types.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </div>

          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Создать
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Тип</th>
                <th>Код</th>
                <th>Название</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {artifacts
                .filter(a => filterType ? a.type_id === filterType : true)
                .filter(a => searchQuery ? (a.code.toLowerCase().includes(searchQuery.toLowerCase()) || a.title.toLowerCase().includes(searchQuery.toLowerCase())) : true)
                .map(a => {
                const t = types.find(type => type.code === a.type_id);
                return (
                  <tr key={a.id}>
                    <td>
                      <span className="badge" style={{ background: t?.color || '#333' }}>
                        {t?.name || a.type_id}
                      </span>
                    </td>
                    <td>
                      <Link to={`/project/${projectId}/artifact/${a.id}`} style={{color: 'var(--accent-primary)', fontWeight: 'bold'}}>
                        {a.code}
                      </Link>
                    </td>
                    <td>{a.title}</td>
                    <td>
                      {a.status || 'draft'} / {a.priority || 'medium'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditModal(a)} className="btn-outline" style={{padding: '4px', borderColor: 'transparent'}}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="btn-outline" style={{padding: '4px', borderColor: 'transparent', color: '#ff4d4f'}}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {artifacts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>Нет артефактов</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto', margin: 0 }}>
            <h3>{editingId ? 'Редактировать артефакт' : 'Создать артефакт'}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #aaa)' }}>Код (напр. REQ-001)</label>
                  <input required pattern="^[A-Z]+-[0-9]+$" title="Формат кода: ЗАГЛАВНЫЕ-ЦЫФРЫ" type="text" className="input" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} style={{ width: '100%', marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #aaa)' }}>Тип артефакта</label>
                  <select required className="input" value={formData.type_id} onChange={e => setFormData({...formData, type_id: e.target.value})} style={{ width: '100%', marginBottom: 0 }}>
                    <option value="" disabled>Выберите тип</option>
                    {types.map(t => (
                      <option key={t.code} value={t.code}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #aaa)' }}>Название</label>
                <input required type="text" className="input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', marginBottom: 0 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #aaa)' }}>Статус</label>
                  <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', marginBottom: 0 }}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="changed">Changed</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #aaa)' }}>Приоритет</label>
                  <select className="input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} style={{ width: '100%', marginBottom: 0 }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #aaa)' }}>Описание</label>
                <textarea rows={3} className="input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', marginBottom: 0, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Отмена</button>
                <button type="submit" className="btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
