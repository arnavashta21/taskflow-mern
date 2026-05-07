import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Icons, StatusLabel, PriorityLabel } from '../ui/Icons';
import toast from 'react-hot-toast';
import { format, isAfter } from 'date-fns';

export default function TaskModal({ task: initialTask, projectId, members, onClose, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [task, setTask] = useState(initialTask);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [saving, setSaving] = useState(false);

  const isOverdue = task.dueDate && isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'done';
  const isAdmin = members?.find(m => m.user?._id === user?._id)?.role === 'admin';
  const canEdit = isAdmin || task.createdBy?._id === user?._id || task.assignee?._id === user?._id;

  const updateField = async (field, value) => {
    if (!canEdit) return;
    try {
      setSaving(true);
      const res = await api.patch(`/tasks/${task._id}`, { [field]: value });
      setTask(res.data.data);
      onUpdate(res.data.data);
    } catch (err) {
      toast.error('Failed to update');
    } finally { setSaving(false); }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { text: comment });
      setTask(prev => ({ ...prev, comments: res.data.data }));
      setComment('');
    } catch { toast.error('Failed to post comment'); }
    finally { setSubmittingComment(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Task deleted');
      onDelete(task._id);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <div className="flex items-center gap-2">
            {saving && <span className="spinner" style={{ width: 14, height: 14 }} />}
            {isOverdue && <span className="overdue-dot" />}
          </div>
          <div className="flex gap-2">
            {(isAdmin || task.createdBy?._id === user?._id) && (
              <button onClick={handleDelete} className="btn btn-danger btn-sm"><Icons.trash /></button>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 6 }}><Icons.close /></button>
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.25rem', marginBottom: 6, lineHeight: 1.3 }}>{task.title}</h2>
        {isOverdue && (
          <p style={{ color: 'var(--red)', fontSize: '0.8125rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icons.warning /> Overdue since {format(new Date(task.dueDate), 'MMM d')}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24 }}>
          {/* Left col */}
          <div>
            {/* Description */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Description</label>
              <textarea className="textarea" style={{ minHeight: 100 }}
                defaultValue={task.description || ''}
                placeholder="Add a description..."
                readOnly={!canEdit}
                onBlur={e => {
                  if (e.target.value !== task.description) updateField('description', e.target.value);
                }}
              />
            </div>

            {/* Tags */}
            {task.tags?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label className="text-xs text-muted fw-500" style={{ display: 'block', marginBottom: 6 }}>Tags</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {task.tags.map(t => <span key={t} className="tag"><Icons.tag /> {t}</span>)}
                </div>
              </div>
            )}

            {/* Activity */}
            {task.activity?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label className="text-xs text-muted fw-500" style={{ display: 'block', marginBottom: 8 }}>Activity</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {task.activity.slice(-5).reverse().map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted">
                      {a.actor?.avatar && <img src={a.actor.avatar} alt={a.actor.name} className="avatar" width={18} height={18} />}
                      <span><strong style={{ color: 'var(--text-2)' }}>{a.actor?.name || 'Someone'}</strong> {a.action}
                        {a.oldValue && a.newValue && <span> from <em>{a.oldValue}</em> → <em>{a.newValue}</em></span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <label className="text-xs text-muted fw-500" style={{ display: 'block', marginBottom: 8 }}>
                Comments ({task.comments?.length || 0})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                {task.comments?.map(c => (
                  <div key={c._id} style={{ display: 'flex', gap: 10 }}>
                    <img src={c.author?.avatar} alt={c.author?.name} className="avatar" width={28} height={28} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                        <span className="text-xs fw-600">{c.author?.name}</span>
                        <span className="text-xs text-muted">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={submitComment} style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="Write a comment..." value={comment}
                  onChange={e => setComment(e.target.value)} style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment || !comment.trim()}>
                  {submittingComment ? <span className="spinner" /> : <Icons.send />}
                </button>
              </form>
            </div>
          </div>

          {/* Right col — metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.8125rem' }}>
            {/* Status */}
            <div className="form-group">
              <label>Status</label>
              <select className="select" value={task.status} disabled={!canEdit}
                onChange={e => updateField('status', e.target.value)}>
                {['todo','in_progress','in_review','done'].map(s => (
                  <option key={s} value={s}>{StatusLabel[s]}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label>Priority</label>
              <select className="select" value={task.priority} disabled={!canEdit}
                onChange={e => updateField('priority', e.target.value)}>
                {['low','medium','high','critical'].map(p => (
                  <option key={p} value={p}>{PriorityLabel[p]}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="form-group">
              <label>Assignee</label>
              <select className="select" value={task.assignee?._id || ''} disabled={!canEdit}
                onChange={e => updateField('assignee', e.target.value || null)}>
                <option value="">Unassigned</option>
                {members?.map(m => m.user && (
                  <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label>Due Date</label>
              <input className="input" type="date" disabled={!canEdit}
                value={task.dueDate ? task.dueDate.substring(0, 10) : ''}
                onChange={e => updateField('dueDate', e.target.value || null)} />
            </div>

            {/* Created by */}
            <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <p className="text-xs text-muted" style={{ marginBottom: 6 }}>Created by</p>
              <div className="flex items-center gap-2">
                <img src={task.createdBy?.avatar} alt={task.createdBy?.name} className="avatar" width={22} height={22} />
                <span className="text-xs">{task.createdBy?.name}</span>
              </div>
              <p className="text-xs text-muted" style={{ marginTop: 6 }}>
                {format(new Date(task.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}