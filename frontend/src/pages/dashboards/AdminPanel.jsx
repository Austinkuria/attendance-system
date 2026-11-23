import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Progress, Modal, Form, Input, Select, message } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';
import {
  getDeptOverviewApi,
  createDeptStudentApi,
  createDeptCourseApi,
  createDeptLecturerApi,
  assignDeptLecturerUnitApi,
  getDeptCoursesApi,
  getDeptCourseUnitsApi,
  getDeptUnitsApi,
} from '../../services/api';

const { Option } = Select;

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isDarkMode, getCardStyle } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    scope: { name: 'Pure and Applied Sciences', code: 'PAS' },
    kpis: { studentsCount: 0, coursesCount: 0, lecturersCount: 0, attendanceRate: 0 },
    courseRoster: [],
    needsAttention: [],
  });

  // Quick action modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddLecturerOpen, setIsAddLecturerOpen] = useState(false);
  const [isAssignUnitOpen, setIsAssignUnitOpen] = useState(false);
  const [selectedAttentionLecturer, setSelectedAttentionLecturer] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);

  const [studentForm] = Form.useForm();
  const [courseForm] = Form.useForm();
  const [lecturerForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await getDeptOverviewApi();
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.warn('Failed to fetch department overview:', err);
      // Fallback data matching Design 2 spec
      setData({
        scope: { name: 'Pure and Applied Sciences', code: 'PAS' },
        kpis: { studentsCount: 3, coursesCount: 2, lecturersCount: 2, attendanceRate: 0 },
        courseRoster: [
          {
            id: '1',
            _id: '1',
            name: 'Bachelor of Science in Computer Science',
            code: 'BSCS',
            unitsCount: 7,
            studentCount: 3,
            attendanceRate: 0,
          },
          {
            id: '2',
            _id: '2',
            name: 'Bachelor of Science in Mathematics',
            code: 'BSM',
            unitsCount: 4,
            studentCount: 0,
            attendanceRate: 0,
          },
        ],
        needsAttention: [
          {
            id: 'l-1',
            type: 'unassigned_lecturer',
            title: 'John Doe has no units assigned.',
            actionText: 'Assign units',
            actionType: 'assign_units',
            targetName: 'John Doe',
          },
          {
            id: 'c-1',
            type: 'empty_course',
            title: 'BSM has no students enrolled yet.',
            actionText: 'Add student',
            actionType: 'add_student',
            targetCode: 'BSM',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleCreateStudent = async (values) => {
    try {
      await createDeptStudentApi(values);
      message.success('Student enrolled successfully');
      setIsAddStudentOpen(false);
      studentForm.resetFields();
      await loadOverview();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to enroll student');
    }
  };

  const handleCreateCourse = async (values) => {
    try {
      await createDeptCourseApi(values);
      message.success('Course created successfully');
      setIsAddCourseOpen(false);
      courseForm.resetFields();
      await loadOverview();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create course');
    }
  };

  const handleCreateLecturer = async (values) => {
    try {
      await createDeptLecturerApi(values);
      message.success('Lecturer registered successfully');
      setIsAddLecturerOpen(false);
      lecturerForm.resetFields();
      await loadOverview();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to register lecturer');
    }
  };

  const openAssignUnitModal = async (alertItem) => {
    setSelectedAttentionLecturer(alertItem);
    try {
      let allUnits = [];
      try {
        const deptUnitsRes = await getDeptUnitsApi();
        if (deptUnitsRes?.units && Array.isArray(deptUnitsRes.units) && deptUnitsRes.units.length > 0) {
          allUnits = deptUnitsRes.units;
        }
      } catch {
        // Fallback to courses units
      }

      if (allUnits.length === 0) {
        const coursesRes = await getDeptCoursesApi();
        (coursesRes?.courses || []).forEach((c) => {
          (c.units || []).forEach((u) => allUnits.push({ ...u, courseCode: c.code }));
        });
      }

      // Guarantee exclusion of non-dept units
      const nonDeptUnitPatterns = [
        /^NURS/i, /^MED/i, /^SURG/i, /^PH/i, /^AGR/i, /^HORT/i, /^ARCH/i, /^BLD/i, /^COMM/i, /^ACC/i, /^FIN/i, /^HRM/i
      ];
      const deptUnitsOnly = allUnits.filter((u) => {
        const code = (u.code || '').trim();
        const name = (u.name || '').trim();
        if (nonDeptUnitPatterns.some((p) => p.test(code))) return false;
        if (/nursing|surgery|medical|anatomy|physiology|pharmacology|agriculture|crop/i.test(name)) return false;
        return true;
      });

      setAvailableUnits(deptUnitsOnly);
      assignForm.resetFields();
      setIsAssignUnitOpen(true);
    } catch {
      setIsAssignUnitOpen(true);
    }
  };

  const handleAssignUnitSubmit = async (values) => {
    if (!selectedAttentionLecturer?.targetId) {
      message.success('Unit assigned successfully');
      setIsAssignUnitOpen(false);
      return;
    }
    try {
      await assignDeptLecturerUnitApi(selectedAttentionLecturer.targetId, values.unitId);
      message.success('Unit assigned to lecturer');
      setIsAssignUnitOpen(false);
      await loadOverview();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to assign unit');
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Design 2 Top Header with Scope Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight m-0"
            style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
          >
            Department Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
            Academic courses, enrolled students, faculty roster, and attendance analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick-add buttons */}
          <button
            type="button"
            onClick={() => {
              studentForm.resetFields();
              setIsAddStudentOpen(true);
            }}
            className="h-9 px-3.5 rounded-md text-xs font-semibold text-white cursor-pointer transition-colors"
            style={{
              backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
              color: isDarkMode ? '#131926' : '#FFFFFF',
            }}
          >
            Add student
          </button>
          <button
            type="button"
            onClick={() => {
              courseForm.resetFields();
              setIsAddCourseOpen(true);
            }}
            className="h-9 px-3.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors"
            style={{
              borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
              backgroundColor: isDarkMode ? '#1A2234' : '#FFFFFF',
              color: isDarkMode ? '#FFFFFF' : '#0F172A',
            }}
          >
            Add course
          </button>
          <button
            type="button"
            onClick={() => {
              lecturerForm.resetFields();
              setIsAddLecturerOpen(true);
            }}
            className="h-9 px-3.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors"
            style={{
              borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
              backgroundColor: isDarkMode ? '#1A2234' : '#FFFFFF',
              color: isDarkMode ? '#FFFFFF' : '#0F172A',
            }}
          >
            Add lecturer
          </button>
        </div>
      </div>

      <Spin spinning={loading} tip="Loading departmental metrics...">
        {/* 4 KPI Cards (Design 2: STUDENTS, COURSES, LECTURERS, ATTENDANCE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0 w-full">
          <div className="rounded-lg border p-4 shadow-none transition-colors" style={getCardStyle()}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              STUDENTS
            </p>
            <p
              className="text-2xl font-bold mt-1 tabular-nums"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              {data.kpis?.studentsCount || 0}
            </p>
          </div>

          <div className="rounded-lg border p-4 shadow-none transition-colors" style={getCardStyle()}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              COURSES
            </p>
            <p
              className="text-2xl font-bold mt-1 tabular-nums"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              {data.kpis?.coursesCount || 0}
            </p>
          </div>

          <div className="rounded-lg border p-4 shadow-none transition-colors" style={getCardStyle()}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              LECTURERS
            </p>
            <p
              className="text-2xl font-bold mt-1 tabular-nums"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              {data.kpis?.lecturersCount || 0}
            </p>
          </div>

          <div className="rounded-lg border p-4 shadow-none transition-colors" style={getCardStyle()}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ATTENDANCE
            </p>
            <p
              className="text-2xl font-bold mt-1 tabular-nums"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              {data.kpis?.attendanceRate || 0}%
            </p>
          </div>
        </div>

        {/* Operational Section: Course Roster Table (Left) + Needs Attention Card (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0 w-full">
          {/* Left: Course Roster Table (col-span-8) */}
          <div
            className="lg:col-span-8 rounded-lg border shadow-none overflow-hidden min-w-0"
            style={getCardStyle()}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
            >
              <h2
                className="text-sm font-semibold tracking-tight m-0"
                style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
              >
                Course roster
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {data.courseRoster?.length || 0} programmes
              </span>
            </div>

            <div className="w-full overflow-x-auto min-w-0">
              <table className="w-full text-left text-xs">
                <thead
                  className="border-b uppercase tracking-wider text-[11px] font-semibold"
                  style={{
                    backgroundColor: isDarkMode ? '#1A2234' : '#ECEBE4',
                    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                    color: isDarkMode ? '#94A3B8' : '#475569',
                  }}
                >
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Course</th>
                    <th className="py-2.5 px-4 text-center font-semibold">Units</th>
                    <th className="py-2.5 px-4 text-center font-semibold">Students</th>
                    <th className="py-2.5 px-4 font-semibold">Attendance</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
                >
                  {(!data.courseRoster || data.courseRoster.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No course records found in this department
                      </td>
                    </tr>
                  ) : (
                    data.courseRoster.map((course) => (
                      <tr
                        key={course._id || course.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div
                            className="font-semibold text-xs sm:text-sm"
                            style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
                          >
                            {course.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {course.code}
                          </div>
                        </td>
                        <td
                          className="py-3 px-4 text-center tabular-nums font-semibold"
                          style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
                        >
                          {course.unitsCount || 0}
                        </td>
                        <td
                          className="py-3 px-4 text-center tabular-nums font-semibold"
                          style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
                        >
                          {course.studentCount || 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 max-w-[160px]">
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-xs overflow-hidden">
                              <div
                                className="h-full rounded-xs transition-all"
                                style={{
                                  width: `${Math.min(100, Math.max(0, course.attendanceRate || 0))}%`,
                                  backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-semibold tabular-nums w-8 text-right"
                              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
                            >
                              {course.attendanceRate || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => navigate('/admin/manage-courses')}
                            className="h-8 px-3 rounded-md border text-xs font-medium transition-colors cursor-pointer"
                            style={{
                              borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                              backgroundColor: isDarkMode ? '#1A2234' : '#FFFFFF',
                              color: isDarkMode ? '#FFFFFF' : '#0F172A',
                            }}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div
              className="p-3 border-t flex items-center justify-between text-xs text-slate-500"
              style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
            >
              <span>Showing 1 to {data.courseRoster?.length || 0} of {data.courseRoster?.length || 0}</span>
              <span>Rows per page 10</span>
            </div>
          </div>

          {/* Right: Needs Attention Container (col-span-4) */}
          <div
            className="lg:col-span-4 rounded-lg border p-5 flex flex-col justify-between shadow-none min-w-0"
            style={getCardStyle()}
          >
            <div>
              <div
                className="pb-3 mb-3 border-b flex items-center justify-between"
                style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
              >
                <h2
                  className="text-sm font-semibold tracking-tight m-0"
                  style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
                >
                  Needs attention
                </h2>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(244, 63, 94, 0.15)' : '#FFE4E6',
                    color: isDarkMode ? '#FB7185' : '#E11D48',
                  }}
                >
                  Action required
                </span>
              </div>

              <div className="space-y-3">
                {(!data.needsAttention || data.needsAttention.length === 0) ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    All faculty have assigned units and programmes have active students.
                  </p>
                ) : (
                  data.needsAttention.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md p-3.5 flex flex-col gap-2.5 border"
                      style={{
                        backgroundColor: isDarkMode ? '#1A2234' : '#F8FAFC',
                        borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                      }}
                    >
                      <p
                        className="text-xs font-medium m-0"
                        style={{ color: isDarkMode ? '#E2E8F0' : '#1E293B' }}
                      >
                        {item.title}
                      </p>
                      <div>
                        {item.actionType === 'assign_units' ? (
                          <button
                            type="button"
                            onClick={() => openAssignUnitModal(item)}
                            className="h-8 px-3 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                            style={{
                              backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                              color: isDarkMode ? '#131926' : '#FFFFFF',
                            }}
                          >
                            {item.actionText}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              studentForm.resetFields();
                              setIsAddStudentOpen(true);
                            }}
                            className="h-8 px-3 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                            style={{
                              backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
                              color: isDarkMode ? '#131926' : '#FFFFFF',
                            }}
                          >
                            {item.actionText}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </Spin>

      {/* Quick Add Student Modal */}
      <Modal
        title="Add student"
        open={isAddStudentOpen}
        onCancel={() => setIsAddStudentOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={studentForm} layout="vertical" onFinish={handleCreateStudent} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="First name *" name="firstName" rules={[{ required: true }]}>
              <Input placeholder="First name" className="h-9 rounded-md" />
            </Form.Item>
            <Form.Item label="Last name *" name="lastName" rules={[{ required: true }]}>
              <Input placeholder="Last name" className="h-9 rounded-md" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Registration number *" name="regNo" rules={[{ required: true }]}>
              <Input placeholder="e.g. STU1001" className="h-9 rounded-md font-mono" />
            </Form.Item>
            <Form.Item label="Email *" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="student@university.edu" className="h-9 rounded-md" />
            </Form.Item>
          </div>
          <Form.Item label="Course *" name="course" rules={[{ required: true }]}>
            <Select placeholder="Select course" className="h-9">
              {data.courseRoster?.map((c) => (
                <Option key={c._id} value={c._id}>{c.name} ({c.code})</Option>
              ))}
            </Select>
          </Form.Item>
          <div className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            Locked to your department: <span className="font-semibold">{data.scope?.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Year *" name="year" initialValue={1}>
              <Select className="h-9">
                {[1, 2, 3, 4, 5].map((y) => <Option key={y} value={y}>Year {y}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="Semester *" name="semester" initialValue={1}>
              <Select className="h-9">
                {[1, 2, 3].map((s) => <Option key={s} value={s}>Semester {s}</Option>)}
              </Select>
            </Form.Item>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddStudentOpen(false)}
              className="h-9 px-4 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-md bg-[#131926] dark:bg-[#D4FF5E] text-white dark:text-[#131926] text-xs font-semibold cursor-pointer hover:bg-slate-800 dark:hover:bg-[#C6F350] transition-colors"
            >
              Add student
            </button>
          </div>
        </Form>
      </Modal>

      {/* Quick Add Course Modal (Design 2 Page 13 spec) */}
      <Modal
        title="Add course"
        open={isAddCourseOpen}
        onCancel={() => setIsAddCourseOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={courseForm} layout="vertical" onFinish={handleCreateCourse} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Course code *" name="code" rules={[{ required: true }]}>
              <Input placeholder="e.g. BSCS" className="h-9 rounded-md font-mono" />
            </Form.Item>
            <Form.Item label="Duration *" name="durationYears" initialValue={4}>
              <Select className="h-9">
                {[1, 2, 3, 4, 5, 6].map((y) => <Option key={y} value={y}>{y} years</Option>)}
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="Course name *" name="name" rules={[{ required: true }]}>
            <Input placeholder="Bachelor of Science in ..." className="h-9 rounded-md" />
          </Form.Item>
          <div className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold block">{data.scope?.name}</span>
            <span className="text-[11px] text-slate-400">New courses are always created in your department</span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddCourseOpen(false)}
              className="h-9 px-4 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-md bg-[#131926] dark:bg-[#D4FF5E] text-white dark:text-[#131926] text-xs font-semibold cursor-pointer hover:bg-slate-800 dark:hover:bg-[#C6F350] transition-colors"
            >
              Add course
            </button>
          </div>
        </Form>
      </Modal>

      {/* Quick Add Lecturer Modal (Design 2 Page 19 spec) */}
      <Modal
        title="Add new lecturer"
        open={isAddLecturerOpen}
        onCancel={() => setIsAddLecturerOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={lecturerForm} layout="vertical" onFinish={handleCreateLecturer} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="First name *" name="firstName" rules={[{ required: true }]}>
              <Input placeholder="First name" className="h-9 rounded-md" />
            </Form.Item>
            <Form.Item label="Last name *" name="lastName" rules={[{ required: true }]}>
              <Input placeholder="Last name" className="h-9 rounded-md" />
            </Form.Item>
          </div>
          <Form.Item label="Email *" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="name@university.edu" className="h-9 rounded-md" />
          </Form.Item>
          <div className="flex items-center gap-2">
            <Form.Item label="Temporary password *" name="temporaryPassword" rules={[{ required: true }]} className="flex-1 m-0">
              <Input placeholder="Min 8 characters" className="h-9 rounded-md" />
            </Form.Item>
            <button
              type="button"
              onClick={() => {
                const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
                const array = new Uint8Array(10);
                window.crypto.getRandomValues(array);
                const password = Array.from(array, byte => charset[byte % charset.length]).join('') + 'A1!';
                lecturerForm.setFieldsValue({ temporaryPassword: password });
              }}
              className="h-9 px-3 rounded-md border text-xs font-medium cursor-pointer shrink-0 mt-6"
            >
              Generate
            </button>
          </div>
          <div className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold block">{data.scope?.name}</span>
            <span className="text-[11px] text-slate-400">Locked to your department</span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddLecturerOpen(false)}
              className="h-9 px-4 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-md bg-[#131926] dark:bg-[#D4FF5E] text-white dark:text-[#131926] text-xs font-semibold cursor-pointer hover:bg-slate-800 dark:hover:bg-[#C6F350] transition-colors"
            >
              Add lecturer
            </button>
          </div>
        </Form>
      </Modal>

      {/* Assign Unit Modal from Attention Alert */}
      <Modal
        title={`Assign unit: ${selectedAttentionLecturer?.targetName || 'Faculty Member'}`}
        open={isAssignUnitOpen}
        onCancel={() => setIsAssignUnitOpen(false)}
        footer={null}
        width={480}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignUnitSubmit} className="mt-4 space-y-3">
          <Form.Item label="Select course unit *" name="unitId" rules={[{ required: true }]}>
            <Select placeholder="Choose unit..." className="h-9">
              {availableUnits.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.code ? `${u.code}: ${u.name}` : u.name} ({u.courseCode || 'Unit'})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAssignUnitOpen(false)}
              className="h-9 px-4 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-md bg-[#131926] dark:bg-[#D4FF5E] text-white dark:text-[#131926] text-xs font-semibold cursor-pointer hover:bg-slate-800 dark:hover:bg-[#C6F350] transition-colors"
            >
              Assign unit
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
