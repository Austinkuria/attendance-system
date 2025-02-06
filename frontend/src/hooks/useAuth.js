// import { useState, useEffect } from 'react';
// import {jwtDecode} from "jwt_decode"

// const useAuth = () => {
//   const [token, setToken] = useState(localStorage.getItem('token'));
//   const [isAuthenticated, setIsAuthenticated] = useState(!!token);

//   useEffect(() => {
//     const checkTokenExpiration = () => {
//       if (token) {
//         const decodedToken = jwtDecode(token);
//         const currentTime = Date.now() / 1000; // Convert to seconds
//         if (decodedToken.exp < currentTime) {
//           localStorage.removeItem('token');
//           setToken(null);
//           setIsAuthenticated(false);
//         }
//       }
//     };

//     checkTokenExpiration();
//     const interval = setInterval(checkTokenExpiration, 60000); // Check every minute

//     return () => clearInterval(interval);
//   }, [token]);

//   const login = (newToken) => {
//     localStorage.setItem('token', newToken);
//     setToken(newToken);
//     setIsAuthenticated(true);
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     setToken(null);
//     setIsAuthenticated(false);
//   };

//   return { token, isAuthenticated, login, logout };
// };

// export default useAuth