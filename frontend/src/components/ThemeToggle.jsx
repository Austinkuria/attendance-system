// components/ThemeToggle.jsx
import { useContext } from 'react';
import { Switch } from 'antd';
import { ThemeContext } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, setIsDarkMode, themeColors } = useContext(ThemeContext);

  return (
    <Switch
      checked={isDarkMode}
      onChange={() => setIsDarkMode(!isDarkMode)}
      checkedChildren="Dark"
      unCheckedChildren="Light"
      style={{
        background: isDarkMode ? themeColors.primary : themeColors.secondary,
        borderColor: themeColors.border,
      }}
    />
  );
};

export default ThemeToggle;