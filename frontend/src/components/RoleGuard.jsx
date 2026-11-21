import { Navigate, useLocation, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import { hasRole } from '../utils/authUtils';
import NotFound from '../pages/ErrorPages/NotFound';

/**
 * RoleGuard component for controlling access based on user roles.
 * When silent404 is true, unauthorized or unauthenticated visits render
 * the 404 Not Found component directly, completely concealing the existence of the endpoint.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string|string[]} props.allowedRoles - Role or array of roles allowed to access
 * @param {string} props.redirectTo - Path to redirect to if unauthorized (when silent404 is false)
 * @param {boolean} props.silent404 - If true, renders NotFound directly instead of redirecting
 */
const RoleGuard = ({
    children,
    allowedRoles,
    redirectTo = null,
    silent404 = true
}) => {
    const location = useLocation();

    if (!hasRole(allowedRoles)) {
        if (silent404 || !redirectTo) {
            return <NotFound />;
        }
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Return children if provided, otherwise return Outlet for nested routes
    return children ? <>{children}</> : <Outlet />;
};

RoleGuard.propTypes = {
    children: PropTypes.node,
    allowedRoles: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]).isRequired,
    redirectTo: PropTypes.string,
    silent404: PropTypes.bool
};

export default RoleGuard;
