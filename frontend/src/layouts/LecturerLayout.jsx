import { Outlet } from 'react-router-dom';
import AppShell from '../components/Layout/AppShell';

/**
 * Lecturer Fluid AppShell Layout
 * Displays top navigation bar with uppercase LECTURER pill, role navigation tabs,
 * theme toggle, and interactive profile chip.
 */
const LecturerLayout = () => {
  const navLinks = [
    {
      label: 'Overview',
      to: '/lecturer-dashboard',
      aliases: ['/lecturer', '/lecturer-dashboard', '/lecturer/overview']
    },
    {
      label: 'Sessions',
      to: '/lecturer/sessions',
      aliases: ['/lecturer/sessions']
    },
    {
      label: 'Past sessions',
      to: '/lecturer/past-attendance',
      aliases: ['/lecturer/past-attendance']
    },
    {
      label: 'Analytics',
      to: '/lecturer/analytics',
      aliases: ['/lecturer/analytics']
    },
    {
      label: 'Feedback',
      to: '/lecturer/feedback',
      aliases: ['/lecturer/feedback']
    }
  ];

  return (
    <AppShell role="lecturer" navLinks={navLinks}>
      <Outlet />
    </AppShell>
  );
};

export default LecturerLayout;
