import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { Mail, ArrowRight } from 'lucide-react';

const VerifyEmailPendingPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const addToast = useToast();

    const email = sessionStorage.getItem('verificationEmail') || sessionStorage.getItem('unverifiedEmail') || '';

    const handleResendEmail = async () => {
        if (!email) {
            addToast('Email not found. Please register again.', 'error');
            navigate('/register');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/resend-verification', { email });
            addToast('Verification email sent! Check your inbox.', 'success');
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to resend email', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Mail size={48} style={{ color: 'var(--primary)', marginBottom: 16 }} />
                    <h1>Verify Your Email</h1>
                    <p>We've sent a verification link to your email</p>
                </div>

                <div style={{
                    backgroundColor: 'rgba(108, 99, 255, 0.1)',
                    border: '1px solid var(--primary)',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 24,
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                        {email}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Click the link in the email to verify your account. The link expires in 1 minute.
                    </p>
                </div>

                <button
                    onClick={handleResendEmail}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px 24px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    {loading ? 'Resending...' : 'Resend Verification Email'}
                </button>

                <div style={{
                    textAlign: 'center',
                    marginTop: 20,
                    paddingTop: 20,
                    borderTop: '1px solid var(--border-color)'
                }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                        Already verified your email?
                    </p>
                    <Link
                        to="/login"
                        style={{
                            color: 'var(--primary)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        Go to Login <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPendingPage;
