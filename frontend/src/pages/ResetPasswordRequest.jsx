import { useState } from "react";
import axios from "axios";
import { Card, Input, Button, Typography, Alert, Form } from "antd";
import { MailOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ResetPasswordRequest = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async () => {
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        { email }
      );

      setMessage(response.data.message || "Reset link sent successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <Card
        className="reset-password-card"
        bordered={false}
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <Title level={2} style={{ textAlign: "center" }}>Reset Password</Title>
        <Text>Enter your email, and we&apos;ll send you a reset link.</Text>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: "15px" }}
          />
        )}
        {message && (
          <Alert
            message={message}
            type="success"
            showIcon
            style={{ marginBottom: "15px" }}
          />
        )}

        <Form layout="vertical">
          <Form.Item>
            <Input
              prefix={<MailOutlined />}
              type="email"
              placeholder="Enter your email"
              size="large"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleResetRequest}
              loading={loading}
            >
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordRequest;
