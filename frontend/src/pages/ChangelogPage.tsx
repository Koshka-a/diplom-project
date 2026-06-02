import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { History, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangelogPage() {
  const { projectId } = useParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [entityType, setEntityType] = useState<string>('');
  const [operation, setOperation] = useState<string>('');

  const loadChangelog = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.getChangelog(projectId, {
        entity_type: entityType || undefined,
        operation: operation || undefined
      });
      setLogs(data);
    } catch (err) {
      toast.error('Ошибка загрузки журнала изменений');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, entityType, operation]);

  useEffect(() => {
    loadChangelog();
  }, [loadChangelog]);

  const renderChanges = (oldVal: any, newVal: any) => {
    if (!oldVal && !newVal) return <span style={{ color: 'var(--text-muted)' }}>Нет данных</span>;
    if (oldVal && newVal) {
      // UPDATE
      return (
        <div style={{ fontSize: '0.85rem' }}>
          <div style={{ color: '#ef4444' }}>- {JSON.stringify(oldVal).substring(0, 50)}...</div>
          <div style={{ color: '#10b981' }}>+ {JSON.stringify(newVal).substring(0, 50)}...</div>
        </div>
      );
    }
    // CREATE or DELETE
    const val = newVal || oldVal;
    return (
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {JSON.stringify(val).substring(0, 100)}
        {JSON.stringify(val).length > 100 ? '...' : ''}
      </div>
    );
  };

  const opColors: Record<string, string> = {
    CREATE: '#10b981',
    UPDATE: '#f59e0b',
    DELETE: '#ef4444',
    IMPORT: '#3b82f6',
  };

  return (
    <div className="content-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={24} color="var(--primary)" />
          Журнал изменений
        </h2>
      </div>

      <div className="glass-card" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Filter size={18} color="var(--text-secondary)" />
        <select 
          className="form-input" 
          style={{ width: '200px' }}
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          <option value="">Все типы объектов</option>
          <option value="Artifact">Artifact</option>
          <option value="Relation">Relation</option>
          <option value="Project">Project</option>
        </select>
        
        <select 
          className="form-input" 
          style={{ width: '200px' }}
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
        >
          <option value="">Все операции</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="IMPORT">IMPORT</option>
        </select>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Записей не найдено</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Операция</th>
                <th>Тип объекта</th>
                <th>ID объекта</th>
                <th>Детали (данные)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span style={{
                      background: `${opColors[log.operation] || '#666'}33`,
                      color: opColors[log.operation] || '#ccc',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {log.operation}
                    </span>
                  </td>
                  <td>{log.entity_type}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {log.entity_id.split('-')[0]}...
                  </td>
                  <td>
                    {renderChanges(log.old_value_json, log.new_value_json)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
