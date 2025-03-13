import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Input, Button, Typography, Alert, Form, Progress, theme } from "antd";
import { LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { ThemeContext } from "../../context/ThemeContext";

const { Title, Text } = Typography;
const { useToken } = theme;

const StyledCard = styled(Card)`
  max-width: 440px;
  width: 90%;
  margin: 40px auto;
  border-radius: 16px;
  
  .ant-card-body {
    padding: 40px;
  }
  
  @media (max-width: 576px) {
    width: 95%;
    margin: 20px auto;
    
    .ant-card-body {
      padding: 24px;
    }
  }
  
  @media (max-width: 375px) {
    width: 100%;
    margin: 10px auto;
    
    .ant-card-body {
      padding: 16px;
    }
  }
`;

const PasswordStrength = styled.div`
  margin: -12px 0 16px;
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: ${props => props.isDarkMode ?
    props.theme.dark.backgroundColor :
    props.theme.light.backgroundColor} !important;
  transition: background-color 0.3s ease;
`;

const ResetPassword = () => {
  const { token } = useParams();
  const { token: themeToken } = useToken();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);
  const { isDarkMode, theme } = useContext(ThemeContext);

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
    <Container
      isDarkMode={isDarkMode}
      theme={theme}
    >
      <StyledCard
        style={{
          background: `${isDarkMode ? theme.dark.componentBackground : theme.light.componentBackground} !important`,
          boxShadow: `${isDarkMode ?
            '0 8px 24px rgba(0, 0, 0, 0.3)' :
            '0 8px 24px rgba(0, 0, 0, 0.1)'} !important`
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/auth/login")}
          style={{
            marginBottom: 24,
            color: `${isDarkMode ? theme.dark.textPrimary : theme.light.textPrimary} !important`
          }}
        />

        <Title
          level={3}
          style={{
            textAlign: "center",
            marginBottom: 8,
            color: `${isDarkMode ? theme.dark.headingColor : theme.light.headingColor} !important`
          }}
        >
          Create New Password
        </Title>
        <Text
          style={{
            display: "block",
            textAlign: "center",
            marginBottom: 32,
            color: `${isDarkMode ? theme.dark.textSecondary : theme.light.textSecondary} !important`
          }}
        >
          Your new password must be different from previous passwords
        </Text>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24 }}
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
            style={{ marginBottom: 24 }}
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
            <Input.Password
              prefix={<LockOutlined style={{
                color: `${isDarkMode ? theme.dark.textSecondary : theme.light.textSecondary} !important`
              }} />}
              placeholder="New password"
              size="large"
              autoFocus
              onChange={(e) => setStrength(calculateStrength(e.target.value))}
              style={{
                background: `${isDarkMode ? theme.dark.inputBackground : theme.light.inputBackground} !important`,
                color: `${isDarkMode ? theme.dark.textPrimary : theme.light.textPrimary} !important`
              }}
            />
          </Form.Item>

          <PasswordStrength>
            <Progress
              percent={strength}
              showInfo={false}
              strokeColor={
                strength < 40 ? '#ff4d4f' :
                  strength < 70 ? '#faad14' : '#52c41a'
              }
            />
            <Text style={{
              fontSize: 12,
              color: `${isDarkMode ? theme.dark.textSecondary : theme.light.textSecondary} !important`
            }}>
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
            <Input.Password
              prefix={<LockOutlined style={{
                color: `${isDarkMode ? theme.dark.textSecondary : theme.light.textSecondary} !important`
              }} />}
              placeholder="Confirm password"
              size="large"
              style={{
                background: `${isDarkMode ? theme.dark.inputBackground : theme.light.inputBackground} !important`,
                color: `${isDarkMode ? theme.dark.textPrimary : theme.light.textPrimary} !important`
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              size={window.innerWidth < 400 ? "middle" : "large"}
              block
              loading={loading}
              style={{
                background: `${isDarkMode ? theme.dark.primaryColor : theme.light.primaryColor} !important`,
                borderColor: `${isDarkMode ? theme.dark.primaryColor : theme.light.primaryColor} !important`
              }}
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>

        <div style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: themeToken.fontSizeSM,
          color: `${isDarkMode ? theme.dark.textSecondary : theme.light.textSecondary} !important`
        }}>
          Remember your password?{" "}
          <Button
            type="link"
            onClick={() => navigate("/auth/login")}
            style={{
              padding: 0,
              color: `${isDarkMode ? theme.dark.linkColor : theme.light.linkColor} !important`
            }}
          >
            Login here
          </Button>
        </div>
      </StyledCard>
    </Container>
  );
};

export default ResetPassword;