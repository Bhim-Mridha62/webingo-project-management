import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyEmailPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const addToast = useToast();
    const [verifyStatus, setVerifyStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await api.get(`/auth/verify-email/${token}`);
                setVerifyStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
                addToast('Email verified! You can now log in.', 'success');

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setVerifyStatus('error');
                setMessage(error.response?.data?.message || 'Failed to verify email. The link may have expired.');
                addToast('Email verification failed', 'error');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token, navigate, addToast]);

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    {verifyStatus === 'loading' && (
                        <>
                            <Loader size={48} style={{ color: 'var(--primary)', marginBottom: 16, animation: 'spin 1s linear infinite' }} />
                            <h1>Verifying Email</h1>
                            <p>Please wait while we verify your email address...</p>
                        </>
                    )}

                    {verifyStatus === 'success' && (
                        <>
                            <CheckCircle size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                            <h1>Email Verified!</h1>
                            <p>Your email has been successfully verified</p>
                        </>
                    )}

                    {verifyStatus === 'error' && (
                        <>
                            <XCircle size={48} style={{ color: '#ef4444', marginBottom: 16 }} />
                            <h1>Verification Failed</h1>
                            <p>We couldn't verify your email</p>
                        </>
                    )}
                </div>

                <div style={{
                    backgroundColor: verifyStatus === 'success' ? 'rgba(16, 185, 129, 0.1)' : verifyStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(108, 99, 255, 0.1)',
                    border: `1px solid ${verifyStatus === 'success' ? '#10b981' : verifyStatus === 'error' ? '#ef4444' : 'var(--primary)'}`,
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 24,
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {message}
                    </p>
                </div>

                {verifyStatus === 'success' && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                            Redirecting to login in a few seconds...
                        </p>
                        <Link
                            to="/login"
                            style={{
                                color: 'var(--primary)',
                                textDecoration: 'none',
                                fontWeight: 600
                            }}
                        >
                            Go to Login Now
                        </Link>
                    </div>
                )}

                {verifyStatus === 'error' && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                            Your verification link may have expired. Please request a new one.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <Link
                                to="/register"
                                style={{
                                    color: 'var(--primary)',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    padding: '10px 20px',
                                    border: '1px solid var(--primary)',
                                    borderRadius: 6,
                                    display: 'inline-block'
                                }}
                            >
                                Register Again
                            </Link>
                            <Link
                                to="/login"
                                style={{
                                    color: 'var(--primary)',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    padding: '10px 20px',
                                    border: '1px solid var(--primary)',
                                    borderRadius: 6,
                                    display: 'inline-block'
                                }}
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default VerifyEmailPage;
