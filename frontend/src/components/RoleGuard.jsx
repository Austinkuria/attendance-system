import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { hasRole } from '../utils/authUtils';

/**
 * RoleGuard component for controlling access based on user roles.
 * Redirects to unauthorized page if user doesn't have the required role.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string|string[]} props.allowedRoles - Role or array of roles allowed to access
 * @param {string} props.redirectTo - Path to redirect to if unauthorized
 */
const RoleGuard = ({
    children,
    allowedRoles,
    redirectTo = "/unauthorized"
}) => {
    const location = useLocation();

    if (!hasRole(allowedRoles)) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

RoleGuard.propTypes = {
    children: PropTypes.node.isRequired,
    allowedRoles: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]).isRequired,
    redirectTo: PropTypes.string
};

export default RoleGuard;
