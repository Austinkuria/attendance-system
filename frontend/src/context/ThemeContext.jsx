import { createContext, useState } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const modernColors = {
    light: {
      primary: '#6C5CE7',
      secondary: '#00CEC9',
      accent: '#FF7675',
      background: '#F7F9FC',
      text: '#2D3436',
      cardGradient1: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
      cardGradient2: 'linear-gradient(135deg, #00CEC9, #81ECEC)',
      cardBg: '#FFFFFF',
    },
    dark: {
      primary: '#A29BFE',
      secondary: '#81ECEC',
      accent: '#FAB1A0',
      background: '#2D3436',
      text: '#F7F9FC',
      cardGradient1: 'linear-gradient(135deg, #5A4FCF, #A29BFE)',
      cardGradient2: 'linear-gradient(135deg, #00CEC9, #81ECEC)',
      cardBg: '#3A4042',
    },
  };

  const themeColors = isDarkMode ? modernColors.dark : modernColors.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Add PropTypes validation
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired, // 'node' covers anything that can be rendered
};