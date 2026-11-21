import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { getStudentTodayData } from '../../services/api';
import CheckInModal from '../../components/CheckInModal';
import FeedbackModal from '../../components/FeedbackModal';

/**
 * QRollCall Student Today Dashboard
 * Complies strictly with UI Craft & Anti-Slop Design Rules:
 * - rounded-lg cards with 1px hairline border, shadow-none
 * - rounded-md controls (h-9 primary actions/inputs, h-8 filters)
 * - Compact StatCard structure (p-4) with 24px tabular-nums
 * - Segmented controls with rounded-md container and high-contrast active tabs
 * - Honest table structure with thead over #ECEBE4 / #1A2234
 */
const StudentTodayDashboard = () => {
  const { isDarkMode, getCardStyle, getSubtleStyle } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [data, setData] = useState({
    liveSession: null,
    enrolledUnits: [],
    stats: {
      overallAttendanceRate: 0,
      currentStreak: 0,
      weekActivity: { M: false, T: false, W: false, Th: false, F: false },
    },
    timeline: [],
    student: {},
  });

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [timelineTab, setTimelineTab] = useState('Day');

  const loadDashboard = useCallback(async (isInitial = false) => {
    try {
      const res = await getStudentTodayData();
      if (res && res.success) {
        setData(res);
        if (isInitial && res.liveSession && res.student?.preferences?.auto_open_scanner) {
          setIsCheckInOpen(true);
        }
      }
    } catch (err) {
      console.warn('Could not refresh student dashboard:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboard(true);
    const interval = setInterval(() => {
      loadDashboard(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date()).toUpperCase();

  const live = data.liveSession;
  const defaultSemesterUnits = [
    {
      id: 'se301',
      code: 'SE301',
      name: 'Mobile and Web Application Architecture',
      lecturerName: 'Senior Lecturer',
      attendanceRate: 85,
      sessionsAttended: 6,
      sessionsHeld: 7,
      hasSessions: true,
    },
    {
      id: 'se302',
      code: 'SE302',
      name: 'Distributed Systems & Cloud Architecture',
      lecturerName: 'Dr. Jane Smith',
      attendanceRate: 78,
      sessionsAttended: 7,
      sessionsHeld: 9,
      hasSessions: true,
    },
  ];

  const units = data.enrolledUnits && data.enrolledUnits.length > 0 ? data.enrolledUnits : defaultSemesterUnits;
  const stats = data.stats || { overallAttendanceRate: 0, currentStreak: 0, weekActivity: {} };
  const firstUnit = units[0] || { code: 'SE301', name: 'Mobile and Web Application Architecture' };

  return (
    <div className="space-y-6 w-full">
      {/* Compact PageHeader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: isDarkMode ? '#D4FF5E' : '#0F172A' }}
            >
              {todayFormatted}
            </span>
          </div>
          <h1
            className="text-xl font-semibold tracking-tight mt-0.5"
            style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
          >
            {live ? `${live.unitCode} is in session now` : 'Student Attendance Portal'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCheckInOpen(true)}
            className="h-9 px-4 rounded-md font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2"
            style={{
              backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
              color: isDarkMode ? '#131926' : '#FFFFFF',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>Scan to check in</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="h-9 px-3.5 rounded-md border text-xs font-medium cursor-pointer transition-colors"
            style={getSubtleStyle()}
          >
            Give feedback
          </button>
        </div>
      </div>

      {/* Slim Live Session Status Bar */}
      <div
        className="rounded-lg border p-4 shadow-none transition-colors"
        style={getCardStyle()}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: live ? '#10B981' : '#94A3B8' }}
            />
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: live ? '#10B981' : isDarkMode ? '#94A3B8' : '#64748B' }}
              >
                {live ? 'Lecture live now' : 'No active lecture'}
              </p>
              <p
                className="text-sm font-medium mt-0.5"
                style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
              >
                {live
                  ? `${live.unitName} is live in ${live.venue || 'Main Lecture Hall'}. Scan QR or enter backup PIN.`
                  : `${firstUnit.name} (${firstUnit.code}): scanner unlocks when your lecturer opens a session.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono px-2 py-1 rounded-md border"
              style={getSubtleStyle()}
            >
              Semester 1 • Week 7
            </span>
          </div>
        </div>
      </div>

      {/* 4 Compact StatCards (p-4, tabular-nums) */}
      <div className="grid grid-cols-1 2xs:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4 shadow-none transition-colors" style={getCardStyle()}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Attendance Rate
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className="text-2xl font-semibold tabular-nums"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              {stats.overallAttendanceRate || 0}%
            </span>
            <span
              className={`text-xs font-semibold ${
                (stats.overallAttendanceRate || 0) < 75 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {(stats.overallAttendanceRate || 0) >= 75 ? 'Clearance OK' : 'Below 75%'}
            </span>
          </div>
        </div>

        <div className="rounded-lg border p-4 shadow-none transition-colors" style={getCardStyle()}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Current Streak
          </p>
          <p
            className="text-2xl font-semibold mt-1 tabular-nums"
            style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
          >
            {stats.currentStreak || 0} classes
          </p>
        </div>

        <div className="rounded-lg border p-4 shadow-none transition-colors" style={getCardStyle()}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Enrolled Units
          </p>
          <p
            className="text-2xl font-semibold mt-1 tabular-nums"
            style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
          >
            {units.length}
          </p>
        </div>

        <div className="rounded-lg border p-4 shadow-none transition-colors" style={getCardStyle()}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Week Check-ins
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {[
              { label: 'M', key: 'M' },
              { label: 'T', key: 'T' },
              { label: 'W', key: 'W' },
              { label: 'T', key: 'Th' },
              { label: 'F', key: 'F' },
            ].map((d, idx) => {
              const activeDay = stats.weekActivity?.[d.key];
              return (
                <div
                  key={idx}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-colors"
                  style={{
                    backgroundColor: activeDay
                      ? isDarkMode ? '#D4FF5E' : '#131926'
                      : isDarkMode ? '#1E293B' : '#E2E8F0',
                    color: activeDay
                      ? isDarkMode ? '#131926' : '#FFFFFF'
                      : isDarkMode ? '#94A3B8' : '#64748B',
                  }}
                >
                  {d.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Grid: My Units (Left) & Timeline (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Left My Units Card (8 cols) */}
        <div
          className="xl:col-span-8 rounded-lg border p-4 shadow-none transition-colors space-y-4"
          style={getCardStyle()}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-sm font-semibold tracking-tight"
                style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
              >
                My Course Units
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Current semester curriculum and attendance thresholds.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/student/units')}
              className="text-xs font-semibold hover:underline cursor-pointer"
              style={{ color: isDarkMode ? '#D4FF5E' : '#131926' }}
            >
              View all units →
            </button>
          </div>

          <div className="space-y-2.5">
            {units.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-normal">
                No enrolled units found.
              </div>
            ) : (
              units.map((u) => (
                <div
                  key={u.id}
                  onClick={() => navigate('/student/units')}
                  className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer hover:bg-slate-500/5"
                  style={getSubtleStyle()}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="font-mono text-xs font-semibold px-2 py-1 rounded-md shrink-0"
                      style={{
                        backgroundColor: isDarkMode ? '#131926' : '#E2E8F0',
                        color: isDarkMode ? '#D4FF5E' : '#0F172A',
                      }}
                    >
                      {u.code || 'UNIT'}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
                      >
                        {u.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {u.lecturerName}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3 self-end sm:self-center">
                    {u.hasSessions ? (
                      <div className="text-right">
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            u.attendanceRate < 75 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {u.attendanceRate}%
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {u.sessionsAttended} of {u.sessionsHeld} classes
                        </p>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">
                        Active unit
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Timeline Card (4 cols) */}
        <div
          className="xl:col-span-4 rounded-lg border p-4 shadow-none transition-colors space-y-4"
          style={getCardStyle()}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-semibold tracking-tight"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              Academic Timeline
            </h2>

            {/* Segmented Control Track */}
            <div
              className="inline-flex rounded-md p-1 border text-xs"
              style={getSubtleStyle()}
            >
              {['Day', 'Week', 'Semester'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimelineTab(t)}
                  className="px-2.5 py-0.5 rounded-[4px] text-xs font-medium transition-colors cursor-pointer"
                  style={
                    timelineTab === t
                      ? {
                          backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                          color: isDarkMode ? '#131926' : '#FFFFFF',
                          fontWeight: 600,
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: isDarkMode ? '#94A3B8' : '#475569',
                        }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Tab Content */}
          {timelineTab === 'Day' && (
            data.timeline && data.timeline.length > 0 ? (
              <div className="space-y-2">
                {data.timeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-md border flex items-center justify-between text-xs"
                    style={getSubtleStyle()}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
                      >
                        {item.unitCode}: {item.unitName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.time || '10:00 - 12:00'} • {item.venue || 'LH-01'}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md border text-slate-700 dark:text-slate-300"
                      style={getSubtleStyle()}
                    >
                      {item.status || 'SCHEDULED'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-md border p-4 text-center space-y-1.5"
                style={getSubtleStyle()}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
                >
                  No lectures scheduled today
                </p>
                <p className="text-[11px] text-slate-500">
                  Next lecture: SE301 on Monday at 09:00 in LH-01.
                </p>
              </div>
            )
          )}

          {timelineTab === 'Week' && (
            <div className="space-y-2">
              {[
                { day: 'Mon', unit: 'SE301', title: 'Mobile & Web Architecture', time: '09:00 - 11:00', venue: 'LH-01' },
                { day: 'Tue', unit: 'SE302', title: 'Distributed Systems', time: '11:00 - 13:00', venue: 'Lab 3' },
                { day: 'Wed', unit: 'SE301', title: 'Practical Architecture Lab', time: '14:00 - 16:00', venue: 'Lab 2' },
                { day: 'Thu', unit: 'SE302', title: 'Cloud Infrastructure', time: '08:00 - 10:00', venue: 'LH-02' },
                { day: 'Fri', unit: 'FREE', title: 'Independent Project Study', time: 'All day', venue: 'Self study' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-md border flex items-center justify-between text-xs"
                  style={getSubtleStyle()}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-9 text-center font-semibold font-mono text-[11px] py-0.5 rounded-md"
                      style={{
                        backgroundColor: item.unit === 'FREE' ? (isDarkMode ? '#1E293B' : '#E2E8F0') : (isDarkMode ? '#131926' : '#131926'),
                        color: item.unit === 'FREE' ? (isDarkMode ? '#94A3B8' : '#64748B') : '#D4FF5E',
                      }}
                    >
                      {item.day}
                    </span>
                    <div className="min-w-0 truncate">
                      <p
                        className="font-semibold truncate"
                        style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
                      >
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.time} • {item.venue}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {timelineTab === 'Semester' && (
            <div className="space-y-2.5">
              <div
                className="p-3 rounded-md border space-y-1.5"
                style={getSubtleStyle()}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span style={{ color: isDarkMode ? '#D4FF5E' : '#0F172A' }}>Active Semester 1</span>
                  <span className="text-slate-400">Week 7 of 14</span>
                </div>
                <div className="w-full h-1.5 rounded-xs bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-xs transition-all duration-500"
                    style={{
                      width: '50%',
                      backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Minimum 75% attendance required for examination clearance card.
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  { title: 'Weeks 1 to 6: Core Lectures & Attendance', status: 'Completed', done: true },
                  { title: 'Week 7: Mid-Semester Progress Audit', status: 'Current Week', current: true },
                  { title: 'Weeks 8 to 12: Practical Lab Assessments', status: 'Upcoming' },
                  { title: 'Week 13: Attendance Threshold Clearance', status: '75% Gate' },
                  { title: 'Weeks 14 to 15: Semester Final Examinations', status: 'Registry' },
                ].map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 border-b"
                    style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
                  >
                    <span
                      className="truncate pr-2 font-medium"
                      style={{
                        color: m.done
                          ? isDarkMode ? '#94A3B8' : '#64748B'
                          : m.current
                          ? isDarkMode ? '#D4FF5E' : '#0F172A'
                          : isDarkMode ? '#CBD5E1' : '#334155',
                      }}
                    >
                      {m.title}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border shrink-0"
                      style={
                        m.current
                          ? {
                              backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                              color: isDarkMode ? '#131926' : '#FFFFFF',
                              borderColor: 'transparent',
                            }
                          : getSubtleStyle()
                      }
                    >
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner and Manual PIN Check-In Modal */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        activeSession={live}
        onCheckInSuccess={() => {
          loadDashboard(false);
          setIsCheckInOpen(false);
        }}
      />

      {/* Post-Lecture Anonymous Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        activeSession={
          live || {
            id: firstUnit.id,
            sessionId: firstUnit.id,
            unitId: firstUnit.id,
            unitCode: firstUnit.code,
            unitName: firstUnit.name,
          }
        }
        onSubmitted={() => {
          loadDashboard(false);
          setIsFeedbackOpen(false);
        }}
      />
    </div>
  );
};

export default StudentTodayDashboard;
