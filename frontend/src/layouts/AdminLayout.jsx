import { Outlet } from 'react-router-dom';
import AppShell from '../components/Layout/AppShell';

/**
 * QRollCall Department Admin AppShell Layout
 * Strict compliance with AGENTS.md & UI_DESIGN_RULES.md:
 * - Clean flat text links flush with the bottom of the h-14 header bar (border-b-2 active tab)
 * - Zero vertical sidebars: uses universal top navigation AppShell
 * - Theme-aware background, surface, and text bindings
 */
const AdminLayout = () => {
  const navLinks = [
    {
      label: 'Overview',
      to: '/admin/dashboard',
      aliases: ['/admin', '/admin/dashboard']
    },
    {
      label: 'Students',
      to: '/admin/students',
      aliases: ['/admin/students', '/admin/manage-students']
    },
    {
      label: 'Courses',
      to: '/admin/courses',
      aliases: ['/admin/courses', '/admin/manage-courses']
    },
    {
      label: 'Lecturers',
      to: '/admin/lecturers',
      aliases: ['/admin/lecturers', '/admin/manage-lecturers']
    },
    {
      label: 'Analytics',
      to: '/admin/analytics',
      aliases: ['/admin/analytics']
    }
  ];

  return (
    <AppShell role="department_admin" navLinks={navLinks}>
      <Outlet />
    </AppShell>
  );
};

export default AdminLayout;
export { AdminLayout as AppShell };
