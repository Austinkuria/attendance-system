import { useState, useEffect } from 'react';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  LineChartOutlined,
  FormOutlined
} from '@ant-design/icons';
import {
  Layout,
  Menu,
  Button,
  Modal,
  Dropdown,
  Space,
  theme,
  message,
  Typography,
  Spin
} from 'antd';
import { Link } from "react-router-dom";
import AttendanceManagement from "../../components/AttendanceManagement";
import Analytics from "./Analytics";
import BackToTop from "../../components/BackToTop";

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;

const LecturerDashboard = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const [collapsed, setCollapsed] = useState(window.innerWidth < 992); // Collapse by default on small screens (lg breakpoint)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) window.location.href = '/auth/login';
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('popstate', () => {
      if (!localStorage.getItem('token')) window.location.href = '/auth/login';
    });
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('popstate', checkAuth);
    };
  }, []);

  // Responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      setCollapsed(mobile); // Sync collapsed state with screen size
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Logout handler
  const logout = () => {
    ['token', 'userData'].forEach(item => localStorage.removeItem(item));
    sessionStorage.clear();
    message.success('Logged out successfully!');
    setTimeout(() => window.location.href = '/auth/login', 500);
  };

  // Profile dropdown items
  const profileItems = [
    { key: '1', label: 'View Profile', icon: <UserOutlined />, onClick: () => window.location.href = '/lecturer/profile' },
    { key: '2', label: 'Settings', icon: <SettingOutlined />, onClick: () => window.location.href = '/lecturer/settings' },
    { type: 'divider' },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => Modal.confirm({
        title: 'Confirm Logout',
        content: 'Are you sure you want to logout?',
        onOk: logout,
        centered: true,
      })
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{
          padding: '0 16px',
          background: colorBgContainer,
          position: 'fixed',
          width: '100%',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Space>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
        </Space>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            flex: 1,
            textAlign: 'center',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: isMobile ? 'none' : 'block' // Hide on small screens
          }}
        >
          Lecturer Dashboard
        </AntTitle>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            display: isMobile ? 'inline' : 'none', // Show only on small screens
          }}
        >
          Lecturer Dashboard
        </AntTitle>
        <Dropdown menu={{ items: profileItems }} trigger={['click']}>
          <Button type="text" icon={<UserOutlined style={{ fontSize: 24 }} />} style={{ marginRight: 24 }} />
        </Dropdown>
      </Header>

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={250}
          breakpoint="lg"
          collapsedWidth={80}
          style={{
            background: colorBgContainer,
            marginTop: 64,
            position: 'fixed',
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
            zIndex: 11 // Ensure sidebar is above content
          }}
        >
          <div className="demo-logo-vertical" />
          <Menu
            mode="inline"
            defaultSelectedKeys={["1"]}
            items={[
              {
                key: "1",
                icon: <DashboardOutlined />,
                label: <Link to="/lecturer-dashboard">Dashboard</Link>,
              },
              {
                key: "2",
                icon: <UserOutlined />,
                label: <Link to="/attendance">Attendance</Link>,
              },
              {
                key: "3",
                icon: <LineChartOutlined />,
                label: <Link to="/analytics">Analytics</Link>,
              },
              {
                key: "4",
                icon: <FormOutlined />,
                label: <Link to="/lecturer/quizzes">Quizzes</Link>,
              },
              {
                key: "5",
                icon: <FormOutlined />,
                label: <Link to="/lecturer/feedback">Feedback</Link>,
              },
            ]}
          />
        </Sider>

        <Content
          style={{
            margin: collapsed ? '64px 16px 16px 80px' : '64px 16px 16px 250px',
            padding: 24,
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
            transition: 'margin-left 0.2s',
            marginLeft: collapsed ? 80 : 250,
          }}
        >
          <Spin spinning={false} tip="Loading...">
            <section style={{ marginBottom: 48 }}>
              <AttendanceManagement />
            </section>
            <section>
              <Analytics />
            </section>
            <BackToTop />
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LecturerDashboard;