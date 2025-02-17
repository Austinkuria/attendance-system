import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Select, Button, Alert, Typography, Card } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import "../styles.css";

const { Title, Text } = Typography;
const { Option } = Select;

const Signup = () => {
  const [error, setError] = useState(null);
  const [role, setRole] = useState("student"); // Track role selection
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { firstName, lastName, email, password, confirmPassword, role, year, semester } = values;
    
    // const hashedPassword = await bcrypt.hash(password, 10);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const userData = {
        firstName,
        lastName,
        email,
        password,
        role,
        ...(role === "student" && { year, semester }), // Include only for students
      };

      const response = await fetch("https://attendance-system-w70n.onrender.com/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/auth/login"); // Redirect after successful signup
      } else {
        setError(data.message || "Signup failed");
      }
    } catch {
      setError("An error occurred during signup");
    }
  };

  return (
    <div className="signup-container">
      <Card className="signup-card">
        <Title level={2} style={{ textAlign: "center" }}>Create an Account</Title>

        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form name="signup" layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="firstName"
            rules={[
              { required: true, message: "Please enter your first name!" },
              { min: 3, message: "First name must be at least 3 characters long!" },
              { pattern: /^[A-Za-z]+$/, message: "First name must not contain numbers!" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="First Name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            rules={[
              { required: true, message: "Please enter your last name!" },
              { min: 3, message: "Last name must be at least 3 characters long!" },
              { pattern: /^[A-Za-z]+$/, message: "Last name must not contain numbers!" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Last Name" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email!" },
              { type: "email", message: "Enter a valid email address!" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please enter your password!" },
              { min: 8, message: "Password must be at least 8 characters long!" },
              { pattern: /[a-z]/, message: "Password must contain at least one lowercase letter!" },
              { pattern: /[0-9]/, message: "Password must contain at least one number!" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item name="role" initialValue="student" rules={[{ required: true }]}>
            <Select onChange={setRole}>
              <Option value="student">Student</Option>
              <Option value="lecturer">Lecturer</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>

          {role === "student" && (
            <>
              <Form.Item name="year" rules={[{ required: true }]}>
                <Select placeholder="Select Year">
                  {[1, 2, 3, 4].map((y) => <Option key={y} value={y}>Year {y}</Option>)}
                </Select>
              </Form.Item>

              <Form.Item name="semester" rules={[{ required: true }]}>
                <Select placeholder="Select Semester">
                  {[1, 2, 3].map((s) => <Option key={s} value={s}>Semester {s}</Option>)}
                </Select>
              </Form.Item>
            </>
          )}
        <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Signup
            </Button>
          </Form.Item>
        </Form>

        <Text style={{ display: 'block', textAlign: 'center' }}>
          Already have an account? <a href="/auth/login">Login</a>
        </Text>
      </Card>
    </div>
  );
};

export default Signup;
