import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';

/**
 * QRollCall Landing / Home Page
 * Precision implementation of Pages 1, 2, and 3 of the Design Specification:
 * - Geometric hierarchy: rounded-lg (8px) cards, rounded-md (6px) buttons/inputs, 1px hairline borders
 * - Color specification:
 *   * Dark Canvas: #0B0F17 / #12172B with high-contrast text and signature #D4FF5E lime accents
 *   * Light Canvas: #F4F3EE with #FFFFFF surfaces, #E2E8F0 hairline borders, #0F172A primary text
 * - Responsive viewport: mobile-first fluid layout across 375px to 1920px
 * - Vector branding with official QRollCall mark
 */
const Home = () => {
  const navigate = useNavigate();
  const { isDarkMode, getCardStyle } = useContext(ThemeContext);

  // Active FAQ Accordion item index
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Testimonial Carousel Index
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Newsletter subscription state
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const testimonials = [
    {
      quote: '“Feedback feature sparked real dialogue.”',
      author: 'Ms. Elena Ortiz, Bright Academy',
    },
    {
      quote: '“Attendance fraud dropped to zero within our first week of roll-out.”',
      author: 'Prof. Marcus Vance, School of Informatics',
    },
    {
      quote: '“Scanning takes less than three seconds. Lecturers can begin on schedule.”',
      author: 'Dr. Sarah Kimani, Department of Pure & Applied Sciences',
    },
  ];

  const faqs = [
    {
      q: 'How does QRollCall work?',
      a: 'Lecturers start a session and show a QR code. Students scan it with their phones to check in, and attendance updates in real time.',
    },
    {
      q: 'How does it prevent proxy attendance?',
      a: 'QR codes are dynamic and every check-in is tied to a unique device, so a shared screenshot or a friend scanning for you is much harder.',
    },
    {
      q: 'How does it benefit lecturers?',
      a: 'Start a session in one step, watch check-ins arrive live and download records afterwards.',
    },
    {
      q: "What's in it for administrators?",
      a: 'Department-level oversight, analytics by course and semester, and reports you can export.',
    },
  ];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (subscribeEmail.trim()) {
      setSubscribed(true);
      setSubscribeEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="min-h-screen w-full font-sans transition-colors duration-150 overflow-x-hidden"
      style={{
        backgroundColor: isDarkMode ? '#0B0F17' : '#F4F3EE',
        color: isDarkMode ? '#FFFFFF' : '#0F172A',
      }}
    >
      {/* ============================================================== */}
      {/* 1. TOP NAVIGATION BAR (Design Spec Page 1)                      */}
      {/* ============================================================== */}
      <header
        className="sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors"
        style={{
          backgroundColor: isDarkMode ? 'rgba(11, 15, 23, 0.92)' : 'rgba(244, 243, 238, 0.94)',
          borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
        }}
      >
        <div className="w-full px-4 2xs:px-4 xs:px-6 sm:px-8 md:px-10 md-sm:px-12 lg:px-14 xl:px-16 xl-lg:px-20 2xl:px-24 2xl-md:px-28 2xl-lg:px-32 3xl:px-44 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <BrandLogo size="md" clickable={true} />

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('benefits')}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Benefits
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('faq')}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action: Theme Toggle & Sign in */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="h-9 px-4 rounded-md font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-none flex items-center justify-center"
              style={{
                backgroundColor: '#D4FF5E',
                color: '#131926',
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION (Design Spec Page 1)                           */}
      {/* ============================================================== */}
      <section
        className="w-full py-16 sm:py-24 border-b relative overflow-hidden"
        style={{
          backgroundColor: '#0B0F17',
          borderColor: '#1E293B',
          color: '#FFFFFF',
        }}
      >
        {/* Subtle geometric grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#C6F36B 1px, transparent 1px), radial-gradient(#C6F36B 1px, #0B0F17 1px)',
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px',
          }}
        />

        <div className="w-full px-4 2xs:px-4 xs:px-6 sm:px-8 md:px-10 md-sm:px-12 lg:px-14 xl:px-16 xl-lg:px-20 2xl:px-24 2xl-md:px-28 2xl-lg:px-32 3xl:px-44 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 xl-lg:grid-cols-12 2xl-lg:grid-cols-12 gap-12 lg:gap-8 xl-lg:gap-12 2xl-lg:gap-16 items-center">
            {/* Left Content (col-span-7) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Category Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700/80 bg-slate-900/60 backdrop-blur-xs text-xs font-medium text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF5E] animate-pulse" />
                <span>QR attendance for colleges and universities</span>
              </div>

              {/* Primary Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
                Attendance, <br />
                <span className="text-white">redefined.</span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
                Scan. Track. Engage. A smarter way to manage attendance for students, lecturers and admins.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  className="h-10 px-5 rounded-md font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-none flex items-center justify-center hover:opacity-90"
                  style={{
                    backgroundColor: '#D4FF5E',
                    color: '#131926',
                  }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="h-10 px-5 rounded-md font-semibold text-xs sm:text-sm border border-slate-700 text-white bg-slate-900/80 hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                >
                  Explore features
                </button>
              </div>
            </div>

            {/* Right Mockup: Live Mobile Device Interface (col-span-5) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-[320px] sm:max-w-[340px] rounded-3xl border-2 border-slate-800 bg-[#12172B] p-5 shadow-2xl relative select-none">
                {/* Phone Notch & Session Status */}
                <div className="flex items-center justify-between pb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-mono font-medium text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SE301 is live</span>
                  </div>
                  {/* Floating Device Verified Badge */}
                  <div className="inline-flex items-center gap-1 bg-white text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Device verified</span>
                  </div>
                </div>

                {/* Central Scanner Graphic with Signature Lime Brackets */}
                <div className="my-6 relative py-10 px-6 rounded-2xl bg-[#090D1A] border border-slate-800/80 flex flex-col items-center justify-center">
                  {/* Top-Left Bracket */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-3 border-l-3 border-[#D4FF5E] rounded-tl-md" />
                  {/* Top-Right Bracket */}
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-3 border-r-3 border-[#D4FF5E] rounded-tr-md" />
                  {/* Bottom-Left Bracket */}
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-3 border-l-3 border-[#D4FF5E] rounded-bl-md" />
                  {/* Bottom-Right Bracket */}
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-3 border-r-3 border-[#D4FF5E] rounded-br-md" />

                  {/* Dynamic QR Inner Simulation */}
                  <div className="w-24 h-24 rounded-lg bg-[#12172B] border border-slate-700 p-2 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-5 h-5 rounded-xs border-2 border-[#D4FF5E] p-0.5">
                        <div className="w-full h-full bg-white" />
                      </div>
                      <div className="w-5 h-5 rounded-xs border-2 border-[#D4FF5E] p-0.5">
                        <div className="w-full h-full bg-white" />
                      </div>
                    </div>
                    <div className="flex justify-center gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-xs" />
                      <div className="w-2 h-2 bg-white rounded-xs" />
                      <div className="w-2 h-2 bg-[#D4FF5E] rounded-xs" />
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="w-5 h-5 rounded-xs border-2 border-[#D4FF5E] p-0.5">
                        <div className="w-full h-full bg-white" />
                      </div>
                      <div className="w-3 h-3 bg-white rounded-xs" />
                    </div>
                  </div>

                  {/* Floating Dynamic QR code Tag */}
                  <div className="absolute -bottom-3 left-4 inline-flex items-center gap-1 bg-slate-900/90 text-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-700 shadow-md">
                    <span>Dynamic QR code</span>
                  </div>
                </div>

                {/* Bottom Trigger Action */}
                <button
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  className="w-full h-10 rounded-md font-bold text-xs cursor-pointer shadow-none transition-opacity hover:opacity-90 flex items-center justify-center"
                  style={{
                    backgroundColor: '#D4FF5E',
                    color: '#131926',
                  }}
                >
                  Scan to check in
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. SECTION: WHY QROLLCALL? (Design Spec Page 1)                */}
      {/* ============================================================== */}
      <section id="features" className="w-full py-16 sm:py-20 border-b" style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}>
        <div className="w-full px-4 2xs:px-4 xs:px-6 sm:px-8 md:px-10 md-sm:px-12 lg:px-14 xl:px-16 xl-lg:px-20 2xl:px-24 2xl-md:px-28 2xl-lg:px-32 3xl:px-44">
          <div className="text-center max-w-2xl 2xl:max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl xl-lg:text-4xl font-bold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
              Why QRollCall?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl-lg:grid-cols-3 2xl-lg:grid-cols-3 gap-6 xl-lg:gap-8 2xl-lg:gap-10">
            {/* Card 1: Instant precision */}
            <div
              className="rounded-lg border p-6 shadow-none flex flex-col justify-between"
              style={getCardStyle()}
            >
              <div>
                <div className="w-9 h-9 rounded-md flex items-center justify-center bg-[#D4FF5E] text-[#131926] mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Instant precision
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Attendance updates in real time with pinpoint accuracy for every session.
                </p>
              </div>
            </div>

            {/* Card 2: Fraud-proof */}
            <div
              className="rounded-lg border p-6 shadow-none flex flex-col justify-between"
              style={getCardStyle()}
            >
              <div>
                <div className="w-9 h-9 rounded-md flex items-center justify-center bg-[#D4FF5E] text-[#131926] mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Fraud-proof
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Dynamic QR codes, unique device tracking and secure authentication stop proxy attendance in its tracks.
                </p>
              </div>
            </div>

            {/* Card 3: Engage students */}
            <div
              className="rounded-lg border p-6 shadow-none flex flex-col justify-between"
              style={getCardStyle()}
            >
              <div>
                <div className="w-9 h-9 rounded-md flex items-center justify-center bg-[#D4FF5E] text-[#131926] mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Engage students
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Interactive feedback and dashboards spark student participation and insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. SECTION: HOW IT WORKS (Design Spec Pages 1 & 2)             */}
      {/* ============================================================== */}
      <section
        className="w-full py-16 sm:py-20 border-b"
        style={{
          backgroundColor: '#0B0F17',
          borderColor: '#1E293B',
          color: '#FFFFFF',
        }}
      >
        <div className="w-full px-4 2xs:px-4 xs:px-6 sm:px-8 md:px-10 md-sm:px-12 lg:px-14 xl:px-16 xl-lg:px-20 2xl:px-24 2xl-md:px-28 2xl-lg:px-32 3xl:px-44">
          <div className="text-center max-w-2xl 2xl:max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl xl-lg:text-4xl font-bold tracking-tight text-white">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl-lg:grid-cols-3 2xl-lg:grid-cols-3 gap-6 xl-lg:gap-8 2xl-lg:gap-10">
            {/* Step 1 */}
            <div className="rounded-lg border border-slate-800 bg-[#12172B] p-6 space-y-4">
              <span className="text-4xl font-bold font-mono tracking-tight text-[#D4FF5E]">
                1
              </span>
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Lecturer starts a session
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Pick a unit and the QR code appears full screen in the lecture hall.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-lg border border-slate-800 bg-[#12172B] p-6 space-y-4">
              <span className="text-4xl font-bold font-mono tracking-tight text-[#D4FF5E]">
                2
              </span>
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Students scan to check in
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Phones scan the dynamic code and the check-in is tied to that device.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-lg border border-slate-800 bg-[#12172B] p-6 space-y-4">
              <span className="text-4xl font-bold font-mono tracking-tight text-[#D4FF5E]">
                3
              </span>
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Attendance appears live
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Watch check-ins arrive, then download the records after class.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SECTION: BENEFITS FOR EVERYONE (Design Spec Page 2)         */}
      {/* ============================================================== */}
      <section id="benefits" className="w-full py-16 sm:py-20 border-b" style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}>
        <div className="w-full px-4 2xs:px-4 xs:px-6 sm:px-8 md:px-10 md-sm:px-12 lg:px-14 xl:px-16 xl-lg:px-20 2xl:px-24 2xl-md:px-28 2xl-lg:px-32 3xl:px-44">
          <div className="text-center max-w-2xl 2xl:max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl xl-lg:text-4xl font-bold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
              Benefits for everyone
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl-lg:grid-cols-3 2xl-lg:grid-cols-3 gap-8 xl-lg:gap-10 2xl-lg:gap-12">
            {/* For Students */}
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-slate-900 dark:text-[#D4FF5E] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                For students
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Quick scans, interactive feedback and clear attendance insights keep you engaged.
              </p>
            </div>

            {/* For Lecturers */}
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-slate-900 dark:text-[#D4FF5E] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                For lecturers
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Effortless session management, real-time tracking and historical records at your fingertips.
              </p>
            </div>

            {/* For Admins */}
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-slate-900 dark:text-[#D4FF5E] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-base font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                For admins
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Centralised oversight, detailed analytics and fraud prevention streamline operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. SECTION: WHAT EDUCATORS SAY (Design Spec Page 2)            */}
      {/* ============================================================== */}
      <section
        className="w-full py-20 border-b"
        style={{
          backgroundColor: '#0B0F17',
          borderColor: '#1E293B',
          color: '#FFFFFF',
        }}
      >
        <div className="w-full px-4 2xs:px-4 xs:px-6 sm:px-8 md:px-10 md-sm:px-12 lg:px-14 xl:px-16 xl-lg:px-20 2xl:px-24 2xl-md:px-28 2xl-lg:px-32 3xl:px-44 text-center space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            What educators say
          </p>

          <blockquote className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-snug">
            {testimonials[activeTestimonial].quote}
          </blockquote>

          <p className="text-xs sm:text-sm font-medium text-[#D4FF5E]">
            {testimonials[activeTestimonial].author}
          </p>

          {/* Testimonial Dot Switchers */}
          <div className="pt-4 flex items-center justify-center gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTestimonial(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeTestimonial === idx ? 'w-6 bg-[#D4FF5E]' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. SECTION: FREQUENTLY ASKED QUESTIONS (Design Spec Page 2)     */}
      {/* ============================================================== */}
      <section id="faq" className="w-full py-16 sm:py-20 border-b" style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}>
        <div className="w-full px-4 2xs:px-4 xs:px-6 sm:px-8 md:px-10 md-sm:px-12 lg:px-14 xl:px-16 xl-lg:px-20 2xl:px-24 2xl-md:px-28 2xl-lg:px-32 3xl:px-44">
          <div className="text-center max-w-2xl 2xl:max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl xl-lg:text-4xl font-bold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
              Frequently asked questions
            </h2>
          </div>

          <div className="w-full max-w-5xl xl-lg:max-w-6xl 2xl:max-w-7xl 3xl:max-w-screen-2xl mx-auto space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-lg border overflow-hidden shadow-none transition-colors"
                  style={getCardStyle()}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-semibold" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                      {faq.q}
                    </span>
                    <span className="text-slate-400 shrink-0 text-sm font-mono font-bold">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className="px-5 pb-4 pt-1 text-xs sm:text-sm border-t leading-relaxed text-slate-600 dark:text-slate-400"
                      style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. SECTION: WHAT'S NEXT FOR QROLLCALL (Design Spec Page 3)     */}
      {/* ============================================================== */}
      <section
        className="w-full py-16 sm:py-20 border-b"
        style={{
          backgroundColor: '#0B0F17',
          borderColor: '#1E293B',
          color: '#FFFFFF',
        }}
      >
        <div className="w-full px-4 2xs:px-4 xs:px-6 sm:px-8 md:px-10 md-sm:px-12 lg:px-14 xl:px-16 xl-lg:px-20 2xl:px-24 2xl-md:px-28 2xl-lg:px-32 3xl:px-44">
          <div className="text-center max-w-2xl 2xl:max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl xl-lg:text-4xl font-bold tracking-tight text-white">
              What’s next for QRollCall
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl-lg:grid-cols-3 2xl-lg:grid-cols-3 gap-6 xl-lg:gap-8 2xl-lg:gap-10">
            {/* Card 1: Next */}
            <div className="rounded-lg border border-slate-800 bg-[#12172B] p-6 space-y-3">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#D4FF5E]">
                Next
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Rich engagement dashboards for deeper student insights.
              </p>
            </div>

            {/* Card 2: Later */}
            <div className="rounded-lg border border-slate-800 bg-[#12172B] p-6 space-y-3">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#D4FF5E]">
                Later
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Facial recognition to enhance attendance security.
              </p>
            </div>

            {/* Card 3: Exploring */}
            <div className="rounded-lg border border-slate-800 bg-[#12172B] p-6 space-y-3">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#D4FF5E]">
                Exploring
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Global language support for worldwide accessibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. SECTION: LIME CTA BANNER (Design Spec Page 3)                */}
      {/* ============================================================== */}
      <section
        className="w-full py-16 sm:py-20 text-center select-none"
        style={{
          backgroundColor: '#D4FF5E',
          color: '#131926',
        }}
      >
        <div className="w-full max-w-4xl xl-lg:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl mx-auto px-4 2xs:px-4 xs:px-6 sm:px-8 md:px-10 md-sm:px-12 lg:px-14 xl:px-16 xl-lg:px-20 2xl:px-24 2xl-md:px-28 2xl-lg:px-32 3xl:px-44 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#131926]">
            Ready to transform attendance?
          </h2>
          <p className="text-xs sm:text-sm text-[#131926]/90 max-w-md mx-auto font-medium">
            Accounts are created by your institution. Sign in, or find out how to get access.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="h-10 px-5 rounded-md font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-none flex items-center justify-center bg-[#131926] text-white hover:bg-[#1E293B]"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate('/request-access')}
              className="h-10 px-5 rounded-md font-semibold text-xs sm:text-sm border border-[#131926] text-[#131926] bg-transparent hover:bg-[#131926]/10 transition-colors cursor-pointer flex items-center justify-center"
            >
              How to get access
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 10. FOOTER (Design Spec Page 3)                                */}
      {/* ============================================================== */}
      <footer
        className="w-full pt-16 pb-12 text-slate-400 text-xs"
        style={{
          backgroundColor: '#080C14',
          color: '#94A3B8',
        }}
      >
        <div className="w-full px-4 2xs:px-4 xs:px-6 sm:px-8 md:px-10 md-sm:px-12 lg:px-14 xl:px-16 xl-lg:px-20 2xl:px-24 2xl-md:px-28 2xl-lg:px-32 3xl:px-44">
          <div className="grid grid-cols-1 md:grid-cols-12 xl-lg:grid-cols-12 2xl-lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
            {/* Col 1: Brand & Bio (col-span-4) */}
            <div className="md:col-span-4 space-y-3">
              <BrandLogo size="md" theme="dark" clickable={true} />
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Smart, secure QR attendance for educational institutions.
              </p>
            </div>

            {/* Col 2: Quick Links (col-span-2) */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Quick links
              </h4>
              <ul className="space-y-2">
                <li>
                  <button type="button" onClick={() => scrollToSection('features')} className="hover:text-white cursor-pointer">
                    Features
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('benefits')} className="hover:text-white cursor-pointer">
                    Benefits
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('faq')} className="hover:text-white cursor-pointer">
                    FAQ
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/request-access')} className="hover:text-white cursor-pointer">
                    Support
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Resources (col-span-2) */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white">
                    Tutorials
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white">
                    Privacy policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Stay Updated (col-span-4) */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Stay updated
              </h4>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="Your email address"
                  className="h-9 px-3 rounded-md bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 w-full focus:outline-hidden focus:border-[#D4FF5E]"
                />
                <button
                  type="submit"
                  className="h-9 px-3.5 rounded-md font-semibold text-xs cursor-pointer transition-colors shrink-0"
                  style={{
                    backgroundColor: '#D4FF5E',
                    color: '#131926',
                  }}
                >
                  Subscribe
                </button>
              </form>
              {subscribed && (
                <p className="text-[11px] text-[#D4FF5E] font-medium">
                  Thank you for subscribing to QRollCall updates.
                </p>
              )}
              <div className="pt-2 space-y-1 text-slate-400">
                <p className="font-mono text-xs">hello@qrollcall.com</p>
                <p className="font-mono text-xs">+254 798 765 432</p>
              </div>
            </div>
          </div>

          {/* Bottom Legal Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© {new Date().getFullYear()} QRollCall. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-400 cursor-pointer">Terms</span>
              <span className="hover:text-slate-400 cursor-pointer">Privacy</span>
              <span className="hover:text-slate-400 cursor-pointer">Cookies</span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-white cursor-pointer font-medium"
              >
                Back to top
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
