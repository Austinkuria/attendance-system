import { useState, useEffect, useContext, useMemo } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getDepartments,
  exportFilteredData,
  downloadEntityTemplate
} from '../../services/superAdminAPI';
import ImportRosterModal from '../../components/ImportRosterModal';

const { Option } = Select;

/**
 * QRollCall Super Admin - University-Wide Courses Curriculum Management
 * Strict compliance with AGENTS.md & UI_DESIGN_RULES.md:
 * - Full CRUD control across all academic degree programmes
 * - Direct ThemeContext bindings
 * - Strict geometry (rounded-lg card, rounded-md controls)
 * - Honest table with clean empty states
 */
const SuperAdminCourses = () => {
  const { isDarkMode, getCardStyle, getSubtleStyle, getInputStyle } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesRes, deptsRes] = await Promise.all([
        getAllCourses(),
        getDepartments()
      ]);

      const fetchedCourses = coursesRes?.courses || (Array.isArray(coursesRes) ? coursesRes : []);
      const fetchedDepts = deptsRes?.departments || (Array.isArray(deptsRes) ? deptsRes : []);

      setCourses(fetchedCourses);
      setDepartments(fetchedDepts);
    } catch (err) {
      console.warn('Failed to load courses:', err);
      message.error('Failed to load university courses directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const code = (c.code || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || code.includes(query);
      const courseDeptId = c.department?._id || c.department?.id || c.department;
      const matchesDept = deptFilter === 'all' || String(courseDeptId) === String(deptFilter);

      return matchesSearch && matchesDept;
    });
  }, [courses, searchQuery, deptFilter]);

  const handleAddCourse = async (values) => {
    try {
      setActionLoading(true);
      await createCourse({
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        department: values.department
      });
      message.success('Degree programme added successfully');
      setIsAddModalOpen(false);
      addForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to add course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCourse = async (values) => {
    if (!activeCourse) return;
    try {
      setActionLoading(true);
      await updateCourse(activeCourse._id || activeCourse.id, {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        department: values.department
      });
      message.success('Course updated successfully');
      setIsEditModalOpen(false);
      editForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = (course) => {
    Modal.confirm({
      title: 'Delete Degree Programme',
      content: `Are you sure you want to delete ${course.name} (${course.code})? This will unenroll associated students.`,
      okText: 'Delete Course',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteCourse(course._id || course.id);
          message.success('Course deleted successfully');
          await loadData();
        } catch (err) {
          message.error(err.response?.data?.message || 'Failed to delete course');
        }
      }
    });
  };

  const handleExport = async (format = 'xlsx') => {
    try {
      setExporting(true);
      const params = {
        departmentId: deptFilter !== 'all' ? deptFilter : undefined,
        search: searchQuery || undefined
      };
      await exportFilteredData('courses', params, format);
      message.success(`Filtered courses catalog exported as .${format}`);
    } catch (err) {
      message.error('Failed to export courses');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
            University Courses & Programmes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global curriculum catalog: academic degree programmes, curriculum codes, and faculty alignments.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => downloadEntityTemplate('courses')}
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
              setIsAddModalOpen(true);
            }}
            className="h-9 px-4 rounded-md text-xs font-semibold cursor-pointer transition-colors"
            style={{
              backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
              color: isDarkMode ? '#131926' : '#FFFFFF',
            }}
          >
            Add programme
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
            placeholder="Search by code or programme name..."
            className="w-full h-9 px-3 rounded-md border text-xs sm:text-sm font-medium shadow-none focus:outline-hidden"
            style={getInputStyle()}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 px-3 rounded-md border text-xs font-medium cursor-pointer shadow-none focus:outline-hidden"
            style={getInputStyle()}
          >
            <option value="all">All academic departments</option>
            {departments.map((d) => (
              <option key={d._id || d.id} value={d._id || d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Honest Data Table */}
      <div className="rounded-lg border shadow-none overflow-hidden min-w-0" style={getCardStyle()}>
        <div className="w-full overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={getSubtleStyle()}>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase w-24">Code</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Degree Programme</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase">Department</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-center">Units</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-center">Enrolled</th>
                <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading curriculum catalog...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No programmes found matching criteria
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => {
                  const id = c._id || c.id;
                  return (
                    <tr key={id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs" style={{ color: isDarkMode ? '#D4FF5E' : '#131926' }}>
                          {c.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs sm:text-sm" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                          {c.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded-md border text-[10px] font-medium"
                          style={getSubtleStyle()}
                        >
                          {c.department?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums font-semibold">
                        {c.unitsCount || (c.units ? c.units.length : 0)}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums font-semibold">
                        {c.studentCount || 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCourse(c);
                              editForm.setFieldsValue({
                                name: c.name,
                                code: c.code,
                                department: c.department?._id || c.department?.id || c.department
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
                            onClick={() => handleDeleteCourse(c)}
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

      {/* MODAL: ADD COURSE */}
      <Modal
        title="Add Degree Programme"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddCourse} className="pt-2">
          <Form.Item
            name="code"
            label="Course Code"
            rules={[{ required: true, message: 'Course code is required' }]}
          >
            <Input placeholder="e.g. BSCS" className="rounded-md h-9 font-mono uppercase" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Degree Programme Title"
            rules={[{ required: true, message: 'Programme title is required' }]}
          >
            <Input placeholder="e.g. Bachelor of Science in Computer Science" className="rounded-md h-9" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Academic Department"
            rules={[{ required: true, message: 'Department is required' }]}
          >
            <Select placeholder="Select department" className="w-full">
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
              {actionLoading ? 'Adding...' : 'Add degree programme'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* MODAL: EDIT COURSE */}
      <Modal
        title={`Edit Programme: ${activeCourse?.code || ''}`}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditCourse} className="pt-2">
          <Form.Item
            name="code"
            label="Course Code"
            rules={[{ required: true, message: 'Course code is required' }]}
          >
            <Input className="rounded-md h-9 font-mono uppercase" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Degree Programme Title"
            rules={[{ required: true, message: 'Programme title is required' }]}
          >
            <Input className="rounded-md h-9" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Academic Department"
            rules={[{ required: true, message: 'Department is required' }]}
          >
            <Select className="w-full">
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
      {/* MODAL: BATCH PROGRAMMES INGESTION */}
      <ImportRosterModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entity="courses"
        title="Batch Ingest Degree Programmes (.xlsx / .csv)"
        onSuccess={loadData}
      />
    </div>
  );
};

export default SuperAdminCourses;
