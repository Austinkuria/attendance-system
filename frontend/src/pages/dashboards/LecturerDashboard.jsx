import { useState, useEffect, createContext } from 'react';
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
  message,
  Typography,
  Spin,
  Grid,
  Switch,
} from 'antd';
import { Link } from 'react-router-dom';
import AttendanceManagement from '../../components/AttendanceManagement'; // Adjust path if necessary
import Analytics from './Analytics';
import BackToTop from '../../components/BackToTop';
import { motion } from 'framer-motion';

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;
const { useBreakpoint } = Grid;

// Define and export ThemeContext
export const ThemeContext = createContext();

const LecturerDashboard = () => {
  const screens = useBreakpoint();
  const [collapsed, setCollapsed] = useState(screens.lg ? false : true);
  const [isMobile, setIsMobile] = useState(!screens.lg);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const modernColors = {
    light: {
      primary: '#6C5CE7',
      secondary: '#00CEC9',
      accent: '#FF7675',
      background: '#F7F9FC',
      text: '#2D3436',
      cardGradient1: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
      cardGradient2: 'linear-gradient(135deg, #00CEC9, #81ECEC)',
      cardBg: '#FFFFFF',
    },
    dark: {
      primary: '#A29BFE',
      secondary: '#81ECEC',
      accent: '#FAB1A0',
      background: '#2D3436',
      text: '#F7F9FC',
      cardGradient1: 'linear-gradient(135deg, #5A4FCF, #A29BFE)',
      cardGradient2: 'linear-gradient(135deg, #00CEC9, #81ECEC)',
      cardBg: '#3A4042',
    },
  };

  const themeColors = isDarkMode ? modernColors.dark : modernColors.light;

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
          okButtonProps: { style: { background: themeColors.accent, border: 'none' } },
        }),
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, themeColors }}>
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
              display: isMobile ? 'none' : 'block',
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
              display: isMobile ? 'inline' : 'none',
            }}
          >
            Lecturer Dashboard
          </AntTitle>
          <Space>
            <Switch
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
              checkedChildren="Dark"
              unCheckedChildren="Light"
              style={{ marginRight: 16 }}
            />
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
            width={180}
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
              margin: 0,
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
              style={{ background: 'transparent', border: 'none', color: themeColors.text }}
              theme={isDarkMode ? 'dark' : 'light'}
            />
          </Sider>

          <Content
            style={{
              marginTop: 64,
              marginLeft: collapsed ? (isMobile ? 0 : 80) : (isMobile ? 0 : 180),
              marginRight: 0,
              marginBottom: 0,
              padding: screens.xs ? 0 : '0 16px',
              background: themeColors.background,
              minHeight: 'calc(100vh - 64px)',
              overflow: 'auto',
              transition: 'margin-left 0.2s',
              width: collapsed
                ? isMobile
                  ? '100%'
                  : 'calc(100% - 80px)'
                : isMobile
                ? '100%'
                : 'calc(100% - 180px)',
              boxSizing: 'border-box',
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
              <BackToTop />
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
          `}
        </style>
      </Layout>
    </ThemeContext.Provider>
  );
};

export default LecturerDashboard;