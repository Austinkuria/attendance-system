import { useState, useEffect, useContext, useMemo } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentAdmins,
  assignAdminToDepartment,
  exportFilteredData
} from '../../services/superAdminAPI';

const { TextArea } = Input;
const { Option } = Select;

/**
 * QRollCall Super Admin - Academic Departments Management
 * Full CRUD control over university faculties, divisions, and appointed department heads
 * Strict compliance with AGENTS.md & UI_DESIGN_RULES.md
 */
const Departments = () => {
  const { isDarkMode, getCardStyle, getSubtleStyle, getInputStyle } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [admins, setAdmins] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      await exportFilteredData('departments', {
        search: searchQuery || undefined,
      }, format);
      message.success(`Departments exported as .${format}`);
    } catch (err) {
      console.error('Export error:', err);
      message.error(`Failed to export departments as .${format}`);
    } finally {
      setExporting(false);
    }
  };

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptsRes, adminsRes] = await Promise.all([
        getDepartments(),
        getDepartmentAdmins()
      ]);

      const fetchedDepts = deptsRes?.departments || (Array.isArray(deptsRes) ? deptsRes : []);
      const fetchedAdmins = adminsRes?.departmentAdmins || adminsRes?.admins || (Array.isArray(adminsRes) ? adminsRes : []);

      setDepartments(fetchedDepts);
      setAdmins(fetchedAdmins);
    } catch (err) {
      console.warn('Failed to load departments:', err);
      message.error('Failed to load academic departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const name = (d.name || '').toLowerCase();
      const code = (d.code || '').toLowerCase();
      const desc = (d.description || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      return !query || name.includes(query) || code.includes(query) || desc.includes(query);
    });
  }, [departments, searchQuery]);

  const handleAddDepartment = async (values) => {
    try {
      setActionLoading(true);
      await createDepartment({
        name: values.name.trim(),
        code: values.code ? values.code.trim().toUpperCase() : undefined,
        description: values.description ? values.description.trim() : ''
      });
      message.success('Academic department created successfully');
      setIsAddModalOpen(false);
      addForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create department');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDepartment = async (values) => {
    if (!activeDepartment) return;
    try {
      setActionLoading(true);
      await updateDepartment(activeDepartment._id || activeDepartment.id, {
        name: values.name.trim(),
        code: values.code ? values.code.trim().toUpperCase() : undefined,
        description: values.description ? values.description.trim() : ''
      });
      message.success('Department updated successfully');
      setIsEditModalOpen(false);
      editForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update department');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignAdmin = async (values) => {
    if (!activeDepartment) return;
    try {
      setActionLoading(true);
      await assignAdminToDepartment(activeDepartment._id || activeDepartment.id, values.adminId);
      message.success('Department administrator assigned');
      setIsAssignModalOpen(false);
      assignForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to assign administrator');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDepartment = (dept) => {
    Modal.confirm({
      title: 'Delete Academic Department',
      content: `Are you sure you want to delete ${dept.name}? This will remove all associated programme linkages.`,
      okText: 'Delete Department',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteDepartment(dept._id || dept.id);
          message.success('Department removed successfully');
          await loadData();
        } catch (err) {
          message.error(err.response?.data?.message || 'Failed to delete department. Ensure no active students or courses remain.');
        }
      }
    });
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
            Academic Departments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Institutional divisions, degree programme containers, and departmental administrator assignments.
          </p>
        </div>

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
          Add academic department
        </button>
      </div>

      {/* 2. Search & Export Bar */}
      <div className="rounded-lg border p-4 shadow-none flex flex-col sm:flex-row items-center justify-between gap-3" style={getCardStyle()}>
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by department name or code..."
            className="w-full h-9 px-3 rounded-md border text-xs sm:text-sm font-medium shadow-none focus:outline-hidden"
            style={getInputStyle()}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExport('xlsx')}
            className="h-9 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-none disabled:opacity-50"
            style={getSubtleStyle()}
            title="Export departments as styled Excel spreadsheet"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export .xlsx</span>
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExport('csv')}
            className="h-9 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-none disabled:opacity-50"
            style={getSubtleStyle()}
            title="Export departments as CSV"
          >
            <span>.csv</span>
          </button>
        </div>
      </div>

      {/* 3. Honest Data Table */}
      <div className="rounded-lg border shadow-none overflow-hidden min-w-0" style={getCardStyle()}>
        <div className="w-full overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={getSubtleStyle()}>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase w-24">Code</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Department Name</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Appointed Admin</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-center">Programmes</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading academic departments...
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No academic departments found matching search
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => {
                  const id = dept._id || dept.id;
                  const adminName = dept.admin
                    ? (`${dept.admin.firstName || ''} ${dept.admin.lastName || ''}`.trim() || dept.admin.email)
                    : (dept.admins && dept.admins.length > 0
                        ? (`${dept.admins[0].firstName || ''} ${dept.admins[0].lastName || ''}`.trim() || dept.admins[0].email)
                        : null);

                  return (
                    <tr key={id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs" style={{ color: isDarkMode ? '#D4FF5E' : '#131926' }}>
                        {dept.code || 'DEPT'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs sm:text-sm" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                          {dept.name}
                        </div>
                        {dept.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {dept.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {adminName ? (
                          <span className="font-medium text-xs" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                            {adminName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No admin assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums font-semibold">
                        {dept.coursesCount || (dept.courses ? dept.courses.length : 0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDepartment(dept);
                              editForm.setFieldsValue({
                                name: dept.name,
                                code: dept.code,
                                description: dept.description
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
                              setActiveDepartment(dept);
                              assignForm.setFieldsValue({
                                adminId: dept.admin?._id || dept.admin?.id || dept.admin
                              });
                              setIsAssignModalOpen(true);
                            }}
                            className="h-8 px-2.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors"
                            style={getSubtleStyle()}
                          >
                            Assign Admin
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDepartment(dept)}
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

      {/* MODAL: ADD DEPARTMENT */}
      <Modal
        title="Add Academic Department"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddDepartment} className="pt-2">
          <Form.Item
            name="name"
            label="Department / School Name"
            rules={[{ required: true, message: 'Department name is required' }]}
          >
            <Input placeholder="e.g. School of Computing and Informatics" className="rounded-md h-9" />
          </Form.Item>

          <Form.Item name="code" label="Department Code (Optional)">
            <Input placeholder="e.g. SCI" className="rounded-md h-9 font-mono uppercase" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Faculty overview and operational remit..." className="rounded-md" />
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
              {actionLoading ? 'Creating...' : 'Create department'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: EDIT DEPARTMENT */}
      <Modal
        title={`Edit Department: ${activeDepartment?.name || ''}`}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditDepartment} className="pt-2">
          <Form.Item
            name="name"
            label="Department / School Name"
            rules={[{ required: true, message: 'Department name is required' }]}
          >
            <Input className="rounded-md h-9" />
          </Form.Item>

          <Form.Item name="code" label="Department Code">
            <Input className="rounded-md h-9 font-mono uppercase" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} className="rounded-md" />
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

      {/* MODAL: ASSIGN ADMIN */}
      <Modal
        title={`Assign Department Admin: ${activeDepartment?.name || ''}`}
        open={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignAdmin} className="pt-2">
          <Form.Item
            name="adminId"
            label="Appointed Administrator"
            rules={[{ required: true, message: 'Select an administrator' }]}
          >
            <Select placeholder="Select department administrator" className="w-full">
              {admins.map((a) => (
                <Option key={a._id || a.id} value={a._id || a.id}>
                  {a.firstName} {a.lastName} ({a.email})
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
              {actionLoading ? 'Assigning...' : 'Assign administrator'}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Departments;
