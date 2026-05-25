import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProjects } from '../store/slices/projectSlice';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';
import api from '../services/api';
import {
  FolderKanban, CheckCircle, Clock, AlertTriangle, TrendingUp,
  MoreVertical, Archive, Trash2
} from 'lucide-react';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const addToast = useToast();
  const { user } = useSelector((state) => state.auth);
  const { projects, loading } = useSelector((state) => state.projects);

  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [activeTab, setActiveTab] = useState('Active');

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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
  const displayedProjects = activeTab === 'Active' ? activeProjects : archivedProjects;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name || 'User'}! Here's your overview.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="stats" />
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple"><FolderKanban /></div>
            <div>
              <div className="stat-value">{projects.length}</div>
              <div className="stat-label">Total Projects</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle /></div>
            <div>
              <div className="stat-value">{activeProjects.length}</div>
              <div className="stat-label">Active Projects</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Clock /></div>
            <div>
              <div className="stat-value">{projects.length - activeProjects.length}</div>
              <div className="stat-label">Archived</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><TrendingUp /></div>
            <div>
              <div className="stat-value">
                {projects.reduce((acc, p) => acc + (p.members?.length || 0), 0)}
              </div>
              <div className="stat-label">Team Members</div>
            </div>
          </div>
        </div>
      )}

      <div className="page-header" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Recent Projects</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
          View All
        </button>
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
        <LoadingSkeleton type="card" count={3} />
      ) : displayedProjects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban />
          <h3>{activeTab === 'Active' ? 'No Active Projects' : 'No Archived Projects'}</h3>
          <p>{activeTab === 'Active' ? 'Create a project or restore an archived one to get started.' : 'Archive projects you are done with to keep things organized.'}</p>
          {activeTab === 'Active' && (
            <button className="btn btn-primary" onClick={() => navigate('/projects')}>
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="project-grid">
          {displayedProjects.slice(0, 6).map((project) => {
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
                        {m.user?.profilePicture ? (
                          <img
                            src={m.user.profilePicture}
                            alt={m.user.name || 'Member'}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          m.user?.name?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                    ))}
                    {project.members?.length > 4 && (
                      <div className="project-card-member">+{project.members.length - 4}</div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
