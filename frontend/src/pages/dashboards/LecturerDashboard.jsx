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
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768); // Collapse by default on smaller screens
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
      height: '64px', // Fixed height for header
      left: 0, // Ensure header is aligned to the left edge
      top: 0, // Ensure header is at the top
    },
    sider: {
      background: themeColors.cardBg,
      position: 'fixed',
      height: 'calc(100vh - 64px)',
      overflow: 'auto',
      zIndex: 5,  // Lower z-index than header
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
      top: 64, // Position exactly below header
      left: 0, // Align to left edge
      marginTop: 0, // Remove any margin
    },
    content: {
      margin: '64px 0 0',
      padding: 0,
      background: themeColors.background,
      minHeight: 'calc(100vh - 64px)',
      overflow: 'initial', // Changed from 'auto' to prevent nested scrollbars
      transition: 'margin-left 0.3s ease-in-out',
      position: 'relative', // Add position relative
      zIndex: 1, // Lower z-index than sider
    },
    backToTopButton: {
      position: 'fixed',
      bottom: 32,
      right: 32,
      zIndex: 1000,
      background: themeColors.primary,
      borderColor: themeColors.primary,
      color: '#fff !important',
      width: 40,  // Fixed width
      height: 40, // Fixed height to match width
      minWidth: 40, // Prevent resizing
      minHeight: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
      padding: 0, // Remove padding that might affect shape
      borderRadius: '50%', // Ensure perfect circle
    },
    globalStyles: `
      .ant-layout, .ant-layout-content {
        background: ${themeColors.background} !important;
        padding: 0 !important;
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
        .ant-layout-content { margin-left: 48px !important; } /* Update to match new collapsedWidth */
      }
      @media (max-width: 768px) {
        .lecturer-content {
          padding: 0;
        }
      }
      @media (max-width: 576px) {
        .lecturer-content {
          padding: 0;
          margin: 0;
        }
        .ant-layout-content {
          padding: 0 !important;
          margin: 64px 0 0 0 !important;
          width: 100vw !important;
          overflow-x: hidden !important;
        }
        .ant-btn { padding: 4px 12px !important; }
      }
      @media (max-width: 400px) {
        .lecturer-content {
          padding: 0 0px;
          margin-right: 0;
          margin-bottom: 0;
        }
      }
      /* Fix content area on small screens */
      @media (max-width: 767px) {
        .ant-layout-sider {
          position: fixed !important;
          z-index: 1001 !important; /* Above everything else */
          height: calc(100vh - 64px) !important;
          overflow-y: auto !important;
          transition: all 0.3s ease !important;
          top: 64px !important;
          left: 0 !important;
        }
        
        .ant-layout-sider-collapsed {
          transform: translateX(-100%) !important;
          box-shadow: none !important;
        }
        
        .ant-layout-content {
          margin-left: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
        
        /* Hamburger menu always visible on mobile */
        .mobile-menu-button {
          display: block !important;
          position: fixed !important;
          z-index: 1001 !important;
          top: 12px !important;
          left: 12px !important;
        }
      }
      
      /* Optimize for very small screens */
      @media (max-width: 359px) {
        .ant-layout-header {
          padding: 0 8px !important;
        }
        
        .ant-typography {
          font-size: 16px !important;
        }
        
        .ant-btn {
          padding: 0 8px !important;
        }
      }
      /* Fix margin between header and sidebar */
      .ant-layout {
        background: ${themeColors.background} !important;
      }
      
      .ant-layout-sider {
        margin-top: 0 !important;  /* Remove any margin from the sider */
      }
      
      .ant-layout-header {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      
      /* Fix for sidebar positioning on mobile/tablet */
      @media (max-width: 767px) {
        .ant-layout-sider {
          position: fixed !important;
          z-index: 1001 !important;
          height: calc(100vh - 64px) !important;
          top: 64px !important;
          left: 0 !important;
          margin: 0 !important;
          border-top: none !important;
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

  // Optimize resize handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else if (window.innerWidth > 1200) {
        setCollapsed(false);
      }
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

  // Handle loading state from AttendanceManagement component
  const handleAttendanceLoadingChange = (isLoading) => {
    setLoading(isLoading);
    if (isLoading) {
      setLoadingMessage('Loading attendance records...');
    }
  };

  // Calculate correct sider width for content position
  const contentMarginLeft = window.innerWidth < 768 ? 0 : (collapsed ? 48 : 250);

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

          /* Mobile overlay when menu is open */
          .menu-overlay {
            position: fixed;
            top: 64px;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.5);
            z-index: 1000;
            display: none;
          }
          
          @media (max-width: 767px) {
            .menu-overlay.visible {
              display: block;
            }
          }

          /* Fix content area on small screens */
          @media (max-width: 767px) {
            .ant-layout-content {
              margin-left: 0 !important;
              width: 100vw !important;
            }
          }

          /* Improved responsive styles for summary cards */
          @media (max-width: 575px) {
            .ant-card .ant-statistic-title {
              margin-bottom: 2px !important;
            }
            
            .ant-row .ant-col {
              padding: 4px !important;
            }
            
            .ant-card {
              border-radius: 8px !important;
            }
            
            .ant-statistic {
              min-height: 40px !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
            }
          }
          /* Fix layout and alignment issues */
          .ant-layout {
            min-height: 100vh !important;
          }
          
          .ant-layout-header {
            padding: 0 16px !important;
            width: 100% !important;
            left: 0 !important;
            top: 0 !important;
          }
          
          .ant-layout-sider {
            top: 64px !important;
            left: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Remove any unwanted margins */
          .ant-layout-sider-children {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Fix content positioning */
          .ant-layout-content {
            margin-top: 64px !important;
            margin-left: ${contentMarginLeft}px !important;
            background: ${themeColors.background} !important;
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
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="mobile-menu-button"
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

      {/* Add overlay div for mobile that closes menu when clicked */}
      {!collapsed && window.innerWidth < 768 && (
        <div
          className="menu-overlay visible"
          onClick={() => setCollapsed(true)}
        />
      )}

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={250}
          breakpoint="lg"
          collapsedWidth={window.innerWidth < 768 ? 0 : 48} // Zero width on mobile when collapsed
          style={{
            ...styles.sider,
            display: window.innerWidth < 768 && collapsed ? 'none' : 'block',
            marginTop: 0, // Explicitly remove margin
          }}
          trigger={null} // Remove the default trigger
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

        <Content style={{
          ...styles.content,
          marginLeft: contentMarginLeft,
          marginTop: 64, // Fixed top margin to account for header
          padding: window.innerWidth < 576 ? '0' : '0 8px',
          width: `calc(100% - ${contentMarginLeft}px)`,
          overflowX: 'hidden',  // Prevent horizontal scroll
        }}>
          <Spin spinning={loading} tip={loadingMessage}>
            <motion.div initial="hidden" animate="visible" variants={cardVariants}>
              <section style={{ margin: 0, padding: 0 }}>
                <AttendanceManagement
                  onLoadingChange={handleAttendanceLoadingChange}
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
                icon={<ArrowUpOutlined style={{ fontSize: 16 }} />} // Control icon size
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