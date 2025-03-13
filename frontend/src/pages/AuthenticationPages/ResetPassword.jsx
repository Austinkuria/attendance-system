import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Input, Button, Typography, Alert, Form, Progress } from "antd";
import { LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { ThemeContext } from "../../context/ThemeContext";

const { Title, Text } = Typography;

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.background};
  padding: 20px;
  box-sizing: border-box;
`;

const StyledCard = styled(Card)`
  max-width: 440px;
  margin: 20px;
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  background-color: ${props => props.theme.cardBg};
  border: 1px solid ${props => props.theme.border};
  
  .ant-card-body {
    padding: 40px;
    
    @media (max-width: 576px) {
      padding: 24px 16px;
    }
  }
`;

const PasswordStrength = styled.div`
  margin: -12px 0 16px;
`;

const StyledInput = styled(Input.Password)`
  font-size: 16px;
  background-color: ${props => props.theme.inputBg} !important;
  border-color: ${props => props.theme.inputBorder} !important;
  border-radius: 8px !important;

  .ant-input {
    background-color: ${props => props.theme.inputBg} !important;
    color: ${props => props.theme.text} !important;
  }
  
  &:hover, &:focus {
    border-color: ${props => props.theme.focus} !important;
    background-color: ${props => props.theme.inputHover} !important;
  }
  
  .ant-input::placeholder {
    color: ${props => props.isDarkMode
    ? 'rgba(255, 255, 255, 0.5)'
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
`;

const StyledButton = styled(Button)`
  background-color: ${props => props.type === 'primary' ? props.theme.primary : 'transparent'} !important;
  border-color: ${props => props.type === 'primary' ? props.theme.primary : 'transparent'} !important;
  color: ${props => props.type === 'primary' ? '#fff' : props.theme.primary} !important;
  border-radius: 8px !important;

  &:hover, &:focus {
    background-color: ${props => props.type === 'primary' ? props.theme.focus : 'transparent'} !important;
    border-color: ${props => props.type === 'primary' ? props.theme.focus : 'transparent'} !important;
    color: ${props => props.type === 'primary' ? '#fff' : props.theme.focus} !important;
  }
`;

const ResetPassword = () => {
  const { token } = useParams();
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);

  const calculateStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.match(/[A-Z]/)) score += 1;
    if (password.match(/[a-z]/)) score += 1;
    if (password.match(/[0-9]/)) score += 1;
    if (password.match(/[\W]/)) score += 1;
    return (score / 5) * 100;
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { password } = values;

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`,
        { token, newPassword: password }

      );

      setMessage({
        title: "Password Updated!",
        content: response.data.message || "Redirecting to login page..."
      });

      setTimeout(() => navigate("/auth/login"), 3000);
    } catch (err) {
      console.error("Password reset error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Invalid or expired reset token. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/auth/request-reset");
    }
  }, [token, navigate]);

  return (
    <PageContainer theme={themeColors}>
      <StyledCard theme={themeColors}>
        <StyledButton
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/auth/login")}
          style={{ marginBottom: 24 }}
          theme={themeColors}
        />

        <Title level={3} style={{ textAlign: "center", marginBottom: 8, color: themeColors.text }}>
          Create New Password
        </Title>
        <Text style={{ display: "block", textAlign: "center", marginBottom: 32, color: themeColors.placeholder }}>
          Your new password must be different from previous passwords
        </Text>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24, borderRadius: "8px" }}
          />
        )}

        {message && (
          <Alert
            message={
              <>
                <div style={{ fontWeight: 500 }}>{message.title}</div>
                <div>{message.content}</div>
              </>
            }
            type="success"
            showIcon
            style={{ marginBottom: 24, borderRadius: "8px" }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading}
        >
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 8, message: 'Password must be at least 8 characters' },
              { pattern: /[a-z]/, message: 'Requires at least one lowercase letter' },
              { pattern: /[0-9]/, message: 'Requires at least one number' }
            ]}
          >
            <StyledInput
              prefix={<LockOutlined />}
              placeholder="New password"
              size="large"
              autoFocus
              onChange={(e) => setStrength(calculateStrength(e.target.value))}
              theme={themeColors}
              isDarkMode={isDarkMode}
            />
          </Form.Item>

          <PasswordStrength>
            <Progress
              percent={strength}
              showInfo={false}
              strokeColor={
                strength < 40 ? themeColors.accent :
                  strength < 70 ? '#faad14' : themeColors.secondary
              }
              trailColor={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
            />
            <Text style={{ fontSize: 12, color: themeColors.placeholder }}>
              Password strength: {
                strength < 40 ? 'Weak' :
                  strength < 70 ? 'Medium' : 'Strong'
              }
            </Text>
          </PasswordStrength>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <StyledInput
              prefix={<LockOutlined />}
              placeholder="Confirm password"
              size="large"
              theme={themeColors}
              isDarkMode={isDarkMode}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <StyledButton
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              theme={themeColors}
            >
              Reset Password
            </StyledButton>
          </Form.Item>
        </Form>

        <div style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: '14px',
          color: themeColors.placeholder
        }}>
          Remember your password?{" "}
          <StyledButton
            type="link"
            onClick={() => navigate("/auth/login")}
            style={{ padding: 0 }}
            theme={themeColors}
          >
            Login here
          </StyledButton>
        </div>
      </StyledCard>

      <style>{`
        .ant-form-item-explain-error {
          color: ${themeColors.accent} !important;
        }
        .ant-alert-error {
          background-color: ${isDarkMode ? 'rgba(255, 77, 79, 0.2)' : '#fff2f0'} !important;
          border-color: ${isDarkMode ? 'rgba(255, 77, 79, 0.3)' : '#ffccc7'} !important;
        }
        .ant-alert-success {
          background-color: ${isDarkMode ? 'rgba(82, 196, 26, 0.2)' : '#f6ffed'} !important;
          border-color: ${isDarkMode ? 'rgba(82, 196, 26, 0.3)' : '#b7eb8f'} !important;
        }
        .ant-alert-message {
          color: ${themeColors.text} !important;
        }
      `}</style>
    </PageContainer>
  );
};

export default ResetPassword;