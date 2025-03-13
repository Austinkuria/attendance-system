import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Input, Button, Typography, Alert, Form } from "antd";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
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
  
  @media (max-width: 576px) {
    padding: 10px;
  }
`;

const StyledCard = styled(Card)`
  max-width: 440px;
  width: 100%;
  margin: 0 auto;
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

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const SuccessMessage = styled.div`
  background-color: ${props => props.isDarkMode ? 'rgba(79, 160, 80, 0.15)' : '#f6ffed'};
  border: 1px solid ${props => props.isDarkMode ? '#438544' : '#b7eb8f'};
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
`;

const StyledInput = styled(Input)`
  font-size: 16px;
  background-color: ${props => props.theme.inputBg} !important;
  border-color: ${props => props.theme.inputBorder} !important;
  color: ${props => props.theme.text} !important;
  border-radius: 8px !important;

  &:hover, &:focus {
    border-color: ${props => props.theme.focus} !important;
    background-color: ${props => props.theme.inputHover} !important;
  }

  .ant-input {
    border-radius: 8px !important;
    background-color: ${props => props.theme.inputBg} !important;
    color: ${props => props.theme.text} !important;
    padding: 2px 14px !important;
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

const StyledButton = styled(Button)`
  background-color: ${props => props.type === 'primary' ? props.theme.primary : 'transparent'} !important;
  border-color: ${props => props.type === 'primary' ? props.theme.primary : 'transparent'} !important;
  border-radius: 8px !important;
  color: ${props => props.type === 'primary' ? '#fff' : props.theme.primary} !important;

  &:hover, &:focus {
    background-color: ${props => props.type === 'primary' ? props.theme.focus : 'transparent'} !important;
    border-color: ${props => props.type === 'primary' ? props.theme.focus : 'transparent'} !important;
    color: ${props => props.type === 'primary' ? '#fff' : props.theme.focus} !important;
  }
`;

const ResponsiveTitle = styled(Title)`
  text-align: center;
  margin-bottom: 8px;
  font-size: 24px !important;
  color: ${props => props.isDarkMode ? '#FFFFFF' : props.theme.text} !important;
  
  @media (max-width: 576px) {
    font-size: 20px !important;
  }
`;

const ResponsiveText = styled(Text)`
  color: ${props => props.theme.placeholder} !important;
`;

const ResetPasswordRequest = () => {
  const [email, setEmail] = useState("");
  const { isDarkMode, themeColors } = useContext(ThemeContext);
  const [form] = Form.useForm();
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const navigate = useNavigate();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleEmailChange = (e) => {
    const newEmail = e.target.value.trim();
    setEmail(newEmail);

    if (!newEmail) {
      setError("Email field cannot be empty.");
      setIsValidEmail(false);
    } else if (!emailRegex.test(newEmail)) {
      setError("Invalid email format (e.g. example@domain.com).");
      setIsValidEmail(false);
    } else {
      setError(null);
      setIsValidEmail(true);
    }
  };

  const handleResetRequest = async () => {
    if (!isValidEmail || !email) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://attendance-system-w70n.onrender.com/api'}/auth/reset-password`,
        { email }
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

  const handleFormSubmit = () => {
    if (!email.trim()) {
      setError("Email field cannot be empty.");
      return;
    }
    handleResetRequest();
  };

  return (
    <PageContainer theme={themeColors}>
      <StyledCard theme={themeColors}>
        <FormHeader>
          <StyledButton
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/auth/login")}
            style={{ float: "left" }}
            theme={themeColors}
          />
          <ResponsiveTitle level={3} theme={themeColors} isDarkMode={isDarkMode}>
            Reset Password
          </ResponsiveTitle>
          <ResponsiveText type="secondary" theme={themeColors}>
            Enter your email to receive a password reset link
          </ResponsiveText>
        </FormHeader>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{
              marginBottom: 24,
              background: isDarkMode ? 'rgba(255, 77, 79, 0.1)' : undefined,
              borderColor: isDarkMode ? '#ff7875' : undefined,
              color: isDarkMode ? '#FFFFFF' : undefined,
            }}
            className={isDarkMode ? 'dark-mode-alert' : ''}
          />
        )}

        {message && (
          <SuccessMessage isDarkMode={isDarkMode}>
            <Alert
              message={
                <>
                  <div style={{
                    fontWeight: 500,
                    color: isDarkMode ? '#FFFFFF' : undefined
                  }}>{message.title}</div>
                  <div style={{
                    color: isDarkMode ? '#FFFFFF' : undefined
                  }}>{message.content}</div>
                </>
              }
              type="success"
              showIcon
              style={{
                background: 'transparent',
                border: 'none',
              }}
              className={isDarkMode ? 'dark-mode-success-alert' : ''}
            />
          </SuccessMessage>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          disabled={loading}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Email field cannot be empty." },
              { pattern: emailRegex, message: "Please enter a valid email address (e.g. example@domain.com)." }
            ]}
            validateTrigger={["onBlur", "onChange", "onSubmit"]}
          >
            <StyledInput
              prefix={<MailOutlined />}
              placeholder="Email address"
              size="large"
              autoFocus
              value={email}
              onChange={handleEmailChange}
              theme={themeColors}
              isDarkMode={isDarkMode}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <StyledButton
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              disabled={!isValidEmail || loading}
              theme={themeColors}
            >
              Send Reset Link
            </StyledButton>
          </Form.Item>

          <div style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: "14px",
            color: themeColors.placeholder
          }}>
            Remember your password?{" "}
            <StyledButton
              type="link"
              onClick={() => navigate("/auth/login")}
              style={{ padding: 0 }}
              theme={themeColors}
            >
              Log in here
            </StyledButton>
          </div>
        </Form>

        <ResponsiveText
          type="secondary"
          theme={themeColors}
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 24,
            fontSize: "14px"
          }}
        >
          Can&apos;t find the email? Check your spam folder or contact support
        </ResponsiveText>
      </StyledCard>

      <style>{`
        .dark-mode-alert .ant-alert-message {
          color: #FFFFFF !important;
        }
        .dark-mode-alert .ant-alert-icon {
          color: #ff7875 !important;
        }
        .dark-mode-success-alert .ant-alert-message,
        .dark-mode-success-alert .ant-alert-description {
          color: #FFFFFF !important;
        }
        .dark-mode-success-alert .ant-alert-icon {
          color: #52c41a !important;
        }
      `}</style>
    </PageContainer>
  );
};

export default ResetPasswordRequest;