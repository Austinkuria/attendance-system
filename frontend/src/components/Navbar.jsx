import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate('/student/view-profile');
  };

  return (
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/auth/login">Login</a></li>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/lecturer-dashboard">Lecturer Dashboard</a></li>
        <li><a href="/student-dashboard">Student Dashboard</a></li>
        <li><a href="/admin">Admin Panel</a></li>
        <li><button onClick={handleViewProfile}>View Profile</button></li> {/* New button added */}
      </ul>
    </nav>
  );
};

export default Navbar;
