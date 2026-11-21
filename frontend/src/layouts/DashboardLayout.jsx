import { useState, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Avatar, Dropdown, Badge, Switch } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BookOutlined,
  UserOutlined,
  BarChartOutlined,
  HistoryOutlined,
  SettingOutlined,
  MessageOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  ApartmentOutlined,
  FileTextOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { ThemeContext } from '../context/ThemeContext';
import SystemFeedbackModal from '../components/SystemFeedbackModal';
import logoImage from '../assets/logo.jpg';

/**
 * Single Master Shell (AppShell / DashboardLayout).
 * Unified layout across all roles: Student, Lecturer, Dept Admin, Super Admin.
 * - Dark slate sidebar with clean muted role badge
 * - White/slate-50 right column with mandatory min-w-0
 * - Top header with left-aligned breadcrumbs and right-aligned profile chip
 * - Footer with Settings and Feedback links (no floating bottom-left button)
 */
const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve current user profile
  const user = useMemo(() => {
    try {
      return (
        JSON.parse(localStorage.getItem('userData')) ||
        JSON.parse(localStorage.getItem('user')) ||
        {}
      );
    } catch {
      return {};
    }
  }, []);

  // Determine user role and corresponding badge
  const role = useMemo(() => {
    const rawRole = (user.role || '').toLowerCase();
    if (rawRole === 'super_admin') return 'super_admin';
    if (rawRole === 'admin' || rawRole === 'department_admin') return 'admin';
    if (rawRole === 'lecturer') return 'lecturer';
    if (rawRole === 'student') return 'student';

    // Fallback based on pathname if role is missing in storage
    const path = location.pathname;
    if (path.startsWith('/super-admin')) return 'super_admin';
    if (path.startsWith('/admin') || path.startsWith('/department-admin')) return 'admin';
    if (path.startsWith('/lecturer')) return 'lecturer';
    return 'student';
  }, [user.role, location.pathname]);

  const roleMeta = useMemo(() => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', defaultPath: '/super-admin' };
      case 'admin':
        return { label: 'Dept Admin', defaultPath: '/admin' };
      case 'lecturer':
        return { label: 'Lecturer', defaultPath: '/lecturer-dashboard' };
      default:
        return { label: 'Student', defaultPath: '/student-dashboard' };
    }
  }, [role]);

  // Main navigation items per role (Feedback and Settings moved to footer)
  const navItems = useMemo(() => {
    switch (role) {
      case 'super_admin':
        return [
          { key: '/super-admin', label: 'Dashboard', icon: <DashboardOutlined /> },
          { key: '/super-admin/departments', label: 'Departments', icon: <ApartmentOutlined /> },
          { key: '/super-admin/admins', label: 'Dept Admins', icon: <TeamOutlined /> },
          { key: '/super-admin/users', label: 'All Users', icon: <UserOutlined /> },
          { key: '/super-admin/reports', label: 'Reports', icon: <FileTextOutlined /> },
          { key: '/super-admin/logs', label: 'Activity Logs', icon: <HistoryOutlined /> },
        ];
      case 'admin':
        return [
          { key: '/admin', label: 'Dashboard', icon: <DashboardOutlined /> },
          { key: '/admin/manage-students', label: 'Students', icon: <TeamOutlined /> },
          { key: '/admin/manage-courses', label: 'Courses', icon: <BookOutlined /> },
          { key: '/admin/manage-lecturers', label: 'Lecturers', icon: <UserOutlined /> },
          { key: '/admin/analytics', label: 'Analytics', icon: <BarChartOutlined /> },
        ];
      case 'lecturer':
        return [
          { key: '/lecturer-dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
          { key: '/lecturer/past-attendance', label: 'Past Sessions', icon: <HistoryOutlined /> },
          { key: '/lecturer/analytics', label: 'Analytics', icon: <BarChartOutlined /> },
        ];
      default:
        return [
          { key: '/student-dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
          { key: '/student/attendance-trends', label: 'Trends', icon: <BarChartOutlined /> },
        ];
    }
  }, [role]);

  // Settings path per role
  const settingsPath = useMemo(() => {
    switch (role) {
      case 'super_admin':
        return '/super-admin/settings';
      case 'admin':
        return '/admin/settings';
      case 'lecturer':
        return '/lecturer/settings';
      default:
        return '/student/settings';
    }
  }, [role]);

  // Breadcrumb segments based on active path
  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    const parts = [roleMeta.label];

    if (path.includes('manage-students')) parts.push('Students');
    else if (path.includes('manage-courses')) parts.push('Courses');
    else if (path.includes('manage-lecturers')) parts.push('Lecturers');
    else if (path.includes('departments')) parts.push('Departments');
    else if (path.includes('admins')) parts.push('Dept Admins');
    else if (path.includes('users')) parts.push('Users');
    else if (path.includes('analytics')) parts.push('Analytics');
    else if (path.includes('trends')) parts.push('Attendance Trends');
    else if (path.includes('past-attendance')) parts.push('Past Sessions');
    else if (path.includes('settings')) parts.push('Settings');
    else if (path.includes('profile')) parts.push('Profile');
    else if (path.includes('reports')) parts.push('Reports');
    else if (path.includes('logs')) parts.push('Activity Logs');
    else parts.push('Overview');

    return parts;
  }, [location.pathname, roleMeta.label]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/auth/login');
  };

  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate(settingsPath),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const displayName =
    user.fullName ||
    (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name) ||
    roleMeta.label;

  const isNavActive = (key) => {
    if (key === '/admin' || key === '/super-admin') {
      return location.pathname === key || location.pathname === `${key}/dashboard`;
    }
    return location.pathname === key || location.pathname.startsWith(`${key}/`);
  };

  return (
    <div className="flex min-h-screen w-full bg-canvas-dots transition-colors" style={{ color: 'var(--text-primary)' }}>
      {/* Left Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } shrink-0 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-all duration-200 z-30 select-none`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <Link
            to={roleMeta.defaultPath}
            className="flex items-center gap-2.5 no-underline text-white font-semibold tracking-tight text-base group"
            aria-label="QRollCall Home"
          >
            <img
              src={logoImage}
              alt="QRollCall"
              className="h-8 w-auto max-h-8 rounded-md object-contain bg-[#0B0F17] shadow-xs border border-slate-700 shrink-0 p-0.5"
            />
          </Link>
          {!collapsed && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 uppercase tracking-wider shrink-0">
              {roleMeta.label}
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isNavActive(item.key);
            return (
              <Link
                key={item.key}
                to={item.key}
                className={`no-underline px-3 py-2 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${
                  active
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-base shrink-0 flex items-center justify-center">
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Settings and Feedback links */}
        <div className="mt-auto p-3 border-t border-slate-800 space-y-1 shrink-0">
          <Link
            to={settingsPath}
            className={`no-underline px-3 py-2 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${
              location.pathname === settingsPath
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title={collapsed ? 'Settings' : undefined}
          >
            <span className="text-base shrink-0 flex items-center justify-center">
              <SettingOutlined />
            </span>
            {!collapsed && <span className="truncate">Settings</span>}
          </Link>

          <button
            type="button"
            onClick={() => setFeedbackModalOpen(true)}
            className="w-full text-left bg-transparent border-0 cursor-pointer px-3 py-2 rounded-md text-sm font-medium flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={collapsed ? 'Feedback' : undefined}
          >
            <span className="text-base shrink-0 flex items-center justify-center">
              <MessageOutlined />
            </span>
            {!collapsed && <span className="truncate">Feedback</span>}
          </button>
        </div>
      </aside>

      {/* Right Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          {/* Left: Collapse toggle + Left-aligned breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-700 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Toggle Sidebar"
            >
              {collapsed ? (
                <MenuUnfoldOutlined className="text-base" />
              ) : (
                <MenuFoldOutlined className="text-base" />
              )}
            </button>
            <nav className="flex items-center text-sm truncate" aria-label="Breadcrumb">
              <span className="text-slate-600 font-semibold">{breadcrumbs[0]}</span>
              <span className="mx-2 text-slate-400 font-bold">/</span>
              <span className="font-bold text-slate-900 truncate">{breadcrumbs[1]}</span>
            </nav>
          </div>

          {/* Right: Theme Toggle, Notifications, User Chip */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="flex items-center gap-1.5" title="Toggle dark mode">
              <BulbOutlined className="text-slate-400 text-sm" />
              <Switch
                checked={isDarkMode}
                onChange={(checked) => setIsDarkMode(checked)}
                size="small"
              />
            </div>

            <Badge count={0} offset={[-2, 2]}>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center"
                aria-label="Notifications"
              >
                <BellOutlined className="text-base" />
              </button>
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow trigger={['click']}>
              <div className="flex items-center gap-2.5 cursor-pointer pl-1 py-1 rounded-md hover:bg-slate-50 transition-colors shrink-0">
                <Avatar
                  size={32}
                  className="bg-slate-900 text-white font-semibold text-xs shrink-0 flex items-center justify-center"
                >
                  {(displayName[0] || 'U').toUpperCase()}
                </Avatar>
                <div className="hidden sm:flex flex-col text-left leading-tight max-w-[140px] truncate shrink-0">
                  <span className="text-xs font-semibold text-slate-900 truncate">{displayName}</span>
                  <span className="text-[11px] text-slate-500 truncate">{roleMeta.label}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="w-full px-3 2xs:px-4 xs:px-5 sm:px-6 md:px-8 md-sm:px-9 lg:px-10 xl:px-12 xl-lg:px-14 2xl:px-16 2xl-md:px-20 2xl-lg:px-24 3xl:px-32 py-6 space-y-6 min-w-0">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Global Feedback Modal initiated from sidebar footer */}
      {feedbackModalOpen && (
        <SystemFeedbackModal
          visible={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
        />
      )}
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node,
};

export const AppShell = DashboardLayout;
export default DashboardLayout;
