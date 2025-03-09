import { useContext } from 'react';
import { Switch } from 'antd';
import { ThemeContext } from '../context/ThemeContext'; // Updated path

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
        borderColor: themeColors.primary,
      }}
    />
  );
};

export default ThemeToggle;