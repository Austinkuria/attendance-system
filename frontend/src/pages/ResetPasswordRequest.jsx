import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Input, Button, Typography, Alert, Form, theme } from "antd";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
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

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const SuccessMessage = styled.div`
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
`;

const ResetPasswordRequest = () => {
  const [email, setEmail] = useState("");
  const { token } = useToken();
  const [form] = Form.useForm();
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    const newEmail = e.target.value.trim();
    setEmail(newEmail);

    if (!newEmail) {
      setError("Email field cannot be empty.");
    } else if (!emailRegex.test(newEmail)) {
      setError("Invalid email format (e.g. example@domain.com).");
    } else {
      setError(null);
    }
  };
  const handleResetRequest = async () => {
    if (error || !email) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        {email}
      );

      setMessage({
        title: "Reset email sent!",
        content: response.data.message || "Check your email for further instructions"
      });
      form.resetFields();
    } catch (err) {
      console.error("Reset request error:", err);
      setError(err.response?.data?.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return (
    <div style={{ 
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      background: token.colorBgContainer 
    }}>
      <StyledCard>
        <FormHeader>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate("/auth/login")}
            style={{ float: "left" }}
          />
          <Title level={3} style={{ margin: "16px 0 8px" }}>
            Reset Password
          </Title>
          <Text type="secondary">
            Enter your email to receive a password reset link
          </Text>
        </FormHeader>

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
          <SuccessMessage>
            <Alert 
              message={
                <>
                  <div style={{ fontWeight: 500 }}>{message.title}</div>
                  <div>{message.content}</div>
                </>
              }
              type="success" 
              showIcon
            />
          </SuccessMessage>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleResetRequest}
          disabled={loading}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              // { type: "email", message: "Please enter a valid email address" }
              { pattern: emailRegex, message: "Please enter a valid email address (e.g. example@domain.com)." }
            ]}
            validateTrigger="onBlur"
            value={email}
              onChange={handleEmailChange}
          >
            <Input
              prefix={<MailOutlined style={{ color: token.colorTextSecondary }} />}
              placeholder="Email address"
              size="large"
              autoFocus
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
              Send Reset Link
            </Button>
          </Form.Item>

          <div style={{ 
            textAlign: "center", 
            marginTop: 24,
            fontSize: token.fontSizeSM,
            color: token.colorTextSecondary
          }}>
            Remember your password?{" "}
            <Button 
              type="link" 
              onClick={() => navigate("/auth/login")}
              style={{ padding: 0 }}
            >
              Log in here
            </Button>
          </div>
        </Form>

        <Text 
          type="secondary" 
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 24,
            fontSize: token.fontSizeSM
          }}
        >
          Can&apos;t find the email? Check your spam folder or contact support
        </Text>
      </StyledCard>
    </div>
  );
};

export default ResetPasswordRequest;