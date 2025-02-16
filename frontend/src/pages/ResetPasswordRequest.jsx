import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Input, Button, Typography, Alert, Form } from "antd";
import { MailOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ResetPasswordRequest = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
        { email }
      );

      setMessage(response.data.message || "Check your email for the reset link.");
      setEmail("");
    } catch (err) {
      console.error("Error sending reset link:", err);
      setError(err.response?.data?.message || "Failed to send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container" style={{ padding: "20px" }}>
      <Card
        className="reset-password-card"
        bordered={false}
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center"
        }}
      >
        <Title level={2} style={{ marginBottom: "10px" }}>Reset Your Password</Title>
        <Text>Enter your email to receive a password reset link.</Text>

        {error && <Alert message={error} type="error" showIcon style={{ margin: "15px 0" }} />}
        {message && <Alert message={message} type="success" showIcon style={{ margin: "15px 0" }} />}

        <Form layout="vertical">
          <Form.Item validateStatus={error ? "error" : ""} help={error}>
            <Input
              prefix={<MailOutlined />}
              type="email"
              placeholder="Enter your email"
              size="large"
              value={email}
              onChange={handleEmailChange}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleResetRequest}
              loading={loading}
              disabled={!!error || !email}
            >
              Send Reset Link
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              type="default"
              size="large"
              block
              onClick={() => navigate("/auth/login")}
            >
              Back to Login
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
          If you don’t receive an email, check your spam folder.
        </Text>
      </Card>
    </div>
  );
};

export default ResetPasswordRequest;
