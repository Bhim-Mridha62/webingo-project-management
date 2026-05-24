import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Paperclip, X, Download } from 'lucide-react';
import Modal from './Modal';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const TaskModal = ({
  isOpen,
  onClose,
  editingTask,
  projectMembers = [],
  submitting,
  onSubmit
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setFiles([]);
      if (editingTask) {
        const defaultValues = {
          title: editingTask.title,
          description: editingTask.description || '',
          status: editingTask.status || 'Todo',
          priority: editingTask.priority || 'Medium',
          dueDate: editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '',
        };
        // Pre-check assignees
        projectMembers.forEach(m => {
          defaultValues[`assignee_${m.user._id}`] = editingTask.assignees?.some(
            a => (a._id || a) === m.user._id
          );
        });
        reset(defaultValues);
      } else {
        const defaultValues = {
          title: '',
          description: '',
          status: 'Todo',
          priority: 'Medium',
          dueDate: '',
        };
        projectMembers.forEach(m => {
          defaultValues[`assignee_${m.user._id}`] = false;
        });
        reset(defaultValues);
      }
    }
  }, [isOpen, editingTask, reset, projectMembers]);

  const handleFormSubmit = (data) => {
    // Map the checkbox fields back to member ids
    const selectedAssignees = projectMembers
      .filter(m => data[`assignee_${m.user._id}`])
      .map(m => m.user._id);

    const taskData = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      assignees: selectedAssignees,
    };

    onSubmit(taskData, files);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? 'Edit Task' : 'Create Task'}
      footer={
        <>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : editingTask ? 'Update' : 'Create'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Task Title */}
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input 
            className="form-input" 
            placeholder="Task title" 
            {...register('title', { required: 'Title is required' })} 
          />
          {errors.title && <div className="form-error">{errors.title.message}</div>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            className="form-input form-textarea" 
            placeholder="Describe this task..." 
            {...register('description')} 
          />
        </div>

        {/* Status & Priority Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input form-select" {...register('status')}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-input form-select" {...register('priority')}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input type="date" className="form-input" {...register('dueDate')} />
        </div>

        {/* Assignees Selection */}
        <div className="form-group">
          <label className="form-label">Assignees</label>
          <div className="checkbox-list" style={{ maxHeight: '140px', overflowY: 'auto' }}>
            {projectMembers.map((m) => (
              <label key={m.user?._id} className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px' }}>
                <input 
                  type="checkbox" 
                  {...register(`assignee_${m.user?._id}`)} 
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span style={{ fontSize: '13px' }}>
                  {m.user?.name || 'User'} ({m.role})
                </span>
              </label>
            ))}
            {projectMembers.length === 0 && (
              <div style={{ padding: 8, fontSize: 12, color: 'var(--text-muted)' }}>No members in this project</div>
            )}
          </div>
        </div>

        {/* File Attachments */}
        <div className="form-group">
          <label className="form-label">Attachments (max 5MB each)</label>
          <div 
            className="file-upload-area" 
            onClick={() => document.getElementById('task-file-input').click()}
            style={{ padding: '20px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: 'pointer' }}
          >
            <Paperclip size={20} style={{ color: 'var(--text-muted)', marginBottom: 6, display: 'inline-block' }} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click to upload files</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Images, PDFs, Documents up to 5MB</div>
          </div>
          <input
            id="task-file-input"
            type="file"
            multiple
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
          />

          {/* Local files queue */}
          {files.length > 0 && (
            <div className="attachments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginTop: 12 }}>
              {files.map((f, i) => {
                const isImg = f.type?.startsWith('image/');
                return (
                  <div key={i} className="attachment-preview-card" style={{ position: 'relative', padding: 6 }}>
                    {isImg ? (
                      <img 
                        src={URL.createObjectURL(f)} 
                        alt={f.name} 
                        style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '4px', marginBottom: 4 }} 
                      />
                    ) : (
                      <div style={{ height: '70px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: 4 }}>
                        <Paperclip size={20} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                    <span 
                      style={{ fontSize: 10, color: 'var(--text-primary)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', display: 'block' }} 
                      title={f.name}
                    >
                      {f.name}
                    </span>
                    <button
                      type="button"
                      className="btn btn-icon btn-ghost btn-sm"
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', padding: 2 }}
                      onClick={(e) => { e.preventDefault(); removeFile(i); }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Existing attachments for editing */}
          {editingTask?.attachments?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Existing files:</div>
              <div className="attachments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                {editingTask.attachments.map((att, i) => {
                  const isImg = att.original_name?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || att.url?.match(/\.(jpeg|jpg|gif|png|webp)/i);
                  return (
                    <div key={i} className="attachment-preview-card" style={{ position: 'relative', padding: 6 }}>
                      {isImg ? (
                        <img 
                          src={att.url} 
                          alt={att.original_name} 
                          style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '4px', marginBottom: 4, cursor: 'pointer' }} 
                          onClick={() => window.open(att.url, '_blank')} 
                        />
                      ) : (
                        <div style={{ height: '70px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: 4 }}>
                          <Paperclip size={20} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                      <span 
                        style={{ fontSize: 10, color: 'var(--text-primary)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', display: 'block' }} 
                        title={att.original_name}
                      >
                        {att.original_name}
                      </span>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-icon btn-ghost btn-sm"
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', padding: 2 }}
                        title="Download"
                      >
                        <Download size={10} />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
