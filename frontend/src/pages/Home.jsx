import { Layout, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: '100vh', textAlign: 'center' }}>
      <Header style={{ background: '#001529', padding: '16px' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>Attendance System</Title>
      </Header>
      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '50px',
          flex: 1,  // Ensure that content stretches to fill available space
          overflowY:'hidden',
        }}
      >
        <Title>Welcome to the Smart Attendance System</Title>
        <Text style={{ fontSize: '16px', color: '#555' }}>
          Simplifying attendance tracking with QR technology.
        </Text>
        <Button
          type="primary"
          size="large"
          style={{ marginTop: '20px' }}
          onClick={() => navigate('/login')}
        >
          Login to Access Your Dashboard
        </Button>
      </Content>
    </Layout>
  );
};

export default Home;
