import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Select, Button, Alert, Typography, Card, message } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, ArrowRightOutlined } from "@ant-design/icons";
import axios from "axios";
import styled from "styled-components";
import { ThemeContext } from "../../context/ThemeContext";

const { Title, Text } = Typography;
const { Option } = Select;

// Container for the entire page
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.background};
  padding: 20px;
  box-sizing: border-box;
  
  @media (max-width: 576px) {
    padding: 10px;
  }
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  background-color: ${props => props.theme.cardBg};
  border: 1px solid ${props => props.theme.border};
  
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

const ResponsiveTitle = styled(Title)`
  text-align: center;
  margin-bottom: 8px;
  font-size: 28px !important;
  color: ${props => props.isDarkMode ? '#FFFFFF' : props.theme.text} !important;
  
  @media (max-width: 576px) {
    font-size: 22px !important;
    margin-bottom: 6px;
  }
`;

const ResponsiveText = styled(Text)`
  display: block;
  text-align: center;
  margin-bottom: 24px;
  font-size: 18px;
  color: ${props => props.theme.placeholder} !important;
  
  @media (max-width: 576px) {
    font-size: 16px;
    margin-bottom: 20px;
  }
`;

const StyledInput = styled(Input)`
  font-size: 16px;
  background-color: ${props => props.theme.inputBg} !important;
  border-color: ${props => props.theme.inputBorder} !important;
  color: ${props => props.theme.text} !important;
  border-radius: 8px !important;

  .ant-input {
    border-radius: 8px !important;
    background-color: ${props => props.theme.inputBg} !important;
    color: ${props => props.theme.text} !important;
    padding: 2px 14px !important;
  }
  
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
`;

const StyledPasswordInput = styled(Input.Password)`
  font-size: 16px;
  background-color: ${props => props.theme.inputBg} !important;
  border-color: ${props => props.theme.inputBorder} !important;
  border-radius: 8px !important;

  .ant-input {
    border-radius: 8px !important;
    background-color: ${props => props.theme.inputBg} !important;
    color: ${props => props.theme.text} !important;
    padding: 2px 14px !important;
  }
  
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
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    background-color: ${props => props.theme.inputBg} !important;
    border-color: ${props => props.theme.inputBorder} !important;
    border-radius: 8px !important;
    
    .ant-select-selection-item {
      color: ${props => props.theme.text} !important;
    }
  }
  
  .ant-select-selection-placeholder {
    color: ${props => props.isDarkMode
    ? 'rgba(255, 255, 255, 0.5)' // Less bright for dark mode
    : props.theme.placeholder} !important;
  }
  
  &:hover, &.ant-select-focused {
    .ant-select-selector {
      border-color: ${props => props.theme.focus} !important;
      background-color: ${props => props.theme.inputHover} !important;
    }
  }
  
  .ant-select-arrow {
    color: ${props => props.isDarkMode
    ? 'rgba(255, 255, 255, 0.5)'
    : props.theme.placeholder} !important;
  }
`;

const StyledButton = styled(Button)`
  background-color: ${props => props.theme.primary} !important;
  border-color: ${props => props.theme.primary} !important;
  border-radius: 8px !important;

  &:hover, &:focus {
    background-color: ${props => props.theme.focus} !important;
    border-color: ${props => props.theme.focus} !important;
  }
  
  .anticon {
    display: inline-flex !important;
    vertical-align: middle !important;
  }
`;

const StyledLinkButton = styled(Button)`
  padding: 0;
  color: ${props => props.theme.primary} !important;

  &:hover, &:focus {
    color: ${props => props.theme.focus} !important;
  }
`;

