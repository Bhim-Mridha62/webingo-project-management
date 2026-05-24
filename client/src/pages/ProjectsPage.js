import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProjects } from '../store/slices/projectSlice';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import api from '../services/api';
import { 
  Plus, FolderKanban, Search, MoreVertical, Archive, Trash2 
} from 'lucide-react';
import { useForm } from 'react-hook-form';

const ProjectsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const addToast = useToast();
  const { projects, loading } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [activeTab, setActiveTab] = useState('Active');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleCreate = async (data) => {
    setCreating(true);
    try {
      await api.post('/projects', data);
      addToast('Project created!', 'success');
      setShowCreateModal(false);
      reset();
      dispatch(fetchProjects());
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleArchive = async (e, project) => {
    e.stopPropagation();
    setActiveDropdownId(null);
    const newStatus = project.status === 'Archived' ? 'Active' : 'Archived';
    try {
      await api.put(`/projects/${project._id}`, { status: newStatus });
      addToast(project.status === 'Archived' ? 'Project restored successfully' : 'Project archived successfully', 'success');
      dispatch(fetchProjects());
    } catch (err) {
      addToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleDeleteProject = async (e, projectId, name) => {
    e.stopPropagation();
    setActiveDropdownId(null);
    if (!window.confirm(`Are you sure you want to permanently delete project "${name}"? This will also delete all tasks.`)) return;
    try {
      await api.delete(`/projects/${projectId}`);
      addToast('Project deleted successfully', 'success');
      dispatch(fetchProjects());
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete project', 'error');
    }
  };

  const activeProjects = projects.filter(p => p.status === 'Active');
  const archivedProjects = projects.filter(p => p.status === 'Archived');
  const baseProjects = activeTab === 'Active' ? activeProjects : archivedProjects;

  const filtered = baseProjects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Manage all your projects in one place</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="filters-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="filter-input"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'Active' ? 'active' : ''}`}
          onClick={() => setActiveTab('Active')}
        >
          Active ({activeProjects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'Archived' ? 'active' : ''}`}
          onClick={() => setActiveTab('Archived')}
        >
          Archived ({archivedProjects.length})
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FolderKanban />
          <h3>{search ? 'No Projects Found' : activeTab === 'Active' ? 'No Active Projects' : 'No Archived Projects'}</h3>
          <p>{search ? 'Try a different search term.' : activeTab === 'Active' ? 'Create your first project to get started.' : 'No archived projects found.'}</p>
          {!search && activeTab === 'Active' && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map((project) => {
            const isAdmin = project.members?.some(m => (m.user?._id || m.user) === user?._id && m.role === 'Admin');
            return (
              <div
                key={project._id}
                className="project-card"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                {/* 3 dot actions */}
                {isAdmin && (
                  <div className="project-actions-dropdown">
                    <button 
                      className="btn btn-icon btn-ghost btn-sm" 
                      style={{ borderRadius: '50%', padding: 6, border: 'none', background: 'transparent' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(activeDropdownId === project._id ? null : project._id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeDropdownId === project._id && (
                      <div className="dropdown-menu">
                        <button
                          className="dropdown-item"
                          onClick={(e) => handleToggleArchive(e, project)}
                        >
                          <Archive size={14} />
                          {project.status === 'Archived' ? 'Restore' : 'Archive'}
                        </button>
                        <button
                          className="dropdown-item dropdown-item-danger"
                          onClick={(e) => handleDeleteProject(e, project._id, project.name)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="project-card-header" style={{ paddingRight: isAdmin ? 28 : 0 }}>
                  <div className="project-card-title">{project.name}</div>
                  <span className={`badge ${project.status === 'Active' ? 'badge-completed' : 'badge-todo'}`}>
                    {project.status}
                  </span>
                </div>
                <div className="project-card-desc">
                  {project.description || 'No description provided.'}
                </div>
                <div className="project-card-footer">
                  <div className="project-card-members">
                    {project.members?.slice(0, 4).map((m, i) => (
                      <div key={i} className="project-card-member">
                        {m.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    ))}
                    {project.members?.length > 4 && (
                      <div className="project-card-member">+{project.members.length - 4}</div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {project.members?.length || 0} members
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); reset(); }}
        title="Create New Project"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); reset(); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit(handleCreate)} disabled={creating}>
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit(handleCreate)}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input className="form-input" placeholder="e.g. E-Commerce Redesign" {...register('name', { required: 'Name is required' })} />
            {errors.name && <div className="form-error">{errors.name.message}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" placeholder="What is this project about?" {...register('description')} />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
