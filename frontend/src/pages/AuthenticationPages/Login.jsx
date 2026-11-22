import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';
import { loginUser, loginDemoUser } from '../../services/api';
import BrandLogo from '../../components/BrandLogo';
import QrBrandGraphic from '../../components/QrBrandGraphic';
import ThemeToggle from '../../components/ThemeToggle';

/**
 * QRollCall Login View
 * Precision implementation of Pages 5 & 7 of the Design Specification:
 * - Desktop: Split-screen architecture (5/12 Dark Navy left, 7/12 Warm Light canvas right)
 * - Mobile: Fluid single-column responsive stacking
 * - Left Banner: Signature QR vector graphic + "Attendance, redefined. Scan. Track. Engage."
 * - Right Content:
 *   * "Welcome back" heading + institutional guidance
 *   * Demo accounts 2x2 grid container (Student, Lecturer, Dept admin, Super admin)
 *   * Native accessible form inputs with "Show/Hide" password toggle
 *   * "Remember me" + "Forgot password?"
 *   * High-contrast "Sign in" action (#131926 in light, #D4FF5E in dark)
 *   * "No account? Accounts are created by your institution. How to get access" routing to /request-access
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const themeContext = useContext(ThemeContext) || {};
  const isDarkMode = themeContext.isDarkMode ?? false;
  const getInputStyle = themeContext.getInputStyle || (() => ({}));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'student' | 'lecturer' | 'department_admin' | 'super_admin'

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') || localStorage.getItem('role');
    if (token && role) {
      redirectToRole(role);
    }
  }, []);

  const redirectToRole = (role) => {
    switch (role) {
      case 'student':
        navigate('/dashboard');
        break;
      case 'lecturer':
        navigate('/lecturer-dashboard');
        break;
      case 'department_admin':
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'super_admin':
        navigate('/super-admin');
        break;
      default:
        navigate('/dashboard');
        break;
    }
  };

  // Standard Login Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      message.error('Please enter both your email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginUser({ email: email.trim().toLowerCase(), password });

      if (res && res.success) {
        message.success('Signed in successfully.');
        const userRole = res.user?.role || localStorage.getItem('userRole');
        redirectToRole(userRole);
      } else {
        message.error(res?.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Login failed. Please verify your credentials.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Demo Account 1-Click Login (Design Spec Page 5)
  const handleDemoLogin = async (demoKey) => {
    try {
      setDemoLoading(demoKey);

      // Pre-fill fields for visual feedback
      const roleEmailMap = {
        student: 'alice.williams@student.edu',
        lecturer: 'john.doe@university.edu',
        department_admin: 'austinmaina.dev+admin@gmail.com',
        super_admin: 'superadmin@qrollcall.ac.ke',
      };

      if (roleEmailMap[demoKey]) {
        setEmail(roleEmailMap[demoKey]);
        setPassword('••••••••••••');
      }

      const res = await loginDemoUser(demoKey);
      if (res && res.success) {
        message.success(`Logged in as demo ${demoKey.replace('_', ' ')}.`);
        const resolvedRole = res.user?.role || demoKey;
        redirectToRole(resolvedRole);
      } else {
        // Fallback standard credentials submit if demo-login endpoint requires fallback
        const fallbackCreds = {
          student: { email: 'alice.williams@student.edu', password: 'Password@2025' },
          lecturer: { email: 'john.doe@university.edu', password: 'Password@2025' },
          department_admin: { email: 'austinmaina.dev+admin@gmail.com', password: 'Admin@2025' },
          super_admin: { email: 'superadmin@qrollcall.ac.ke', password: 'SuperAdmin@2025' },
        };

        const cred = fallbackCreds[demoKey];
        if (cred) {
          const directRes = await loginUser(cred);
          if (directRes && directRes.success) {
            message.success(`Logged in as demo ${demoKey.replace('_', ' ')}.`);
            redirectToRole(directRes.user?.role || demoKey);
            return;
          }
        }
        message.error('Demo authentication temporarily unavailable. Please type your password.');
      }
    } catch (err) {
      console.warn('Demo login failed, trying fallback credentials:', err);
      const fallbackCreds = {
        student: { email: 'alice.williams@student.edu', password: 'Password@2025' },
        lecturer: { email: 'john.doe@university.edu', password: 'Password@2025' },
        department_admin: { email: 'austinmaina.dev+admin@gmail.com', password: 'Admin@2025' },
        super_admin: { email: 'superadmin@qrollcall.ac.ke', password: 'SuperAdmin@2025' },
      };
      try {
        const directRes = await loginUser(fallbackCreds[demoKey]);
        if (directRes && directRes.success) {
          message.success(`Logged in as demo ${demoKey.replace('_', ' ')}.`);
          redirectToRole(directRes.user?.role || demoKey);
          return;
        }
      } catch {
        // Ignore fallback error
      }
      message.error(err.response?.data?.message || 'Demo login failed');
    } finally {
      setDemoLoading(null);
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
        {/* 1. LEFT COLUMN: DARK NAVY BRAND BANNER (Page 5 Spec)          */}
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
        {/* 2. RIGHT COLUMN: WARM CANVAS LOGIN FORM (Pages 5 & 7 Spec)     */}
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

          {/* Form Container */}
          <div className="w-full max-w-md lg:max-w-lg mx-auto md:mx-0 md:pl-4 lg:pl-8 my-auto py-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                Welcome Back!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Sign in to check in to your classes.
              </p>
            </div>

            {/* Demo Accounts Box (Page 5 Spec) */}
            <div
              className="rounded-lg border border-dashed p-4 shadow-none transition-colors"
              style={{
                backgroundColor: isDarkMode ? '#1A2234' : '#FFFFFF',
                borderColor: isDarkMode ? '#334155' : '#CBD5E1',
              }}
            >
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2.5">
                Quick Demo Access: Demo accounts
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Student Demo */}
                <button
                  type="button"
                  aria-label="Student Demo"
                  disabled={demoLoading !== null}
                  onClick={() => handleDemoLogin('student')}
                  className="h-9 px-3 rounded-md border text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{
                    backgroundColor: isDarkMode ? '#131926' : '#F8FAFC',
                    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  }}
                >
                  {demoLoading === 'student' ? 'Connecting...' : 'Student'}
                </button>

                {/* Lecturer Demo */}
                <button
                  type="button"
                  aria-label="Lecturer Demo"
                  disabled={demoLoading !== null}
                  onClick={() => handleDemoLogin('lecturer')}
                  className="h-9 px-3 rounded-md border text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{
                    backgroundColor: isDarkMode ? '#131926' : '#F8FAFC',
                    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  }}
                >
                  {demoLoading === 'lecturer' ? 'Connecting...' : 'Lecturer'}
                </button>

                {/* Dept Admin Demo */}
                <button
                  type="button"
                  aria-label="Admin Demo"
                  disabled={demoLoading !== null}
                  onClick={() => handleDemoLogin('department_admin')}
                  className="h-9 px-3 rounded-md border text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{
                    backgroundColor: isDarkMode ? '#131926' : '#F8FAFC',
                    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  }}
                >
                  {demoLoading === 'department_admin' ? 'Connecting...' : 'Dept admin'}
                </button>

                {/* Super Admin Demo */}
                <button
                  type="button"
                  aria-label="Super Admin"
                  disabled={demoLoading !== null}
                  onClick={() => handleDemoLogin('super_admin')}
                  className="h-9 px-3 rounded-md border text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{
                    backgroundColor: isDarkMode ? '#131926' : '#F8FAFC',
                    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  }}
                >
                  {demoLoading === 'super_admin' ? 'Connecting...' : 'Super admin'}
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="emailInput"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}
                >
                  Email address
                </label>
                <input
                  id="emailInput"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address (you@university.ac.ke)"
                  className="w-full text-xs sm:text-sm h-10 px-3.5 rounded-md border font-medium focus:outline-hidden transition-colors"
                  style={getInputStyle()}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="passwordInput"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="passwordInput"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full text-xs sm:text-sm h-10 pl-3.5 pr-14 rounded-md border font-medium focus:outline-hidden transition-colors"
                    style={getInputStyle()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer select-none"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-xs cursor-pointer accent-[#D4FF5E]"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => navigate('/auth/reset-password')}
                  className="text-xs font-semibold hover:underline cursor-pointer text-emerald-600 dark:text-[#D4FF5E]"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Sign In Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-md font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-none flex items-center justify-center hover:opacity-95"
                  style={{
                    backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                    color: isDarkMode ? '#131926' : '#FFFFFF',
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            {/* Institutional Access Notice Footer (Page 5 Spec) */}
            <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No account? Accounts are created by your institution.{' '}
              <button
                type="button"
                onClick={() => navigate('/request-access')}
                className="font-semibold underline cursor-pointer text-emerald-600 dark:text-[#D4FF5E]"
              >
                How to get access
              </button>
            </div>
          </div>

          {/* Mobile-only bottom copyright */}
          <div className="md:hidden pt-8 text-center text-xs text-slate-500 font-mono">
            © 2026 QRollCall
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
