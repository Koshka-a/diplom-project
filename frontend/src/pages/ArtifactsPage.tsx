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
  const [formData, setFormData] = useState({ code: '', title: '', type_id: '', description: '' });

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
    setFormData({ code: '', title: '', type_id: types[0]?.code || '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (a: Artifact) => {
    setEditingId(a.id);
    setFormData({ code: a.code, title: a.title, type_id: a.type_id, description: a.description || '' });
    setShowModal(true);
  };

  return (
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
                  <td>{a.status || 'Draft'}</td>
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

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: 500 }}>
            <h3>{editingId ? 'Редактировать артефакт' : 'Создать артефакт'}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{display: 'block', marginBottom: 5}}>Код (например REQ-001)</label>
                <input required pattern="^[A-Z]+-[0-9]+$" title="Формат кода: ЗАГЛАВНЫЕ-ЦЫФРЫ (например: REQ-001)" type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#222', color: 'white'}} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: 5}}>Название</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#222', color: 'white'}} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: 5}}>Тип</label>
                <select required value={formData.type_id} onChange={e => setFormData({...formData, type_id: e.target.value})} style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#222', color: 'white'}}>
                  <option value="" disabled>Выберите тип</option>
                  {types.map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{display: 'block', marginBottom: 5}}>Описание</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#222', color: 'white'}} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Отмена</button>
                <button type="submit" className="btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
