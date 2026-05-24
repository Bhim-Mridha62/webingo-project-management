import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTasks, taskAdded, taskUpdated, taskDeleted } from '../store/slices/taskSlice';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import {
  Plus, Search, Filter, UserPlus, Paperclip, Calendar,
  Trash2, Edit3, Download, X, Users
} from 'lucide-react';
import { getDueStatus } from '../utils/dateUtils';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const ProjectDetailPage = () => {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const addToast = useToast();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);

  const [project, setProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Drag and drop states
  const [activeDragCol, setActiveDragCol] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const { register: regMember, handleSubmit: handleMemberSubmit, reset: resetMember } = useForm();

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setActiveDragCol(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (status) => {
    setActiveDragCol(status);
  };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    setActiveDragCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === status) return;

    try {
      // Optimistic update
      dispatch(taskUpdated({ ...task, status }));

      await api.put(`/tasks/${taskId}`, { status });
      addToast(`Task moved to ${status}`, 'success');
    } catch (err) {
      addToast('Failed to move task', 'error');
      // Revert optimistic update
      dispatch(taskUpdated(task));
    } finally {
      setDraggingTaskId(null);
    }
  };

  // Member removal handler
  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) return;
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      addToast(`${memberName} removed from project`, 'success');
      // Refetch project to get updated member list
      const { data: updated } = await api.get(`/projects/${projectId}`);
      setProject(updated);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove member', 'error');
    }
  };

  // Socket handlers
  const handleTaskCreated = useCallback((task) => {
    dispatch(taskAdded(task));
    addToast('New task created', 'info');
  }, [dispatch, addToast]);

  const handleTaskUpdated = useCallback((task) => {
    dispatch(taskUpdated(task));
  }, [dispatch]);

  const handleTaskDeleted = useCallback((taskId) => {
    dispatch(taskDeleted(taskId));
  }, [dispatch]);

  useSocket(projectId, {
    onTaskCreated: handleTaskCreated,
    onTaskUpdated: handleTaskUpdated,
    onTaskDeleted: handleTaskDeleted,
  });

  useEffect(() => {
    dispatch(fetchTasks(projectId));
    const loadProject = async () => {
      try {
        const { data } = await api.get(`/projects/${projectId}`);
        setProject(data);
      } catch (err) {
        addToast('Failed to load project', 'error');
      }
    };
    loadProject();
  }, [dispatch, projectId, addToast]);

  const handleCreateTask = async (data) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('status', data.status || 'Todo');
      formData.append('priority', data.priority || 'Medium');
      formData.append('dueDate', data.dueDate || '');

      // Collect selected assignees
      const selectedAssignees = project?.members
        ?.filter((_, i) => data[`assignee_${i}`])
        .map(m => m.user._id) || [];
      formData.append('assignees', JSON.stringify(selectedAssignees));

      files.forEach(f => formData.append('attachments', f));

      await api.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Task created!', 'success');
      setShowTaskModal(false);
      reset();
      setFiles([]);
      dispatch(fetchTasks(projectId));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTask = async (data) => {
    if (!editingTask) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('status', data.status || editingTask.status);
      formData.append('priority', data.priority || editingTask.priority);
      formData.append('dueDate', data.dueDate || '');

      const selectedAssignees = project?.members
        ?.filter((_, i) => data[`assignee_${i}`])
        .map(m => m.user._id) || [];
      formData.append('assignees', JSON.stringify(selectedAssignees));

      files.forEach(f => formData.append('attachments', f));

      await api.put(`/tasks/${editingTask._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Task updated!', 'success');
      setEditingTask(null);
      setShowTaskModal(false);
      reset();
      setFiles([]);
      dispatch(fetchTasks(projectId));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      addToast('Task deleted', 'success');
      dispatch(fetchTasks(projectId));
    } catch (err) {
      addToast('Failed to delete task', 'error');
    }
  };

  const handleBulkUpdateStatus = async (status) => {
    if (selectedTasks.length === 0) return;
    try {
      await Promise.all(selectedTasks.map(id => api.put(`/tasks/${id}`, { status })));
      addToast(`${selectedTasks.length} tasks updated to ${status}`, 'success');
      setSelectedTasks([]);
      dispatch(fetchTasks(projectId));
    } catch (err) {
      addToast('Bulk update failed', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    if (!window.confirm(`Delete ${selectedTasks.length} tasks?`)) return;
    try {
      await Promise.all(selectedTasks.map(id => api.delete(`/tasks/${id}`)));
      addToast(`${selectedTasks.length} tasks deleted`, 'success');
      setSelectedTasks([]);
      dispatch(fetchTasks(projectId));
    } catch (err) {
      addToast('Bulk delete failed', 'error');
    }
  };

  const handleAddMember = async (data) => {
    try {
      await api.post(`/projects/${projectId}/members`, {
        email: data.memberEmail,
        role: data.memberRole || 'Viewer',
      });
      addToast('Member added!', 'success');
      setShowMemberModal(false);
      resetMember();
      const { data: updated } = await api.get(`/projects/${projectId}`);
      setProject(updated);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add member', 'error');
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setValue('title', task.title);
    setValue('description', task.description);
    setValue('status', task.status);
    setValue('priority', task.priority);
    setValue('dueDate', task.dueDate ? task.dueDate.split('T')[0] : '');
    // Pre-check assignees
    project?.members?.forEach((m, i) => {
      setValue(`assignee_${i}`, task.assignees?.some(a => (a._id || a) === m.user._id));
    });
    setShowTaskModal(true);
  };

  const toggleSelect = (taskId) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  // Filter and search
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, filterStatus, filterPriority, searchQuery]);

  // Group tasks by status for kanban
  const columns = STATUSES.map(status => ({
    status,
    tasks: filteredTasks.filter(t => t.status === status)
  }));

  const myRole = project?.members?.find(m => m.user?._id === user?._id)?.role;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{project?.name || 'Loading...'}</h1>
          <p>{project?.description || ''}</p>
          {myRole && (
            <span className="badge badge-in-progress" style={{ marginTop: 8 }}>
              Your Role: {myRole}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(myRole === 'Admin') && (
            <button className="btn btn-ghost" onClick={() => setShowMemberModal(true)}>
              <UserPlus size={16} /> Add Member
            </button>
          )}
          {(myRole === 'Admin' || myRole === 'Team Member') && (
            <button className="btn btn-primary" onClick={() => {
              setEditingTask(null);
              reset();
              setFiles([]);
              setShowTaskModal(true);
            }}>
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Members row */}
      {project?.members && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <Users size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Members:</span>
          {project.members.map((m, i) => {
            const isMe = m.user?._id === user?._id;
            const canRemove = myRole === 'Admin' && !isMe;
            return (
              <span key={i} className="badge badge-in-progress" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {m.user?.name || 'User'} ({m.role})
                {canRemove && (
                  <button
                    type="button"
                    style={{ border: 'none', background: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 0 }}
                    onClick={() => handleRemoveMember(m.user?._id, m.user?.name)}
                    title="Remove member"
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="filter-input"
            style={{ paddingLeft: 32 }}
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {selectedTasks.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>{selectedTasks.length} selected</span>
            <select
              className="filter-select"
              onChange={(e) => { if (e.target.value) handleBulkUpdateStatus(e.target.value); e.target.value = ''; }}
              defaultValue=""
            >
              <option value="">Bulk Status...</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="kanban-board">
          {STATUSES.map(s => (
            <div key={s} className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-title">{s}</span>
              </div>
              <div className="kanban-column-body">
                <LoadingSkeleton type="task" count={2} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="kanban-board">
          {columns.map(({ status, tasks: colTasks }) => (
            <div key={status} className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-title">
                  <span className={`badge badge-${status.toLowerCase().replace(' ', '-')}`}
                    style={{ width: 8, height: 8, padding: 0, borderRadius: '50%', marginRight: 4 }}
                  />
                  {status}
                </span>
                <span className="kanban-column-count">{colTasks.length}</span>
              </div>
              <div
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(status)}
                onDragLeave={() => setActiveDragCol(null)}
                onDrop={(e) => handleDrop(e, status)}
                className={`kanban-column-body ${activeDragCol === status ? 'drag-hover' : ''}`}
              >
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isDraggable = myRole === 'Admin' || myRole === 'Team Member';
                    const coverImage = task.attachments?.find(att =>
                      att.original_name?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || att.url?.match(/\.(jpeg|jpg|gif|png|webp)/i)
                    );
                    return (
                      <div
                        key={task._id}
                        draggable={isDraggable}
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onDragEnd={handleDragEnd}
                        className={`task-card ${draggingTaskId === task._id ? 'dragging' : ''}`}
                      >
                        {coverImage && (
                          <img
                            src={coverImage.url}
                            alt="Cover"
                            style={{
                              width: 'calc(100% + 28px)',
                              margin: '-14px -14px 12px -14px',
                              height: '110px',
                              objectFit: 'cover',
                              borderTopLeftRadius: 'var(--radius-sm)',
                              borderTopRightRadius: 'var(--radius-sm)',
                              display: 'block'
                            }}
                          />
                        )}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task._id)}
                            onChange={() => toggleSelect(task._id)}
                            style={{ marginTop: 3, accentColor: 'var(--accent-primary)' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div className="task-card-title" onClick={() => openEditModal(task)} style={{ cursor: 'pointer' }}>
                              {task.title}
                            </div>
                            <div className="task-card-meta">
                              <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                              {task.dueDate && (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Calendar size={10} />
                                  {getDueStatus(task.dueDate)}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                              <div className="task-card-assignees">
                                {task.assignees?.slice(0, 3).map((a, i) => (
                                  <div key={i} className="task-card-assignee">
                                    {a.name?.[0]?.toUpperCase() || '?'}
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {task.attachments?.length > 0 && (
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Paperclip size={10} /> {task.attachments.length}
                                  </span>
                                )}
                                {(myRole === 'Admin' || myRole === 'Team Member') && (
                                  <>
                                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEditModal(task)} title="Edit">
                                      <Edit3 size={12} />
                                    </button>
                                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDeleteTask(task._id)} title="Delete">
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditingTask(null); reset(); setFiles([]); }}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowTaskModal(false); setEditingTask(null); reset(); setFiles([]); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit(editingTask ? handleUpdateTask : handleCreateTask)}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingTask ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Task title" {...register('title', { required: 'Required' })} />
            {errors.title && <div className="form-error">{errors.title.message}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" placeholder="Describe this task..." {...register('description')} />
          </div>
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
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" {...register('dueDate')} />
          </div>
          <div className="form-group">
            <label className="form-label">Assignees</label>
            <div className="checkbox-list">
              {project?.members?.map((m, i) => (
                <label key={i} className="checkbox-item">
                  <input type="checkbox" {...register(`assignee_${i}`)} />
                  {m.user?.name || 'User'} ({m.role})
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Attachments (max 5MB each)</label>
            <div className="file-upload-area" onClick={() => document.getElementById('file-input').click()}>
              <Paperclip size={20} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click to upload files</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Images, PDFs, Word docs up to 5MB</div>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              style={{ display: 'none' }}
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files)])}
            />
            {files.length > 0 && (
              <div className="attachments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginTop: 12 }}>
                {files.map((f, i) => {
                  const isImg = f.type?.startsWith('image/');
                  return (
                    <div key={i} className="attachment-preview-card">
                      {isImg ? (
                        <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: 6 }} />
                      ) : (
                        <div style={{ height: '80px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: 6 }}>
                          <Paperclip size={24} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-primary)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }} title={f.name}>{f.name}</span>
                      <button
                        type="button"
                        className="btn btn-icon btn-ghost btn-sm"
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', padding: 4 }}
                        onClick={(e) => { e.preventDefault(); setFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Existing attachments for edit */}
            {editingTask?.attachments?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Existing files:</div>
                <div className="attachments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                  {editingTask.attachments.map((att, i) => {
                    const isImg = att.original_name?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || att.url?.match(/\.(jpeg|jpg|gif|png|webp)/i);
                    return (
                      <div key={i} className="attachment-preview-card">
                        {isImg ? (
                          <img src={att.url} alt={att.original_name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: 6, cursor: 'pointer' }} onClick={() => window.open(att.url, '_blank')} />
                        ) : (
                          <div style={{ height: '80px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: 6 }}>
                            <Paperclip size={24} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-primary)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }} title={att.original_name}>{att.original_name}</span>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-icon btn-ghost btn-sm"
                          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', padding: 4 }}
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

      {/* Add Member Modal */}
      <Modal
        isOpen={showMemberModal}
        onClose={() => { setShowMemberModal(false); resetMember(); }}
        title="Add Team Member"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowMemberModal(false); resetMember(); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleMemberSubmit(handleAddMember)}>Add Member</button>
          </>
        }
      >
        <form>
          <div className="form-group">
            <label className="form-label">Member Email</label>
            <input className="form-input" placeholder="email@example.com" {...regMember('memberEmail', { required: true })} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input form-select" {...regMember('memberRole')}>
              <option value="Team Member">Team Member</option>
              <option value="Viewer">Viewer</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
