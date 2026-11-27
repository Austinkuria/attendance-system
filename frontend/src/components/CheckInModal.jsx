import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import QrScanner from 'qr-scanner';
import { checkInAttendance } from '../services/api';

/**
 * QRollCall Student Check-in Modal
 * Complies strictly with UI Craft & Anti-Slop Design Rules:
 * - rounded-lg modal dialog with 1px hairline border, shadow-none
 * - rounded-md controls (h-9 primary actions/inputs)
 * - permitted rounded-full strictly for status indicator dot and success avatar
 */
const CheckInModal = ({ isOpen, onClose, liveSession, onCheckInSuccess }) => {
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual' | 'success'
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);

  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // Initialize and tear down QR scanner
  useEffect(() => {
    if (!isOpen || mode !== 'camera') {
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      return;
    }

    let isMounted = true;
    const startScanner = async () => {
      if (!videoRef.current) return;
      try {
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            const token = typeof result === 'object' ? result.data : result;
            if (token && isMounted) {
              handleProcessCheckIn({ qrToken: token });
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: false,
            highlightCodeOutline: false,
            maxScansPerSecond: 4,
          }
        );
        scannerRef.current = qrScanner;
        await qrScanner.start();
      } catch (err) {
        console.warn('Camera initiation notice:', err.message);
        if (isMounted) {
          setErrorMessage('Camera access unavailable. Please use manual backup code.');
          setMode('manual');
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // Automatic background synchronization of offline check-ins
  useEffect(() => {
    const syncOfflineQueue = async () => {
      try {
        const queue = JSON.parse(localStorage.getItem('pendingCheckIns') || '[]');
        if (queue.length === 0) return;
        const remaining = [];
        for (const item of queue) {
          try {
            await checkInAttendance(item.payload);
          } catch (e) {
            console.warn('Failed to sync offline check-in, retaining:', e);
            remaining.push(item);
          }
        }
        localStorage.setItem('pendingCheckIns', JSON.stringify(remaining));
      } catch {
        // Fallback
      }
    };

    if (navigator.onLine) {
      syncOfflineQueue();
    }
  }, []);

  const handleProcessCheckIn = async (checkInData) => {
    setLoading(true);
    setErrorMessage('');

    const resolvedSessionId =
      liveSession?.id ||
      liveSession?.sessionId ||
      liveSession?._id ||
      checkInData.sessionId;

    // Retrieve GPS position if available for geofenced session validation
    let coords = null;
    if (navigator?.geolocation) {
      try {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 2500, maximumAge: 60000 }
          );
        });
      } catch {
        coords = null;
      }
    }

    const payload = {
      sessionId: resolvedSessionId,
      qrToken: checkInData.qrToken,
      manualPin: checkInData.pin,
      checkInMethod: checkInData.pin ? 'MANUAL_PIN' : 'QR_SCAN',
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    };

    try {
      const res = await checkInAttendance(payload);
      if (res && res.success) {
        setCheckInResult({
          unitCode: res.session?.unitCode || liveSession?.unitCode || 'SE301',
          unitName: res.session?.unitName || liveSession?.unitName || 'Mobile and Web Application Architecture',
          checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setMode('success');
        if (onCheckInSuccess) onCheckInSuccess(res);
      } else {
        setErrorMessage(res?.message || 'Check-in could not be verified. Please retry.');
      }
    } catch (err) {
      console.warn('Check-in network fault:', err);
      if (!navigator.onLine) {
        const queue = JSON.parse(localStorage.getItem('pendingCheckIns') || '[]');
        queue.push({ payload, timestamp: Date.now() });
        localStorage.setItem('pendingCheckIns', JSON.stringify(queue));

        setCheckInResult({
          unitCode: liveSession?.unitCode || 'SE301',
          unitName: `${liveSession?.unitName || 'Lecture'} (Saved Offline)`,
          checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setMode('success');
      } else {
        setErrorMessage(err.response?.data?.message || 'Verification failed. Please scan again or enter manual code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCheckIn({ pin: manualCode });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-sm rounded-lg bg-[#131926] text-white p-5 border border-slate-700 shadow-none flex flex-col items-center">
        {/* Top Dismiss Row */}
        {mode !== 'success' && (
          <div className="w-full flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Lecture Check-in
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* SCREEN 2: CAMERA OR MANUAL PIN SCANNER */}
        {mode !== 'success' ? (
          <div className="w-full flex flex-col items-center space-y-3.5">
            {/* Unit Live Status */}
            <div className="w-full rounded-md bg-[#1C2638] px-3.5 py-2.5 flex items-start gap-2.5 border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-[#D4FF5E] mt-1 shrink-0 animate-pulse" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {liveSession?.unitCode || 'SE301'} is live
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {liveSession?.unitName || 'Mobile and Web Application Architecture'}
                </p>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="w-full px-3 py-2 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
                {errorMessage}
              </div>
            )}

            {mode === 'camera' ? (
              <>
                {/* Viewport Frame with Corner Brackets */}
                <div className="relative w-56 h-56 rounded-md overflow-hidden bg-black flex items-center justify-center border border-slate-800">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />

                  {/* Corner Accent Brackets */}
                  <div className="absolute inset-3 pointer-events-none flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-t-2 border-l-2 border-[#D4FF5E] rounded-tl-xs" />
                      <div className="w-5 h-5 border-t-2 border-r-2 border-[#D4FF5E] rounded-tr-xs" />
                    </div>
                    <div className="w-full h-0.5 bg-[#D4FF5E]/80 shadow-[0_0_8px_#D4FF5E] animate-pulse" />
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-b-2 border-l-2 border-[#D4FF5E] rounded-bl-xs" />
                      <div className="w-5 h-5 border-b-2 border-r-2 border-[#D4FF5E] rounded-br-xs" />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 text-center max-w-[220px] leading-relaxed">
                  Point camera at the rotating QR code in the lecture hall.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('manual');
                  }}
                  className="w-full h-9 rounded-md border border-slate-700 bg-transparent hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  Enter backup code manually
                </button>
              </>
            ) : (
              /* Manual 6-Character PIN Input Mode */
              <form onSubmit={handleManualSubmit} className="w-full flex flex-col items-center space-y-3 py-2">
                <p className="text-xs text-slate-300 text-center">
                  Enter the 6-character code projected on the lecturer screen.
                </p>

                <input
                  type="text"
                  maxLength={6}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-48 text-center text-xl font-mono tracking-widest h-10 px-3 rounded-md bg-slate-900 border border-slate-700 text-[#D4FF5E] font-bold focus:outline-hidden focus:border-[#D4FF5E]"
                  autoFocus
                />

                <div className="w-full flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setMode('camera');
                    }}
                    className="flex-1 h-9 rounded-md border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Use camera
                  </button>

                  <button
                    type="submit"
                    disabled={loading || manualCode.trim().length !== 6}
                    className="flex-1 h-9 rounded-md bg-[#D4FF5E] text-[#131926] text-xs font-bold hover:brightness-105 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    {loading ? 'Verifying...' : 'Verify code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* SCREEN 3: SUCCESS CONFIRMATION */
          <div className="w-full flex flex-col items-center text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#D4FF5E] text-[#131926] flex items-center justify-center animate-in zoom-in-75 duration-300">
              <svg className="w-8 h-8 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Check-in verified
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-[240px] mx-auto leading-relaxed">
                {checkInResult?.unitCode}: {checkInResult?.unitName}
              </p>
            </div>

            <div className="w-full rounded-md bg-[#1C2638] px-4 py-2.5 flex items-center justify-between border border-slate-700/60">
              <span className="text-xs text-slate-400">Timestamp</span>
              <span className="text-xs font-mono font-semibold text-white tracking-wider">
                {checkInResult?.checkedInAt}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-9 rounded-md bg-[#D4FF5E] text-[#131926] font-semibold text-xs hover:brightness-105 transition-all cursor-pointer"
            >
              Back to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

CheckInModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  liveSession: PropTypes.object,
  onCheckInSuccess: PropTypes.func,
};

export default CheckInModal;
