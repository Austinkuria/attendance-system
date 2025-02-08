import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, message } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const AdminProfile = () => {
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

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <Layout style={{ padding: '24px' }}>
      <Content>
        <Card>
          <Title level={2}>Admin Profile</Title>
          <p>
            <strong>Name:</strong> {profile.firstName} {profile.lastName}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Role:</strong> {profile.role}
          </p>
          <Button type="primary" onClick={() => navigate('/admin-dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminProfile;