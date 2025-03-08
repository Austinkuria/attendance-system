import { useState, useEffect } from 'react';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  LineChartOutlined,
  FormOutlined,
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
  Spin,
  Grid,
} from 'antd';
import { Link } from 'react-router-dom';
import AttendanceManagement from '../../components/AttendanceManagement';
import Analytics from './Analytics';
import BackToTop from '../../components/BackToTop';

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;

const LecturerDashboard = () => {
  const screens = Grid.useBreakpoint();
  const { token: { colorBgContainer } } = theme.useToken();
  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      setCollapsed(mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const logout = () => {
    ['token', 'userData'].forEach((item) => localStorage.removeItem(item));
    sessionStorage.clear();
    message.success('Logged out successfully!');
    setTimeout(() => (window.location.href = '/auth/login'), 500);
  };

  const profileItems = [
    {
      key: '1',
      label: 'View Profile',
      icon: <UserOutlined />,
      onClick: () => (window.location.href = '/lecturer/profile'),
    },
    {
      key: '2',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => (window.location.href = '/lecturer/settings'),
    },
    { type: 'divider' },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () =>
        Modal.confirm({
          title: 'Confirm Logout',
          content: 'Are you sure you want to logout?',
          onOk: logout,
          centered: true,
        }),
    },
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
          justifyContent: 'space-between',
          border: '1px solid orange', // Debugger: Orange border for Header
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
            display: isMobile ? 'none' : 'block',
          }}
        >
          Lecturer Dashboard
        </AntTitle>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            display: isMobile ? 'inline' : 'none',
          }}
        >
          Lecturer Dashboard
        </AntTitle>
        <Dropdown menu={{ items: profileItems }} trigger={['click']}>
          <Button
            type="text"
            icon={<UserOutlined style={{ fontSize: 24 }} />}
            style={{ marginRight: 24 }}
          />
        </Dropdown>
      </Header>

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={180}
          breakpoint="lg"
          collapsedWidth={80}
          style={{
            background: colorBgContainer,
            marginTop: 64,
            position: 'fixed',
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
            zIndex: 11,
            margin: 0,
            border: '1px solid blue', // Debugger: Blue border for Sider
          }}
        >
          <div className="demo-logo-vertical" />
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            items={[
              {
                key: '1',
                icon: <DashboardOutlined />,
                label: <Link to="/lecturer-dashboard">Dashboard</Link>,
              },
              {
                key: '2',
                icon: <UserOutlined />,
                label: <Link to="/lecturer/past-attendance">Attendance</Link>,
              },
              {
                key: '3',
                icon: <LineChartOutlined />,
                label: <Link to="/lecturer/analytics">Analytics</Link>,
              },
              {
                key: '5',
                icon: <FormOutlined />,
                label: <Link to="/lecturer/feedback">Feedback</Link>,
              },
            ]}
          />
        </Sider>

        <Content
          style={{
            marginTop: 64,
            marginLeft: collapsed ? (isMobile ? 0 : 80) : (isMobile ? 0 : 180), // No margin on small screens
            marginRight: 0,
            marginBottom: 0,
            padding: screens.xs ? 0 : '0 16px', // No padding on small screens
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
            transition: 'margin-left 0.2s',
            width: collapsed ? (isMobile ? '100%' : 'calc(100% - 80px)') : (isMobile ? '100%' : 'calc(100% - 180px)'),
            boxSizing: 'border-box',
            border: '1px solid green', // Debugger: Green border for Content
          }}
        >
          <Spin spinning={false} tip="Loading...">
            <section style={{ margin: 0, border: '1px dashed yellow' }}> {/* Debugger: Yellow dashed border for AttendanceManagement */}
              <AttendanceManagement />
            </section>
            <section style={{ margin: 0, border: '1px dashed pink' }}> {/* Debugger: Pink dashed border for Analytics */}
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