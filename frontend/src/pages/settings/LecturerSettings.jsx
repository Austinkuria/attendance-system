import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Form, Input, message, Spin, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ThemeContext } from '../../context/ThemeContext';

const { Header, Content } = Layout;
const { Title } = Typography;

const SettingsCard = styled(Card)`
  max-width: 600px;
  margin: 24px auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: ${props => props.theme.cardBg};
  border: 1px solid ${props => props.theme.border};
  
  @media (max-width: 576px) {
    padding: 16px;
    margin: 16px;
  }
`;

const LecturerSettings = () => {
  const { isDarkMode, themeColors } = useContext(ThemeContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingProfile(true);
        const userData = await getUserProfile();
        form.setFieldsValue({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          department: userData.department
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        message.error('Failed to load profile data');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserData();
  }, [form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await updateUserProfile(values);
      message.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: themeColors.background }}>
      <Header style={{
        padding: '0 16px',
        background: themeColors.cardBg,
        position: 'fixed',
        width: '100%',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        borderBottom: `1px solid ${themeColors.border}`
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/lecturer-dashboard')}
          style={{ color: themeColors.primary }}
        />
        <Title level={3} style={{ margin: 0, textAlign: 'center', flex: 1, color: themeColors.text }}>
          Account Settings
        </Title>
      </Header>

      <Content style={{ padding: '24px', marginTop: 64 }}>


        <SettingsCard theme={themeColors}>
          <Spin spinning={loadingProfile} tip="Loading profile data...">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ color: themeColors.text }}
            >
              <Form.Item
                name="firstName"
                label={<span style={{ color: themeColors.text }}>First Name</span>}
                rules={[{ required: true, message: 'Please enter your first name' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: themeColors.placeholder }} />}
                  placeholder="First Name"
                  style={{
                    background: themeColors.inputBg,
                    color: themeColors.text,
                    borderColor: themeColors.inputBorder,
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="lastName"
                label={<span style={{ color: themeColors.text }}>Last Name</span>}
                rules={[{ required: true, message: 'Please enter your last name' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: themeColors.placeholder }} />}
                  placeholder="Last Name"
                  style={{
                    background: themeColors.inputBg,
                    color: themeColors.text,
                    borderColor: themeColors.inputBorder,
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span style={{ color: themeColors.text }}>Email</span>}
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: themeColors.placeholder }} />}
                  placeholder="Email"
                  style={{
                    background: themeColors.inputBg,
                    color: themeColors.text,
                    borderColor: themeColors.inputBorder,
                    borderRadius: '8px'
                  }}
                  disabled
                />
              </Form.Item>
              <Form.Item
                name="department"
                label={<span style={{ color: themeColors.text }}>Department</span>}
              >
                <Input
                  placeholder="Department"
                  style={{
                    background: themeColors.inputBg,
                    color: themeColors.text,
                    borderColor: themeColors.inputBorder,
                    borderRadius: '8px'
                  }}
                  disabled
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span style={{ color: themeColors.text }}>Change Password</span>}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: themeColors.placeholder }} />}
                  placeholder="Leave blank to keep current password"
                  style={{
                    background: themeColors.inputBg,
                    color: themeColors.text,
                    borderColor: themeColors.inputBorder,
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={<span style={{ color: themeColors.text }}>Confirm Password</span>}
                dependencies={['password']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: themeColors.placeholder }} />}
                  placeholder="Confirm your new password"
                  style={{
                    background: themeColors.inputBg,
                    color: themeColors.text,
                    borderColor: themeColors.inputBorder,
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    style={{
                      background: themeColors.primary,
                      borderColor: themeColors.primary,
                      color: '#fff',
                      borderRadius: '8px'
                    }}
                  >
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => navigate('/lecturer-dashboard')}
                    style={{
                      borderColor: themeColors.border,
                      color: themeColors.text,
                      borderRadius: '8px'
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Spin>
        </SettingsCard>
      </Content>

      <style>{`
        .ant-form-item-label > label {
          color: ${themeColors.text} !important;
        }
        .ant-input, .ant-input-password {
          color: ${themeColors.text} !important;
        }
        .ant-input::placeholder, .ant-input-password::placeholder {
          color: ${themeColors.placeholder} !important;
        }
        .ant-input-affix-wrapper-focused, .ant-input:focus {
          border-color: ${themeColors.focus} !important;
          box-shadow: 0 0 0 2px ${themeColors.focus}40 !important;
        }
        .ant-btn-primary:hover, .ant-btn-primary:focus {
          background: ${themeColors.focus} !important;
          border-color: ${themeColors.focus} !important;
        }
        .ant-breadcrumb-separator {
          color: ${themeColors.text} !important;
        }
        .ant-breadcrumb a:hover {
          color: ${themeColors.focus} !important;
        }
        .ant-form-item-explain-error {
          color: ${themeColors.accent} !important;
        }
      `}</style>
    </Layout>
  );
};

export default LecturerSettings;