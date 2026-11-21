import { Navigate } from 'react-router-dom';
import { isTokenValid, getUserRole } from '../utils/authUtils';
import NotFound from './ErrorPages/NotFound';

/**
 * Role-aware dashboard dispatcher.
 * Automatically forwards authenticated users to their designated role dashboard.
 * Unauthenticated visitors receive a silent 404 to avoid leaking route presence.
 */
const Dashboard = () => {
  if (!isTokenValid()) {
    return <NotFound />;
  }

  const role = getUserRole();

  switch (role) {
    case 'super_admin':
      return <Navigate to="/super-admin" replace />;
    case 'admin':
    case 'department_admin':
      return <Navigate to="/admin" replace />;
    case 'lecturer':
      return <Navigate to="/lecturer-dashboard" replace />;
    case 'student':
      return <Navigate to="/student-dashboard" replace />;
    default:
      return <NotFound />;
  }
};

export default Dashboard;
