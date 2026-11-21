import { useState, useEffect, useContext, useMemo } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  bulkUpdateUserStatus,
  bulkDeleteUsers,
  getDepartments,
  getAllCourses,
  exportFilteredData,
  downloadEntityTemplate
} from '../../services/superAdminAPI';
import ImportRosterModal from '../../components/ImportRosterModal';

const { Option } = Select;

/**
 * QRollCall Super Admin - University-Wide Users Management
 * Complete CRUD authority across all roles: Students, Lecturers, Dept Admins, Super Admins
 * Strict compliance with AGENTS.md & UI_DESIGN_RULES.md:
 * - Segmented controls with high contrast active state
 * - Strict geometry (rounded-lg card, rounded-md controls, rounded-full strictly for avatars)
 * - Honest table with full thead over subtle fill
 * - Direct ThemeContext bindings
 */
const SuperAdminUsers = () => {
  const { isDarkMode, getCardStyle, getSubtleStyle, getInputStyle } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  // Filters
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'student' | 'lecturer' | 'department_admin' | 'super_admin'
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState('student');

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Load all users, departments, courses
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes, coursesRes] = await Promise.all([
        getAllUsers(),
        getDepartments(),
        getAllCourses()
      ]);

      const fetchedUsers = usersRes?.users || (Array.isArray(usersRes) ? usersRes : []);
      const fetchedDepts = deptsRes?.departments || (Array.isArray(deptsRes) ? deptsRes : []);
      const fetchedCourses = coursesRes?.courses || (Array.isArray(coursesRes) ? coursesRes : []);

      setUsers(fetchedUsers);
      setDepartments(fetchedDepts);
      setCourses(fetchedCourses);
    } catch (err) {
      console.warn('Failed to load users:', err);
      message.error('Failed to load university directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const regNo = (u.regNo || u.reg_number || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || fullName.includes(query) || email.includes(query) || regNo.includes(query);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      const userDeptId = u.department?._id || u.department?.id || u.department;
      const matchesDept = deptFilter === 'all' || String(userDeptId) === String(deptFilter);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive !== false) ||
        (statusFilter === 'inactive' && u.isActive === false);

      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, deptFilter, statusFilter]);

  // Handle Create User
  const handleCreateUser = async (values) => {
    try {
      setActionLoading(true);
      const payload = {
        role: values.role,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password || undefined,
        department: values.department || undefined,
        regNo: values.regNo?.trim()?.toUpperCase() || undefined,
        course: values.course || undefined,
        year: values.year ? parseInt(values.year) : undefined,
        semester: values.semester ? parseInt(values.semester) : undefined,
        managedDepartments: values.managedDepartments || undefined
      };

      const res = await createUser(payload);
      message.success(`User created. Temp Password: ${res.tempPassword || 'Set'}`);
      setIsAddModalOpen(false);
      addForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit User
  const handleEditUser = async (values) => {
    if (!activeUser) return;
    try {
      setActionLoading(true);
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        department: values.department || undefined,
        isActive: values.isActive
      };

      await updateUser(activeUser._id || activeUser.id, payload);
      message.success('User details updated successfully');
      setIsEditModalOpen(false);
      editForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (values) => {
    if (!activeUser) return;
    try {
      setActionLoading(true);
      const res = await resetUserPassword(activeUser._id || activeUser.id, values.newPassword);
      message.success(`Password reset. Temporary password: ${res.tempPassword || values.newPassword}`);
      setIsResetPasswordOpen(false);
      passwordForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Active Status
  const handleToggleActive = async (user) => {
    try {
      const nextStatus = user.isActive === false;
      await updateUser(user._id || user.id, { isActive: nextStatus });
      message.success(`User ${nextStatus ? 'activated' : 'deactivated'}`);
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Handle Delete User
  const handleDeleteUser = (user) => {
    Modal.confirm({
      title: 'Delete User Account',
      content: `Are you sure you want to permanently delete ${user.firstName} ${user.lastName} (${user.role})? This cannot be undone.`,
      okText: 'Delete Permanently',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteUser(user._id || user.id);
          message.success('User deleted successfully');
          await loadData();
        } catch (err) {
          message.error(err.response?.data?.message || 'Failed to delete user');
        }
      }
    });
  };

  // Bulk status update
  const handleBulkStatus = async (isActive) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateUserStatus(selectedIds, isActive);
      message.success(`Status updated for ${selectedIds.length} users`);
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Bulk status update failed');
    }
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    Modal.confirm({
      title: 'Bulk Delete Users',
      content: `Are you sure you want to delete ${selectedIds.length} selected users?`,
      okText: 'Delete Selected',
      okType: 'danger',
      onOk: async () => {
        try {
          await bulkDeleteUsers(selectedIds);
          message.success('Selected users deleted');
          setSelectedIds([]);
          await loadData();
        } catch (err) {
          message.error(err.response?.data?.message || 'Bulk delete failed');
        }
      }
    });
  };

  const handleExport = async (format = 'xlsx') => {
    try {
      setExporting(true);
      const params = {
        role: roleFilter !== 'all' ? roleFilter : undefined,
        departmentId: deptFilter !== 'all' ? deptFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined
      };
      await exportFilteredData('users', params, format);
      message.success(`Filtered users directory exported as .${format}`);
    } catch (err) {
      message.error('Failed to export users directory');
    } finally {
      setExporting(false);
    }
  };

  // Role display helpers
  const getRoleBadge = (role) => {
    const roleLabels = {
      super_admin: 'Super Admin',
      department_admin: 'Dept Admin',
      lecturer: 'Lecturer',
      student: 'Student',
    };
    return (
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {roleLabels[role] || role}
      </span>
    );
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
            University Directory & Users
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global repository of student enrolments, faculty appointments, department heads, and system administrators.
          </p>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => downloadEntityTemplate(roleFilter === 'lecturer' ? 'lecturers' : 'students')}
            className="h-9 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
            style={getSubtleStyle()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Template</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
            style={getSubtleStyle()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Import .xlsx</span>
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExport('xlsx')}
            className="h-9 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
            style={getSubtleStyle()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{exporting ? 'Exporting...' : 'Export .xlsx'}</span>
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExport('csv')}
            className="h-9 px-3 rounded-md border text-xs font-semibold transition-colors cursor-pointer shadow-none"
            style={getSubtleStyle()}
          >
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              addForm.resetFields();
              setSelectedRoleForAdd('student');
              setIsAddModalOpen(true);
            }}
            className="h-9 px-4 rounded-md text-xs font-semibold cursor-pointer transition-colors"
            style={{
              backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
              color: isDarkMode ? '#131926' : '#FFFFFF',
            }}
          >
            Add user
          </button>
        </div>
      </div>

      {/* 2. Role Segmented Control (Rule 2: rounded-md track p-1, rounded-[4px] inner tabs) */}
      <div
        className="rounded-md p-1 flex items-center gap-1 overflow-x-auto no-scrollbar w-fit border"
        style={getSubtleStyle()}
      >
        {[
          { key: 'all', label: 'All roles' },
          { key: 'student', label: 'Students' },
          { key: 'lecturer', label: 'Lecturers' },
          { key: 'department_admin', label: 'Dept admins' },
          { key: 'super_admin', label: 'Super admins' },
        ].map((tab) => {
          const isActive = roleFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRoleFilter(tab.key)}
              className="px-3 py-1.5 rounded-[4px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border-0"
              style={{
                backgroundColor: isActive
                  ? isDarkMode
                    ? '#D4FF5E'
                    : '#131926'
                  : 'transparent',
                color: isActive
                  ? isDarkMode
                    ? '#131926'
                    : '#FFFFFF'
                  : isDarkMode
                  ? '#94A3B8'
                  : '#64748B',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Filter Controls Bar */}
      <div className="rounded-lg border p-4 shadow-none flex flex-col md:flex-row items-center justify-between gap-3" style={getCardStyle()}>
        <div className="w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or reg number..."
            className="w-full h-9 px-3 rounded-md border text-xs sm:text-sm font-medium shadow-none focus:outline-hidden"
            style={getInputStyle()}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 px-3 rounded-md border text-xs font-medium cursor-pointer shadow-none focus:outline-hidden"
            style={getInputStyle()}
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d._id || d.id} value={d._id || d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border text-xs font-medium cursor-pointer shadow-none focus:outline-hidden"
            style={getInputStyle()}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkStatus(true)}
                className="h-8 px-2.5 rounded-md border text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200"
                style={getSubtleStyle()}
              >
                Activate ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatus(false)}
                className="h-8 px-2.5 rounded-md border text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200"
                style={getSubtleStyle()}
              >
                Deactivate
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="h-8 px-2.5 rounded-md border text-xs font-semibold cursor-pointer text-rose-600"
                style={getSubtleStyle()}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Honest Data Table */}
      <div className="rounded-lg border shadow-none overflow-hidden min-w-0" style={getCardStyle()}>
        <div className="w-full overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={getSubtleStyle()}>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredUsers.map((u) => u._id || u.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">User Identity</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Role</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Department / Programme</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Reg / Staff ID</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Status</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading university directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No users found matching the selected filters
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const id = u._id || u.id;
                  const isChecked = selectedIds.includes(id);
                  const initials = `${(u.firstName || 'U')[0]}${(u.lastName || '')[0] || ''}`.toUpperCase();

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-500/5 transition-colors"
                      style={{
                        backgroundColor: isChecked ? (isDarkMode ? '#1A2234' : '#F1F5F9') : 'transparent',
                      }}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((i) => i !== id));
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar strictly w-8 h-8 rounded-full */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none"
                            style={{
                              backgroundColor: isDarkMode ? '#1A2234' : '#131926',
                              color: isDarkMode ? '#D4FF5E' : '#FFFFFF',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-xs sm:text-sm" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-xs" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                          {u.department?.name || u.course?.name || 'Central Administration'}
                        </div>
                        {u.course?.code && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {u.course.code} {u.year ? `· Y${u.year}S${u.semester || 1}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {u.regNo || u.reg_number || u.staffId || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive !== false ? (
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveUser(u);
                              editForm.setFieldsValue({
                                firstName: u.firstName,
                                lastName: u.lastName,
                                email: u.email,
                                department: u.department?._id || u.department?.id || u.department,
                                isActive: u.isActive !== false
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="h-8 px-2.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors"
                            style={getSubtleStyle()}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveUser(u);
                              passwordForm.resetFields();
                              setIsResetPasswordOpen(true);
                            }}
                            className="h-8 px-2.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors text-slate-700 dark:text-slate-200"
                            style={getSubtleStyle()}
                          >
                            Key
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className="h-8 px-2.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors"
                            style={getSubtleStyle()}
                          >
                            {u.isActive !== false ? 'Suspend' : 'Resume'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="h-8 px-2.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors text-rose-600 hover:bg-rose-500/10"
                            style={getSubtleStyle()}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD USER */}
      <Modal
        title="Create University User"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={addForm}
          layout="vertical"
          initialValues={{ role: 'student', year: 1, semester: 1 }}
          onFinish={handleCreateUser}
          className="pt-2"
        >
          <Form.Item name="role" label="System Role" rules={[{ required: true }]}>
            <Select onChange={(val) => setSelectedRoleForAdd(val)} className="w-full">
              <Option value="student">Student</Option>
              <Option value="lecturer">Academic Lecturer</Option>
              <Option value="department_admin">Department Administrator</Option>
              <Option value="super_admin">Super Administrator</Option>
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
              <Input className="rounded-md h-9" />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
              <Input className="rounded-md h-9" />
            </Form.Item>
          </div>

          <Form.Item name="email" label="Institutional Email" rules={[{ required: true, type: 'email' }]}>
            <Input className="rounded-md h-9" placeholder="user@university.ac.ke" />
          </Form.Item>

          {/* Department selector */}
          {selectedRoleForAdd !== 'super_admin' && (
            <Form.Item name="department" label="Department" rules={[{ required: true, message: 'Department is required' }]}>
              <Select placeholder="Select department" className="w-full">
                {departments.map((d) => (
                  <Option key={d._id || d.id} value={d._id || d.id}>
                    {d.name} ({d.code || 'DEPT'})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* Student specific fields */}
          {selectedRoleForAdd === 'student' && (
            <>
              <Form.Item name="regNo" label="Registration Number" rules={[{ required: true }]}>
                <Input placeholder="e.g. SCM211-0001/2023" className="rounded-md h-9 font-mono" />
              </Form.Item>

              <Form.Item name="course" label="Enrolled Degree Programme" rules={[{ required: true }]}>
                <Select placeholder="Select course" className="w-full">
                  {courses.map((c) => (
                    <Option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item name="year" label="Year of Study" rules={[{ required: true }]}>
                  <Select className="w-full">
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <Option key={y} value={y}>Year {y}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="semester" label="Semester" rules={[{ required: true }]}>
                  <Select className="w-full">
                    {[1, 2, 3].map((s) => (
                      <Option key={s} value={s}>Semester {s}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </>
          )}

          <Form.Item
            name="password"
            label="Initial Password"
            extra="Leave blank to automatically generate temporary password."
          >
            <Input.Password placeholder="Min 8 characters" className="rounded-md h-9" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="h-9 px-4 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="h-9 px-4 rounded-md text-xs font-semibold text-white bg-[#131926] dark:bg-[#D4FF5E] dark:text-[#131926] hover:bg-slate-800 dark:hover:bg-[#C6F350] transition-colors cursor-pointer"
            >
              {actionLoading ? 'Creating...' : 'Create user account'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: EDIT USER */}
      <Modal
        title={`Edit User: ${activeUser?.firstName || ''} ${activeUser?.lastName || ''}`}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditUser} className="pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
              <Input className="rounded-md h-9" />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
              <Input className="rounded-md h-9" />
            </Form.Item>
          </div>

          <Form.Item name="email" label="Institutional Email" rules={[{ required: true, type: 'email' }]}>
            <Input className="rounded-md h-9" />
          </Form.Item>

          <Form.Item name="department" label="Department">
            <Select placeholder="Select department" className="w-full" allowClear>
              {departments.map((d) => (
                <Option key={d._id || d.id} value={d._id || d.id}>
                  {d.name} ({d.code || 'DEPT'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Account Status" valuePropName="checked">
            <Select className="w-full">
              <Option value={true}>Active</Option>
              <Option value={false}>Suspended / Inactive</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="h-9 px-4 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="h-9 px-4 rounded-md text-xs font-semibold text-white bg-[#131926] dark:bg-[#D4FF5E] dark:text-[#131926] hover:bg-slate-800 dark:hover:bg-[#C6F350] transition-colors cursor-pointer"
            >
              {actionLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: RESET PASSWORD */}
      <Modal
        title={`Reset Password: ${activeUser?.firstName || ''} ${activeUser?.lastName || ''}`}
        open={isResetPasswordOpen}
        onCancel={() => setIsResetPasswordOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleResetPassword} className="pt-2">
          <Form.Item
            name="newPassword"
            label="New Password"
            extra="Leave blank to automatically generate a secure temporary password."
          >
            <Input.Password placeholder="Enter new password or leave blank" className="rounded-md h-9" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsResetPasswordOpen(false)}
              className="h-9 px-4 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="h-9 px-4 rounded-md text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer"
            >
              {actionLoading ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
        </Form>
      </Modal>
      {/* MODAL: BATCH ROSTER INGESTION */}
      <ImportRosterModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entity={roleFilter === 'lecturer' ? 'lecturers' : 'students'}
        title={`Batch Ingest ${roleFilter === 'lecturer' ? 'Lecturers' : 'Students'} Spreadsheet`}
        onSuccess={loadData}
      />
    </div>
  );
};

export default SuperAdminUsers;
