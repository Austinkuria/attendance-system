# Authentication Utilities

This directory contains utility functions for handling authentication and user sessions throughout the frontend application.

## authUtils.js

`authUtils.js` provides a centralized set of functions for token management, user authentication, and role-based access control.

### Key Features

- JWT token handling and validation
- User role and permissions checking
- Session management and validation
- Automatic logout on token expiration
- Axios interceptors for authentication headers

### Main Functions

#### Token Management

- `hasToken()`: Check if a JWT token exists in localStorage
- `isTokenValid()`: Check if the current JWT token is valid and not expired
- `validateSession()`: Validate the current session with the backend
- `storeAuthData(authData)`: Store authentication data in localStorage after login

#### User Information

- `getUserRole()`: Get the user's role from the JWT token
- `getUserId()`: Get the user's ID from the JWT token
- `hasRole(allowedRoles)`: Check if user has specified role(s)

#### Session Management

- `logout()`: Logout the user by clearing localStorage and redirecting
- `setupAuthInterceptors(axiosInstance)`: Setup axios interceptors for authentication

### How to Use

#### Basic Authentication Check

```javascript
import { isTokenValid, logout } from '../utils/authUtils';

// Check if user is authenticated
if (!isTokenValid()) {
  logout(); // Will redirect to login page
  return;
}
```

#### Role-Based Access Control

```javascript
import { hasRole } from '../utils/authUtils';

// Check if user has admin or lecturer role
if (hasRole(['admin', 'lecturer'])) {
  // Show admin/lecturer features
} else {
  // Show limited features
}
```

#### Setup Authentication Interceptors

```javascript
import axios from 'axios';
import { setupAuthInterceptors } from '../utils/authUtils';

// Create axios instance
const api = axios.create({
  baseURL: 'https://api.example.com'
});

// Setup interceptors
setupAuthInterceptors(api);

// Now all requests will include the auth token automatically
```

#### Validate Session on App Load

```javascript
import { validateSession } from '../utils/authUtils';

// In your app initialization
const initApp = async () => {
  try {
    // Verify the session is still valid
    await validateSession();
    // Continue with app initialization
  } catch (error) {
    // Session invalid, user will be logged out and redirected
    console.error('Session validation failed:', error.message);
  }
};
```

## Integration with RoleGuard and ProtectedRoute

The auth utilities work in tandem with the RoleGuard and ProtectedRoute components to create a comprehensive authentication system:

1. `ProtectedRoute` ensures the user has a valid token before accessing protected routes
2. `RoleGuard` uses `hasRole()` to restrict access based on user roles
3. `authUtils.js` provides the core functionality used by both components
