import { Outlet } from 'react-router-dom';
import AppShell from '../../components/Layout/AppShell';

/**
 * QRollCall Super Admin Fluid AppShell Layout
 * Strict compliance with AGENTS.md & UI_DESIGN_RULES.md:
 * - h-14 header bar with clean flat text links flush with bottom border (border-b-2 on active)
 * - Zero heavy floating vertical sidebars: uses universal top navigation AppShell
 * - Theme-aware background, surface, and text bindings
 * - Full system-wide scope
 */
const SuperAdminLayout = () => {
  const navLinks = [
    {
      label: 'Overview',
      to: '/super-admin',
      aliases: ['/super-admin']
    },
    {
      label: 'Departments',
      to: '/super-admin/departments',
      aliases: ['/super-admin/departments']
    },
    {
      label: 'Admins',
      to: '/super-admin/admins',
      aliases: ['/super-admin/admins']
    },
    {
      label: 'Users',
      to: '/super-admin/users',
      aliases: ['/super-admin/users']
    },
    {
      label: 'Courses',
      to: '/super-admin/courses',
      aliases: ['/super-admin/courses']
    },
    {
      label: 'Audit Logs',
      to: '/super-admin/logs',
      aliases: ['/super-admin/logs']
    }
  ];

  return (
    <AppShell role="super_admin" navLinks={navLinks}>
      <Outlet />
    </AppShell>
  );
};

export default SuperAdminLayout;
