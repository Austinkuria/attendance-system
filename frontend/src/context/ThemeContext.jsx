// context/ThemeContext.js
import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

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
      // Core Palette
      primary: '#6C5CE7',        // Main action color (buttons, links)
      secondary: '#00CEC9',      // Secondary actions, highlights
      accent: '#FF7675',         // Warnings, errors, or emphasis
      background: '#F7F9FC',     // Page background
      text: '#2D3436',           // Default text
      textInvert: '#FFFFFF',     // Text on dark backgrounds
      textSecondary: '#718096',  // Secondary text color
      cardBg: '#FFFFFF',         // Card backgrounds
      border: '#E2E8F0',         // Borders, dividers
      hover: '#EDF2FF',          // Hover background (light tint of primary)
      focus: '#A29BFE',          // Focus states (derived from primary)
      disabled: '#CBD5E0',       // Disabled elements
      placeholder: '#A0AEC0',    // Placeholder text
      primaryLight: '#EDF2FF',   // Light version of primary
      backgroundLight: '#F7F9FC', // Light version of background

      // Summary Card Gradients (constrained to palette)
      cardGradient1: 'linear-gradient(135deg, #6C5CE7, #A29BFE)', // Primary-based
      cardGradient2: 'linear-gradient(135deg, #00CEC9, #81ECEC)', // Secondary-based
      cardGradient3: 'linear-gradient(135deg, #FF7675, #FAB1A0)', // Accent-based
      cardGradient4: 'linear-gradient(135deg, #0984E3, #74B9FF)', // Blue variant (within palette)

      // Additional UI Elements
      tableHeaderBg: '#F7F9FC',   // Table headers
      tableRowHover: '#EDF2FF',  // Table row hover
      modalBg: '#FFFFFF',        // Modal background
      inputBg: '#FFFFFF',        // Input background
      inputBorder: '#E2E8F0',    // Input border
      inputHover: '#EDF2FF',     // Input hover background
      paginationActive: '#6C5CE7', // Pagination active item
    },
    dark: {
      // Core Palette
      primary: '#A29BFE',        // Lightened primary for dark mode
      secondary: '#81ECEC',      // Lightened secondary
      accent: '#FAB1A0',         // Lightened accent
      background: '#2D3436',     // Dark background
      text: '#F7F9FC',           // Light text
      textInvert: '#2D3436',     // Text on light backgrounds
      textSecondary: '#A0AEC0',  // Secondary text color
      cardBg: '#3A4042',         // Dark card background
      border: '#4A5568',         // Dark borders
      hover: '#4A5568',          // Hover background (dark tint)
      focus: '#6C5CE7',          // Focus states (darker primary)
      disabled: '#718096',       // Disabled elements
      placeholder: '#A0AEC0',    // Placeholder text
      primaryLight: '#3A3851',   // Light version of primary for dark mode
      backgroundLight: '#353B3D', // Light version of background for dark mode

      // Summary Card Gradients (constrained to palette)
      cardGradient1: 'linear-gradient(135deg, #5A4FCF, #8E86E5)!important', // Primary-based
      cardGradient2: 'linear-gradient(135deg, #00B7B3, #6CDADA)', // Secondary-based
      cardGradient3: 'linear-gradient(135deg, #E65F5C, #E09B86)', // Accent-based
      cardGradient4: 'linear-gradient(135deg, #0773C4, #5DA8FF)', // Blue variant (within palette)

      // Additional UI Elements
      tableHeaderBg: '#3A4042',   // Table headers
      tableRowHover: '#4A5568',  // Table row hover
      modalBg: '#3A4042',        // Modal background
      inputBg: '#3A4042',        // Input background
      inputBorder: '#4A5568',    // Input border
      inputHover: '#4A5568',     // Input hover background
      paginationActive: '#A29BFE', // Pagination active item
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