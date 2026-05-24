import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProjects } from '../store/slices/projectSlice';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { FolderKanban, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { projects, loading } = useSelector((state) => state.projects);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const activeProjects = projects.filter(p => p.status === 'Active');

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

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban />
          <h3>No Projects Yet</h3>
          <p>Create your first project to get started.</p>
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>
            Create Project
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.slice(0, 6).map((project) => (
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
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