const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const Signup = () => {
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  // Public registration is disabled - show informational message
  return (
    <PageContainer theme={themeColors}>
      <StyledCard theme={themeColors}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
          <ResponsiveTitle level={3} theme={themeColors} isDarkMode={isDarkMode}>
            Public Registration Disabled
          </ResponsiveTitle>
          <ResponsiveText theme={themeColors}>
            Self-registration is currently disabled for security reasons
          </ResponsiveText>

          <Alert
            message="How to Get an Account"
            description={
              <div style={{ textAlign: 'left' }}>
                <p>Accounts are created by administrators. To get access:</p>
                <ol style={{ paddingLeft: 20, marginTop: 10 }}>
                  <li><strong>Students:</strong> Contact your department administrator</li>
                  <li><strong>Lecturers:</strong> Contact your department administrator</li>
                  <li><strong>Department Admins:</strong> Contact the super administrator</li>
                </ol>
                <p style={{ marginTop: 15 }}>
                  Once your account is created, you'll receive an email with your login credentials.
                </p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24, marginTop: 24 }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StyledButton
              type="primary"
              size="large"
              onClick={() => navigate('/auth/login')}
              icon={<ArrowRightOutlined />}
              block
            >
              Go to Login Page
            </StyledButton>
            <Text style={{ color: themeColors.placeholder, fontSize: 14, marginTop: 10 }}>
              Already have an account? Click above to login
            </Text>
          </div>
        </div>
      </StyledCard>
    </PageContainer>
  );
};

