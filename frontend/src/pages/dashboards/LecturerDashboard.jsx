import { useState, useEffect } from 'react';
import {
  Layout,
  theme,
  Dropdown,
  Modal,
  message,
  Button
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import Sidebar from "../../components/Sidebar";
import AttendanceManagement from "../../components/AttendanceManagement";
import Analytics from "./Analytics";
import BackToTop from "../../components/BackToTop";

const { Header, Content } = Layout;

const LecturerDashboard = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(true);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/auth/login';
  }, []);

  // Responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setCollapsed(mobile); // Collapse sidebar by default on mobile
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
    <Layout style={{ minHeight: "100vh", background: '#f0f2f5' }}>
      <Sidebar collapsed={collapsed} isMobile={isMobile} />
      <Layout>
        <Header style={{
          padding: '0 16px',
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'fixed',
          width: isMobile ? '100%' : `calc(100% - ${collapsed ? 80 : 200}px)`,
          left: collapsed ? 80 : 200,
          zIndex: 10,
          transition: 'all 0.2s',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64, color: '#1890ff' }}
          />
          <Dropdown menu={{ items: profileItems }} trigger={['click']}>
            <Button
              type="text"
              icon={<UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              style={{ marginRight: 24 }}
            />
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '80px 16px 24px',
            padding: isMobile ? 16 : 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            maxWidth: 1200,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <section style={{ marginBottom: 48 }}>
            <AttendanceManagement />
          </section>
          <section>
            <Analytics />
          </section>
          <BackToTop />
        </Content>
      </Layout>
    </Layout>
  );
};

export default LecturerDashboard;