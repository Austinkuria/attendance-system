import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/api';
import { Layout, Card, Typography, Button, message, Avatar, Row, Col, Space, Skeleton } from 'antd';
import { UserOutlined, ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Content } = Layout;
const { Title, Text } = Typography;

const ProfileCard = styled(Card)`
  max-width: 800px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const LecturerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
      } catch {
        message.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <Layout style={{ padding: '24px', minHeight: '100vh' }}>
      <Content>
        <ProfileCard>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/lecturer-dashboard')}
              style={{ marginBottom: 16 }}
            >
              Back to Dashboard
            </Button>

            {loading ? (
              <Skeleton avatar paragraph={{ rows: 4 }} active />
            ) : (
              <>
                <Row align="middle" gutter={[24, 16]}>
                  <Col>
                    <Avatar size={128} icon={<UserOutlined />} />
                  </Col>
                  <Col>
                    <Title level={2}>{profile.firstName} {profile.lastName}</Title>
                    <Text type="secondary">Lecturer</Text>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Text strong>Email:</Text> {profile.email}
                  </Col>
                  <Col span={24}>
                    <Text strong>Role:</Text> {profile.role}
                  </Col>
                  <Col span={24}>
                    <Text strong>Department:</Text> {profile.department?.name || 'N/A'}
                  </Col>
                </Row>

                <Row justify="end">
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />} 
                    onClick={() => navigate('/edit-profile')}
                  >
                    Edit Profile
                  </Button>
                </Row>
              </>
            )}
          </Space>
        </ProfileCard>
      </Content>
    </Layout>
  );
};

export default LecturerProfile;