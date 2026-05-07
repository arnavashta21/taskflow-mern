import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Icons, StatusLabel, PriorityLabel, StatusIcon } from '../components/ui/Icons';
import TaskModal from '../components/tasks/TaskModal';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import toast from 'react-hot-toast';
import { format, isAfter } from 'date-fns';

const COLUMNS = ['todo', 'in_progress', 'in_review', 'done'];
const COL_COLORS = { todo: 'var(--text-3)', in_progress: 'var(--blue)', in_review: 'var(--yellow)', done: 'var(--green)' };

function InviteMemberModal({ projectId, onClose, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email, role });
      toast.success('Member added!');
      onInvited(res.data.data);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add member'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.125rem' }}>Invite Member</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 6 }}><Icons.close /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Email address</label>
            <input className="input" type="email" placeholder="colleague@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            <p className="text-xs text-muted mt-1">They must already have a TaskFlow account.</p>
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createStatus, setCreateStatus] = useState('todo');
  const [showInvite, setShowInvite] = useState(false);

  const myRole = project?.members?.find(m => m.user?._id === user?._id)?.role;
  const isAdmin = myRole === 'admin';

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project=${id}`)
    ]).then(([p, t]) => {
      setProject(p.data.data);
      setTasks(t.data.data);
    }).catch(() => { toast.error('Project not found'); navigate('/projects'); })
    .finally(() => setLoading(false));
  }, [id]);

  const tasksByStatus = COLUMNS.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  const handleTaskCreated = (task) => setTasks(prev => [task, ...prev]);
  const handleTaskUpdate = (updated) => setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
  const handleTaskDelete = (taskId) => setTasks(prev => prev.filter(t => t._id !== taskId));

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProject(prev => ({ ...prev, members: prev.members.filter(m => m.user?._id !== userId) }));
      toast.success('Member removed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: project?.color, flexShrink: 0 }} />
          <div>
            <h1 className="page-title">{project?.name}</h1>
            {project?.description && <p className="page-subtitle">{project.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(true)}>
              <Icons.members /> Invite
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => { setCreateStatus('todo'); setShowCreateTask(true); }}>
            <Icons.plus /> New Task
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ padding: '0 32px' }}>
        <div className="flex gap-4 flex-wrap" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-2)' }}>
          <span><strong style={{ color: 'var(--text)' }}>{project?.stats?.total || 0}</strong> tasks</span>
          <span style={{ color: 'var(--green)' }}><strong>{project?.stats?.done || 0}</strong> done</span>
          {project?.stats?.overdue > 0 && (
            <span style={{ color: 'var(--red)' }}><strong>{project.stats.overdue}</strong> overdue</span>
          )}
          <span><strong style={{ color: 'var(--text)' }}>{project?.members?.length || 0}</strong> members</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px' }}>
        <div className="tabs">
          <button className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>Board</button>
          <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>List</button>
          <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
            Members ({project?.members?.length})
          </button>
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: 0 }}>

        {/* BOARD VIEW */}
        {tab === 'board' && (
          <div className="kanban-board" style={{ overflowX: 'auto', paddingBottom: 20 }}>
            {COLUMNS.map(status => (
              <div key={status} className="kanban-col">
                <div className="kanban-col-header">
                  <span className="kanban-col-title">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COL_COLORS[status] }} />
                    {StatusLabel[status]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="kanban-count">{tasksByStatus[status]?.length}</span>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '3px 6px' }}
                      onClick={() => { setCreateStatus(status); setShowCreateTask(true); }}>
                      <Icons.plus />
                    </button>
                  </div>
                </div>
                {tasksByStatus[status]?.length === 0 && (
                  <div style={{ color: 'var(--text-3)', fontSize: '0.8125rem', textAlign: 'center', padding: '20px 0' }}>
                    No tasks
                  </div>
                )}
                {tasksByStatus[status]?.map(task => (
                  <TaskCard key={task._id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* LIST VIEW */}
        {tab === 'list' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No tasks yet</td></tr>
                  )}
                  {tasks.map(task => {
                    const overdue = task.dueDate && isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'done';
                    return (
                      <tr key={task._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTask(task)}>
                        <td>
                          <div className="flex items-center gap-2">
                            {overdue && <span className="overdue-dot" />}
                            <span style={{ fontWeight: 500 }}>{task.title}</span>
                          </div>
                        </td>
                        <td><span className={`badge badge-${task.status}`}>{StatusLabel[task.status]}</span></td>
                        <td><span className={`badge badge-${task.priority}`}>{PriorityLabel[task.priority]}</span></td>
                        <td>
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <img src={task.assignee.avatar} alt={task.assignee.name} className="avatar" width={24} height={24} />
                              <span className="text-sm">{task.assignee.name}</span>
                            </div>
                          ) : <span className="text-muted text-sm">—</span>}
                        </td>
                        <td>
                          {task.dueDate ? (
                            <span className="text-sm" style={{ color: overdue ? 'var(--red)' : 'var(--text-2)' }}>
                              {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          ) : <span className="text-muted text-sm">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MEMBERS VIEW */}
        {tab === 'members' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {project?.members?.map(m => m.user && (
                  <tr key={m.user._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <img src={m.user.avatar} alt={m.user.name} className="avatar" width={32} height={32} />
                        <span className="fw-500">{m.user.name}</span>
                        {m.user._id === user._id && (
                          <span style={{ fontSize: '0.7rem', background: 'var(--accent-glow)', color: 'var(--accent-2)',
                            padding: '1px 6px', borderRadius: 20 }}>you</span>
                        )}
                      </div>
                    </td>
                    <td className="text-muted text-sm">{m.user.email}</td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', padding: '3px 10px', borderRadius: 20,
                        background: m.role === 'admin' ? 'var(--accent-glow)' : 'var(--bg-4)',
                        color: m.role === 'admin' ? 'var(--accent-2)' : 'var(--text-2)' }}>
                        {m.role}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{format(new Date(m.joinedAt), 'MMM d, yyyy')}</td>
                    {isAdmin && (
                      <td>
                        {m.user._id !== project.owner && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.user._id)}>
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {isAdmin && (
              <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(true)}>
                  <Icons.plus /> Invite member
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskModal task={selectedTask} projectId={id} members={project?.members}
          onClose={() => setSelectedTask(null)}
          onUpdate={t => { handleTaskUpdate(t); setSelectedTask(t); }}
          onDelete={handleTaskDelete} />
      )}
      {showCreateTask && (
        <CreateTaskModal projectId={id} members={project?.members} defaultStatus={createStatus}
          onClose={() => setShowCreateTask(false)} onCreated={handleTaskCreated} />
      )}
      {showInvite && (
        <InviteMemberModal projectId={id} onClose={() => setShowInvite(false)}
          onInvited={p => setProject(p)} />
      )}
    </>
  );
}

function TaskCard({ task, onClick }) {
  const isOverdue = task.dueDate && isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'done';

  return (
    <div className={`task-card ${isOverdue ? 'overdue' : ''}`} onClick={onClick}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span className={`badge badge-${task.priority}`} style={{ fontSize: '0.7rem', padding: '2px 7px' }}>
          {PriorityLabel[task.priority]}
        </span>
        {isOverdue && <span className="overdue-dot" />}
      </div>
      <p style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4, marginBottom: 8 }}>{task.title}</p>

      {task.tags?.length > 0 && (
        <div className="flex gap-1" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
          {task.tags.slice(0, 2).map(t => <span key={t} className="tag" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>{t}</span>)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted">
          {task.comments?.length > 0 && (
            <span className="flex items-center gap-1"><Icons.comment /> {task.comments.length}</span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-1" style={{ color: isOverdue ? 'var(--red)' : 'inherit' }}>
              <Icons.clock /> {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
        {task.assignee && (
          <img src={task.assignee.avatar} alt={task.assignee.name}
            className="avatar" width={22} height={22} title={task.assignee.name} />
        )}
      </div>
    </div>
  );
}