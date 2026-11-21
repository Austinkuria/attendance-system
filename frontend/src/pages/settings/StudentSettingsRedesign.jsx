import { useState, useEffect, useContext } from 'react';
import { getStudentSettingsData, updateStudentSettingsData } from '../../services/api';
import { ThemeContext } from '../../context/ThemeContext';
import { message } from 'antd';

/**
 * QRollCall Student Settings & Profile
 * Complies strictly with UI Craft & Anti-Slop Design Rules:
 * - rounded-lg cards with 1px hairline border, shadow-none
 * - rounded-md controls (h-9 primary inputs/buttons, h-8 filters)
 * - Segmented control for appearance with high-contrast active state
 * - Direct ThemeContext bindings via CSS variables
 */
const StudentSettingsRedesign = () => {
  const { isDarkMode, themePreference, setThemePreference, getCardStyle, getSubtleStyle, getInputStyle } =
    useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    regNumber: '',
    courseName: '',
  });

  const [preferences, setPreferences] = useState({
    notify_session_started: true,
    notify_feedback_reminders: true,
    notify_low_attendance: false,
    theme_preference: themePreference || 'system',
    auto_open_scanner: false,
    anonymous_feedback_default: true,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await getStudentSettingsData();
        if (isMounted && res.success) {
          if (res.profile) {
            setProfile({
              firstName: res.profile.firstName || '',
              middleName: res.profile.middleName || '',
              lastName: res.profile.lastName || '',
              email: res.profile.email || '',
              regNumber: res.profile.regNumber || '',
              courseName: res.profile.courseName || '',
            });
          }
          if (res.preferences) {
            setPreferences((prev) => ({ ...prev, ...res.preferences }));
            if (res.preferences.theme_preference) {
              setThemePreference(res.preferences.theme_preference);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching student settings:', err);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, [setThemePreference]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await updateStudentSettingsData({
        firstName: profile.firstName,
        middleName: profile.middleName,
        lastName: profile.lastName,
        preferences,
      });

      if (res.success) {
        message.success('Profile names and preferences updated');
        const updatedFullName = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
        const stored = JSON.parse(localStorage.getItem('userData') || '{}');
        localStorage.setItem(
          'userData',
          JSON.stringify({
            ...stored,
            fullName: updatedFullName,
            firstName: profile.firstName,
            middleName: profile.middleName,
            lastName: profile.lastName,
            preferences,
          })
        );
      }
    } catch (err) {
      console.error('Error saving student settings:', err);
      message.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (choice) => {
    setPreferences((prev) => ({ ...prev, theme_preference: choice }));
    setThemePreference(choice);
  };

  const scrollToSection = (id) => {
    setActiveTab(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Compact PageHeader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
          >
            Settings & Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your personal profile names, notification alerts, and theme preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-4 rounded-md font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
            color: isDarkMode ? '#131926' : '#FFFFFF',
          }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {/* Left Side Navigation Tabs */}
        <div
          className="md:col-span-1 space-y-1 rounded-lg border p-2 shadow-none sticky top-20"
          style={getCardStyle()}
        >
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'scanner', label: 'Scanner' },
            { id: 'privacy', label: 'Privacy' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => scrollToSection(tab.id)}
              className="w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer"
              style={
                activeTab === tab.id
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Stacked Settings Cards */}
        <div className="md:col-span-3 space-y-4">
          {/* 1. Profile Card */}
          <div
            id="section-profile"
            className="rounded-lg border p-4 shadow-none space-y-4 transition-colors"
            style={getCardStyle()}
          >
            <div>
              <h2
                className="text-sm font-semibold tracking-tight"
                style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
              >
                Personal Identity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your official names. Institutional records (email, registration number, course) are managed by university administration.
              </p>
            </div>

            {/* Editable Names: First, Middle, Last */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                  First name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  placeholder="First name"
                  className="w-full text-xs h-9 px-3 rounded-md border font-medium focus:outline-hidden"
                  style={getInputStyle()}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                  Middle name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={profile.middleName}
                  onChange={(e) => setProfile({ ...profile, middleName: e.target.value })}
                  placeholder="Middle name"
                  className="w-full text-xs h-9 px-3 rounded-md border font-medium focus:outline-hidden"
                  style={getInputStyle()}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                  Last name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  placeholder="Last name"
                  className="w-full text-xs h-9 px-3 rounded-md border font-medium focus:outline-hidden"
                  style={getInputStyle()}
                />
              </div>
            </div>

            {/* Read-Only Institutional Information */}
            <div
              className="pt-3 border-t space-y-3"
              style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Institutional Details (Read-only)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    University email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    disabled
                    title="Institutional email cannot be edited directly"
                    className="w-full text-xs h-9 px-3 rounded-md border text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium select-none"
                    style={getSubtleStyle()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Registration number
                  </label>
                  <input
                    type="text"
                    value={profile.regNumber}
                    readOnly
                    disabled
                    title="Registration number is fixed by academic registry"
                    className="w-full text-xs h-9 px-3 rounded-md border text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono font-medium select-none"
                    style={getSubtleStyle()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Assigned course
                  </label>
                  <input
                    type="text"
                    value={profile.courseName}
                    readOnly
                    disabled
                    title="Course program is managed by department admin"
                    className="w-full text-xs h-9 px-3 rounded-md border text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium select-none"
                    style={getSubtleStyle()}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Notifications Card */}
          <div
            id="section-notifications"
            className="rounded-lg border p-4 shadow-none space-y-3.5 transition-colors"
            style={getCardStyle()}
          >
            <h2
              className="text-sm font-semibold tracking-tight"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              Notifications
            </h2>

            <div
              className="space-y-3 divide-y"
              style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
            >
              <div className="flex items-start justify-between gap-4 pt-1">
                <div>
                  <p className="text-xs font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Session started
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Alert when a lecturer opens a live attendance session
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_session_started}
                  onChange={(e) =>
                    setPreferences({ ...preferences, notify_session_started: e.target.checked })
                  }
                  className="w-4 h-4 rounded-xs cursor-pointer accent-[#D4FF5E]"
                />
              </div>

              <div className="flex items-start justify-between gap-4 pt-3">
                <div>
                  <p className="text-xs font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Feedback reminders
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Notification after a lecture session concludes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_feedback_reminders}
                  onChange={(e) =>
                    setPreferences({ ...preferences, notify_feedback_reminders: e.target.checked })
                  }
                  className="w-4 h-4 rounded-xs cursor-pointer accent-[#D4FF5E]"
                />
              </div>

              <div className="flex items-start justify-between gap-4 pt-3">
                <div>
                  <p className="text-xs font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Low attendance warning
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Alert when attendance in any unit falls below 75%
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_low_attendance}
                  onChange={(e) =>
                    setPreferences({ ...preferences, notify_low_attendance: e.target.checked })
                  }
                  className="w-4 h-4 rounded-xs cursor-pointer accent-[#D4FF5E]"
                />
              </div>
            </div>
          </div>

          {/* 3. Appearance Card */}
          <div
            id="section-appearance"
            className="rounded-lg border p-4 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            style={getCardStyle()}
          >
            <div>
              <h2
                className="text-sm font-semibold tracking-tight"
                style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
              >
                Appearance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose how QRollCall looks across your device.
              </p>
            </div>

            <div
              className="inline-flex rounded-md p-1 border text-xs"
              style={getSubtleStyle()}
            >
              {[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
                { id: 'system', label: 'System' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleThemeChange(opt.id)}
                  className="px-3 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer"
                  style={
                    (preferences.theme_preference || themePreference) === opt.id
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
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Scanner and Privacy Card */}
          <div
            id="section-scanner"
            className="rounded-lg border p-4 shadow-none space-y-3.5 transition-colors"
            style={getCardStyle()}
          >
            <h2
              className="text-sm font-semibold tracking-tight"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              Scanner and Privacy
            </h2>

            <div
              className="space-y-3 divide-y"
              style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
            >
              <div className="flex items-start justify-between gap-4 pt-1">
                <div>
                  <p className="text-xs font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Open scanner when class is live
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Automatically launch the scanner view when an active session is detected
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.auto_open_scanner}
                  onChange={(e) =>
                    setPreferences({ ...preferences, auto_open_scanner: e.target.checked })
                  }
                  className="w-4 h-4 rounded-xs cursor-pointer accent-[#D4FF5E]"
                />
              </div>

              <div id="section-privacy" className="flex items-start justify-between gap-4 pt-3">
                <div>
                  <p className="text-xs font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Send feedback anonymously by default
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your name will not be attached to lecture feedback submissions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.anonymous_feedback_default}
                  onChange={(e) =>
                    setPreferences({ ...preferences, anonymous_feedback_default: e.target.checked })
                  }
                  className="w-4 h-4 rounded-xs cursor-pointer accent-[#D4FF5E]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSettingsRedesign;
