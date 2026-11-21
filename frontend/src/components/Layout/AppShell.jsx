import { useContext, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import ThemeToggle from '../ThemeToggle';
import BrandLogo from '../BrandLogo';

/**
 * QRollCall Design 2 Unified Fluid AppShell
 * Complies strictly with UI Craft & Anti-Slop Design Rules:
 * - h-14 header bar with clean flat text links flush with bottom border (border-b-2 on active)
 * - rounded-md role badge, rounded-lg dropdown panel (shadow-none)
 * - rounded-full strictly for user avatar (w-8 h-8) and status indicator dots
 * - Direct ThemeContext bindings via CSS variables
 */
const AppShell = ({
  role = 'student',
  navLinks = [],
  user: userProp = null,
  children,
}) => {
  const { isDarkMode, getCardStyle, getSubtleStyle } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setIsMobileDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Automatically close mobile navigation drawer when the route changes
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    localStorage.clear();
    sessionStorage.clear();
    navigate('/auth/login');
  };

  let user = userProp;
  if (!user) {
    try {
      const stored = localStorage.getItem('userData');
      if (stored) user = JSON.parse(stored);
    } catch {
      // Fallback
    }
  }

  const roleLabelMap = {
    student: 'STUDENT',
    lecturer: 'LECTURER',
    department_admin: 'DEPT ADMIN',
    admin: 'DEPT ADMIN',
    super_admin: 'SUPER ADMIN',
  };

  const roleDisplay = roleLabelMap[role] || (role ? role.toUpperCase() : 'USER');
  const fullName = user?.fullName || `${user?.firstName || 'User'} ${user?.lastName || ''}`.trim() || 'User';
  const initial = (user?.firstName || fullName || 'U')[0].toUpperCase();

  const handleSettingsClick = () => {
    if (role === 'student') navigate('/student/settings');
    else if (role === 'lecturer') navigate('/lecturer/settings');
    else if (role === 'super_admin') navigate('/super-admin');
    else navigate('/admin/settings');
  };

  const homePath =
    role === 'student'
      ? '/student-dashboard'
      : role === 'lecturer'
      ? '/lecturer-dashboard'
      : role === 'super_admin'
      ? '/super-admin'
      : '/admin';

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden flex flex-col transition-colors duration-150 bg-canvas-dots"
      style={{
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Navigation Header Bar (h-14) */}
      <header
        className="sticky top-0 z-40 w-full border-b transition-colors backdrop-blur-md"
        style={{
          backgroundColor: isDarkMode ? 'rgba(11, 15, 23, 0.95)' : 'rgba(245, 245, 245, 0.95)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="w-full px-3 2xs:px-4 xs:px-5 sm:px-6 md:px-8 md-sm:px-9 lg:px-10 xl:px-12 xl-lg:px-14 2xl:px-16 2xl-md:px-20 2xl-lg:px-24 3xl:px-32 h-14 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Brand and Flat Navigation Links */}
          <div className="flex items-center gap-2 xs:gap-4 sm:gap-8 min-w-0 h-full">
            {/* Standard Mobile Drawer Hamburger Toggle (Screens 475px and below: xs:hidden) */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="xs:hidden w-8 h-8 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0"
              style={getSubtleStyle()}
              aria-label="Open navigation menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo + Monogram + Wordmark */}
            <NavLink
              to={homePath}
              className="flex items-center !no-underline group shrink-0"
              aria-label="QRollCall Home"
            >
              <BrandLogo size="md" clickable={false} />
            </NavLink>

            {/* Flat Text Navigation Links (Visible on screens >= 475px: hidden xs:flex) */}
            <nav className="hidden xs:flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar h-full">
              {navLinks.map((link) => {
                const isActive =
                  link.to &&
                  (location.pathname === link.to ||
                    (link.aliases && link.aliases.includes(location.pathname)));

                if (link.to) {
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className="h-full flex items-center px-3 text-xs sm:text-sm font-medium transition-colors !no-underline whitespace-nowrap relative border-b-2"
                      style={{
                        borderColor: isActive
                          ? isDarkMode
                            ? '#D4FF5E'
                            : '#0F172A'
                          : 'transparent',
                        color: isActive
                          ? isDarkMode
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDarkMode
                          ? '#94A3B8'
                          : '#64748B',
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      {link.label}
                    </NavLink>
                  );
                }

                return (
                  <button
                    key={link.label}
                    type="button"
                    onClick={link.onClick}
                    className="h-full flex items-center px-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer border-b-2 border-transparent"
                    style={{
                      color: isDarkMode ? '#94A3B8' : '#64748B',
                    }}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Section: Theme Toggle, User Avatar Chip */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            {/* User Avatar Chip with Interactive Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-2 py-1 rounded-md border transition-colors cursor-pointer text-left"
                style={getSubtleStyle()}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
                title="Account menu"
              >
                <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
                  <span
                    className="text-xs font-semibold max-w-[130px] truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {fullName}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider font-medium text-slate-400"
                  >
                    {roleDisplay}
                  </span>
                </div>

                {/* Neon Lime Circle Avatar (permitted rounded-full) */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#D4FF5E] text-[#131926] font-bold text-xs flex items-center justify-center">
                  {initial}
                </div>
              </button>

              {/* Profile Popover Dropdown (rounded-lg, shadow-none, 1px border) */}
              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-lg border p-2 z-50 transition-all shadow-none"
                  style={getCardStyle()}
                >
                  <div
                    className="px-3 py-2.5 border-b"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {fullName}
                    </p>
                    <p className="text-[11px] truncate mt-0.5 text-slate-500 dark:text-slate-400">
                      {user?.email || 'user@university.ac.ke'}
                    </p>
                    <div className="mt-1.5 inline-block">
                      <span
                        className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border"
                        style={getSubtleStyle()}
                      >
                        {roleDisplay}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleSettingsClick();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left hover:bg-slate-500/10"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <svg className="w-4 h-4 shrink-0 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Manage account & settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left text-rose-500 hover:bg-rose-500/10"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sliding Navigation Drawer (Active on screens <= 475px: xs:hidden) */}
      {isMobileDrawerOpen && (
        <div className="xs:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sliding Panel */}
          <div
            className="relative w-72 max-w-[82vw] h-full flex flex-col justify-between border-r shadow-none z-10 transition-transform duration-200 ease-in-out"
            style={getCardStyle()}
          >
            {/* Drawer Header & Content */}
            <div>
              <div
                className="h-14 px-4 flex items-center justify-between border-b shrink-0"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <BrandLogo size="md" clickable={false} />
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-md border flex items-center justify-center transition-colors cursor-pointer"
                  style={getSubtleStyle()}
                  aria-label="Close navigation menu"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Profile Bar */}
              <div
                className="p-4 border-b space-y-2 shrink-0"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#D4FF5E] text-[#131926] font-bold text-sm flex items-center justify-center shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-semibold truncate leading-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {fullName}
                    </p>
                    <p className="text-[11px] truncate text-slate-500 dark:text-slate-400 mt-0.5">
                      {user?.email || 'user@university.ac.ke'}
                    </p>
                  </div>
                </div>
                <div className="inline-block">
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border"
                    style={getSubtleStyle()}
                  >
                    {roleDisplay}
                  </span>
                </div>
              </div>

              {/* Navigation Links Roster */}
              <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
                {navLinks.map((link) => {
                  const isActive =
                    link.to &&
                    (location.pathname === link.to ||
                      (link.aliases && link.aliases.includes(location.pathname)));

                  if (link.to) {
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors !no-underline ${
                          isActive
                            ? isDarkMode
                              ? 'bg-[#D4FF5E] text-[#131926]'
                              : 'bg-[#131926] text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-500/10'
                        }`}
                      >
                        <span>{link.label}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </NavLink>
                    );
                  }

                  return (
                    <button
                      key={link.label}
                      type="button"
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        if (link.onClick) link.onClick();
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-500/10 transition-colors text-left cursor-pointer"
                    >
                      <span>{link.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div
              className="p-3 border-t space-y-1.5 shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  handleSettingsClick();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left hover:bg-slate-500/10"
                style={{ color: 'var(--text-primary)' }}
              >
                <svg className="w-4 h-4 shrink-0 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Account Settings</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer text-left text-rose-500 hover:bg-rose-500/10"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fluid Main Content Viewport Container leveraging full Tailwind screens */}
      <main className="flex-1 w-full px-3 2xs:px-4 xs:px-5 sm:px-6 md:px-8 md-sm:px-9 lg:px-10 xl:px-12 xl-lg:px-14 2xl:px-16 2xl-md:px-20 2xl-lg:px-24 3xl:px-32 py-6 space-y-6 min-w-0">
        {children}
      </main>
    </div>
  );
};

AppShell.propTypes = {
  role: PropTypes.oneOf(['student', 'lecturer', 'department_admin', 'admin', 'super_admin']),
  navLinks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
      href: PropTypes.string,
      onClick: PropTypes.func,
      aliases: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  user: PropTypes.object,
  children: PropTypes.node,
};

export default AppShell;
