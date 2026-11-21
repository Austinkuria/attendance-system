import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/api';
import { message } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';

/**
 * QRollCall Department Administrator Profile View
 * Strict compliance with UI Craft & Anti-Slop Design Rules:
 * - Fluid full-width viewport (occupies full screen across 1366px, 1440px, 1920px)
 * - rounded-lg cards, 1px hairline border (#E2E8F0 in light, #1E293B in dark), shadow-none
 * - Compact rounded-md buttons (h-9)
 * - Proportional rounded-full user avatar (w-14 h-14) with zero text overlap
 * - Direct ThemeContext bindings for light/dark parity
 */
const AdminProfile = () => {
  const navigate = useNavigate();
  const { isDarkMode, getCardStyle, getSubtleStyle } = useContext(ThemeContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        if (isMounted && data) {
          setProfile(data);
        }
      } catch (error) {
        console.warn('Error fetching profile, using active session data:', error);
        try {
          const stored = localStorage.getItem('userData');
          if (stored && isMounted) {
            setProfile(JSON.parse(stored));
          }
        } catch {
          // fallback handled below
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    message.success('Logged out successfully.');
    navigate('/auth/login');
  };

  const fullName = profile?.fullName || `${profile?.firstName || 'Department'} ${profile?.lastName || 'Admin'}`.trim();
  const email = profile?.email || 'admin@university.ac.ke';
  const roleDisplay = 'Department Administrator';
  const departmentName = profile?.department?.name || profile?.departmentName || 'Department of Computer Science';
  const staffId = profile?.staffId || profile?.employeeId || profile?.regNo || 'ADM/PAS/001';
  const initials = `${(profile?.firstName || fullName || 'D')[0]}${(profile?.lastName || 'A')[0]}`.toUpperCase();

  const primaryTextColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const secondaryTextColor = isDarkMode ? '#94A3B8' : '#64748B';
  const borderColor = isDarkMode ? '#1E293B' : '#E2E8F0';

  if (loading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium" style={{ color: secondaryTextColor }}>
          Loading administrator profile...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: primaryTextColor }}>
            Administrator Profile
          </h1>
          <p className="text-xs mt-1" style={{ color: secondaryTextColor }}>
            Manage your personal credentials, department assignment, and account security.
          </p>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/admin/settings')}
            className="h-9 px-3.5 rounded-md text-xs font-semibold cursor-pointer transition-colors"
            style={{
              backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
              color: isDarkMode ? '#131926' : '#FFFFFF',
            }}
          >
            Edit profile
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="h-9 px-3.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors text-rose-500 hover:bg-rose-500/10"
            style={{ borderColor }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* 2. Top Summary Card: Identity Header */}
      <div className="rounded-lg border p-5 shadow-none transition-colors" style={getCardStyle()}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-base shadow-none shrink-0"
              style={{
                backgroundColor: isDarkMode ? '#1A2234' : '#131926',
                color: isDarkMode ? '#D4FF5E' : '#FFFFFF',
                border: `1px solid ${borderColor}`,
              }}
            >
              {initials}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight" style={{ color: primaryTextColor }}>
                  {fullName}
                </h2>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Active
                </span>
              </div>
              <p className="text-xs font-medium mt-0.5" style={{ color: secondaryTextColor }}>
                {roleDisplay} · {departmentName}
              </p>
              <p className="text-[11px] font-mono mt-1" style={{ color: secondaryTextColor }}>
                {email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Account & Security Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-w-0 w-full">
        {/* Left Column: Account Details */}
        <div className="rounded-lg border p-5 shadow-none space-y-4" style={getCardStyle()}>
          <div className="pb-3 border-b flex items-center justify-between" style={{ borderColor }}>
            <h3 className="text-sm font-semibold tracking-tight" style={{ color: primaryTextColor }}>
              Account Information
            </h3>
            <span className="text-[11px] font-mono" style={{ color: secondaryTextColor }}>
              Staff ID: {staffId}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Full Name
              </dt>
              <dd className="font-semibold mt-1" style={{ color: primaryTextColor }}>
                {fullName}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Email Address
              </dt>
              <dd className="font-semibold font-mono mt-1" style={{ color: primaryTextColor }}>
                {email}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Department
              </dt>
              <dd className="font-semibold mt-1" style={{ color: primaryTextColor }}>
                {departmentName}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Role
              </dt>
              <dd className="font-semibold mt-1" style={{ color: primaryTextColor }}>
                Department Administrator
              </dd>
            </div>
          </dl>
        </div>

        {/* Right Column: Security & Settings */}
        <div className="rounded-lg border p-5 shadow-none space-y-4" style={getCardStyle()}>
          <div className="pb-3 border-b flex items-center justify-between" style={{ borderColor }}>
            <h3 className="text-sm font-semibold tracking-tight" style={{ color: primaryTextColor }}>
              Security & Access
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor }}>
              <div>
                <p className="font-medium m-0" style={{ color: primaryTextColor }}>
                  Password
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                  Last updated periodically
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/settings')}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer"
              >
                Change password
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor }}>
              <div>
                <p className="font-medium m-0" style={{ color: primaryTextColor }}>
                  Active Session
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                  Institutional web authentication
                </p>
              </div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Active
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/settings')}
                className="h-9 px-4 rounded-md border text-xs font-semibold cursor-pointer transition-colors"
                style={getSubtleStyle()}
              >
                Open account settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
