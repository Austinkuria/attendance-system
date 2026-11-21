import { useContext } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

/**
 * QRollCall Brand Logo Component
 * Incorporates official vector scanner-tick mark and precision typography.
 * Follows Design Spec Page 4:
 * - Mark: Scanner brackets framing a verification tick
 * - Light Backgrounds: Navy #131926 wordmark with lime #65A30D / #84CC16 accent
 * - Dark Backgrounds: Crisp white wordmark with high-contrast #D4FF5E accent
 */
const BrandLogo = ({
  variant = 'full', // 'full' | 'mark'
  size = 'md', // 'sm' | 'md' | 'lg'
  theme = 'auto', // 'auto' | 'dark' | 'light'
  clickable = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const themeCtx = useContext(ThemeContext);
  const isDarkMode = theme === 'dark' ? true : theme === 'light' ? false : (themeCtx?.isDarkMode ?? false);

  const sizeConfig = {
    sm: { markSize: 'w-6 h-6', text: 'text-base', gap: 'gap-2' },
    md: { markSize: 'w-7 h-7', text: 'text-lg', gap: 'gap-2.5' },
    lg: { markSize: 'w-9 h-9', text: 'text-2xl', gap: 'gap-3' },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  const handleClick = () => {
    if (clickable) {
      navigate('/');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-center select-none ${currentSize.gap} ${
        clickable ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Official Vector Mark */}
      <img
        src="/qrollcall-mark.svg"
        alt="QRollCall Mark"
        className={`${currentSize.markSize} shrink-0 rounded-md object-contain shadow-none`}
      />

      {/* Wordmark (for 'full' variant) */}
      {variant === 'full' && (
        <span className={`font-bold tracking-tight font-sans ${currentSize.text}`}>
          <span style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>QRoll</span>
          <span style={{ color: isDarkMode ? '#D4FF5E' : '#65A30D' }}>Call</span>
        </span>
      )}
    </div>
  );
};

BrandLogo.propTypes = {
  variant: PropTypes.oneOf(['full', 'mark']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  theme: PropTypes.oneOf(['auto', 'dark', 'light']),
  clickable: PropTypes.bool,
  className: PropTypes.string,
};

export default BrandLogo;
