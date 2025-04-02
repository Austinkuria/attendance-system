import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isTokenValid, validateSession } from '../utils/authUtils';

// Create context with default values
export const AuthContext = createContext({
  isAuthenticated: false,
  userId: null,
  userRole: null,
  loading: true,
  checkAuth: () => { },
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check authentication status
  const checkAuth = async () => {
    try {
      setLoading(true);
      const valid = isTokenValid();

      if (valid) {
        // Get user data from localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          setUserId(parsedUserData.id);
          setUserRole(parsedUserData.role);
        }

        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userId,
      userRole,
      loading,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
