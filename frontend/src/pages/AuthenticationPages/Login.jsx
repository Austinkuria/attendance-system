import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Typography, Alert, Form, message, Checkbox } from 'antd';
import { LockOutlined, MailOutlined, ArrowRightOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import axios from 'axios';
import { ThemeContext } from '../../context/ThemeContext';
import { loginUser } from '../../services/api';

const { Title, Text } = Typography;

const PageContainer = styled.div`
  min-height: 100vh;
  height: 100vh; /* Force exact viewport height */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.background};
  overflow: hidden; /* Prevent both x and y overflow */
  padding: 0; /* Remove padding that could cause overflow */
  box-sizing: border-box;
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 520px;
  max-height: 95vh; /* Limit height to prevent overflow */
  overflow-y: auto; /* Allow scrolling inside the card if needed */
  margin: 0 auto; /* Remove vertical margin */
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  background-color: ${props => props.theme.cardBg};
  border: 1px solid ${props => props.theme.border};
  
  /* Add custom scrollbar for the card if content overflows */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.border};
    border-radius: 6px;
  }
  
  .ant-card-body {
    padding: 32px;
    
    @media (max-width: 768px) {
      padding: 24px 16px;
    }
  }
  
  @media (max-width: 576px) {
    max-width: 95%;
    border-radius: 12px;
  }
`;

const StyledInput = styled(Input)`
  font-size: 20px;
  padding: 12px;
  background-color: ${props => props.theme.inputBg} !important;
  border-color: ${props => props.theme.inputBorder} !important;
  border-radius: 8px !important;

  &:hover, &:focus {
    border-color: ${props => props.theme.focus} !important;
    background-color: ${props => props.theme.inputHover} !important;
  }

  .ant-input {
    background-color: ${props => props.theme.inputBg} !important;
    color: ${props => props.theme.text} !important;
    border-radius: 8px !important;
    padding: 2px 14px !important;
  }
  
  .ant-input::placeholder {
    color: ${props => props.isDarkMode
    ? 'rgba(255, 255, 255, 0.5)' // Less bright for dark mode
    : props.theme.placeholder} !important;
  }

  .ant-input-prefix {
    color: ${props => props.isDarkMode
    ? 'rgba(255, 255, 255, 0.5)'
    : props.theme.placeholder} !important;
    margin-right: 8px;
  }
  
  .ant-input-suffix .anticon {
    color: ${props => props.isDarkMode
    ? 'rgba(255, 255, 255, 0.5)'
    : props.theme.placeholder} !important;
  }
  
  @media (max-width: 576px) {
    font-size: 16px;
    padding: 10px;
  }
`;

const StyledPasswordInput = styled(Input.Password)`
  font-size: 20px;
  padding: 12px;
  background-color: ${props => props.theme.inputBg} !important;
  border-color: ${props => props.theme.inputBorder} !important;
  border-radius: 8px !important;

  &:hover, &:focus {
    border-color: ${props => props.theme.focus} !important;
    background-color: ${props => props.theme.inputHover} !important;
  }

  .ant-input {
    background-color: ${props => props.theme.inputBg} !important;
    color: ${props => props.theme.text} !important;
    border-radius: 8px !important;
    padding: 2px 14px !important;
  }
  
  .ant-input::placeholder {
    color: ${props => props.isDarkMode
    ? 'rgba(255, 255, 255, 0.5)' // Less bright for dark mode
    : props.theme.placeholder} !important;
  }

  .ant-input-prefix {
    color: ${props => props.isDarkMode
    ? 'rgba(255, 255, 255, 0.5)'
    : props.theme.placeholder} !important;
    margin-right: 8px;
  }
  
  .ant-input-suffix .anticon {
    color: ${props => props.isDarkMode
    ? 'rgba(255, 255, 255, 0.5)'
    : props.theme.placeholder} !important;
  }
  
  @media (max-width: 576px) {
    font-size: 16px;
    padding: 10px;
  }
`;

const StyledButton = styled(Button)`
  height: 48px;
  font-size: 20px;
  background-color: ${props => props.theme.primary} !important;
  border-color: ${props => props.theme.primary} !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  
  .ant-btn-icon-only {
    vertical-align: middle;
  }
  
  .anticon {
    display: inline-flex !important;
    vertical-align: middle !important;
    margin-right: 6px !important;
  }
  
  span {
    display: inline-flex !important;
    align-items: center !important;
  }

  &:hover, &:focus {
    background-color: ${props => props.theme.focus} !important;
    border-color: ${props => props.theme.focus} !important;
  }
  
  @media (max-width: 576px) {
    height: 40px;
    font-size: 16px;
  }
`;

const StyledLinkButton = styled(Button)`
  padding: 0;
  font-size: 18px;
  color: ${props => props.theme.primary} !important;

  &:hover, &:focus {
    color: ${props => props.theme.focus} !important;
  }
  
  @media (max-width: 576px) {
    font-size: 16px;
  }
`;

const ResponsiveText = styled(Text)`
  display: block;
  text-align: center;
  margin-bottom: 30px; /* Reduced margin */
  font-size: 22px;
  color: ${props => props.theme.placeholder};
  
  @media (max-width: 576px) {
    font-size: 18px;
    margin-bottom: 20px;
  }
`;

const ResponsiveTitle = styled(Title)`
  text-align: center;
  margin-bottom: 12px; /* Reduced margin */
  font-size: 28px !important; /* Slightly smaller */
  color: ${props => props.isDarkMode ? '#FFFFFF' : props.theme.text} !important;
  
  @media (max-width: 576px) {
    font-size: 22px !important;
    margin-bottom: 10px;
  }
`;

const FormItemStyled = styled(Form.Item)`
  .ant-form-item-control-input-content {
    &:hover {
      .ant-input-affix-wrapper, .ant-input {
        background-color: ${props => props.theme.inputHover} !important;
        border-color: ${props => props.theme.focus} !important;
      }
    }
  }
`;

const Login = () => {
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Check network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if the user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user && user.role) {
            // Redirect to appropriate dashboard based on role
            switch (user.role) {
              case 'student': navigate('/student-dashboard'); break;
              case 'lecturer': navigate('/lecturer-dashboard'); break;
              case 'admin': navigate('/admin'); break;
              default: // Do nothing, stay on login page
            }
          }
        } catch (e) {
          // If parsing fails, clear localStorage
          console.error("Error parsing user data:", e);
          localStorage.clear();
        }
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [navigate]);

  const handleLogin = async (values) => {
    if (!navigator.onLine) {
      setError('You are currently offline. Please check your internet connection and try again.');
      return;
    }

    const { email, password, remember } = values;
    setLoading(true);
    setError(null);

    try {
      // Use our new login function with rememberMe flag
      const response = await loginUser({
        email,
        password,
        rememberMe: remember // Pass remember me flag to control token storage
      });

      // Check if password change is required
      if (response.requiresPasswordChange) {
        message.warning(response.message);

        // Store temp token and redirect to change password
        localStorage.setItem('tempToken', response.tempToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/auth/change-password', {
          state: { isForced: true }
        });
        return;
      }

      // Store email in localStorage if remember is checked
      if (remember) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Show success message
      message.success('Login successful! Redirecting...');

      // Redirect based on role
      const { role } = response.user;
      switch (role) {
        case 'super_admin':
          navigate('/super-admin');
          break;
        case 'department_admin':
          navigate('/department-admin');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'lecturer':
          navigate('/lecturer-dashboard');
          break;
        case 'student':
          navigate('/student-dashboard');
          break;
        default:
          console.warn('Unknown role:', role);
          navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);

      // Handle specific error codes
      if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setError(error.response.data.message);
        setUnverifiedEmail(form.getFieldValue('email'));
      } else if (error.response?.status === 423) {
        setError(error.response.data.message);
      } else if (error.response?.status === 401) {
        const attemptsRemaining = error.response.data.attemptsRemaining;
        if (attemptsRemaining !== undefined) {
          setError(`Invalid credentials. ${attemptsRemaining} attempts remaining.`);
        } else {
          setError('Invalid email or password');
        }
      } else {
        setError(error.message || 'Failed to login. Please try again later.');
      }

      // If it looks like a CORS error
      if (error.originalError && error.originalError.message?.includes('Network Error')) {
        setError('Cannot connect to the server. This might be due to network issues or CORS restrictions.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    try {
      setLoading(true);
      const response = await axios.post(
        'https://attendance-system-w70n.onrender.com/api/auth/resend-verification',
        { email: unverifiedEmail }
      );

      if (response.data.success) {
        message.success('Verification email sent! Please check your inbox.');
        setError(null);
        setUnverifiedEmail(null);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill email if remembered
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      form.setFieldsValue({ email: rememberedEmail });
    }
  }, [form]);

  return (
    <PageContainer theme={themeColors}>
      <StyledCard theme={themeColors}>
        <ResponsiveTitle level={2} theme={themeColors} isDarkMode={isDarkMode}>
          Welcome Back!
        </ResponsiveTitle>
        <ResponsiveText theme={themeColors}>
          Login to access your account
        </ResponsiveText>

        {!networkStatus && (
          <Alert
            message="You are offline"
            description="Please check your internet connection to log in."
            type="warning"
            showIcon
            style={{
              marginBottom: 24,
              fontSize: '16px',
              borderRadius: '8px'
            }}
          />
        )}

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{
              marginBottom: 24,
              fontSize: '16px',
              borderRadius: '8px'
            }}
            action={
              unverifiedEmail && (
                <Button
                  size="small"
                  type="primary"
                  onClick={handleResendVerification}
                  loading={loading}
                >
                  Resend Email
                </Button>
              )
            }
          />
        )}

        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={handleLogin}
          disabled={loading || !networkStatus}
          style={{ color: themeColors.text }}
        >
          <FormItemStyled
            name="email"
            rules={[
              { required: true, message: 'Please enter your email!' },
              {
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Enter a valid email format (e.g., user@example.com)!'
              }
            ]}
            style={{ marginBottom: 20 }}
            theme={themeColors}
          >
            <StyledInput
              prefix={<MailOutlined style={{ fontSize: '20px' }} />}
              placeholder="Email address"
              size="large"
              autoFocus
              theme={themeColors}
              isDarkMode={isDarkMode}
            />
          </FormItemStyled>

          <FormItemStyled
            name="password"
            rules={[
              { required: true, message: 'Please enter your password!' },
              { min: 8, message: 'Password must be at least 8 characters long!' },
              { pattern: /[a-z]/, message: 'Password must contain at least one lowercase letter!' },
              { pattern: /[0-9]/, message: 'Password must contain at least one number!' }
            ]}
            style={{ marginBottom: 24 }}
            theme={themeColors}
          >
            <StyledPasswordInput
              prefix={<LockOutlined style={{ fontSize: '20px' }} />}
              placeholder="Password"
              size="large"
              theme={themeColors}
              isDarkMode={isDarkMode}
            />
          </FormItemStyled>

          <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 16 }}>
            <Checkbox style={{ color: themeColors.text }}>Remember me</Checkbox>
          </Form.Item>

          <Form.Item style={{ marginTop: 16 }}>
            <StyledButton
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              disabled={!networkStatus}
              theme={themeColors}
              icon={loading ? <LoadingOutlined /> : <ArrowRightOutlined style={{ fontSize: '20px' }} />}
            >
              {loading ? 'Logging in...' : 'Login'}
            </StyledButton>
          </Form.Item>
        </Form>

        <div style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: '18px',
          color: themeColors.placeholder
        }}>
          Don&apos;t have an account?{' '}
          <StyledLinkButton
            type="link"
            onClick={() => navigate('/auth/signup')}
            theme={themeColors}
          >
            Sign up here
          </StyledLinkButton>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 16,
          fontSize: '18px',
          color: themeColors.placeholder
        }}>
          <StyledLinkButton
            type="link"
            onClick={() => navigate('/auth/reset-password')}
            theme={themeColors}
          >
            Forgot your password?
          </StyledLinkButton>
        </div>
      </StyledCard>
    </PageContainer>
  );
};

export default Login;