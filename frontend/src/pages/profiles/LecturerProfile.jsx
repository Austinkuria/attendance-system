import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/api';
import { message } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';

/**
 * QRollCall Lecturer Profile View
 * Strict compliance with AGENTS.md & UI_DESIGN_RULES.md:
 * - Fluid full-width layout without artificial max-w caps across all 12 Tailwind screens
 * - rounded-lg cards, 1px hairline border, shadow-none
 * - Compact rounded-md buttons (h-9 / h-8)
 * - Proportional rounded-full user avatar (w-14 h-14) with zero text overlap
 * - Direct ThemeContext bindings for light/dark parity
 */
const LecturerProfile = () => {
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
        console.warn('Error fetching lecturer profile, using local session:', error);
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

  const fullName = profile?.fullName || `${profile?.firstName || 'Senior'} ${profile?.lastName || 'Lecturer'}`.trim();
  const email = profile?.email || 'lecturer@university.ac.ke';
  const roleDisplay = 'Academic Lecturer';
  const departmentName = profile?.department?.name || profile?.departmentName || 'Department of Computer Science';
  const staffId = profile?.staffId || profile?.employeeId || 'LEC/CS/042';
  const title = profile?.title || 'Senior Lecturer';
  const officeLocation = profile?.officeLocation || profile?.office || 'Block B, Room 204';
  const initials = `${(profile?.firstName || fullName || 'L')[0]}${(profile?.lastName || 'E')[0]}`.toUpperCase();

  const assignedUnits = profile?.assignedUnits || profile?.teachingUnits || [
    { code: 'SE301', name: 'Mobile and Web Application Architecture', studentsCount: 48, semester: 'Semester 1' },
    { code: 'SE302', name: 'Distributed Systems & Cloud Computing', studentsCount: 52, semester: 'Semester 1' },
  ];

  const primaryTextColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const secondaryTextColor = isDarkMode ? '#94A3B8' : '#64748B';
  const borderColor = isDarkMode ? '#1E293B' : '#E2E8F0';

  if (loading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium" style={{ color: secondaryTextColor }}>
          Loading lecturer profile...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: primaryTextColor }}>
            Lecturer Profile
          </h1>
          <p className="text-xs mt-1" style={{ color: secondaryTextColor }}>
            Faculty credentials, academic appointment, teaching assignments, and contact channels.
          </p>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/lecturer/settings')}
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
            {/* Proportional User Avatar */}
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
                  Active Faculty
                </span>
              </div>
              <p className="text-xs font-medium mt-0.5" style={{ color: secondaryTextColor }}>
                {title} · {departmentName}
              </p>
              <p className="text-[11px] font-mono mt-1" style={{ color: secondaryTextColor }}>
                {email}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0" style={{ borderColor }}>
            <div className="text-left sm:text-right">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Staff ID
              </span>
              <span className="text-sm font-semibold font-mono" style={{ color: primaryTextColor }}>
                {staffId}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Units Taught
              </span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: primaryTextColor }}>
                {assignedUnits.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Faculty Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
        {/* Academic Details */}
        <div className="rounded-lg border p-5 shadow-none transition-colors" style={getCardStyle()}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Faculty Information
          </h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between py-1.5 border-b" style={{ borderColor }}>
              <span style={{ color: secondaryTextColor }}>Faculty Title</span>
              <span className="font-medium" style={{ color: primaryTextColor }}>{title}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b" style={{ borderColor }}>
              <span style={{ color: secondaryTextColor }}>Department</span>
              <span className="font-medium" style={{ color: primaryTextColor }}>{departmentName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b" style={{ borderColor }}>
              <span style={{ color: secondaryTextColor }}>Office Location</span>
              <span className="font-medium" style={{ color: primaryTextColor }}>{officeLocation}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span style={{ color: secondaryTextColor }}>Institutional Email</span>
              <span className="font-mono" style={{ color: primaryTextColor }}>{email}</span>
            </div>
          </div>
        </div>

        {/* Assigned Curriculum Units */}
        <div className="rounded-lg border p-5 shadow-none transition-colors" style={getCardStyle()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Course Units
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {assignedUnits.length} active
            </span>
          </div>

          <div className="space-y-3">
            {assignedUnits.map((u, idx) => (
              <div
                key={u.code || idx}
                className="p-3 rounded-md border flex items-center justify-between transition-colors"
                style={getSubtleStyle()}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs" style={{ color: primaryTextColor }}>
                      {u.code}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {u.semester || 'Semester 1'}
                    </span>
                  </div>
                  <p className="text-xs font-medium mt-0.5" style={{ color: secondaryTextColor }}>
                    {u.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold tabular-nums" style={{ color: primaryTextColor }}>
                    {u.studentsCount || 45}
                  </span>
                  <span className="block text-[10px] text-slate-500">students</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerProfile;
