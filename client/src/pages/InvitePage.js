import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const addToast = useToast();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    const acceptInvite = async () => {
      const userToken = localStorage.getItem('token');
      if (!userToken) {
        // Save invite token and redirect to login
        localStorage.setItem('pendingInvite', token);
        addToast('Please log in to accept the invitation', 'info');
        navigate('/login');
        return;
      }

      try {
        const { data } = await api.get(`/projects/invite/${token}`);
        setStatus('success');
        setMessage(data.message);
        setProjectId(data.projectId);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Failed to accept invitation');
      }
    };
    acceptInvite();
  }, [token, navigate, addToast]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <Loader size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Accepting Invitation...</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Please wait a moment</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,200,151,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={32} style={{ color: 'var(--accent-success)' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Invitation Accepted!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{message}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(projectId ? `/projects/${projectId}` : '/projects')}
            >
              Go to Project
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(233,69,96,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <XCircle size={32} style={{ color: 'var(--accent-secondary)' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Invitation Failed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{message}</p>
            <button className="btn btn-ghost" onClick={() => navigate('/login')}>Back to Login</button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default InvitePage;
