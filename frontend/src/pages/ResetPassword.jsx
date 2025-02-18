import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Input, Button, Typography, Alert, Form, Progress, theme } from "antd";
import { LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import styled from "styled-components";

const { Title, Text } = Typography;
const { useToken } = theme;

const StyledCard = styled(Card)`
  max-width: 440px;
  margin: 40px auto;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  
  .ant-card-body {
    padding: 40px;
  }
`;

const PasswordStrength = styled.div`
  margin: -12px 0 16px;
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

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`,
        { password: values.password },
        { withCredentials: true }

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
    <div style={{ 
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      background: themeToken.colorBgContainer 
    }}>
      <StyledCard>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate("/auth/login")}
          style={{ marginBottom: 24 }}
        />

        <Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
          Create New Password
        </Title>
        <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: 32 }}>
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
              // { pattern: /[A-Z]/, message: 'Requires at least one uppercase letter' },
              { pattern: /[a-z]/, message: 'Requires at least one lowercase letter' },
              { pattern: /[0-9]/, message: 'Requires at least one number' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: themeToken.colorTextSecondary }} />}
              placeholder="New password"
              size="large"
              autoFocus
              onChange={(e) => setStrength(calculateStrength(e.target.value))}
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
            <Text type="secondary" style={{ fontSize: 12 }}>
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
              prefix={<LockOutlined style={{ color: themeToken.colorTextSecondary }} />}
              placeholder="Confirm password"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          textAlign: "center", 
          marginTop: 24,
          fontSize: themeToken.fontSizeSM,
          color: themeToken.colorTextSecondary
        }}>
          Remember your password?{" "}
          <Button 
            type="link" 
            onClick={() => navigate("/auth/login")}
            style={{ padding: 0 }}
          >
            Login here
          </Button>
        </div>
      </StyledCard>
    </div>
  );
};

export default ResetPassword;