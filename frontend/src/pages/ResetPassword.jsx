import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Input, Button, Typography, Alert, Form } from "antd";
import { LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  //  Password strength validation
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validatePassword = () => {
    if (!password) return "Password cannot be empty.";
    if (!passwordRegex.test(password)) {
      return "Password must be at least 8 characters, with a mix of letters, numbers, and symbols.";
    }
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleResetPassword = async () => {
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        { token, newPassword: password }
      );

      setMessage(response.data.message || "Password reset successfully! Redirecting...");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => navigate("/auth/login"), 3000);
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.response?.data?.message || "Invalid or expired reset token. Try again.");
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
          padding: "20px"
        }}
      >
        <Title level={2} style={{ textAlign: "center" }}>Set New Password</Title>
        <Text style={{ display: "block", marginBottom: "15px", textAlign: "center" }}>
          Ensure your password is strong and unique.
        </Text>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: "15px" }} />}
        {message && <Alert message={message} type="success" showIcon style={{ marginBottom: "15px" }} />}

        <Form layout="vertical">
          <Form.Item validateStatus={error ? "error" : ""} help={validatePassword()}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="New Password"
              size="large"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          <Form.Item validateStatus={error ? "error" : ""} help={password && password !== confirmPassword ? "Passwords do not match." : ""}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm New Password"
              size="large"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleResetPassword}
              loading={loading}
              disabled={!!validatePassword()}
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ fontSize: "12px", textAlign: "center", display: "block" }}>
          After resetting, you&apos;ll be redirected to the login page.
        </Text>
      </Card>
    </div>
  );
};

export default ResetPassword;
