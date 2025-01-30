import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import '../styles.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api//login', { email, password });

      // Store token in localStorage
      const token = response.data.token;
      localStorage.setItem('token', token);

      // Decode token to get user role
      const decodedToken = jwtDecode(token);
      const role = decodedToken.role;

      // Store role in localStorage
      localStorage.setItem('role', role);

      // Redirect based on role
      switch (role) {
        case 'student':
          navigate('/student-dashboard');
          break;
        case 'lecturer':
          navigate('/lecturer-dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/dashboard'); // Fallback
      }
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p>Don&apos;t have an account? <a href="/signup">Signup</a></p>
      </form>
    </div>
  );
};

export default Login;
