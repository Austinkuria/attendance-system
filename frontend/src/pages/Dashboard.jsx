import { Layout, Card, Typography } from 'antd';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Dashboard = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '16px', textAlign: 'center' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>Dashboard</Title>
      </Header>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <Card style={{ width: 400, textAlign: 'center', padding: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <Title level={4}>Welcome to Your Dashboard</Title>
          <Text>Your personalized overview and quick access to features.</Text>
        </Card>
      </Content>
    </Layout>
  );
};

export default Dashboard;
