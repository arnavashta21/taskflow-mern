import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Icons, StatusLabel, PriorityLabel } from '../components/ui/Icons';
import { format, isAfter } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const statusMap = {};
  data?.statusBreakdown?.forEach(s => { statusMap[s._id] = s.count; });

  const done = statusMap['done'] || 0;
  const total = data?.stats?.totalTasks || 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d')} · Here's what's happening</p>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--accent-2)' }}>{data?.stats?.projects || 0}</span>
            <span className="stat-label">Active Projects</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{data?.stats?.totalTasks || 0}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--blue)' }}>{data?.stats?.myTasks || 0}</span>
            <span className="stat-label">Assigned to Me</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--green)' }}>{data?.stats?.doneTasks || 0}</span>
            <span className="stat-label">Completed</span>
          </div>
          {data?.stats?.overdueTasks > 0 && (
            <div className="stat-card" style={{ borderColor: 'rgba(248,113,113,0.3)' }}>
              <span className="stat-value" style={{ color: 'var(--red)' }}>{data.stats.overdueTasks}</span>
              <span className="stat-label flex items-center gap-2"><Icons.warning /> Overdue</span>
            </div>
          )}
        </div>

        {/* Overall progress */}
        {total > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4" style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.9375rem' }}>Overall Progress</h3>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-2)' }}>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex gap-4 mt-3" style={{ marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { key: 'todo', label: 'To Do', color: 'var(--text-3)' },
                { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
                { key: 'in_review', label: 'In Review', color: 'var(--yellow)' },
                { key: 'done', label: 'Done', color: 'var(--green)' }
              ].map(s => (
                <div key={s.key} className="flex items-center gap-2 text-sm">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                  <span className="text-muted">{s.label}</span>
                  <span className="fw-600">{statusMap[s.key] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: 14 }}>Recent Activity</h2>
          {data?.recentActivity?.length === 0 ? (
            <div className="empty-state">
              <Icons.tasks />
              <p>No tasks yet. Create a project to get started.</p>
              <Link to="/projects" className="btn btn-primary btn-sm">Go to Projects</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data?.recentActivity?.map(task => (
                <Link to={`/projects/${task.project?._id}`} key={task._id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 'var(--radius)',
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                    transition: 'all 0.15s', textDecoration: 'none'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <span className={`badge badge-${task.status}`} style={{ flexShrink: 0 }}>
                    {StatusLabel[task.status]}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                    {task.project && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', background: 'var(--bg-4)',
                        padding: '2px 8px', borderRadius: 4 }}>
                        {task.project.name}
                      </span>
                    )}
                    {task.dueDate && isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'done' && (
                      <span className="overdue-dot" />
                    )}
                    {task.assignee && (
                      <img src={task.assignee.avatar} alt={task.assignee.name}
                        className="avatar" width={22} height={22} title={task.assignee.name} />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}