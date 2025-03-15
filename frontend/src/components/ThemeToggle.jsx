// components/ThemeToggle.jsx
import { Switch } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useContext } from 'react';
import PropTypes from 'prop-types';
import { ThemeContext } from '../context/ThemeContext';

const ThemeToggle = ({ position = 'default' }) => {
  const { isDarkMode, setIsDarkMode, themeColors } = useContext(ThemeContext);

  // Define position styles
  const positions = {
    default: {},
    topRight: {
      position: 'absolute',
      top: 16,
      right: 24,
      zIndex: 1000,
    },
    headerRight: {
      marginLeft: 'auto',
      marginRight: 8
    }
  };

  return (
    <Switch
      checked={isDarkMode}
      onChange={() => setIsDarkMode(!isDarkMode)}
      checkedChildren={<BulbFilled />}
      unCheckedChildren={<BulbOutlined />}
      style={{
        background: isDarkMode ? themeColors.primary : '#d9d9d9',
        ...positions[position]
      }}
    />
  );
};
ThemeToggle.propTypes = {
  position: PropTypes.oneOf(['default', 'topRight', 'headerRight'])
};

export default ThemeToggle;