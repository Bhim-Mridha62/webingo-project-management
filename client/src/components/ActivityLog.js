import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Activity, User, Clock } from 'lucide-react';

const ACTION_LABELS = {
  task_created: { label: 'Created task', color: 'var(--accent-success)' },
  task_updated: { label: 'Updated task', color: 'var(--accent-info)' },
  task_deleted: { label: 'Deleted task', color: 'var(--accent-secondary)' },
  member_added: { label: 'Added member', color: 'var(--accent-primary)' },
  project_created: { label: 'Created project', color: 'var(--accent-success)' },
  project_updated: { label: 'Updated project', color: 'var(--accent-info)' },
};

const ActivityLog = ({ projectId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${projectId}/activity?page=${p}&limit=15`);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch (err) {
      console.error('Failed to load activity log', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchLogs(1);
  }, [projectId]);

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '70%' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%', marginTop: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Activity size={16} style={{ color: 'var(--accent-primary)' }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>Activity Log</span>
      </div>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          No activity yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {logs.map((log, i) => {
            const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'var(--text-muted)' };
            return (
              <div key={log._id} style={{
                display: 'flex', gap: 12, padding: '12px 0',
                borderBottom: i < logs.length - 1 ? '1px solid var(--border-color)' : 'none',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'white'
                }}>
                  {log.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{log.user?.name || 'User'}</span>
                    {' '}
                    <span style={{ color: actionInfo.color, fontWeight: 500 }}>{actionInfo.label}</span>
                  </div>
                  {log.details && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{log.details}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} /> {formatTime(log.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchLogs(page - 1)} disabled={page <= 1}>Prev</button>
          <span style={{ alignSelf: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages}>Next</button>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
