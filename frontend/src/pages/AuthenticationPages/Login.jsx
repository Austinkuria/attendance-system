import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Card, Input, Button, Typography, Alert, Form } from 'antd';
import { LockOutlined, MailOutlined, ArrowRightOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ThemeContext } from '../../context/ThemeContext';

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
  color: ${props => props.theme.text} !important;
  border-radius: 8px !important;

  &:hover, &:focus {
    border-color: ${props => props.theme.focus} !important;
    background-color: ${props => props.theme.inputHover} !important;
  }

  &::placeholder {
    color: ${props => props.isDarkMode
    ? 'rgba(255, 255, 255, 0.5)' // Less bright for dark mode
    : props.theme.placeholder} !important;
  }

  .ant-input {
    background-color: ${props => props.theme.inputBg} !important;
    color: ${props => props.theme.text} !important;
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
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    const { email, password } = values;

    setLoading(true);
    setError(null);

    try {
      // Create a cancellable request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

      const response = await axios.post(
        'https://attendance-system-w70n.onrender.com/api/auth/login',
        { email, password },
        {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      clearTimeout(timeoutId);

      // Store token and user data efficiently
      const { token } = response.data;  // Removed unused 'user' variable

      // Store essential data only
      localStorage.setItem('token', token);

      // Pre-decode token to avoid duplicate work across components
      const decodedToken = jwtDecode(token);
      const role = decodedToken.role;
      const userId = decodedToken.userId;

      // Store minimal user data
      const userData = JSON.stringify({
        id: userId,
        role: role,
        lastLogin: new Date().toISOString()
      });

      localStorage.setItem('userData', userData);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);

      // Redirect based on role
      switch (role) {
        case 'student':
          navigate('/student-dashboard');
          break;
        case 'lecturer':
          navigate('/lecturer-dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/'); // Fallback
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setError('Login request timed out. Please check your internet connection and try again.');
      } else {
        console.error("Login error:", error.response ? error.response.data : error.message);
        setError(error.response?.data?.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer theme={themeColors}>
      <StyledCard theme={themeColors}>
        <ResponsiveTitle level={2} theme={themeColors} isDarkMode={isDarkMode}>
          Welcome Back!
        </ResponsiveTitle>
        <ResponsiveText theme={themeColors}>
          Login to access your account
        </ResponsiveText>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{
              marginBottom: 24, /* Reduced margin */
              fontSize: '16px',
              borderRadius: '8px'
            }}
          />
        )}

        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={handleLogin}
          disabled={loading}
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
            style={{ marginBottom: 20 }} /* Reduced margin */
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
            style={{ marginBottom: 24 }} /* Reduced margin */
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

          <Form.Item style={{ marginTop: 16 }}> {/* Reduced margin */}
            <StyledButton
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              theme={themeColors}
            >
              <ArrowRightOutlined style={{ fontSize: '20px' }} /> Login
            </StyledButton>
          </Form.Item>
        </Form>

        <div style={{
          textAlign: 'center',
          marginTop: 24, /* Reduced margin */
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
          marginTop: 16, /* Reduced margin */
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