import { Layout, Card, Typography } from 'antd';
import PropTypes from 'prop-types';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const Dashboard = ({ username }) => {
  const customStyles = {
    header: { background: '#001529', padding: '16px', textAlign: 'center' },
    card: { width: '90%', maxWidth: 400, textAlign: 'center', padding: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
    footer: { textAlign: 'center', background: '#f0f2f5', padding: '16px' },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={customStyles.header}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>Dashboard</Title>
      </Header>
      <Content style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <Card style={customStyles.card}>
          <Title level={4}>Welcome, {username}!</Title>
          <Text>Your personalized overview and quick access to features.</Text>
        </Card>
        <Card style={customStyles.card}>
          <Title level={4}>Quick Actions</Title>
          <Text>Links to important features or pages.</Text>
        </Card>
      </Content>
      <Footer style={customStyles.footer}>
        <Text>© 2023 Your Company. All rights reserved.</Text>
      </Footer>
    </Layout>
  );
};
Dashboard.propTypes = {
  username: PropTypes.string.isRequired,
};

export default Dashboard;