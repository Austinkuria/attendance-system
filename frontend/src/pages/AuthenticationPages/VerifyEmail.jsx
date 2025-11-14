import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Result, Button, Spin, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://attendance-system-w70n.onrender.com/api';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null); // 'success', 'error', 'already-verified'
    const [errorMessage, setErrorMessage] = useState('');
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setErrorMessage('Invalid verification link');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);

                if (response.data.success) {
                    if (response.data.alreadyVerified) {
                        setStatus('already-verified');
                    } else {
                        setStatus('success');
                        setUserData(response.data.user);
                    }

                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/auth/login', {
                            state: {
                                message: 'Email verified successfully! Please login to continue.',
                                verified: true
                            }
                        });
                    }, 3000);
                }
            } catch (error) {
                console.error('Email verification error:', error);
                setStatus('error');

                if (error.response?.data?.code === 'INVALID_TOKEN') {
                    setErrorMessage('This verification link is invalid or has expired.');
                } else {
                    setErrorMessage(error.response?.data?.message || 'Failed to verify email. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [token, navigate]);

    const handleResendEmail = async () => {
        if (!userData?.email) {
            message.error('Unable to resend verification email');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`${API_URL}/auth/resend-verification`, {
                email: userData.email
            });

            if (response.data.success) {
                message.success('Verification email sent! Please check your inbox.');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            message.error(error.response?.data?.message || 'Failed to resend verification email');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Card style={{ maxWidth: 500, textAlign: 'center', padding: '40px' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                    <h2 style={{ marginTop: 20 }}>Verifying your email...</h2>
                    <p>Please wait while we verify your email address.</p>
                </Card>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <Card style={{ maxWidth: 600, width: '100%' }}>
                {status === 'success' && (
                    <Result
                        status="success"
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title="Email Verified Successfully!"
                        subTitle={`Welcome, ${userData?.firstName || 'User'}! Your email has been verified. Redirecting you to login...`}
                        extra={[
                            <Button type="primary" key="login" onClick={() => navigate('/auth/login')}>
                                Go to Login
                            </Button>,
                            <Link to="/" key="home">
                                <Button>Back to Home</Button>
                            </Link>
                        ]}
                    />
                )}

                {status === 'already-verified' && (
                    <Result
                        status="info"
                        title="Email Already Verified"
                        subTitle="Your email has already been verified. You can log in to your account."
                        extra={[
                            <Button type="primary" key="login" onClick={() => navigate('/auth/login')}>
                                Go to Login
                            </Button>,
                            <Link to="/" key="home">
                                <Button>Back to Home</Button>
                            </Link>
                        ]}
                    />
                )}

                {status === 'error' && (
                    <Result
                        status="error"
                        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        title="Verification Failed"
                        subTitle={errorMessage}
                        extra={[
                            userData?.email && (
                                <Button
                                    type="primary"
                                    key="resend"
                                    onClick={handleResendEmail}
                                    loading={loading}
                                >
                                    Resend Verification Email
                                </Button>
                            ),
                            <Button key="login" onClick={() => navigate('/auth/login')}>
                                Go to Login
                            </Button>,
                            <Link to="/" key="home">
                                <Button>Back to Home</Button>
                            </Link>
                        ].filter(Boolean)}
                    />
                )}
            </Card>
        </div>
    );
};

export default VerifyEmail;