// Keep the old code commented for reference
const SignupOld = () => {
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("student");
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [userEmail, setUserEmail] = useState('');
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
        // Check if email verification is required
        if (response.data.requiresVerification) {
          setUserEmail(values.email);
          setShowVerificationMessage(true);
          form.resetFields();
        } else {
          // Old flow for accounts that don't require verification
          form.resetFields();
          message.success("Account created successfully! Redirecting to login page...", 2);
          setTimeout(() => navigate("/auth/login"), 2000);
        }
      }
    } catch (error) {
      console.error("Signup error:", error.response?.data);

      if (error.response?.data?.errors) {
        const fieldErrors = error.response.data.errors.reduce((acc, err) => {
          acc[err.field] = err.message;
          return acc;
        }, {});

        form.setFields(Object.keys(fieldErrors).map(field => ({
          name: field,
          errors: [fieldErrors[field]]
        })));

        setError("Please fix the errors in the form.");
      } else {
        setError(error.response?.data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "https://attendance-system-w70n.onrender.com/api/auth/resend-verification",
        { email: userEmail }
      );

      if (response.data.success) {
        message.success("Verification email sent! Please check your inbox.");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  // Show verification message instead of form
  if (showVerificationMessage) {
    return (
      <PageContainer theme={themeColors}>
        <StyledCard theme={themeColors}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <MailOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 20 }} />
            <ResponsiveTitle level={3} theme={themeColors} isDarkMode={isDarkMode}>
              Check Your Email
            </ResponsiveTitle>
            <Text style={{ color: themeColors.text, display: 'block', marginBottom: 20 }}>
              We've sent a verification link to <strong>{userEmail}</strong>
            </Text>
            <Alert
              message="Verify your email to continue"
              description="Please check your email inbox (and spam folder) for a verification link. Click the link to activate your account."
              type="info"
              showIcon
              style={{ marginBottom: 20, textAlign: 'left' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button
                type="primary"
                onClick={handleResendVerification}
                loading={loading}
                style={{ width: '100%' }}
              >
                Resend Verification Email
              </Button>
              <Button
                onClick={() => navigate('/auth/login')}
                style={{ width: '100%' }}
              >
                Go to Login
              </Button>
            </div>
          </div>
        </StyledCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer theme={themeColors}>
      <StyledCard theme={themeColors}>
        <ResponsiveTitle level={3} theme={themeColors} isDarkMode={isDarkMode}>
          Create New Account
        </ResponsiveTitle>
        <ResponsiveText theme={themeColors}>
          Join our attendance management system
        </ResponsiveText>

        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => {
              setError(null);
              form.resetFields();
            }}
            style={{
              marginBottom: 24,
              fontSize: "16px",
              borderRadius: '8px'
            }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
          style={{ color: themeColors.text }}
        >
          <ResponsiveGrid>
            <Form.Item
              name="firstName"
              rules={[
                { required: true, message: "First name is required" },
                { min: 3, message: "Minimum 3 characters" },
                { pattern: /^[A-Za-z\u00C0-\u024F\s'-]+$/, message: "Invalid characters" }
              ]}
            >
              <StyledInput
                prefix={<UserOutlined />}
                placeholder="First name"
                size="large"
                theme={themeColors}
                isDarkMode={isDarkMode}
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
              <StyledInput
                prefix={<UserOutlined />}
                placeholder="Last name"
                size="large"
                theme={themeColors}
                isDarkMode={isDarkMode}
              />
            </Form.Item>
          </ResponsiveGrid>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email!" },
              {
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Enter a valid email format (e.g., user@example.com)!"
              }
            ]}
            style={{ marginTop: 12 }}
          >
            <StyledInput
              prefix={<MailOutlined />}
              placeholder="Email address"
              size="large"
              autoComplete="email"
              theme={themeColors}
              isDarkMode={isDarkMode}
            />
          </Form.Item>

          <ResponsiveGrid style={{ marginTop: 12 }}>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please enter your password!" },
                { min: 8, message: "Password must be at least 8 characters long!" },
                { pattern: /[a-z]/, message: "Password must contain at least one lowercase letter!" },
                { pattern: /[0-9]/, message: "Password must contain at least one number!" }
              ]}
            >
              <StyledPasswordInput
                prefix={<LockOutlined />}
                placeholder="Create password"
                size="large"
                theme={themeColors}
                isDarkMode={isDarkMode}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject("Passwords do not match");
                  },
                }),
              ]}
            >
              <StyledPasswordInput
                prefix={<LockOutlined />}
                placeholder="Confirm password"
                size="large"
                theme={themeColors}
                isDarkMode={isDarkMode}
              />
            </Form.Item>
          </ResponsiveGrid>

          <Form.Item
            name="role"
            initialValue="student"
            rules={[{ required: true, message: "Select your role" }]}
            style={{ marginTop: 12 }}
          >
            <StyledSelect
              size="large"
              onChange={setRole}
              placeholder="Select role"
              theme={themeColors}
              isDarkMode={isDarkMode}
            >
              <Option value="student">Student</Option>
              <Option value="lecturer">Lecturer</Option>
              <Option value="admin">Administrator</Option>
            </StyledSelect>
          </Form.Item>

          {role === "student" && (
            <ResponsiveGrid style={{ marginTop: 12 }}>
              <Form.Item
                name="year"
                rules={[{ required: true, message: "Select year" }]}
              >
                <StyledSelect
                  size="large"
                  placeholder="Academic year"
                  theme={themeColors}
                  isDarkMode={isDarkMode}
                >
                  {[1, 2, 3, 4].map(year => (
                    <Option key={year} value={year}>Year {year}</Option>
                  ))}
                </StyledSelect>
              </Form.Item>

              <Form.Item
                name="semester"
                rules={[{ required: true, message: "Select semester" }]}
              >
                <StyledSelect
                  size="large"
                  placeholder="Current semester"
                  theme={themeColors}
                  isDarkMode={isDarkMode}
                >
                  {[1, 2, 3].map(sem => (
                    <Option key={sem} value={sem}>Semester {sem}</Option>
                  ))}
                </StyledSelect>
              </Form.Item>
            </ResponsiveGrid>
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <StyledButton
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              theme={themeColors}
            >
              <ArrowRightOutlined style={{ marginRight: 8 }} />
              {loading ? "Creating Account..." : "Create Account"}
            </StyledButton>
          </Form.Item>
        </Form>

        <div style={{
          textAlign: "center",
          marginTop: 24,
          color: themeColors.placeholder
        }}>
          Already registered?{" "}
          <StyledLinkButton
            type="link"
            onClick={() => navigate("/auth/login")}
            theme={themeColors}
          >
            Login here
          </StyledLinkButton>
        </div>
      </StyledCard>
    </PageContainer>
  );
};

export default Signup;
