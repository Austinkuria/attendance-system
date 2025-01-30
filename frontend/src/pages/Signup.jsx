import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css'; // Importing the CSS file

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student'); // Default to 'student'
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    // **Password confirmation validation**
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login'); // Redirect to login page after successful signup
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch {
      setError('An error occurred during signup');
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Signup</button>
        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </form>
    </div>
  );
};

export default Signup;
