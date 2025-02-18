import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Select, Button, Alert, Typography, Card, theme } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, ArrowRightOutlined } from "@ant-design/icons";
import axios from "axios";
import styled from "styled-components";

const { Title, Text } = Typography;
const { Option } = Select;
const { useToken } = theme;

const StyledCard = styled(Card)`
  max-width: 520px;
  margin: 40px auto;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  
  .ant-card-body {
    padding: 40px;
  }
`;

const Signup = () => {
  const { token: themeToken } = useToken();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("student");
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);

    try {
      const userData = {
        ...values,
        ...(values.role === "student" && { 
          year: values.year,
          semester: values.semester 
        })
      };

      const response = await axios.post(
        "https://attendance-system-w70n.onrender.com/api/auth/signup",
        userData
      );

      if (response.status === 201) {
        form.resetFields();
        Alert.success({
          message: "Account Created!",
          description: "Redirecting to login page...",
          duration: 2
        });
        setTimeout(() => navigate("/auth/login"), 2000);
      }
    } catch (error) {
      console.error("Signup error:", error.response?.data);
      setError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      background: themeToken.colorBgContainer 
    }}>
      <StyledCard>
        <Title level={3} style={{ textAlign: "center", marginBottom: 8 , fontSize: "30px" }}>
          Create New Account
        </Title>
        <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: 32 , fontSize: "20px" }}>
          Join our attendance management system
        </Text>

        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24,fontSize: '16px'  }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish} disabled={loading}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "20px" }}>
            <Form.Item
              name="firstName"
              rules={[
                { required: true, message: "First name is required" },
                { min: 3, message: "Minimum 3 characters" },
                { pattern: /^[A-Za-z\u00C0-\u024F\s'-]+$/, message: "Invalid characters" }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: themeToken.colorTextSecondary, fontSize: '20px'  }} />}
                placeholder="First name"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="lastName"
              rules={[
                { required: true, message: "Last name is required" },
                { min: 3, message: "Minimum 3 characters" },
                { pattern: /^[A-Za-z\u00C0-\u024F\s'-]+$/, message: "Invalid characters" }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: themeToken.colorTextSecondary, fontSize: '20px'  }} />}
                placeholder="Last name"
                size="large"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { 
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
                message: 'Enter a valid email format (e.g., user@example.com)!' 
              }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: themeToken.colorTextSecondary, fontSize: '20px'  }} />}
              placeholder="Email address"
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: '20px'  }}>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter your password!' },
                { min: 8, message: 'Password must be at least 8 characters long!' },
                { pattern: /[a-z]/, message: 'Password must contain at least one lowercase letter!' },
                { pattern: /[0-9]/, message: 'Password must contain at least one number!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: themeToken.colorTextSecondary, fontSize: '20px' }} />}
                placeholder="Create password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: "Confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Passwords do not match');
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: themeToken.colorTextSecondary, fontSize: '20px' }} />}
                placeholder="Confirm password"
                size="large"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="role"
            initialValue="student"
            rules={[{ required: true, message: "Select your role" }]}
          >
            <Select 
              size="large"
              onChange={setRole}
              placeholder="Select role"
            >
              <Option value="student">Student</Option>
              <Option value="lecturer">Lecturer</Option>
              <Option value="admin">Administrator</Option>
            </Select>
          </Form.Item>

          {role === "student" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" , fontSize: "20px" }}>
              <Form.Item
                name="year"
                rules={[{ required: true, message: "Select year" }]}
              >
                <Select
                  size="large"
                  placeholder="Academic year"
                >
                  {[1, 2, 3, 4].map(year => (
                    <Option key={year} value={year}>Year {year}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="semester"
                rules={[{ required: true, message: "Select semester" }]}
              >
                <Select
                  size="large"
                  placeholder="Current semester"
                >
                  {[1, 2, 3].map(sem => (
                    <Option key={sem} value={sem}>Semester {sem}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          )}

          <Form.Item style={{ marginTop: 32 , fontSize: "20px" }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              icon={<ArrowRightOutlined />}
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <Text 
          style={{ 
            display: "block", 
            textAlign: "center", 
            marginTop: 24,
            fontSize: "18px",
            color: themeToken.colorTextSecondary
          }}
        >
          Already registered?{" "}
          <Button 
            type="link" 
            onClick={() => navigate("/auth/login")}
            style={{ padding: 0 , fontSize: "18px" }}
          >
            Login here
          </Button>
        </Text>
      </StyledCard>
    </div>
  );
};

export default Signup;