import { useState, useContext } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Switch, Button } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MessageOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import PropTypes from 'prop-types';
import logoImage from '../../assets/logo.jpg';

const { Header, Sider, Content } = Layout;

const MainLayout = ({
  children,
  menuItems = [],
  roleLabel = 'Portal',
  user = { name: 'User', role: 'Member' },
  onOpenFeedback,
  onLogout,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();

  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Account Settings',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: onLogout,
    },
  ];

  return (
    <Layout className="min-h-screen w-full">
      {/* 1. UNIFORM DARK SLATE SIDEBAR ACROSS ALL ROLES */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        collapsedWidth={72}
        theme="dark"
        className="!bg-slate-900 border-r border-slate-800 shrink-0"
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={logoImage}
                alt="QRollCall"
                className="h-7 w-auto max-h-7 rounded-md object-contain bg-white shadow-xs border border-slate-700 shrink-0 p-0.5"
              />
              {!collapsed && (
                <span className="text-white font-semibold tracking-tight text-base truncate">
                  QRollCall
                </span>
              )}
            </div>
            {!collapsed && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                {roleLabel}
              </span>
            )}
          </div>

          {/* Primary Role Navigation */}
          <div className="flex-1 overflow-y-auto py-3 px-2">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              className="!bg-transparent !border-none"
            />
          </div>

          {/* Anchored Sidebar Footer (Replaces floating Feedback button) */}
          <div className="p-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onOpenFeedback}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <MessageOutlined className="text-base shrink-0" />
              {!collapsed && <span>Send Feedback</span>}
            </button>
          </div>
        </div>
      </Sider>

      {/* 2. RIGHT WORKSPACE COLUMN (min-w-0 prevents horizontal overflow) */}
      <Layout className="flex-1 flex flex-col min-w-0">
        {/* Uniform Top Bar */}
        <Header className="!h-14 !px-6 !leading-normal bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-20">
          {/* Left: Collapse Trigger + Left-Aligned Context */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((prev) => !prev)}
              className="!flex !items-center !justify-center"
            />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
              {roleLabel} Portal
            </span>
          </div>

          {/* Right: Theme Switch, Notifications, User Profile (shrink-0 prevents clipping) */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <BulbOutlined className="text-slate-400 text-sm" />
              <Switch
                size="small"
                checked={isDarkMode}
                onChange={setIsDarkMode}
              />
            </div>

            <Badge count={0} size="small">
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined className="text-slate-600 dark:text-slate-300" />}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <button
                type="button"
                className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
              >
                <Avatar size={30} icon={<UserOutlined />} className="!bg-indigo-600 shrink-0" />
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {user.role}
                  </div>
                </div>
              </button>
            </Dropdown>
          </div>
        </Header>

        {/* 3. UNIFORM CONTENT CONTAINER */}
        <Content className="flex-1 min-w-0 overflow-x-hidden">
          <div className="max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  menuItems: PropTypes.array,
  roleLabel: PropTypes.string,
  user: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string,
  }),
  onOpenFeedback: PropTypes.func,
  onLogout: PropTypes.func,
};

export default MainLayout;