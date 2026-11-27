import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { API_URL } from '../services/api';

/**
 * Environment indicator badge
 * Visible strictly in development mode to prevent confusing local dev with production
 */
export const EnvironmentBadge = () => {
  const { isDarkMode } = useContext(ThemeContext);

  // In production builds, render nothing
  if (!import.meta.env.DEV) {
    return null;
  }

  const isLocalBackend = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');

  return (
    <div
      className="fixed bottom-3 right-3 z-50 pointer-events-none flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono font-medium tracking-wide border shadow-none"
      style={{
        backgroundColor: isDarkMode ? '#131926' : '#FFFFFF',
        borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
        color: isDarkMode ? '#94A3B8' : '#475569',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: isLocalBackend ? '#EAB308' : '#3B82F6',
        }}
      />
      <span>DEV</span>
      <span style={{ color: isDarkMode ? '#475569' : '#94A3B8' }}>·</span>
      <span>{isLocalBackend ? 'local:5000' : 'remote'}</span>
    </div>
  );
};

export default EnvironmentBadge;
