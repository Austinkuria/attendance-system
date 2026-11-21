import { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLiveSessionQrToken, endLiveSession } from '../../services/api';
import QRCode from 'qrcode';
import { message, Modal } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';

/**
 * QRollCall Lecturer Live Session Projector
 * Complies strictly with UI Craft & Anti-Slop Design Rules:
 * - rounded-lg cards with 1px hairline border, shadow-none
 * - rounded-md controls (h-9 primary actions/inputs, h-8 filters/actions)
 * - Clean progress indicator and high-contrast typography
 * - Direct ThemeContext bindings via CSS variables
 */
const LecturerLiveSessionProjector = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, getCardStyle, getSubtleStyle } = useContext(ThemeContext);

  const [sessionData, setSessionData] = useState({
    unitCode: 'SE301',
    unitName: 'Mobile and Web Application Architecture',
    classSize: 30,
    checkedInCount: 0,
    manualPin: '',
    secondsRemaining: 30,
    attendees: [],
  });

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [ending, setEnding] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Synthesised web audio chime on new student scan
  const playCheckInChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const fetchSessionQr = useCallback(async () => {
    try {
      const res = await getLiveSessionQrToken(sessionId);
      if (res && res.success) {
        setSessionData((prev) => {
          if (res.checkedInCount > prev.checkedInCount) {
            playCheckInChime();
          }
          return {
            unitCode: res.unitCode,
            unitName: res.unitName,
            classSize: res.classSize,
            checkedInCount: res.checkedInCount,
            manualPin: res.manualPin,
            secondsRemaining: res.secondsRemaining,
            attendees: res.attendees || [],
          };
        });

        setCountdown(res.secondsRemaining || 30);

        if (res.qrCode) {
          setQrCodeDataUrl(res.qrCode);
        } else if (res.qrToken) {
          const url = await QRCode.toDataURL(res.qrToken, {
            width: 480,
            margin: 2,
            errorCorrectionLevel: 'H',
          });
          setQrCodeDataUrl(url);
        }
      }
    } catch (err) {
      console.error('Error fetching live session token:', err);
      if (err.response?.status === 400 || err.response?.data?.message?.includes('ended')) {
        message.info('Session has ended.');
        navigate('/lecturer-dashboard');
      }
    }
  }, [sessionId, navigate, playCheckInChime]);

  useEffect(() => {
    fetchSessionQr();

    const attendeePoll = setInterval(() => {
      fetchSessionQr();
    }, 5000);

    return () => clearInterval(attendeePoll);
  }, [fetchSessionQr]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchSessionQr();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [fetchSessionQr]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleCopyPin = () => {
    if (sessionData.manualPin) {
      navigator.clipboard.writeText(sessionData.manualPin);
      message.success(`Manual PIN ${sessionData.manualPin} copied`);
    }
  };

  const handleEndSession = () => {
    Modal.confirm({
      title: 'End Attendance Session?',
      content: 'This will stop the 30-second rotating QR token and automatically mark remaining enrolled students as absent.',
      okText: 'End Session',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setEnding(true);
        try {
          await endLiveSession(sessionId);
          message.success('Session ended and absent records marked successfully.');
          navigate('/lecturer-dashboard');
        } catch (err) {
          console.error('Error ending session:', err);
          message.error(err.response?.data?.message || 'Failed to end session');
        } finally {
          setEnding(false);
        }
      },
    });
  };

  const progressPercent = Math.min(100, Math.max(0, (countdown / 30) * 100));

  return (
    <div
      className="min-h-screen w-full p-4 sm:p-6 lg:p-8 flex flex-col justify-between items-center transition-colors"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Floating Utility Bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigate('/lecturer-dashboard')}
          className="h-9 px-3.5 rounded-md border text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
          style={getSubtleStyle()}
        >
          <span>← Back to Overview</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="h-9 px-3.5 rounded-md border text-xs font-medium cursor-pointer transition-colors"
            style={getSubtleStyle()}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F11)'}
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1">
        {/* LEFT COLUMN: LIVE ROTATING QR CODE DISPLAY (7 cols) */}
        <div
          className="lg:col-span-7 rounded-lg border p-6 sm:p-8 flex flex-col items-center justify-between min-h-[520px] shadow-none transition-colors"
          style={getCardStyle()}
        >
          <div className="text-center w-full">
            <span
              className="text-xs font-semibold tracking-wider uppercase font-mono"
              style={{ color: isDarkMode ? '#D4FF5E' : '#0F172A' }}
            >
              Session Live • {sessionData.unitCode}
            </span>
            <h1
              className="text-xl sm:text-2xl font-semibold mt-1 truncate max-w-md mx-auto"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              {sessionData.unitName}
            </h1>
          </div>

          {/* Central Rotating QR Container Box */}
          <div className="my-4 flex flex-col items-center">
            <div
              className="p-4 bg-white rounded-lg border flex items-center justify-center shadow-none"
              style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
            >
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Live Session QR Code"
                  className="w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 object-contain"
                />
              ) : (
                <div className="w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center text-slate-500 text-xs font-medium">
                  Loading rotating QR Code...
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center mt-3">
              Dynamic QR token refreshes in <strong className="font-mono text-sm" style={{ color: isDarkMode ? '#D4FF5E' : '#0F172A' }}>{countdown}s</strong>
            </p>

            {/* Manual PIN Fallback */}
            {sessionData.manualPin && (
              <button
                type="button"
                onClick={handleCopyPin}
                className="mt-2.5 h-9 px-3.5 rounded-md border flex items-center gap-2 cursor-pointer transition-colors"
                style={getSubtleStyle()}
                title="Click to copy manual backup PIN"
              >
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Backup PIN:</span>
                <span
                  className="text-sm font-mono font-semibold tracking-widest"
                  style={{ color: isDarkMode ? '#D4FF5E' : '#0F172A' }}
                >
                  {sessionData.manualPin}
                </span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress Bar & End Session Button */}
          <div className="w-full max-w-sm flex flex-col items-center space-y-3">
            <div className="w-full h-1.5 rounded-xs bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full transition-all duration-1000 ease-linear rounded-xs"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleEndSession}
              disabled={ending}
              className="h-9 px-4 rounded-md border text-xs font-semibold text-rose-500 hover:underline cursor-pointer transition-colors"
              style={getSubtleStyle()}
            >
              {ending ? 'Ending session...' : 'End session'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME CHECKED-IN MONITOR (5 cols) */}
        <div
          className="lg:col-span-5 rounded-lg border p-4 sm:p-6 shadow-none flex flex-col justify-between min-h-[520px] transition-colors space-y-4"
          style={getCardStyle()}
        >
          <div>
            <div className="flex items-center justify-between">
              <h2
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Checked In
              </h2>
              <span
                className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border text-slate-700 dark:text-slate-300"
                style={getSubtleStyle()}
              >
                Live Roster
              </span>
            </div>

            {/* Big Counter */}
            <div className="my-3 flex items-baseline gap-2">
              <span
                className="text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums"
                style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
              >
                {sessionData.checkedInCount}
              </span>
              <span className="text-sm font-medium text-slate-400">
                of {sessionData.classSize}
              </span>
              <span
                className="ml-auto text-xs font-semibold font-mono tabular-nums"
                style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
              >
                {sessionData.classSize > 0 ? Math.round((sessionData.checkedInCount / sessionData.classSize) * 100) : 0}%
              </span>
            </div>

            <div className="h-px w-full my-3" style={{ backgroundColor: 'var(--border-color)' }} />

            {/* Attendees Live Feed */}
            {sessionData.attendees && sessionData.attendees.length > 0 ? (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {sessionData.attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="p-2.5 rounded-md border flex items-center justify-between transition-colors shadow-none"
                    style={getSubtleStyle()}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
                      >
                        {attendee.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {attendee.regNumber}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono block text-slate-400">
                        {new Date(attendee.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: isDarkMode ? '#D4FF5E' : '#10B981' }}
                      >
                        {attendee.checkInMethod === 'MANUAL_PIN' ? 'PIN' : 'Scanned'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="my-6 rounded-md border p-6 text-center flex flex-col items-center justify-center min-h-[200px]"
                style={getSubtleStyle()}
              >
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  Students appear here in real time as they scan or enter PIN.
                </p>
              </div>
            )}
          </div>

          <div
            className="text-center pt-3 border-t text-[11px] text-slate-400"
            style={{ borderColor: 'var(--border-color)' }}
          >
            QRollCall Live Session Monitor • Real-time auto sync
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerLiveSessionProjector;
