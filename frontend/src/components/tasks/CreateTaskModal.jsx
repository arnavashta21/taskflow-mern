import { useState } from 'react';
import api from '../../api/client';
import { Icons, StatusLabel, PriorityLabel } from '../ui/Icons';
import toast from 'react-hot-toast';

export default function CreateTaskModal({ projectId, members, defaultStatus = 'todo', onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', status: defaultStatus, priority: 'medium',
    assignee: '', dueDate: '', tags: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, project: projectId };
      if (!payload.assignee) delete payload.assignee;
      if (!payload.dueDate) delete payload.dueDate;
      if (payload.tags) payload.tags = payload.tags.split(',').map(t => t.trim()).filter(Boolean);
      else delete payload.tags;

      const res = await api.post('/tasks', payload);
      toast.success('Task created');
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.125rem' }}>New Task</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 6 }}><Icons.close /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Title *</label>
            <input className="input" placeholder="Task title"
              value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              required autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="textarea" placeholder="Optional details..."
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select className="select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {['todo','in_progress','in_review','done'].map(s => (
                  <option key={s} value={s}>{StatusLabel[s]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                {['low','medium','high','critical'].map(p => (
                  <option key={p} value={p}>{PriorityLabel[p]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assign to</label>
              <select className="select" value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})}>
                <option value="">Unassigned</option>
                {members?.map(m => m.user && (
                  <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input className="input" type="date" value={form.dueDate}
                onChange={e => setForm({...form, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Tags <span className="text-muted">(comma separated)</span></label>
            <input className="input" placeholder="frontend, api, bug"
              value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
          </div>
          <div className="flex gap-2" style={{ marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}