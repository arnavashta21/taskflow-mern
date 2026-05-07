import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Icons } from '../components/ui/Icons';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PROJECT_COLORS = ['#7c6af7','#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#fb923c','#38bdf8'];

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#7c6af7', dueDate: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      toast.success('Project created!');
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.125rem' }}>New Project</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}><Icons.close /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Project Name *</label>
            <input className="input" placeholder="e.g. Website Redesign"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} required autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="textarea" placeholder="What's this project about?"
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input className="input" type="date" value={form.dueDate}
              onChange={e => setForm({...form, dueDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent',
                    cursor: 'pointer', transition: 'transform 0.15s', transform: form.color === c ? 'scale(1.2)' : 'scale(1)' }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-between" style={{ marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.get('/projects')
      .then(res => setProjects(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} you're part of</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Icons.plus /> New Project
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <Icons.projects />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-2)' }}>No projects yet</h3>
            <p>Create your first project to start collaborating</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icons.plus /> Create Project</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.map(p => (
              <Link key={p._id} to={`/projects/${p._id}`}
                style={{ display: 'block', textDecoration: 'none' }}>
                <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s',
                  borderTop: `3px solid ${p.color}` }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <h3 style={{ fontSize: '0.9375rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
                    <span style={{ fontSize: '0.75rem', background: p.status === 'active' ? 'var(--green-bg)' : 'var(--bg-4)',
                      color: p.status === 'active' ? 'var(--green)' : 'var(--text-3)',
                      padding: '2px 8px', borderRadius: 20 }}>
                      {p.status}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted" style={{ marginBottom: 14, overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {p.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div style={{ marginBottom: 14 }}>
                    <div className="flex items-center justify-between text-xs text-muted" style={{ marginBottom: 6 }}>
                      <span>{p.stats?.done || 0} / {p.stats?.total || 0} tasks</span>
                      <span>{p.stats?.total ? Math.round(((p.stats.done||0) / p.stats.total) * 100) : 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${p.stats?.total ? Math.round(((p.stats.done||0)/p.stats.total)*100) : 0}%`,
                        background: p.color
                      }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Members */}
                    <div className="avatar-stack">
                      {p.members?.slice(0, 4).map(m => (
                        <img key={m.user?._id} src={m.user?.avatar} alt={m.user?.name}
                          className="avatar" width={24} height={24} title={m.user?.name} />
                      ))}
                      {p.members?.length > 4 && (
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-4)',
                          color: 'var(--text-2)', fontSize: '0.625rem', fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '2px solid var(--bg-2)', marginLeft: -8 }}>
                          +{p.members.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted">
                      {p.stats?.overdue > 0 && (
                        <span style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icons.warning /> {p.stats.overdue} overdue
                        </span>
                      )}
                      {p.dueDate && <span><Icons.clock /> {format(new Date(p.dueDate), 'MMM d')}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </>
  );
}