import PropTypes from 'prop-types';

/**
 * QRollCall Stylized Brand QR Code Graphic
 * Renders the exact visual identity from Pages 5 & 6 of the Design Specification:
 * - 3 outer position detection patterns in signature lime (#C6F36B / #D4FF5E)
 * - White and light-slate data modules in precise geometric grid
 * - Scalable vector elements with zero pixelation
 */
const QrBrandGraphic = ({ size = 200, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none flex items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Top-Left Position Marker */}
        <rect
          x="10"
          y="10"
          width="60"
          height="60"
          rx="6"
          stroke="#C6F36B"
          strokeWidth="10"
          fill="none"
        />
        <rect x="28" y="28" width="24" height="24" rx="3" fill="#FFFFFF" />

        {/* Top-Right Position Marker */}
        <rect
          x="130"
          y="10"
          width="60"
          height="60"
          rx="6"
          stroke="#C6F36B"
          strokeWidth="10"
          fill="none"
        />
        <rect x="148" y="28" width="24" height="24" rx="3" fill="#FFFFFF" />

        {/* Bottom-Left Position Marker */}
        <rect
          x="10"
          y="130"
          width="60"
          height="60"
          rx="6"
          stroke="#C6F36B"
          strokeWidth="10"
          fill="none"
        />
        <rect x="28" y="148" width="24" height="24" rx="3" fill="#FFFFFF" />

        {/* Center & Data Modules (Matching Page 5 & 6 Spec) */}
        <rect x="100" y="25" width="18" height="18" rx="2" fill="#E2E8F0" />
        <rect x="90" y="60" width="20" height="20" rx="3" fill="#FFFFFF" />
        <rect x="140" y="85" width="18" height="18" rx="2" fill="#E2E8F0" />
        <rect x="80" y="95" width="20" height="20" rx="2" fill="#CBD5E1" />
        <rect x="110" y="105" width="22" height="22" rx="3" fill="#FFFFFF" />
        <rect x="160" y="115" width="18" height="18" rx="2" fill="#E2E8F0" />
      </svg>
    </div>
  );
};

QrBrandGraphic.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
};

export default QrBrandGraphic;
