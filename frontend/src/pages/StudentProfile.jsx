import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentProfile } from '../services/api';
import { Layout, Card, Typography, Button, message } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getStudentProfile();
        setProfile(profileData);
      } catch  {
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
          <Title level={2}>Student Profile</Title>
          <p>
            <strong>Name:</strong> {profile.firstName} {profile.lastName}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Registration Number:</strong> {profile.regNo}
          </p>
          <p>
            <strong>Course:</strong> {profile.course}
          </p>
          <p>
            <strong>Department:</strong> {profile.department}
          </p>
          <p>
            <strong>Year:</strong> {profile.year}
          </p>
          <p>
            <strong>Semester:</strong> {profile.semester}
          </p>
          <Button type="primary" onClick={() => navigate('/student-dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </Content>
    </Layout>
  );
};

export default StudentProfile;