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
import Sidebar from "../components/Sidebar";
import AttendanceManagement from "../components/AttendanceManagement";
import Analytics from "../pages/Analytics";
import BackToTop from "../components/BackToTop";

const { Header, Content } = Layout;

const LecturerDashboard = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    
    const handlePopState = () => {
      if (!localStorage.getItem('token')) {
        window.location.href = '/login';
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setCollapsed(true);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    window.location.href = '/login';
    window.location.reload(true);
  };

  // Profile dropdown items
  const profileItems = [
    {
      key: '1',
      label: 'View Profile',
      icon: <UserOutlined />,
      onClick: () => window.location.href = '/lecturer/profile'
    },
    {
      key: '2',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => window.location.href = '/lecturer/settings'
    },
    {
      type: 'divider',
    },
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
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} />
      
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
          <Dropdown menu={{ items: profileItems }} trigger={['click']}>
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
            {/* Attendance Management Section */}
            <section style={{ marginBottom: 48 }}>
              <AttendanceManagement />
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