import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AppShell from '../components/Layout/AppShell';

/**
 * Student AppShell Layout
 */
const StudentLayout = () => {
  const navLinks = [
    {
      label: 'Today',
      to: '/student',
      aliases: ['/student', '/student-dashboard']
    },
    {
      label: 'My units',
      to: '/student/units',
      aliases: ['/student/units', '/student/my-units']
    },
    {
      label: 'Trends',
      to: '/student/trends',
      aliases: ['/student/trends', '/student/attendance-trends']
    }
  ];

  return (
    <AppShell role="student" navLinks={navLinks}>
      <Outlet />
    </AppShell>
  );
};

export default StudentLayout;
