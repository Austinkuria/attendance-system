import { useContext } from 'react';
import PropTypes from 'prop-types';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Uniform StatCard component.
 * High-contrast, theme-aware metric surface.
 */
const StatCard = ({
  title,
  value,
  subtitle,
  onClick,
  loading = false,
  className = '',
}) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-5 transition-all duration-150 ${
        isDarkMode
          ? 'bg-[#131926] border-slate-800 text-white'
          : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
      } ${
        onClick ? 'cursor-pointer hover:border-slate-400 dark:hover:border-slate-600' : ''
      } ${className}`}
    >
      <div className={`text-xs font-bold uppercase tracking-wider truncate ${
        isDarkMode ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {title}
      </div>
      <div className={`mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums leading-none ${
        isDarkMode ? 'text-white' : 'text-slate-900'
      }`}>
        {loading ? '...' : value}
      </div>
      {subtitle && (
        <div className={`mt-1.5 text-xs truncate font-medium ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default StatCard;
