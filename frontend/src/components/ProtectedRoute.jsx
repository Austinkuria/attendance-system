import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
// import * as jwt_decode from 'jwt-decode';
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    // Function to check if the token is expired
    const isTokenExpired = (token) => {
        if (!token) return true;
        const decodedToken = jwtDecode(token)
        const currentTime = Date.now() / 1000; // Convert to seconds
        return decodedToken.exp < currentTime;
    };

    // If the token doesn't exist or is expired, redirect to login
    if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');  // Remove expired token
        return <Navigate to="/auth/login" />;
    }

    // If token exists and is not expired, render the children components
    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
