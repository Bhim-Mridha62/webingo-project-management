import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTasks, taskAdded, taskUpdated, taskDeleted } from '../store/slices/taskSlice';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/Toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import api from '../services/api';
import {
  Plus, UserPlus, X, Users
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Import modular components
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import TaskListView from '../components/TaskListView';
import TaskModal from '../components/TaskModal';
import MemberModal from '../components/MemberModal';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];

const ProjectDetailPage = () => {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const addToast = useToast();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);

  // Project information
  const [project, setProject] = useState(null);

  // Filter and Sorting States
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  // Modals and selection
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Drag and drop states
  const [activeDragCol, setActiveDragCol] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  // Load project details and tasks
  const loadProject = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setProject(data);
    } catch (err) {
      addToast('Failed to load project details', 'error');
    }
  }, [projectId, addToast]);

  useEffect(() => {
    dispatch(fetchTasks(projectId));
    loadProject();
  }, [dispatch, projectId, loadProject]);

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
      // Optimistic update on frontend
      dispatch(taskUpdated({ ...task, status }));
      addToast(`Task moved to ${status}`, 'success');

      await api.put(`/tasks/${taskId}`, { status });
    } catch (err) {
      addToast('Failed to move task', 'error');
      // Revert optimistic update
      dispatch(taskUpdated(task));
    } finally {
      setDraggingTaskId(null);
    }
  };

  // Socket.io Real-Time Event handlers
  const handleTaskCreated = useCallback((task) => {
    dispatch(taskAdded(task));
    addToast(`New task created: "${task.title}"`, 'info');
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

  // Task creation/update triggers
  const handleCreateTask = async (taskData, filesList) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('title', taskData.title);
      formData.append('description', taskData.description || '');
      formData.append('status', taskData.status || 'Todo');
      formData.append('priority', taskData.priority || 'Medium');
      formData.append('dueDate', taskData.dueDate || '');
      formData.append('assignees', JSON.stringify(taskData.assignees));

      filesList.forEach(f => formData.append('attachments', f));

      await api.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      addToast('Task created successfully!', 'success');
      setShowTaskModal(false);
      dispatch(fetchTasks(projectId));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTask = async (taskData, filesList) => {
    if (!editingTask) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', taskData.title);
      formData.append('description', taskData.description || '');
      formData.append('status', taskData.status || editingTask.status);
      formData.append('priority', taskData.priority || editingTask.priority);
      formData.append('dueDate', taskData.dueDate || '');
      formData.append('assignees', JSON.stringify(taskData.assignees));

      filesList.forEach(f => formData.append('attachments', f));

      await api.put(`/tasks/${editingTask._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast('Task updated successfully!', 'success');
      setEditingTask(null);
      setShowTaskModal(false);
      dispatch(fetchTasks(projectId));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      addToast('Task deleted successfully', 'success');
      dispatch(fetchTasks(projectId));
    } catch (err) {
      addToast('Failed to delete task', 'error');
    }
  };

  // Bulk Operations
  const handleBulkUpdateStatus = async (status) => {
    if (selectedTasks.length === 0) return;
    try {
      await Promise.all(selectedTasks.map(id => api.put(`/tasks/${id}`, { status })));
      addToast(`${selectedTasks.length} tasks updated to "${status}"`, 'success');
      setSelectedTasks([]);
      dispatch(fetchTasks(projectId));
    } catch (err) {
      addToast('Bulk update failed', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedTasks.length} selected tasks?`)) return;
    try {
      await Promise.all(selectedTasks.map(id => api.delete(`/tasks/${id}`)));
      addToast(`${selectedTasks.length} tasks deleted successfully`, 'success');
      setSelectedTasks([]);
      dispatch(fetchTasks(projectId));
    } catch (err) {
      addToast('Bulk delete failed', 'error');
    }
  };

  // Add/Remove project members
  const handleAddMember = async (memberData) => {
    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/members`, {
        email: memberData.memberEmail,
        role: memberData.memberRole || 'Viewer',
      });
      addToast('Member added successfully!', 'success');
      setShowMemberModal(false);
      loadProject();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) return;
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      addToast(`${memberName} removed from project`, 'success');
      loadProject();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove member', 'error');
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const toggleSelect = (taskId) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    const visibleTaskIds = filteredAndSortedTasks.map(t => t._id);
    const allSelected = visibleTaskIds.every(id => selectedTasks.includes(id));
    if (allSelected) {
      setSelectedTasks(prev => prev.filter(id => !visibleTaskIds.includes(id)));
    } else {
      setSelectedTasks(prev => {
        const union = new Set([...prev, ...visibleTaskIds]);
        return Array.from(union);
      });
    }
  };

  // Filtering and Sorting logic inside useMemo
  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter(t => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterAssignee) {
        const hasAssignee = t.assignees?.some(a => (a._id || a) === filterAssignee);
        if (!hasAssignee) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    if (sortBy) {
      result.sort((a, b) => {
        let valA, valB;
        if (sortBy === 'dueDate') {
          valA = a.dueDate ? new Date(a.dueDate).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
          valB = b.dueDate ? new Date(b.dueDate).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        if (sortBy === 'priority') {
          const ORDER = { Low: 0, Medium: 1, High: 2, Critical: 3 };
          valA = ORDER[a.priority] ?? -1;
          valB = ORDER[b.priority] ?? -1;
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        if (sortBy === 'status') {
          const ORDER = { Todo: 0, 'In Progress': 1, Review: 2, Completed: 3 };
          valA = ORDER[a.status] ?? -1;
          valB = ORDER[b.status] ?? -1;
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        if (sortBy === 'title') {
          valA = (a.title || '').toLowerCase();
          valB = (b.title || '').toLowerCase();
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return 0;
      });
    }

    return result;
  }, [tasks, filterStatus, filterPriority, filterAssignee, searchQuery, sortBy, sortOrder]);

  // Group tasks by status for Kanban Board representation (preserving current sorting)
  const kanbanColumns = STATUSES.map(status => ({
    status,
    tasks: filteredAndSortedTasks.filter(t => t.status === status)
  }));

  const myRole = project?.members?.find(m => m.user?._id === user?._id)?.role;

  return (
    <div>
      {/* Header Info */}
      <div className="page-header">
        <div>
          <h1 style={{ background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {project?.name || 'Loading Project...'}
          </h1>
          <p style={{ margin: '8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {project?.description || 'No description provided'}
          </p>
          {myRole && (
            <span className="badge badge-in-progress" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="online-dot" /> Your Role: {myRole}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {myRole === 'Admin' && (
            <button className="btn btn-ghost" onClick={() => setShowMemberModal(true)}>
              <UserPlus size={16} /> Add Member
            </button>
          )}
          {(myRole === 'Admin' || myRole === 'Team Member') && (
            <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Project Members list */}
      {project?.members && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Users size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Members:</span>
          {project.members.map((m, i) => {
            const isMe = m.user?._id === user?._id;
            const canRemove = myRole === 'Admin' && !isMe;
            return (
              <span 
                key={i} 
                className="badge badge-todo" 
                style={{ 
                  fontSize: 11, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '4px 10px'
                }}
              >
                {m.user?.name || 'User'} ({m.role})
                {canRemove && (
                  <button
                    type="button"
                    style={{ border: 'none', background: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 0 }}
                    onClick={() => handleRemoveMember(m.user?._id, m.user?.name)}
                    title={`Remove ${m.user?.name}`}
                  >
                    <X size={11} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Advanced Filters, Search & View Selection Component */}
      <TaskFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        filterAssignee={filterAssignee}
        setFilterAssignee={setFilterAssignee}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        projectMembers={project?.members || []}
        selectedTasksCount={selectedTasks.length}
        onBulkStatusUpdate={handleBulkUpdateStatus}
        onBulkDelete={handleBulkDelete}
      />

      {/* Tasks Layout View */}
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
      ) : viewMode === 'list' ? (
        <TaskListView
          tasks={filteredAndSortedTasks}
          myRole={myRole}
          selectedTasks={selectedTasks}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={openEditModal}
          onDelete={handleDeleteTask}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
      ) : (
        /* Kanban Board View */
        <div className="kanban-board">
          {kanbanColumns.map(({ status, tasks: colTasks }) => (
            <div key={status} className="kanban-column" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="kanban-column-header" style={{ padding: '14px 16px' }}>
                <span className="kanban-column-title" style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  <span 
                    className={`badge badge-${status.toLowerCase().replace(' ', '-')}`}
                    style={{ width: 8, height: 8, padding: 0, borderRadius: '50%', marginRight: 8, display: 'inline-block' }}
                  />
                  {status}
                </span>
                <span className="kanban-column-count" style={{ fontSize: '11px' }}>{colTasks.length}</span>
              </div>
              
              <div
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(status)}
                onDragLeave={() => setActiveDragCol(null)}
                onDrop={(e) => handleDrop(e, status)}
                className={`kanban-column-body ${activeDragCol === status ? 'drag-hover' : ''}`}
                style={{
                  minHeight: '200px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      myRole={myRole}
                      isSelected={selectedTasks.includes(task._id)}
                      onToggleSelect={() => toggleSelect(task._id)}
                      onEdit={() => openEditModal(task)}
                      onDelete={handleDeleteTask}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggingTaskId === task._id}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        editingTask={editingTask}
        projectMembers={project?.members || []}
        submitting={submitting}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
      />

      {/* Add Member Modal */}
      <MemberModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        submitting={submitting}
        onSubmit={handleAddMember}
      />
    </div>
  );
};

export default ProjectDetailPage;
