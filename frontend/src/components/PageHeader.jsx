import PropTypes from 'prop-types';

/**
 * Standardized PageHeader Component.
 * Ensures consistent left-aligned title, single-line subtitle,
 * and clean right-aligned action buttons across every dashboard and sub-page.
 */
const PageHeader = ({ title, subtitle, children, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0">
            {subtitle}
          </p>
        )}
      </div>
      {(children || actions) && (
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {actions || children}
        </div>
      )}
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
};

export default PageHeader;
