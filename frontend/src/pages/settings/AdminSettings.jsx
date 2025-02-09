import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, Form, Input, message } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const AdminSettings = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
      } catch {
        message.error('Failed to load profile data');
      }
    };

    fetchProfile();
  }, [navigate]);

  const onFinish = async (values) => {
    try {
      await updateUserProfile(values);
      message.success('Profile updated successfully');
      navigate('/admin/profile');
    } catch {
      message.error('Failed to update profile');
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <Layout style={{ padding: '24px' }}>
      <Content>
        <Card>
          <Title level={2}>Admin Settings</Title>
          <Form
            initialValues={profile}
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'Please input your first name!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Please input your last name!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Please input your email!' }]}
            >
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Update Profile
            </Button>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminSettings;