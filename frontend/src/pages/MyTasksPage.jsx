import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Icons, StatusLabel, PriorityLabel } from '../components/ui/Icons';
import { format, isAfter } from 'date-fns';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/tasks/my')
      .then(res => setTasks(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'overdue') return t.dueDate && isAfter(new Date(), new Date(t.dueDate)) && t.status !== 'done';
    if (filter === 'active') return t.status !== 'done';
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  const overdueCount = tasks.filter(t => t.dueDate && isAfter(new Date(), new Date(t.dueDate)) && t.status !== 'done').length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{tasks.length} tasks assigned to you across all projects</p>
        </div>
      </div>

      <div style={{ padding: '0 32px' }}>
        <div className="tabs">
          <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({tasks.length})</button>
          <button className={`tab ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
            Active ({tasks.filter(t => t.status !== 'done').length})
          </button>
          {overdueCount > 0 && (
            <button className={`tab ${filter === 'overdue' ? 'active' : ''}`} onClick={() => setFilter('overdue')}
              style={{ color: filter === 'overdue' ? 'var(--red)' : 'var(--red)', opacity: filter === 'overdue' ? 1 : 0.7 }}>
              Overdue ({overdueCount})
            </button>
          )}
          <button className={`tab ${filter === 'done' ? 'active' : ''}`} onClick={() => setFilter('done')}>Done</button>
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Icons.tasks />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-2)' }}>
              {filter === 'all' ? 'No tasks assigned to you' : `No ${filter} tasks`}
            </h3>
            <p>Tasks assigned to you will appear here</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => {
                  const overdue = task.dueDate && isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'done';
                  return (
                    <tr key={task._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {overdue && <span className="overdue-dot" />}
                          <span className="fw-500" style={{ fontSize: '0.875rem' }}>{task.title}</span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted" style={{ marginTop: 2, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td>
                        {task.project && (
                          <Link to={`/projects/${task.project._id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%',
                              background: task.project.color || 'var(--accent)', flexShrink: 0 }} />
                            <span className="text-sm" style={{ color: 'var(--accent-2)' }}>{task.project.name}</span>
                          </Link>
                        )}
                      </td>
                      <td><span className={`badge badge-${task.status}`}>{StatusLabel[task.status]}</span></td>
                      <td><span className={`badge badge-${task.priority}`}>{PriorityLabel[task.priority]}</span></td>
                      <td>
                        {task.dueDate ? (
                          <span className="text-sm" style={{ color: overdue ? 'var(--red)' : 'var(--text-2)' }}>
                            {overdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        ) : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}