import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Switch } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    BankOutlined,
    TeamOutlined,
    UserOutlined,
    BarChartOutlined,
    FileTextOutlined,
    SettingOutlined,
    LogoutOutlined,
    BellOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BulbOutlined,
} from '@ant-design/icons';
import './SuperAdminLayout.css';

const { Header, Sider, Content } = Layout;

const SuperAdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Menu items
    const menuItems = [
        {
            key: '/super-admin',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/super-admin/departments',
            icon: <BankOutlined />,
            label: 'Departments',
        },
        {
            key: '/super-admin/admins',
            icon: <TeamOutlined />,
            label: 'Dept. Admins',
        },
        {
            key: '/super-admin/users',
            icon: <UserOutlined />,
            label: 'All Users',
        },
        {
            key: '/super-admin/reports',
            icon: <BarChartOutlined />,
            label: 'Reports',
        },
        {
            key: '/super-admin/logs',
            icon: <FileTextOutlined />,
            label: 'Activity Logs',
        },
        {
            key: '/super-admin/settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
    ];

    // User dropdown menu
    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'My Profile',
            onClick: () => navigate('/super-admin/profile'),
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Account Settings',
            onClick: () => navigate('/super-admin/account'),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true,
            onClick: handleLogout,
        },
    ];

    function handleLogout() {
        localStorage.clear();
        navigate('/login');
    }

    const handleMenuClick = ({ key }) => {
        navigate(key);
    };

    const toggleDarkMode = (checked) => {
        setDarkMode(checked);
        // You can implement dark mode theme switching here
        document.body.setAttribute('data-theme', checked ? 'dark' : 'light');
    };

    return (
        <Layout className={`super-admin-layout ${darkMode ? 'dark-mode' : ''}`}>
            {/* Sidebar */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                className="super-admin-sider"
                width={250}
            >
                {/* Logo */}
                <div className="logo">
                    {collapsed ? (
                        <h2>QR</h2>
                    ) : (
                        <h2>QRollCall Admin</h2>
                    )}
                </div>

                {/* Menu */}
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Sider>

            {/* Main Layout */}
            <Layout>
                {/* Header */}
                <Header className="super-admin-header">
                    <div className="header-left">
                        {/* Collapse Button */}
                        <div className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        </div>

                        {/* Page Title */}
                        <h3 className="page-title">
                            {menuItems.find((item) => item.key === location.pathname)?.label || 'Dashboard'}
                        </h3>
                    </div>

                    <div className="header-right">
                        {/* Dark Mode Toggle */}
                        <div className="dark-mode-toggle">
                            <BulbOutlined />
                            <Switch
                                checked={darkMode}
                                onChange={toggleDarkMode}
                                size="small"
                            />
                        </div>

                        {/* Notifications */}
                        <Badge count={5} offset={[-5, 5]}>
                            <BellOutlined className="header-icon" />
                        </Badge>

                        {/* User Dropdown */}
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                            <div className="user-info">
                                <Avatar
                                    size="default"
                                    style={{ backgroundColor: '#667eea' }}
                                    icon={<UserOutlined />}
                                >
                                    {user.firstName?.[0]}
                                </Avatar>
                                {!collapsed && (
                                    <div className="user-details">
                                        <span className="user-name">{user.fullName || 'Super Admin'}</span>
                                        <span className="user-role">{user.role || 'super_admin'}</span>
                                    </div>
                                )}
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                {/* Content */}
                <Content className="super-admin-content">
                    <div className="content-wrapper">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default SuperAdminLayout;
