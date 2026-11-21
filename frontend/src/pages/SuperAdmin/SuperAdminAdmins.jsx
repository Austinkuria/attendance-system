import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';
import {
  getDepartmentAdmins,
  createDepartmentAdmin,
  updateDepartmentAdmin,
  deleteDepartmentAdmin,
  assignDepartments,
  getDepartments,
  downloadAdminTemplate,
  uploadAdminsFile,
  bulkUpdateAdminsStatus,
  bulkDeleteAdmins,
  resetUserPassword,
  exportFilteredData
} from '../../services/superAdminAPI';

const { Option } = Select;

/**
 * QRollCall Super Admin - Department Administrators Management
 * Strict compliance with AGENTS.md, UI_DESIGN_RULES.md:
 * - Full CRUD control over all departmental administrators
 * - Direct ThemeContext bindings (light/dark parity)
 * - Strict geometry: rounded-lg cards, rounded-md (h-9/h-8) inputs & actions, shadow-none, 1px hairline border
 * - Honest table with full thead over subtle fill and clean empty states
 */
const SuperAdminAdmins = () => {
  const { isDarkMode, getCardStyle, getSubtleStyle, getInputStyle } = useContext(ThemeContext);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [activeAdmin, setActiveAdmin] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format = 'xlsx') => {
    try {
      setExporting(true);
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined
      };
      await exportFilteredData('admins', params, format);
      message.success(`Filtered administrators list exported as .${format}`);
    } catch (err) {
      message.error('Failed to export administrators');
    } finally {
      setExporting(false);
    }
  };

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Load admins and departments
  const loadData = async () => {
    try {
      setLoading(true);
      const [adminsRes, deptsRes] = await Promise.all([
        getDepartmentAdmins(),
        getDepartments()
      ]);

      const fetchedAdmins = adminsRes?.departmentAdmins || adminsRes?.admins || (Array.isArray(adminsRes) ? adminsRes : []);
      const fetchedDepts = deptsRes?.departments || (Array.isArray(deptsRes) ? deptsRes : []);

      setAdmins(fetchedAdmins);
      setDepartments(fetchedDepts);
    } catch (err) {
      console.warn('Failed to fetch department administrators:', err);
      message.error('Failed to load administrators directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const fullName = `${admin.firstName || ''} ${admin.lastName || ''}`.toLowerCase();
      const email = (admin.email || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || fullName.includes(query) || email.includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && admin.isActive !== false) ||
        (statusFilter === 'inactive' && admin.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }, [admins, searchQuery, statusFilter]);

  // Handle Add Admin
  const handleAddAdmin = async (values) => {
    try {
      setActionLoading(true);
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password || undefined,
        managedDepartments: values.managedDepartments || []
      };

      await createDepartmentAdmin(payload);
      message.success('Department administrator created successfully');
      setIsAddModalOpen(false);
      addForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create department admin');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Admin
  const handleEditAdmin = async (values) => {
    if (!activeAdmin) return;
    try {
      setActionLoading(true);
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase()
      };

      await updateDepartmentAdmin(activeAdmin._id || activeAdmin.id, payload);
      message.success('Administrator updated successfully');
      setIsEditModalOpen(false);
      editForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update administrator');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Assign Departments
  const handleAssignDepartments = async (values) => {
    if (!activeAdmin) return;
    try {
      setActionLoading(true);
      await assignDepartments(activeAdmin._id || activeAdmin.id, values.departmentIds || []);
      message.success('Department assignments updated');
      setIsAssignModalOpen(false);
      assignForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to assign departments');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (values) => {
    if (!activeAdmin) return;
    try {
      setActionLoading(true);
      const res = await resetUserPassword(activeAdmin._id || activeAdmin.id, values.newPassword);
      message.success(`Password reset. Temporary password: ${res.tempPassword || values.newPassword}`);
      setIsResetPasswordOpen(false);
      passwordForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Admin
  const handleDeleteAdmin = (admin) => {
    Modal.confirm({
      title: 'Delete Department Administrator',
      content: `Are you sure you want to remove ${admin.firstName} ${admin.lastName}? This will revoke their departmental administration access.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteDepartmentAdmin(admin._id || admin.id);
          message.success('Administrator removed successfully');
          await loadData();
        } catch (err) {
          message.error(err.response?.data?.message || 'Failed to delete administrator');
        }
      }
    });
  };

  // Bulk status update
  const handleBulkStatus = async (isActive) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateAdminsStatus(selectedIds, isActive);
      message.success(`Updated ${selectedIds.length} administrators`);
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    Modal.confirm({
      title: 'Bulk Delete Administrators',
      content: `Are you sure you want to permanently remove ${selectedIds.length} administrators?`,
      okText: 'Delete Selected',
      okType: 'danger',
      onOk: async () => {
        try {
          await bulkDeleteAdmins(selectedIds);
          message.success('Selected administrators removed');
          setSelectedIds([]);
          await loadData();
        } catch (err) {
          message.error(err.response?.data?.message || 'Bulk delete failed');
        }
      }
    });
  };

  // Excel batch upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setImporting(true);
      await uploadAdminsFile(file);
      message.success('Administrators imported successfully');
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Import failed. Check file format.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
            Department Administrators
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage institutional department heads, assign operational jurisdictions, and configure administrative credentials.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={downloadAdminTemplate}
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
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
            style={getSubtleStyle()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>{importing ? 'Importing...' : 'Import .xlsx'}</span>
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
              setIsAddModalOpen(true);
            }}
            className="h-9 px-4 rounded-md text-xs font-semibold cursor-pointer transition-colors"
            style={{
              backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
              color: isDarkMode ? '#131926' : '#FFFFFF',
            }}
          >
            Add administrator
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="rounded-lg border p-4 shadow-none flex flex-col sm:flex-row items-center justify-between gap-3" style={getCardStyle()}>
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-9 px-3 rounded-md border text-xs sm:text-sm font-medium shadow-none focus:outline-hidden"
            style={getInputStyle()}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
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

      {/* 3. Honest Data Table */}
      <div className="rounded-lg border shadow-none overflow-hidden min-w-0" style={getCardStyle()}>
        <div className="w-full overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={getSubtleStyle()}>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredAdmins.length && filteredAdmins.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredAdmins.map((a) => a._id || a.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Administrator</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Assigned Department(s)</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Status</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Last Login</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading administrators...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No administrators found matching the criteria
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const id = admin._id || admin.id;
                  const isChecked = selectedIds.includes(id);
                  const managed = admin.managedDepartments || [];

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
                        <div className="font-semibold text-xs sm:text-sm" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                          {admin.firstName} {admin.lastName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {admin.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {managed.length === 0 ? (
                            <span className="text-slate-400 italic">None assigned</span>
                          ) : (
                            managed.map((d) => (
                              <span
                                key={d._id || d.id || d}
                                className="px-2 py-0.5 rounded-md border text-[10px] font-medium"
                                style={getSubtleStyle()}
                              >
                                {d.name || d.code || 'Department'}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {admin.isActive !== false ? (
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAdmin(admin);
                              editForm.setFieldsValue({
                                firstName: admin.firstName,
                                lastName: admin.lastName,
                                email: admin.email
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
                              setActiveAdmin(admin);
                              const currentDeptIds = (admin.managedDepartments || []).map((d) => d._id || d.id || d);
                              assignForm.setFieldsValue({ departmentIds: currentDeptIds });
                              setIsAssignModalOpen(true);
                            }}
                            className="h-8 px-2.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors"
                            style={getSubtleStyle()}
                          >
                            Assign
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAdmin(admin);
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
                            onClick={() => handleDeleteAdmin(admin)}
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

      {/* MODAL: ADD ADMIN */}
      <Modal
        title="Add Department Administrator"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddAdmin} className="pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'First name is required' }]}
            >
              <Input placeholder="e.g. Jane" className="rounded-md h-9" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Last name is required' }]}
            >
              <Input placeholder="e.g. Doe" className="rounded-md h-9" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="Institutional Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Valid email required' }
            ]}
          >
            <Input placeholder="admin@university.ac.ke" className="rounded-md h-9" />
          </Form.Item>

          <Form.Item
            name="managedDepartments"
            label="Assigned Jurisdiction(s)"
            rules={[{ required: true, message: 'Select at least one department' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select departments"
              className="w-full"
              optionFilterProp="children"
            >
              {departments.map((d) => (
                <Option key={d._id || d.id} value={d._id || d.id}>
                  {d.name} ({d.code || 'DEPT'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label="Initial Password (Optional)"
            extra="Leave blank to generate temporary password automatically."
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
              {actionLoading ? 'Creating...' : 'Create administrator'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: EDIT ADMIN */}
      <Modal
        title="Edit Administrator Details"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditAdmin} className="pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'First name is required' }]}
            >
              <Input className="rounded-md h-9" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Last name is required' }]}
            >
              <Input className="rounded-md h-9" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="Institutional Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Valid email required' }
            ]}
          >
            <Input className="rounded-md h-9" />
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

      {/* MODAL: ASSIGN DEPARTMENTS */}
      <Modal
        title={`Assign Departments: ${activeAdmin?.firstName || ''} ${activeAdmin?.lastName || ''}`}
        open={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignDepartments} className="pt-2">
          <Form.Item
            name="departmentIds"
            label="Managed Departments"
            rules={[{ required: true, message: 'Select at least one department' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select departments"
              className="w-full"
              optionFilterProp="children"
            >
              {departments.map((d) => (
                <Option key={d._id || d.id} value={d._id || d.id}>
                  {d.name} ({d.code || 'DEPT'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="h-9 px-4 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="h-9 px-4 rounded-md text-xs font-semibold text-white bg-[#131926] dark:bg-[#D4FF5E] dark:text-[#131926] hover:bg-slate-800 dark:hover:bg-[#C6F350] transition-colors cursor-pointer"
            >
              {actionLoading ? 'Saving...' : 'Update assignments'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: RESET PASSWORD */}
      <Modal
        title={`Reset Password: ${activeAdmin?.firstName || ''} ${activeAdmin?.lastName || ''}`}
        open={isResetPasswordOpen}
        onCancel={() => setIsResetPasswordOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleResetPassword} className="pt-2">
          <Form.Item
            name="newPassword"
            label="New Password"
            extra="Leave blank to automatically generate a secure random password."
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
    </div>
  );
};

export default SuperAdminAdmins;
