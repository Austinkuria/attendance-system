import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Create context in a separate variable
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('isDarkMode');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const modernColors = {
    light: {
      // Core Palette - Optimized for professionalism & accessibility
      primary: '#6366F1',        // Indigo 500 - Modern, professional (buttons, links, primary actions)
      secondary: '#14B8A6',      // Teal 500 - Trustworthy, tech-forward (secondary actions, highlights)
      accent: '#F43F5E',         // Rose 500 - Friendly attention (warnings, emphasis)
      background: '#F8FAFC',     // Slate 50 - Clean, professional page background
      text: '#0F172A',           // Slate 900 - Deep, readable text
      textInvert: '#FFFFFF',     // White text on dark backgrounds
      textSecondary: '#64748B',  // Slate 500 - Balanced secondary text
      cardBg: '#FFFFFF',         // Pure white card backgrounds
      border: '#E2E8F0',         // Slate 200 - Subtle borders
      hover: '#EEF2FF',          // Indigo 50 - Subtle hover state
      focus: '#818CF8',          // Indigo 400 - Clear focus indicator
      disabled: '#CBD5E0',       // Gray 300 - Disabled elements
      placeholder: '#94A3B8',    // Slate 400 - Readable placeholders
      primaryLight: '#EEF2FF',   // Indigo 50 - Light backgrounds
      backgroundLight: '#F1F5F9', // Slate 100 - Alternate light background

      // Semantic Colors - Consistent feedback states
      success: '#22C55E',        // Green 500 - Success, present, positive
      warning: '#F59E0B',        // Amber 500 - Warnings, pending
      error: '#EF4444',          // Red 500 - Errors, absent, critical
      info: '#3B82F6',           // Blue 500 - Information, neutral

      // Card Gradients - Vibrant yet professional
      cardGradient1: 'linear-gradient(135deg, #6366F1, #818CF8)', // Indigo gradient
      cardGradient2: 'linear-gradient(135deg, #14B8A6, #2DD4BF)', // Teal gradient
      cardGradient3: 'linear-gradient(135deg, #F43F5E, #FB7185)', // Rose gradient
      cardGradient4: 'linear-gradient(135deg, #3B82F6, #60A5FA)', // Blue gradient

      // Table Styling - Professional and readable
      tableHeaderBg: '#EEF2FF',      // Indigo 50 - Subtle header background
      tableHeaderText: '#1E293B',    // Slate 800 - Strong header text
      tableRowHover: '#F1F5F9',      // Slate 100 - Gentle row hover
      tableStripedRow: '#F8FAFC',    // Slate 50 - Subtle striping
      tableBorder: '#E2E8F0',        // Slate 200 - Clear table borders

      // Component-specific colors
      modalBg: '#FFFFFF',        // Modal backgrounds
      inputBg: '#FFFFFF',        // Input field backgrounds
      inputBorder: '#E2E8F0',    // Input borders
      inputHover: '#EEF2FF',     // Input hover state
      paginationActive: '#6366F1', // Active pagination button

      // Hover states for interactive elements
      primaryHover: 'rgba(99, 102, 241, 0.85)',    // Primary color at 85% opacity
      secondaryHover: 'rgba(20, 184, 166, 0.85)',  // Secondary color at 85% opacity
      accentHover: 'rgba(244, 63, 94, 0.85)',      // Accent color at 85% opacity
    },
    dark: {
      // Core Palette - Optimized for dark mode readability
      primary: '#818CF8',        // Indigo 400 - Lighter for dark bg
      secondary: '#2DD4BF',      // Teal 400 - Vibrant on dark
      accent: '#FB7185',         // Rose 400 - Softer on dark
      background: '#0F172A',     // Slate 900 - Deep, professional dark
      text: '#F1F5F9',           // Slate 100 - High contrast readable text
      textInvert: '#0F172A',     // Dark text for light elements
      textSecondary: '#94A3B8',  // Slate 400 - Balanced secondary text
      cardBg: '#1E293B',         // Slate 800 - Elevated card background
      border: '#334155',         // Slate 700 - Visible but subtle borders
      hover: '#334155',          // Slate 700 - Clear hover feedback
      focus: '#6366F1',          // Indigo 500 - Strong focus indicator
      disabled: '#475569',       // Slate 600 - Clearly disabled
      placeholder: '#94A3B8',    // Slate 400 - Visible placeholders
      primaryLight: '#1E1B4B',   // Indigo 950 - Dark primary background
      backgroundLight: '#1E293B', // Slate 800 - Alternate dark background

      // Semantic Colors - Adjusted for dark mode
      success: '#4ADE80',        // Green 400 - Vibrant success
      warning: '#FBBF24',        // Amber 400 - Clear warning
      error: '#F87171',          // Red 400 - Visible error
      info: '#60A5FA',           // Blue 400 - Clear information

      // Card Gradients - Vibrant on dark
      cardGradient1: 'linear-gradient(135deg, #6366F1, #818CF8)', // Indigo gradient
      cardGradient2: 'linear-gradient(135deg, #14B8A6, #2DD4BF)', // Teal gradient
      cardGradient3: 'linear-gradient(135deg, #F43F5E, #FB7185)', // Rose gradient
      cardGradient4: 'linear-gradient(135deg, #3B82F6, #60A5FA)', // Blue gradient

      // Table Styling - Dark mode optimized
      tableHeaderBg: '#1E1B4B',      // Indigo 950 - Distinct header
      tableHeaderText: '#F1F5F9',    // Slate 100 - Clear header text
      tableRowHover: '#334155',      // Slate 700 - Noticeable hover
      tableStripedRow: '#1E293B',    // Slate 800 - Subtle striping
      tableBorder: '#334155',        // Slate 700 - Visible borders

      // Component-specific colors
      modalBg: '#1E293B',        // Slate 800 - Elevated modals
      inputBg: '#1E293B',        // Slate 800 - Input backgrounds
      inputBorder: '#334155',    // Slate 700 - Input borders
      inputHover: '#334155',     // Slate 700 - Input hover
      paginationActive: '#818CF8', // Indigo 400 - Active pagination

      // Hover states for interactive elements
      primaryHover: 'rgba(129, 140, 248, 0.85)',   // Primary color at 85% opacity
      secondaryHover: 'rgba(45, 212, 191, 0.85)',  // Secondary color at 85% opacity
      accentHover: 'rgba(251, 113, 133, 0.85)',    // Accent color at 85% opacity
    },
  };

  const themeColors = isDarkMode ? modernColors.dark : modernColors.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};