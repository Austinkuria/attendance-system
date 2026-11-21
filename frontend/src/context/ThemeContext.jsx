import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import PropTypes from 'prop-types';

export const ThemeContext = createContext(null);

export const PALETTE = {
  light: {
    // Canvas & Card surfaces
    background: '#F5F5F5',
    backgroundLight: '#EFEFEF',
    cardBg: '#FFFFFF',
    modalBg: '#FFFFFF',
    inputBg: '#FFFFFF',
    subtleHeader: '#EFEFEF',

    // Typography
    text: '#0F172A',
    textInvert: '#FFFFFF',
    textSecondary: '#475569',
    placeholder: '#64748B',

    // Borders & dividers
    border: '#E5E7EB',
    inputBorder: '#D1D5DB',
    hover: '#F3F4F6',
    inputHover: '#F9FAFB',
    disabled: '#D1D5DB',

    // Brand & Live Accents
    primary: '#131926',
    brandPrimary: '#131926',
    brandHover: '#1E293B',
    liveAccent: '#D4FF5E',
    liveText: '#131926',
    success: '#16A34A',
    successBg: '#DCFCE7',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',

    // Table styling
    tableHeaderBg: '#EFEFEF',
    tableHeaderText: '#475569',
    tableRowHover: '#F9FAFB',
    tableStripedRow: '#FFFFFF',
    tableBorder: '#E5E7EB',
  },
  dark: {
    // Canvas & Elevated Card surfaces
    background: '#0B0F17',
    backgroundLight: '#1A2234',
    cardBg: '#131926',
    modalBg: '#131926',
    inputBg: '#1A2234',
    subtleHeader: '#1A2234',

    // Typography
    text: '#FFFFFF',
    textInvert: '#0F172A',
    textSecondary: '#94A3B8',
    placeholder: '#94A3B8',

    // Borders & dividers
    border: '#1E293B',
    inputBorder: '#334155',
    hover: '#1E293B',
    inputHover: '#1E293B',
    disabled: '#334155',

    // Brand & Live Accents
    primary: '#D4FF5E',
    brandPrimary: '#D4FF5E',
    brandHover: '#C6F350',
    liveAccent: '#D4FF5E',
    liveText: '#131926',
    success: '#4ADE80',
    successBg: 'rgba(34, 197, 94, 0.16)',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',

    // Table styling
    tableHeaderBg: '#1A2234',
    tableHeaderText: '#94A3B8',
    tableRowHover: '#1E293B',
    tableStripedRow: '#131926',
    tableBorder: '#1E293B',
  },
};

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState(() => {
    try {
      return localStorage.getItem('themePreference') || 'system';
    } catch {
      return 'system';
    }
  });

  const getSystemDark = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const pref = localStorage.getItem('themePreference') || 'system';
      if (pref === 'dark') return true;
      if (pref === 'light') return false;
      return getSystemDark();
    } catch {
      return false;
    }
  });

  // Listen to OS system theme changes when preference is 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e) => {
      if (themePreference === 'system') {
        setIsDarkMode(e.matches);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [themePreference]);

  // Apply dark mode class to document root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    if (document.body) {
      document.body.classList.toggle('dark', isDarkMode);
    }
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
    try {
      localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    } catch {
      // Ignore storage errors
    }
  }, [isDarkMode]);

  const setThemePreference = useCallback((choice) => {
    setThemePreferenceState(choice);
    try {
      localStorage.setItem('themePreference', choice);
    } catch {
      // Ignore
    }

    if (choice === 'dark') {
      setIsDarkMode(true);
    } else if (choice === 'light') {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(getSystemDark());
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      const nextPref = next ? 'dark' : 'light';
      setThemePreferenceState(nextPref);
      try {
        localStorage.setItem('themePreference', nextPref);
        localStorage.setItem('isDarkMode', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const themeColors = isDarkMode ? PALETTE.dark : PALETTE.light;

  /**
   * Helper: High-Contrast Active Pill/Tab styling
   */
  const getPillClass = useCallback(
    (isActive) => {
      if (isActive) {
        return isDarkMode
          ? '!bg-[#D4FF5E] !text-[#131926] font-extrabold shadow-xs'
          : '!bg-[#131926] !text-white font-extrabold shadow-xs';
      }
      return isDarkMode
        ? 'text-slate-300 hover:text-white font-semibold'
        : 'text-slate-700 hover:text-slate-900 font-semibold';
    },
    [isDarkMode]
  );

  /**
   * Helper: Standard Card Surface styling
   */
  const getCardSurfaceClass = useCallback(
    (extra = '') => {
      return `${
        isDarkMode ? 'bg-[#131926] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      } border rounded-3xl transition-colors ${extra}`;
    },
    [isDarkMode]
  );

  /**
   * Helper: Subtle header/table strip styling
   */
  const getSubtleHeaderClass = useCallback(
    (extra = '') => {
      return `${
        isDarkMode ? 'bg-[#1A2234] text-slate-300 border-slate-800' : 'bg-[#EFEFEF] text-slate-700 border-slate-200'
      } border-b ${extra}`;
    },
    [isDarkMode]
  );

  /**
   * Helper: Primary Live CTA styling
   */
  const getLiveCtaClass = useCallback(
    (extra = '') => {
      return `bg-[#D4FF5E] hover:bg-[#c6f350] text-[#131926] font-bold transition-all shadow-md cursor-pointer ${extra}`;
    },
    []
  );

  /**
   * Helper: Live Badge styling
   */
  const getLiveBadgeClass = useCallback(
    (extra = '') => {
      return `${
        isDarkMode
          ? 'bg-emerald-950/60 text-[#4ADE80] border border-emerald-800'
          : 'bg-[#DCFCE7] text-[#16A34A] border border-emerald-200'
      } font-bold px-2.5 py-0.5 rounded-full text-xs ${extra}`;
    },
    [isDarkMode]
  );

  /**
   * Single Source of Truth Surface Helpers
   * Bound directly to CSS variables to guarantee 100% theme uniformity with zero hardcoded drift
   */
  const getCardStyle = useCallback(
    () => ({
      backgroundColor: 'var(--bg-surface)',
      borderColor: 'var(--border-color)',
      color: 'var(--text-primary)',
    }),
    []
  );

  const getSubtleStyle = useCallback(
    () => ({
      backgroundColor: 'var(--bg-subtle)',
      borderColor: 'var(--border-color)',
      color: 'var(--text-primary)',
    }),
    []
  );

  const getInputStyle = useCallback(
    () => ({
      backgroundColor: 'var(--bg-surface)',
      borderColor: 'var(--border-color)',
      color: 'var(--text-primary)',
    }),
    []
  );

  /**
   * Helper: Rock-solid inline Pill/Tab styling
   */
  const getPillStyle = useCallback(
    (isActive) => ({
      backgroundColor: isActive ? (isDarkMode ? '#D4FF5E' : '#131926') : 'transparent',
      color: isActive ? (isDarkMode ? '#131926' : '#FFFFFF') : (isDarkMode ? '#94A3B8' : '#475569'),
      fontWeight: isActive ? 800 : 600,
    }),
    [isDarkMode]
  );

  const value = useMemo(
    () => ({
      isDarkMode,
      setIsDarkMode,
      themePreference,
      setThemePreference,
      toggleTheme,
      themeColors,
      getPillClass,
      getCardSurfaceClass,
      getSubtleHeaderClass,
      getLiveCtaClass,
      getLiveBadgeClass,
      getCardStyle,
      getSubtleStyle,
      getInputStyle,
      getPillStyle,
    }),
    [
      isDarkMode,
      themePreference,
      setThemePreference,
      toggleTheme,
      themeColors,
      getPillClass,
      getCardSurfaceClass,
      getSubtleHeaderClass,
      getLiveCtaClass,
      getLiveBadgeClass,
      getCardStyle,
      getSubtleStyle,
      getInputStyle,
      getPillStyle,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: isDarkMode ? '#D4FF5E' : '#131926',
            colorBgLayout: themeColors.background,
            colorBgContainer: themeColors.cardBg,
            colorBgElevated: themeColors.modalBg,
            colorBorder: themeColors.border,
            colorText: themeColors.text,
            colorTextSecondary: themeColors.textSecondary,
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
            borderRadius: 6,
          },
          components: {
            Button: {
              primaryColor: isDarkMode ? '#131926' : '#FFFFFF',
              defaultColor: isDarkMode ? '#FFFFFF' : '#0F172A',
              defaultBg: isDarkMode ? '#1A2234' : '#FFFFFF',
              defaultBorderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
            },
            Modal: {
              contentBg: isDarkMode ? '#131926' : '#FFFFFF',
              headerBg: isDarkMode ? '#131926' : '#FFFFFF',
              titleColor: isDarkMode ? '#FFFFFF' : '#0F172A',
            },
            Input: {
              colorBgContainer: isDarkMode ? '#1A2234' : '#FFFFFF',
              colorBorder: isDarkMode ? '#1E293B' : '#E2E8F0',
              colorText: isDarkMode ? '#FFFFFF' : '#0F172A',
              colorTextPlaceholder: isDarkMode ? '#64748B' : '#94A3B8',
            },
            Select: {
              colorBgContainer: isDarkMode ? '#1A2234' : '#FFFFFF',
              colorBorder: isDarkMode ? '#1E293B' : '#E2E8F0',
              colorText: isDarkMode ? '#FFFFFF' : '#0F172A',
              colorTextPlaceholder: isDarkMode ? '#64748B' : '#94A3B8',
              optionSelectedBg: isDarkMode ? '#1E293B' : '#F1F5F9',
              optionSelectedColor: isDarkMode ? '#D4FF5E' : '#131926',
            },
            Layout: {
              siderBg: isDarkMode ? '#0B0F17' : '#FFFFFF',
              headerBg: themeColors.cardBg,
              headerHeight: 64,
            },
            Menu: {
              darkItemBg: '#0B0F17',
              darkItemSelectedBg: '#131926',
              darkItemColor: '#CBD5E1',
              darkItemSelectedColor: '#FFFFFF',
            },
            Table: {
              headerBg: themeColors.tableHeaderBg,
              headerColor: themeColors.tableHeaderText,
              rowHoverBg: themeColors.tableRowHover,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export default ThemeContext;
