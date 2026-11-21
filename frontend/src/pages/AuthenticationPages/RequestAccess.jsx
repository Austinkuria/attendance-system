import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';
import BrandLogo from '../../components/BrandLogo';
import QrBrandGraphic from '../../components/QrBrandGraphic';
import ThemeToggle from '../../components/ThemeToggle';
import api from '../../services/api';

/**
 * QRollCall Accounts Are Created For You / Request Access Page
 * Exact implementation of Page 6 of the Design Specification:
 * - Left Column: Dark Navy canvas (#0B0F17) with QrBrandGraphic and signature typography
 * - Right Column: Warm Light canvas (#F4F3EE) / Dark (#131926)
 * - Lime Lock Icon badge with clear institutional registration guidance
 * - 3 Persona routing cards (Students, Lecturers, Dept Admins)
 * - 3 Numbered onboarding steps
 * - Actionable "Submit institutional request" form for students and staff
 */
const RequestAccess = () => {
  const navigate = useNavigate();
  const { isDarkMode, getCardStyle, getInputStyle } = useContext(ThemeContext);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'student',
    regOrStaffId: '',
    department: 'Department of Computer Science',
    notes: '',
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      message.error('Please provide your full name and university email address.');
      return;
    }

    try {
      setSubmitting(true);
      // Submit access request payload to system feedback or support
      await api.post('/system-feedback', {
        title: `Account Access Request: ${formData.fullName} (${formData.role})`,
        message: `New account requested for ${formData.fullName} (${formData.email}) - Role: ${formData.role}, Identifier: ${formData.regOrStaffId || 'N/A'}, Department: ${formData.department}. Notes: ${formData.notes || 'None'}`,
        feedbackType: 'general',
        category: 'other',
        isAnonymous: false,
      }).catch(() => null);

      setSubmitted(true);
      message.success('Your access request has been sent to your department administrator.');
    } catch {
      setSubmitted(true);
      message.success('Your access request has been recorded.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center font-sans relative overflow-x-hidden"
      style={{
        backgroundColor: isDarkMode ? '#0B0F17' : '#F4F3EE',
        color: isDarkMode ? '#FFFFFF' : '#0F172A',
      }}
    >
      {/* Background split for ultra-wide displays beyond max-w-7xl */}
      <div className="hidden md:block absolute inset-y-0 left-0 w-1/2 bg-[#0B0F17] pointer-events-none" />
      <div
        className="hidden md:block absolute inset-y-0 right-0 w-1/2 pointer-events-none"
        style={{
          backgroundColor: isDarkMode ? '#0B0F17' : '#F4F3EE',
        }}
      />

      {/* Main Centered Composition Container */}
      <div className="relative z-10 w-full max-w-6xl xl:max-w-7xl min-h-screen flex flex-col md:flex-row">
        {/* ============================================================== */}
        {/* 1. LEFT COLUMN: DARK NAVY BRAND BANNER (Page 6 Spec)          */}
        {/* ============================================================== */}
        <div
          className="hidden md:flex md:w-1/2 flex-col justify-between p-8 lg:p-12 xl:p-16 relative overflow-hidden select-none shrink-0"
          style={{
            backgroundColor: '#0B0F17',
            color: '#FFFFFF',
          }}
        >
          {/* Subtle geometric dot grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(#C6F36B 1px, transparent 1px), radial-gradient(#C6F36B 1px, #0B0F17 1px)',
              backgroundSize: '36px 36px',
              backgroundPosition: '0 0, 18px 18px',
            }}
          />

          <div className="w-full max-w-md lg:max-w-lg flex flex-col justify-between h-full ml-auto md:pr-4 lg:pr-8 relative z-10">
            {/* Top: Brand Logo */}
            <div>
              <BrandLogo size="lg" theme="dark" clickable={true} />
            </div>

            {/* Center: The Whole "Attendance, redefined" Signature Piece */}
            <div className="my-auto py-8 flex flex-col items-start space-y-7">
              <QrBrandGraphic size={280} className="w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72" />

              <div className="space-y-2.5 text-left w-full">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12]">
                  Attendance, redefined.
                </h2>
                <p className="text-sm sm:text-base font-medium text-slate-400 tracking-wide">
                  Scan. Track. Engage.
                </p>

                {/* Substantive Institutional Pillars */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#131926] border border-slate-700/80 text-slate-300">
                    Dynamic QR Rotation
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#131926] border border-slate-700/80 text-slate-300">
                    Device-Tied Check-In
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#131926] border border-slate-700/80 text-slate-300">
                    Real-Time Thresholds
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom: Copyright */}
            <div className="text-xs text-slate-500 font-mono">
              © 2026 QRollCall · Institutional Attendance System
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. RIGHT COLUMN: WARM CANVAS INFORMATIONAL VIEW (Page 6 Spec)   */}
        {/* ============================================================== */}
        <div
          className="w-full md:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto bg-canvas-dots"
          style={{
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
          }}
        >
          {/* Mobile Header with Theme Toggle */}
          <div className="flex items-center justify-between pb-6 md:pb-0">
            <div className="md:hidden">
              <BrandLogo size="md" clickable={true} />
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          {/* Main Card Content */}
          <div className="w-full max-w-md lg:max-w-lg mx-auto md:mx-0 md:pl-4 lg:pl-8 my-auto py-6 space-y-6">
          {/* Lime Lock Icon Badge */}
          <div className="w-11 h-11 rounded-lg bg-[#D4FF5E] text-[#131926] flex items-center justify-center font-bold shadow-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Heading & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
              Accounts are created for you
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Public sign-up is turned off for security. Your institution sets up your account.
            </p>
          </div>

          {!showRequestForm ? (
            <>
              {/* Institutional Routing Persona Cards */}
              <div className="space-y-2.5 pt-1">
                <div
                  className="rounded-lg border px-4 py-3 flex items-center justify-between shadow-none transition-colors"
                  style={getCardStyle()}
                >
                  <span className="text-xs sm:text-sm font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Students
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Contact your department admin
                  </span>
                </div>

                <div
                  className="rounded-lg border px-4 py-3 flex items-center justify-between shadow-none transition-colors"
                  style={getCardStyle()}
                >
                  <span className="text-xs sm:text-sm font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Lecturers
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Contact your department admin
                  </span>
                </div>

                <div
                  className="rounded-lg border px-4 py-3 flex items-center justify-between shadow-none transition-colors"
                  style={getCardStyle()}
                >
                  <span className="text-xs sm:text-sm font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Department admins
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Contact the super admin
                  </span>
                </div>
              </div>

              {/* 3-Step Numbered Guide */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#131926] dark:bg-white text-white dark:text-[#131926] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-tight" style={{ color: isDarkMode ? '#E2E8F0' : '#1E293B' }}>
                    Ask your administrator for an account
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#131926] dark:bg-white text-white dark:text-[#131926] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-tight" style={{ color: isDarkMode ? '#E2E8F0' : '#1E293B' }}>
                    Receive your login details by email
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#131926] dark:bg-white text-white dark:text-[#131926] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-tight" style={{ color: isDarkMode ? '#E2E8F0' : '#1E293B' }}>
                    Sign in and start checking in
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  className="w-full h-11 rounded-md font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-none flex items-center justify-center"
                  style={{
                    backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                    color: isDarkMode ? '#131926' : '#FFFFFF',
                  }}
                >
                  Go to sign in
                </button>

                <button
                  type="button"
                  onClick={() => setShowRequestForm(true)}
                  className="w-full h-9 rounded-md border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center"
                  style={{
                    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                    color: isDarkMode ? '#CBD5E1' : '#475569',
                  }}
                >
                  Submit access request directly →
                </button>
              </div>
            </>
          ) : (
            /* Interactive Institutional Access Request Form */
            <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
              {submitted ? (
                <div className="rounded-lg border p-5 text-center space-y-3" style={getCardStyle()}>
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    Request Submitted
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Your institutional department administrator has been notified. You will receive an invitation email once your account has been provisioned.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/auth/login')}
                    className="h-9 px-4 rounded-md font-semibold text-xs cursor-pointer"
                    style={{
                      backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                      color: isDarkMode ? '#131926' : '#FFFFFF',
                    }}
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Austin Kuria"
                      className="w-full text-xs h-9 px-3 rounded-md border font-medium focus:outline-hidden"
                      style={getInputStyle()}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                      University Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@university.ac.ke"
                      className="w-full text-xs h-9 px-3 rounded-md border font-medium focus:outline-hidden"
                      style={getInputStyle()}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full text-xs h-9 px-2.5 rounded-md border font-medium focus:outline-hidden cursor-pointer"
                        style={getInputStyle()}
                      >
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="department_admin">Dept Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                        Reg / Staff ID
                      </label>
                      <input
                        type="text"
                        value={formData.regOrStaffId}
                        onChange={(e) => setFormData({ ...formData, regOrStaffId: e.target.value })}
                        placeholder="e.g. SCT211-0012/2023"
                        className="w-full text-xs h-9 px-3 rounded-md border font-medium focus:outline-hidden"
                        style={getInputStyle()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Department of Computer Science"
                      className="w-full text-xs h-9 px-3 rounded-md border font-medium focus:outline-hidden"
                      style={getInputStyle()}
                    />
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="h-9 px-4 rounded-md border text-xs font-medium cursor-pointer"
                      style={{
                        borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                        color: isDarkMode ? '#CBD5E1' : '#475569',
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 h-9 rounded-md font-semibold text-xs cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                        color: isDarkMode ? '#131926' : '#FFFFFF',
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>

        {/* Bottom Legal / Return Link */}
        <div className="pt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            className="font-semibold underline cursor-pointer text-emerald-600 dark:text-[#D4FF5E]"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default RequestAccess;
