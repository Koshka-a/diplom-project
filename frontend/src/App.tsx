/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Database, Network, Zap, Menu, History } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { api } from './api/client';
import DashboardPage from './pages/DashboardPage';
import ArtifactsPage from './pages/ArtifactsPage';
import GraphPage from './pages/GraphPage';
import ImpactPage from './pages/ImpactPage';
import ArtifactCardPage from './pages/ArtifactCardPage';
import ChangelogPage from './pages/ChangelogPage';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      api.getProject(projectId).then(setProject).catch(console.error);
    }
  }, [projectId]);
  
  if (!projectId) return null;

  const handleDeleteProject = async () => {
    if (window.confirm('Вы точно хотите удалить этот проект и все его артефакты? Это действие необратимо.')) {
      try {
        await api.deleteProject(projectId);
        navigate('/');
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <Database className="icon" />
          <span>Workplace</span>
        </div>
        <nav className="nav-menu">
          <Link to={`/project/${projectId}`} className="nav-item">
            <LayoutDashboard size={20} />
            Дашборд
          </Link>
          <Link to={`/project/${projectId}/artifacts`} className="nav-item">
            <Database size={20} />
            Артефакты
          </Link>
          <Link to={`/project/${projectId}/graph`} className="nav-item">
            <Network size={20} />
            Онтология
          </Link>
          <Link to={`/project/${projectId}/impact`} className="nav-item">
            <Zap size={20} />
            Анализ влияния
          </Link>
          <Link to={`/project/${projectId}/changelog`} className="nav-item">
            <History size={20} />
            Журнал
          </Link>
        </nav>
      </aside>
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <Menu size={24} />
            <h1>{project ? project.name : `Проект ${projectId}`}</h1>
          </div>
          <div className="header-actions" style={{display: 'flex', gap: '10px'}}>
            <button onClick={handleDeleteProject} className="btn-outline" style={{borderColor: '#ff4d4f', color: '#ff4d4f'}}>
              Удалить проект
            </button>
            <Link to="/" className="btn-outline" style={{textDecoration: 'none'}}>
              Выйти из проекта
            </Link>
          </div>
        </header>
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}

function ProjectList() {
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getProjects().then(setProjects).catch(console.error);
  }, []);

  const handleLoadDemo = async () => {
    try {
      const res = await api.loadDemo();
      navigate(`/project/${res.project_id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName) {
      try {
        const p = await api.createProject({name: newProjectName, description: newProjectDesc});
        setShowProjectModal(false);
        navigate(`/project/${p.id}`);
      } catch (e: any) {
        toast.error(e.response?.data?.detail || 'Ошибка создания проекта');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      toast.loading('Импорт проекта...', { id: 'import' });
      const res = await api.importJson(file);
      toast.success('Проект успешно импортирован!', { id: 'import' });
      navigate(`/project/${res.project_id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка импорта', { id: 'import' });
    }
    
    // reset input
    e.target.value = '';
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)', height: '100vh', display: 'flex' }}>
      <div className="glass-card" style={{ width: 600, textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem' }}>Управление проектами</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Выберите проект или создайте новый</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto' }}>
          {projects.map((p: any) => (
            <Link key={p.id} to={`/project/${p.id}`} className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '1rem', textDecoration: 'none' }}>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleDateString()}</span>
            </Link>
          ))}
          {projects.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Нет доступных проектов</div>}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>

          <button onClick={() => { setNewProjectName(''); setNewProjectDesc(''); setShowProjectModal(true); }} className="btn btn-primary" style={{ flex: 1, padding: '1rem' }}>
            + Создать проект
          </button>
          
          <label className="btn btn-secondary" style={{ flex: 1, padding: '1rem', cursor: 'pointer', textAlign: 'center', margin: 0 }}>
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
            Загрузить JSON
          </label>

          <button onClick={handleLoadDemo} className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }}>
            <Zap size={18} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} /> Демо-данные
          </button>
        </div>
      </div>

      {showProjectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', zIndex: 1000, overflowY: 'auto', padding: '2rem 0' }}>
          <div className="glass-card" style={{ width: 400, textAlign: 'left', margin: 'auto' }}>
            <h3 style={{marginBottom: '1rem'}}>Новый проект</h3>
            <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{display: 'block', marginBottom: 5}}>Название проекта *</label>
                <input required type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#222', color: 'white'}} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: 5}}>Описание</label>
                <textarea rows={3} value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#222', color: 'white'}} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowProjectModal(false)} className="btn-secondary">Отмена</button>
                <button type="submit" className="btn-primary">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:projectId" element={<AppLayout><DashboardPage /></AppLayout>} />
          <Route path="/project/:projectId/artifacts" element={<AppLayout><ArtifactsPage /></AppLayout>} />
          <Route path="/project/:projectId/artifact/:artifactId" element={<AppLayout><ArtifactCardPage /></AppLayout>} />
          <Route path="/project/:projectId/graph" element={<AppLayout><GraphPage /></AppLayout>} />
          <Route path="/project/:projectId/impact" element={<AppLayout><ImpactPage /></AppLayout>} />
          <Route path="/project/:projectId/changelog" element={<AppLayout><ChangelogPage /></AppLayout>} />
        </Routes>
      </Router>
    </>
  );
}
