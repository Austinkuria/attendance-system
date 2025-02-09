import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, message } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const LecturerProfile = () => {
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
          <Title level={2}>Lecturer Profile</Title>
          <p>
            <strong>Name:</strong> {profile.firstName} {profile.lastName}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Role:</strong> {profile.role}
          </p>
          <p>
            <strong>Department:</strong> {profile.department?.name || 'N/A'}
          </p>
          <Button type="primary" onClick={() => navigate('/lecturer-dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </Content>
    </Layout>
  );
};

export default LecturerProfile;