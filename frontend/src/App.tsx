import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Database, Network, Zap, Menu } from 'lucide-react';
import { api } from './api/client';
import DashboardPage from './pages/DashboardPage';
import ArtifactsPage from './pages/ArtifactsPage';
import GraphPage from './pages/GraphPage';
import ImpactPage from './pages/ImpactPage';

function Sidebar() {
  const { projectId } = useParams();
  
  if (!projectId) return null;

  return (
    <div className="sidebar">
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>W</div>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Workplace</h2>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link to={`/projects/${projectId}`} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><LayoutDashboard size={18} /> Дашборд</Link>
        <Link to={`/projects/${projectId}/artifacts`} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Database size={18} /> Артефакты</Link>
        <Link to={`/projects/${projectId}/graph`} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Network size={18} /> Онтология / Граф</Link>
        <Link to={`/projects/${projectId}/impact`} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Zap size={18} /> Анализ влияния</Link>
        <Link to="/" className="btn btn-secondary" style={{ justifyContent: 'flex-start', marginTop: 'auto' }}><Menu size={18} /> Все проекты</Link>
      </nav>
    </div>
  );
}

function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/projects/:projectId" element={<ProjectLayout><DashboardPage /></ProjectLayout>} />
        <Route path="/projects/:projectId/artifacts" element={<ProjectLayout><ArtifactsPage /></ProjectLayout>} />
        <Route path="/projects/:projectId/graph" element={<ProjectLayout><GraphPage /></ProjectLayout>} />
        <Route path="/projects/:projectId/impact" element={<ProjectLayout><ImpactPage /></ProjectLayout>} />
      </Routes>
    </Router>
  );
}

function ProjectList() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    api.getProjects().then(setProjects).catch(console.error);
  }, []);

  const handleLoadDemo = async () => {
    try {
      const res = await api.loadDemo();
      window.location.href = `/projects/${res.project_id}`;
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ width: 600, textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem' }}>Управление проектами</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Выберите проект или загрузите демо-данные</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {projects.map((p: any) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '1rem' }}>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleDateString()}</span>
            </Link>
          ))}
        </div>

        <button onClick={handleLoadDemo} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
          <Zap size={18} /> Загрузить демо-проект
        </button>
      </div>
    </div>
  );
}
