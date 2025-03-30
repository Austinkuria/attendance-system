# Authentication Utilities

This documentation covers the authentication utilities available in the application.

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
- `redirectToDashboard()`: Redirects user to the appropriate dashboard based on role

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

## Auth Components

### ProtectedRoute

`ProtectedRoute` ensures the user has a valid token before accessing protected routes.

```jsx
import { ProtectedRoute } from './components';

// In your router configuration:
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/profile" element={<Profile />} />
</Route>

// Or as a wrapper:
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### RoleGuard

`RoleGuard` uses `hasRole()` to restrict access based on user roles.

```jsx
import { RoleGuard } from './components';

// Restrict access to admins only
<Route path="/admin" element={
  <ProtectedRoute>
    <RoleGuard allowedRoles="admin">
      <AdminDashboard />
    </RoleGuard>
  </ProtectedRoute>
} />

// Allow multiple roles
<Route path="/reports" element={
  <ProtectedRoute>
    <RoleGuard allowedRoles={["admin", "lecturer"]}>
      <Reports />
    </RoleGuard>
  </ProtectedRoute>
} />
```

## Setup Authentication Interceptors

Automatically adds authentication tokens to API requests and handles token expiration.

```javascript
import { setupAuthInterceptors } from '../utils/authUtils';
import api from '../services/api';

// Configure the API instance to use authentication
setupAuthInterceptors(api);

// Now all requests will include the auth token automatically
```

#### Validate Session on App Load

It's important to validate the user's session when the application loads to ensure they're still authenticated.

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
}
```
