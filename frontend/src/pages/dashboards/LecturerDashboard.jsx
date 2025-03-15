import { useContext, useState, useEffect } from 'react';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  LineChartOutlined,
  FormOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import {
  Layout,
  Menu,
  Button,
  Modal,
  Dropdown,
  Space,
  message,
  Typography,
  Spin,
} from 'antd';
import { Link } from 'react-router-dom';
import AttendanceManagement from '../../components/AttendanceManagement';
import Analytics from './Analytics';
import { ThemeContext } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import ThemeToggle from '../../components/ThemeToggle';

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;

const LecturerDashboard = () => {
  const { isDarkMode, setIsDarkMode, themeColors } = useContext(ThemeContext);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    // Single more efficient auth check
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Use replace instead of href to prevent back button issues
        window.location.replace('/auth/login');
        return false;
      }
      return true;
    };

    if (!checkAuth()) return;

    // Only listen for storage events (when user logs out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        window.location.replace('/auth/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logout = () => {
    // More efficient logout
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    message.success('Logged out successfully!');
    window.location.replace('/auth/login');
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
          okButtonProps: { style: { background: themeColors.accent, border: 'none' } },
        }),
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <Layout style={{ minHeight: '100vh', background: themeColors.background }}>
      <Header
        style={{
          padding: '0 16px',
          background: isDarkMode ? '#1F2527' : 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          position: 'fixed',
          width: '100%',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${themeColors.primary}20`,
        }}
      >
        <Space>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '18px',
              width: 64,
              height: 64,
              color: themeColors.primary,
              transition: 'all 0.3s',
            }}
            ghost
          />
        </Space>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            flex: 1,
            textAlign: 'center',
            color: themeColors.primary,
            fontWeight: 600,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: window.innerWidth < 992 ? 'none' : 'block',
          }}
        >
          Lecturer Dashboard
        </AntTitle>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            color: themeColors.primary,
            fontWeight: 600,
            display: window.innerWidth >= 992 ? 'none' : 'inline',
          }}
        >
          Lecturer Dashboard
        </AntTitle>
        <Space>
          <ThemeToggle />
          <Dropdown menu={{ items: profileItems }} trigger={['click']}>
            <Button
              type="text"
              icon={<UserOutlined style={{ fontSize: 24, color: themeColors.primary }} />}
              style={{ marginRight: 24, transition: 'all 0.3s' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </Dropdown>
        </Space>
      </Header>

      <Layout style={{ background: themeColors.background }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={250}
          breakpoint="lg"
          collapsedWidth={80}
          style={{
            background: isDarkMode ? '#1F2527' : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            marginTop: 64,
            position: 'fixed',
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
            zIndex: 11,
            boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
          }}
        >
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
            style={{ background: 'transparent', border: 'none', color: themeColors.text }}
            theme={isDarkMode ? 'dark' : 'light'}
          />
        </Sider>

        <Content
          className="lecturer-content"
          style={{
            marginTop: '64px',
            marginRight: '8px',
            marginBottom: '8px',
            marginLeft: collapsed ? '80px' : '250px', // Match exact sidebar width
            background: themeColors.background,
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
            transition: 'margin-left 0.3s ease-in-out',
          }}
        >
          <Spin spinning={false} tip="Loading...">
            <motion.div initial="hidden" animate="visible" variants={cardVariants}>
              <section style={{ margin: 0 }}>
                <AttendanceManagement />
              </section>
            </motion.div>
            <motion.div initial="hidden" animate="visible" variants={cardVariants}>
              <section style={{ margin: 0 }}>
                <Analytics />
              </section>
            </motion.div>
            {showBackToTop && (
              <Button
                shape="circle"
                icon={<ArrowUpOutlined />}
                onClick={scrollToTop}
                style={{
                  position: 'fixed',
                  bottom: 32,
                  right: 32,
                  zIndex: 1000,
                  background: themeColors.primary,
                  border: 'none',
                  width: 50,
                  height: 50,
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isDarkMode ? '#8E86E5' : '#5A4FCF')}
                onMouseLeave={(e) => (e.currentTarget.style.background = themeColors.primary)}
              />
            )}
          </Spin>
        </Content>
      </Layout>
      <style>
        {`
          .ant-layout {
            background: ${themeColors.background} !important;
          }
          .ant-layout-content {
            background: ${themeColors.background} !important;
          }
          body {
            background: ${themeColors.background} !important;
          }
          .lecturer-content {
            padding: 0 16px;
          }
          @media (max-width: 768px) {
            .lecturer-content {
              padding: 0 12px;
            }
          }
          @media (max-width: 576px) {
            .lecturer-content {
              padding: 0 8px;
              margin-right: 4px;
              margin-bottom: 4px;
            }
          }
          @media (max-width: 400px) {
            .lecturer-content {
              padding: 0 4px;
              margin-right: 0;
              margin-bottom: 0;
            }
          }
        `}
      </style>
    </Layout>
  );
};

export default LecturerDashboard;