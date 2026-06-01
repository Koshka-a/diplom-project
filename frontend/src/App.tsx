import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Database, Network, Zap, Menu } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { api } from './api/client';
import DashboardPage from './pages/DashboardPage';
import ArtifactsPage from './pages/ArtifactsPage';
import GraphPage from './pages/GraphPage';
import ImpactPage from './pages/ImpactPage';
import ArtifactCardPage from './pages/ArtifactCardPage';

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

  const handleCreateProject = async () => {
    const name = prompt("Введите имя нового проекта:");
    if (name) {
      try {
        const p = await api.createProject({name, description: ''});
        navigate(`/project/${p.id}`);
      } catch (e) {
        console.error(e);
      }
    }
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
          <button onClick={handleCreateProject} className="btn btn-primary" style={{ flex: 1, padding: '1rem' }}>
            + Создать проект
          </button>
          <button onClick={handleLoadDemo} className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }}>
            <Zap size={18} /> Демо-данные
          </button>
        </div>
      </div>
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
        </Routes>
      </Router>
    </>
  );
}
