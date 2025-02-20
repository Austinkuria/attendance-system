
import { useState, useEffect } from 'react';
import {
  Layout,
  theme,
  Dropdown,
  Menu,
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
import Analytics from "../Analytics";
import BackToTop from "../../components/BackToTop";
import ErrorBoundary from "../../components/ErrorBoundary";
// import QRCodeGenerator from "../components/QRCodeGenerator";  // Ensure correct filename

const { Header, Content } = Layout;

const LecturerDashboard = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Authentication check: redirect to /auth/login if no token is found
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
    }
  }, []);

  // Responsive layout: collapse sidebar on mobile screens
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setCollapsed(mobile); // Collapse sidebar on mobile
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
    setTimeout(() => window.location.href = '/auth/login', 500); // Smooth transition
  };

  // Profile dropdown items
  const profileItems = (
    <Menu>
      <Menu.Item key="1" icon={<UserOutlined />} onClick={() => window.location.href = '/lecturer/profile'}>
        View Profile
      </Menu.Item>
      <Menu.Item key="2" icon={<SettingOutlined />} onClick={() => window.location.href = '/lecturer/settings'}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="3"
        icon={<LogoutOutlined />}
        danger
        onClick={() => Modal.confirm({
          title: 'Confirm Logout',
          content: 'Are you sure you want to logout?',
          onOk: logout,
          centered: true,
        })}
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar Component */}
      <Sidebar collapsed={collapsed} isMobile={isMobile} />

      <Layout>
        <Header style={{
          padding: 0,
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown overlay={profileItems} trigger={['click']}>
            <Button
              type="text"
              icon={<UserOutlined style={{ fontSize: 24 }} />}
              style={{ marginRight: 24 }}
            />
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* QR Code Generator Section */}
            {/* <section style={{ marginBottom: 48 }}>
              <QRCodeGenerator />
            </section> */}

            {/* Attendance Management Section */}
            <section style={{ marginBottom: 48 }}>
            <ErrorBoundary>
        <AttendanceManagement />
      </ErrorBoundary>
            </section>

            {/* Analytics Section */}
            <section>
              <Analytics />
            </section>
          </div>

          <BackToTop />
        </Content>
      </Layout>
    </Layout>
  );
};

export default LecturerDashboard;