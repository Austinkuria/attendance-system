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
  Row,
  Col,
  Card,
} from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import AttendanceManagement from '../../components/AttendanceManagement';
import { ThemeContext } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import ThemeToggle from '../../components/ThemeToggle';

const { Header, Sider, Content } = Layout;
const { Title: AntTitle } = Typography;

const LecturerDashboard = () => {
  const { isDarkMode, themeColors } = useContext(ThemeContext);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading dashboard data...');
  const navigate = useNavigate();

  // Create style objects matching AdminPanel approach
  const styles = {
    layout: {
      minHeight: '100vh',
      background: themeColors.background,
      color: themeColors.text,
    },
    header: {
      padding: '0 16px',
      background: themeColors.cardBg,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'fixed',
      width: '100%',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${themeColors.border}`,
    },
    sider: {
      background: themeColors.cardBg,
      marginTop: 64,
      position: 'fixed',
      height: 'calc(100vh - 64px)',
      overflow: 'auto',
      zIndex: 11,
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
    },
    content: {
      margin: '64px 16px 16px',
      padding: 24,
      background: themeColors.background,
      minHeight: 'calc(100vh - 64px)',
      overflow: 'auto',
      transition: 'margin-left 0.3s ease-in-out',
    },
    backToTopButton: {
      position: 'fixed',
      bottom: 32,
      right: 32,
      zIndex: 1000,
      background: themeColors.primary,
      borderColor: themeColors.primary,
      color: '#fff !important',
      width: 50,
      height: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    },
    globalStyles: `
      .ant-layout, .ant-layout-content {
        background: ${themeColors.background} !important;
      }
      .ant-menu {
        background: ${themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
        border: none !important;
        padding: 8px 0;
      }
      .ant-menu-item {
        color: ${themeColors.text} !important;
        margin: 4px 8px !important;
        border-radius: 6px;
      }
      .ant-menu-item:hover {
        background: ${themeColors.hover} !important;
        color: ${themeColors.primary} !important;
      }
      .ant-menu-item-selected {
        background: ${themeColors.hover} !important;
        color: ${themeColors.primary} !important;
      }
      .ant-menu-item a {
        color: ${themeColors.text} !important;
      }
      .ant-menu-item-selected a {
        color: ${themeColors.primary} !important;
      }
      .ant-btn-primary {
        background: ${themeColors.primary} !important;
        border-color: ${themeColors.primary} !important;
        color: ${isDarkMode ? themeColors.text : "#fff"} !important;
        border-radius: 8px;
      }
      .ant-btn-primary:hover, .ant-btn-primary:focus {
        background: ${themeColors.focus} !important;
        border-color: ${themeColors.focus} !important;
      }
      .ant-layout-sider-trigger {
        background-color: ${themeColors.background} !important;
        color: ${themeColors.text} !important;
        border-top: 1px solid ${themeColors.border} !important;
      }
      .ant-layout-sider-trigger:hover {
        background-color: ${themeColors.border} !important;
      }
      .lecturer-content {
        padding: 0 16px;
      }
      .summary-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
      }
      .ant-card.ant-card-hoverable:not(.summary-card):hover {
        transform: none !important;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
      }
      @media (max-width: 992px) {
        .ant-layout-content { margin-left: 88px !important; }
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
        .ant-btn { padding: 4px 12px !important; }
      }
      @media (max-width: 400px) {
        .lecturer-content {
          padding: 0 4px;
          margin-right: 0;
          margin-bottom: 0;
        }
      }
    `,
  };

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

    // Simulate loading data
    setLoading(true);
    setLoadingMessage('Loading dashboard data...');

    // Simulate data loading completion
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timer);
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
      icon: <UserOutlined style={{ color: themeColors.text }} />,
      onClick: () => navigate('/lecturer/profile'),
      style: {
        color: themeColors.text,
        '&:hover': {
          background: themeColors.hover,
        }
      }
    },
    {
      key: '2',
      label: 'Settings',
      icon: <SettingOutlined style={{ color: themeColors.text }} />,
      onClick: () => navigate('/lecturer/settings'),
      style: {
        color: themeColors.text,
        '&:hover': {
          background: themeColors.hover,
        }
      }
    },
    { type: 'divider' },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined style={{ color: '#fff' }} />,
      danger: false,
      style: {
        color: '#fff',
        backgroundColor: themeColors.accent,
        borderRadius: '4px',
        '&:hover': {
          opacity: 0.85,
        }
      },
      onClick: () =>
        Modal.confirm({
          title: <span style={{ color: themeColors.text }}>Confirm Logout</span>,
          content: <span style={{ color: themeColors.text }}>Are you sure you want to logout?</span>,
          onOk: logout,
          centered: true,
          width: 400, // Add width property
          okButtonProps: {
            style: {
              backgroundColor: themeColors.accent,
              borderColor: themeColors.accent,
              color: '#fff'
            }
          },
          cancelButtonProps: {
            style: {
              backgroundColor: themeColors.accent,
              borderColor: themeColors.accent,
              color: '#fff',
              opacity: 1
            }
          }
        })
    }
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <Layout style={styles.layout} data-theme={isDarkMode ? 'dark' : 'light'}>
      <style>
        {styles.globalStyles}
        {`
          /* Add these styles for dropdown menu theming */
          .ant-modal {
            width: 400px !important;
          }
          
          .ant-modal .ant-modal-content {
            width: 100% !important;
          }
          
          /* Rest of your existing styles */
          .ant-dropdown .ant-dropdown-menu {
            background-color: ${themeColors.cardBg} !important;
          }
          
          .ant-dropdown .ant-dropdown-menu-item {
            color: ${themeColors.text} !important;
          }
          
          .ant-dropdown .ant-dropdown-menu-item:hover {
            background-color: ${themeColors.hover} !important;
          }
          
          .ant-dropdown .ant-dropdown-menu-item .anticon {
            color: ${themeColors.text} !important;
          }
          
          .ant-dropdown .ant-dropdown-menu-item-divider {
            background-color: ${themeColors.border} !important;
          }
          
          /* Special styling for logout menu item */
          .ant-dropdown .ant-dropdown-menu-item:last-child {
            margin: 4px 8px !important;
            border-radius: 4px !important;
          }
          
          .ant-dropdown .ant-dropdown-menu-item:last-child:hover {
            opacity: 0.85 !important;
            background-color: ${themeColors.accent} !important;
          }
          
          .ant-dropdown .ant-dropdown-menu-item:last-child .anticon {
            color: #fff !important;
          }
        `}
      </style>
      <Header style={styles.header}>
        <Space>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              color: isDarkMode ? themeColors.text : "#1890ff",
              fontSize: 18,
              width: 64,
              height: 64,
            }}
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
            display: window.innerWidth < 992 ? 'none' : 'block',
            color: isDarkMode ? themeColors.text : "#1890ff",
            fontSize: '20px',
          }}
        >
          Lecturer Dashboard
        </AntTitle>
        <AntTitle
          level={3}
          style={{
            margin: 0,
            display: window.innerWidth >= 992 ? 'none' : 'inline',
            color: isDarkMode ? themeColors.text : "#1890ff",
            fontSize: '20px',
          }}
        >
          Lecturer Dashboard
        </AntTitle>
        <Space>
          <ThemeToggle isDarkMode={isDarkMode} />
          <Dropdown menu={{ items: profileItems }} trigger={['click']}>
            <Button
              type="text"
              icon={
                <UserOutlined
                  style={{
                    fontSize: 24,
                    color: isDarkMode ? themeColors.primary : '#1890ff',
                    background: isDarkMode ? `${themeColors.primary}20` : `rgba(24, 144, 255, 0.1)`,
                    padding: isDarkMode ? '10px' : '8px',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease'
                  }}
                />
              }
              style={{
                borderRadius: '50%',
                marginLeft: 16, // Add margin between toggle and profile icon
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                const iconEl = e.currentTarget.querySelector('.anticon');
                if (iconEl) {
                  iconEl.style.background = isDarkMode
                    ? `${themeColors.primary}40`
                    : `rgba(24, 144, 255, 0.2)`;
                }
              }}
              onMouseLeave={(e) => {
                const iconEl = e.currentTarget.querySelector('.anticon');
                if (iconEl) {
                  iconEl.style.background = isDarkMode
                    ? `${themeColors.primary}20`
                    : `rgba(24, 144, 255, 0.1)`;
                }
              }}
            />
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={250}
          breakpoint="lg"
          collapsedWidth={80}
          style={styles.sider}
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
          />
        </Sider>

        <Content style={{ ...styles.content, marginLeft: collapsed ? 88 : 258 }}>
          <Spin spinning={loading} tip={loadingMessage}>
            <motion.div initial="hidden" animate="visible" variants={cardVariants}>
              <section style={{ margin: 0 }}>
                <AttendanceManagement
                  onLoadingChange={(isLoading) => {
                    setLoading(isLoading);
                    if (isLoading) setLoadingMessage('Loading attendance records...');
                  }}
                />
              </section>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={cardVariants}>
              <section style={{ margin: 0 }}>
                <Row justify="center" align="middle" style={{ marginTop: 16 }}>
                  <Col xs={12} sm={10} md={8} lg={6}>
                    <Card
                      hoverable
                      onClick={() => navigate('/lecturer/analytics')}
                      style={{
                        background: themeColors.cardGradient1,
                        borderRadius: 12,
                        overflow: 'hidden',
                        height: '100%', // Ensure consistent height
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                      bodyStyle={{ padding: '12px' }} // Reduce padding inside card
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LineChartOutlined style={{ fontSize: 20, color: themeColors.textInvert, marginRight: 8 }} />
                        <Typography.Title level={5} style={{ margin: 0, color: themeColors.textInvert, fontSize: '14px' }}>
                          Analytics
                        </Typography.Title>
                      </div>
                      <Typography.Text style={{
                        textAlign: 'center',
                        display: 'block',
                        marginTop: 4,
                        fontSize: '12px',
                        color: `${themeColors.textInvert}CC`,
                      }}>
                        View trends
                      </Typography.Text>
                    </Card>
                  </Col>
                </Row>
              </section>
            </motion.div>

            {showBackToTop && (
              <Button
                style={styles.backToTopButton}
                onMouseEnter={(e) => (e.currentTarget.style.background = isDarkMode ? '#8E86E5' : '#5A4FCF')}
                onMouseLeave={(e) => (e.currentTarget.style.background = themeColors.primary)}
                onClick={scrollToTop}
                icon={<ArrowUpOutlined />}
                shape="circle"
              />
            )}
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LecturerDashboard;