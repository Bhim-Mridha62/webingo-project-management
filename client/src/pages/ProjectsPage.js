import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProjects } from '../store/slices/projectSlice';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import api from '../services/api';
import { Plus, FolderKanban, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';

const ProjectsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const addToast = useToast();
  const { projects, loading } = useSelector((state) => state.projects);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

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

  const filtered = projects.filter(p =>
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

      <div className="filters-bar">
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

      {loading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FolderKanban />
          <h3>{search ? 'No Projects Found' : 'No Projects Yet'}</h3>
          <p>{search ? 'Try a different search term.' : 'Create your first project to get started.'}</p>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map((project) => (
            <div
              key={project._id}
              className="project-card"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              <div className="project-card-header">
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
          ))}
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
