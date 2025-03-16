import { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Button,
  Alert,
  Row,
  Col,
  Tag,
  message,
  Typography,
  Spin,
} from 'antd';
import {
  ArrowUpOutlined,
  LeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  BookOutlined,
  FilterOutlined,
  IdcardOutlined,
  ApartmentOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  getCourses,
  deleteCourse,
  getDepartments,
  addUnitToCourse,
  removeUnitFromCourse,
  getUnitsByCourse,
} from '../../services/api';
import { ThemeContext } from '../../context/ThemeContext';
import { useTableStyles } from '../../components/SharedTableStyles';
import { useModalStyles } from '../../components/SharedModalStyles';

const { Content } = Layout;
const { Option } = Select;
const { Title } = Typography;

const ManageCourses = () => {
  const navigate = useNavigate();
  const { isDarkMode, themeColors } = useContext(ThemeContext);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showUnitDeleteModal, setShowUnitDeleteModal] = useState(false);
  const [form] = Form.useForm();
  const [unitForm] = Form.useForm();
  const [formData, setFormData] = useState({ name: '', code: '', department: '' });
  const [unitInput, setUnitInput] = useState({ name: '', code: '', year: '', semester: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseForUnits, setSelectedCourseForUnits] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [units, setUnits] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const courseCodes = useMemo(() => [...new Set(courses.map(course => course.code))], [courses]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, deptsRes] = await Promise.all([getCourses(), getDepartments()]);
      setCourses(coursesRes);
      setDepartments(deptsRes);
      setError('');
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesCode = selectedCode ? course.code === selectedCode : true;
      const matchesDepartment = selectedDepartment ? course.department?._id === selectedDepartment : true;
      return matchesCode && matchesDepartment;
    });
  }, [courses, selectedCode, selectedDepartment]);

  const handleCourseSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const requestBody = {
        name: values.name,
        code: values.code,
        departmentId: values.department?._id || values.department,
      };
      let response;
      if (selectedCourse) {
        response = await fetch(`https://attendance-system-w70n.onrender.com/api/course/${selectedCourse._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
      } else {
        response = await fetch('https://attendance-system-w70n.onrender.com/api/course/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save course");
      message.success(selectedCourse ? "Course updated successfully" : "Course added successfully");
      setShowCourseModal(false);
      setSelectedCourse(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error("Error saving course:", error);
      message.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManageUnits = async (course) => {
    try {
      setLoading(true);
      setSelectedCourseForUnits(course);
      const unitsRes = await getUnitsByCourse(course._id);
      setUnits(unitsRes);
      setShowUnitsModal(true);
    } catch (err) {
      setError(`Failed to load units: ${err.message}`);
      message.error(`Failed to load units`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async () => {
    try {
      await unitForm.validateFields();
      setLoading(true);
      const newUnit = await addUnitToCourse(selectedCourseForUnits._id, unitInput);
      setUnits(prevUnits => [...prevUnits, newUnit]);
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course._id === selectedCourseForUnits._id
            ? { ...course, units: [...(course.units || []), newUnit] }
            : course
        )
      );
      setUnitInput({ name: '', code: '', year: '', semester: '' });
      unitForm.resetFields();
      message.success('Unit added successfully');
    } catch (err) {
      if (err.errorFields) return;
      setError(`Failed to add unit: ${err.message}`);
      message.error('Failed to add unit');
    } finally {
      setLoading(false);
    }
  };

  const promptRemoveUnit = (unitId) => {
    setSelectedUnitId(unitId);
    setShowUnitDeleteModal(true);
  };

  const confirmUnitDelete = async () => {
    try {
      setLoading(true);
      await removeUnitFromCourse(selectedCourseForUnits._id, selectedUnitId);
      const unitsRes = await getUnitsByCourse(selectedCourseForUnits._id);
      setUnits(unitsRes);
      message.success('Unit removed successfully');
    } catch (err) {
      setError(`Failed to remove unit: ${err.message}`);
      message.error('Failed to remove unit');
    } finally {
      setLoading(false);
      setShowUnitDeleteModal(false);
      setSelectedUnitId(null);
    }
  };

  const handleDeleteConfirmation = (courseId) => {
    setSelectedCourse(courses.find(course => course._id === courseId));
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteCourse(selectedCourse._id);
      message.success('Course deleted successfully');
      await fetchData();
      setShowDeleteModal(false);
    } catch (err) {
      setError(`Failed to delete course: ${err.message}`);
      message.error('Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const tableStyles = useTableStyles();
  const modalStyles = useModalStyles();

  const styles = useMemo(() => ({
    layout: {
      minHeight: "100vh",
      background: isDarkMode ? themeColors.background : "#f0f2f5",
      padding: 0,
      margin: 0,
      width: "100%",
      overflowX: "hidden",
      boxSizing: "border-box",
    },
    headerRow: {
      marginBottom: "16px",
      padding: "8px",
      background: isDarkMode ? themeColors.cardBg : "#fafafa",
      borderRadius: "8px 8px 0 0",
      flexWrap: "wrap",
      gap: "8px",
      alignItems: "center",
      width: "100%",
      boxSizing: "border-box",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    },
    headerTitle: {
      color: isDarkMode ? themeColors.text : "#1890ff",
      margin: 0,
      fontSize: "20px",
      display: "flex",
      alignItems: "center",
    },
    content: {
      width: "100%",
      maxWidth: "100%",
      margin: 0,
      padding: "8px",
      background: isDarkMode ? themeColors.cardBg : "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      boxSizing: "border-box",
      overflowX: "hidden",
    },
    filterRow: {
      marginBottom: "16px",
      padding: "0 8px",
      background: isDarkMode ? themeColors.cardBg : "#fff",
      borderRadius: 4,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      width: "100%",
      boxSizing: "border-box",
    },
    actionsContainer: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    },
    backToTopButton: {
      position: "fixed",
      bottom: "16px",
      right: "16px",
      zIndex: 1000,
      background: themeColors.primary,
      borderColor: themeColors.primary,
    },
    table: {
      borderRadius: 8,
      overflow: "hidden",
      background: isDarkMode ? themeColors.cardBg : "#fff",
      width: "100%",
      margin: 0,
      padding: 0,
      boxSizing: "border-box",
    },
    modalHeader: {
      padding: "12px 16px",
      background: themeColors.primary,
      color: themeColors.text,
      borderRadius: "8px 8px 0 0",
    },
    modalContent: {
      padding: "16px",
      boxSizing: "border-box",
      background: isDarkMode ? themeColors.cardBg : "#fff",
      color: isDarkMode ? themeColors.text : "#000",
    },
    responsiveOverrides: `
      .ant-input,
      .ant-select-selector {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
        border-color: ${isDarkMode ? themeColors.secondary : "#d9d9d9"} !important;
      }
      .ant-input:focus,
      .ant-input-focused,
      .ant-select-selector:focus,
      .ant-select-focused .ant-select-selector {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
        border-color: ${isDarkMode ? themeColors.primary : "#40a9ff"} !important;
        box-shadow: 0 0 0 2px ${isDarkMode ? "rgba(24, 144, 255, 0.2)" : "rgba(24, 144, 255, 0.2)"} !important;
      }
      .ant-input:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 1000px ${isDarkMode ? themeColors.cardBg : "#fff"} inset !important;
        -webkit-text-fill-color: ${isDarkMode ? themeColors.text : "#000"} !important;
        caret-color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-input::placeholder,
      .ant-select-selection-placeholder {
        color: ${isDarkMode ? themeColors.textSecondary : "#999"} !important; // Changed from hardcoded #a0a0a0
      }
      .ant-form-item {
        background: transparent !important;
      }
      .ant-form-item-label > label {
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-table-thead > tr > th {
        background: ${isDarkMode ? themeColors.cardBg : "#fafafa"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-table-tbody > tr > td {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-table-tbody > tr:hover > td {
        background: ${isDarkMode ? themeColors.secondary : "#fafafa"} !important;
      }
      .ant-modal-content,
      .ant-modal-body {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-modal-header {
        background: ${isDarkMode ? themeColors.cardBg : "#fafafa"} !important;
        border-bottom: ${isDarkMode ? `1px solid ${themeColors.secondary}` : "1px solid #f0f0f0"} !important;
      }
      .ant-modal-title {
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-modal-close-x {
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-select-dropdown {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
      }
      .ant-select-item {
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
      }
      .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
        background: ${isDarkMode ? themeColors.secondary : "#e6f7ff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-select-selection-item {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${isDarkMode ? themeColors.text : "#000"} !important;
      }
      .ant-btn:hover {
        background: ${isDarkMode ? themeColors.secondary : "#e6f7ff"} !important;
      }
      html, body, #root {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: "hidden";
      }
      .ant-layout, .ant-layout-content {
        padding: 0 !important;
        margin: 0 !important;
      }
      @media (max-width: 768px) {
        .ant-layout-content { 
          padding: 4px !important; 
        }
        .filter-row { 
          padding: 0 4px !important; 
        }
        .header-row { 
          padding: 4px !important; 
        }
        .ant-btn {
          font-size: 12px;
          padding: 4px 8px;
        }
        .ant-modal {
          width: 90% !important;
          margin: 0 auto;
        }
        .back-to-top-btn {
          bottom: 40px;
          right: 10px;
        }
      }
      @media (max-width: 576px) {
        .ant-layout-content { 
          padding: 2px !important; 
        }
        .filter-row { 
          padding: 0 2px !important; 
          margin-bottom: 8px !important;
        }
        .header-row { 
          padding: 2px !important; 
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
        .ant-row:not(.header-row) {
          flex-direction: column;
          margin: 0;
        }
        .ant-col {
          width: 100%;
          margin-bottom: 8px;
          padding: 0;
        }
        .ant-table {
          font-size: 12px;
        }
        .ant-modal {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .ant-modal-content {
          border-radius: 0;
        }
        .back-to-top-btn {
          bottom: 30px;
          right: 5px;
          width: 32px;
          height: 32px;
          font-size: 14px;
        }
        .ant-alert {
          margin-bottom: 8px !important;
        }
      }
      /* Button hover styles */
      .ant-btn-primary:not(.ant-btn-dangerous):hover,
      .ant-btn-primary:not(.ant-btn-dangerous):focus {
        background: ${themeColors.primaryHover} !important;
        border-color: ${themeColors.primaryHover} !important;
      }
      
      .ant-btn-dangerous.ant-btn-primary:hover,
      .ant-btn-dangerous.ant-btn-primary:focus {
        background: ${themeColors.accentHover} !important;
        border-color: ${themeColors.accentHover} !important;
      }
      
      .ant-btn:not(.ant-btn-primary):hover,
      .ant-btn:not(.ant-btn-primary):focus {
        border-color: ${themeColors.primary} !important;
        color: ${themeColors.primary} !important;
      }
      
      /* This overrides the earlier generic button hover */
      .ant-btn-default:hover {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        border-color: ${themeColors.primary} !important;
        color: ${themeColors.primary} !important;
      }
      
      /* Consistent table styling */
      .ant-table {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${themeColors.text} !important;
        border: 1px solid ${themeColors.border} !important;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      .ant-table-thead > tr > th {
        background: ${isDarkMode ? themeColors.backgroundLight : themeColors.tableHeaderBg} !important;
        color: ${themeColors.text} !important;
        font-weight: 600;
        border-bottom: 2px solid ${themeColors.border} !important;
      }
      .ant-table-tbody > tr > td {
        background: ${isDarkMode ? themeColors.cardBg : "#fff"} !important;
        color: ${themeColors.text} !important;
        border-bottom: 1px solid ${themeColors.border} !important;
      }
      .ant-table-tbody > tr:hover > td {
        background: ${isDarkMode ? themeColors.hover : themeColors.tableRowHover} !important;
      }
      .ant-table-row:nth-child(even) {
        background-color: ${isDarkMode ? themeColors.backgroundLight : themeColors.background} !important;
      }
      .ant-table-row:nth-child(even) > td {
        background-color: ${isDarkMode ? themeColors.backgroundLight : themeColors.background} !important;
      }
      .ant-table-title {
        padding: 16px;
        font-weight: 600;
        background: ${themeColors.primary} !important;
        color: ${themeColors.textInvert} !important;
        border-radius: 8px 8px 0 0;
      }
      ${tableStyles}
      ${modalStyles.styles}
    `,
  }), [isDarkMode, themeColors, tableStyles, modalStyles.styles]);

  const columns = [
    {
      title: (<><IdcardOutlined style={{ marginRight: 4, color: themeColors.accent }} />Code</>),
      dataIndex: 'code',
      key: 'code',
      render: text => <span style={{ color: themeColors.primary, fontWeight: 500 }}>{text}</span>,
      width: 100,
    },
    {
      title: (<><BookOutlined style={{ marginRight: 4, color: themeColors.accent }} />Name</>),
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: (<><ApartmentOutlined style={{ marginRight: 4, color: themeColors.accent }} />Department</>),
      dataIndex: ['department', 'name'],
      key: 'department',
      render: dept => dept || 'N/A',
      width: 150,
      responsive: ['md'],
    },
    {
      title: (<><FilterOutlined style={{ marginRight: 4, color: themeColors.accent }} />Units</>),
      key: 'units',
      render: (_, record) => <Tag color={themeColors.primary}>{record.units ? record.units.length : 0}</Tag>,
      width: 80,
      responsive: ['sm'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={styles.actionsContainer} className="actions-container">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            style={{ background: themeColors.primary, borderColor: themeColors.primary }}
            onClick={() => {
              setSelectedCourse(record);
              setFormData({ name: record.name, code: record.code, department: record.department?._id });
              form.setFieldsValue({ name: record.name, code: record.code, department: record.department?._id });
              setShowCourseModal(true);
            }}
          >
            Edit
          </Button>
          <Button
            type="default"
            icon={<UnorderedListOutlined />}
            size="small"
            style={{
              background: isDarkMode ? themeColors.cardBg : "#fff", // Using dynamic background instead of hardcoded
              borderColor: themeColors.secondary,
              color: themeColors.text
            }}
            onClick={() => handleManageUnits(record)}
          >
            Units
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="small"
            style={{ background: themeColors.accent, borderColor: themeColors.accent }}
            onClick={() => handleDeleteConfirmation(record._id)}
          >
            Delete
          </Button>
        </div>
      ),
      width: 200,
    },
  ];

  const unitColumns = [
    {
      title: (<><IdcardOutlined style={{ marginRight: 4, color: themeColors.accent }} />Code</>),
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      render: year => <Tag color={themeColors.primary}>{year}</Tag>,
      width: 80,
      responsive: ['sm'],
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      key: 'semester',
      render: sem => <Tag color={themeColors.primary}>{sem}</Tag>,
      width: 80,
      responsive: ['sm'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          size="small"
          style={{ background: themeColors.accent, borderColor: themeColors.accent }}
          onClick={() => promptRemoveUnit(record._id)}
        >
          Remove
        </Button>
      ),
      width: 120,
    },
  ];

  return (
    <Layout style={styles.layout}>
      <Content style={styles.content} className="ant-layout-content">
        <style>{styles.responsiveOverrides}</style>
        <Spin spinning={loading} tip={selectedCourse ? "Processing course..." : "Loading courses..."}>
          {showBackToTop && (
            <Button
              type="primary"
              shape="circle"
              icon={<ArrowUpOutlined />}
              style={styles.backToTopButton}
              className="back-to-top-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          )}

          <Row justify="space-between" align="middle" style={styles.headerRow} className="header-row">
            <Button
              type="link"
              icon={<LeftOutlined />}
              onClick={() => navigate('/admin')}
              style={{ color: themeColors.primary }}
            >
              Back to Admin
            </Button>
            <Title level={3} style={styles.headerTitle}>
              <BookOutlined style={{ marginRight: 8 }} />
              Course Management
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                background: themeColors.primary,
                borderColor: themeColors.primary,
                color: themeColors.textInvert
              }}
              onClick={() => {
                setShowCourseModal(true);
                setSelectedCourse(null);
                setFormData({ name: '', code: '', department: '' });
                form.resetFields();
              }}
            >
              Add Course
            </Button>
          </Row>

          <Row gutter={[8, 8]} style={styles.filterRow}>
            <Col xs={24} sm={12}>
              <Select
                placeholder="All Courses"
                style={{ width: '100%' }}
                value={selectedCode || undefined}
                onChange={value => setSelectedCode(value)}
                allowClear
                size="large"
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                {courseCodes.map(code => (
                  <Option key={code} value={code}>{code}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12}>
              <Select
                placeholder="All Departments"
                style={{ width: '100%' }}
                value={selectedDepartment || undefined}
                onChange={value => setSelectedDepartment(value)}
                allowClear
                size="large"
                dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                {departments.map(dept => (
                  <Option key={dept._id} value={dept._id}>{dept.name}</Option>
                ))}
              </Select>
            </Col>
          </Row>

          {error && (
            <Alert
              message={error}
              type="error"
              closable
              onClose={() => setError('')}
              style={{ marginBottom: 16, margin: '0 8px', width: 'calc(100% - 16px)' }}
            />
          )}

          <Table
            dataSource={filteredCourses}
            columns={columns}
            rowKey="_id"
            scroll={{ x: 'max-content', y: 400 }}
            pagination={{ pageSize: 10, responsive: true }}
            style={styles.table}
            className="ant-table-custom"
          />

          <Modal
            open={showCourseModal}
            title={
              <div style={{ ...modalStyles.modalTitle, color: themeColors.textInvert }}>
                {selectedCourse ? <EditOutlined style={{ marginRight: 8 }} /> : <PlusOutlined style={{ marginRight: 8 }} />}
                {selectedCourse ? "Edit Course" : "Add Course"}
              </div>
            }
            onCancel={() => {
              setShowCourseModal(false);
              setSelectedCourse(null);
              form.resetFields();
            }}
            footer={[
              <Button
                key="cancel"
                onClick={() => setShowCourseModal(false)}
                style={{
                  color: isDarkMode ? themeColors.text : themeColors.text,
                  background: isDarkMode ? themeColors.cardBg : '#fff',
                  borderColor: themeColors.border
                }}
              >
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={handleCourseSubmit}
                loading={loading}
                style={{
                  background: themeColors.primary,
                  borderColor: themeColors.primary,
                  color: themeColors.textInvert
                }}
              >
                Save Course
              </Button>,
            ]}
            width={{ xs: '90%', sm: '70%', md: '50%' }[window.innerWidth < 576 ? 'xs' : window.innerWidth < 768 ? 'sm' : 'md']}
            styles={{
              header: modalStyles.modalHeader,
              body: modalStyles.modalBody,
              footer: modalStyles.modalFooter,
              content: modalStyles.modalContainer
            }}
            className={selectedCourse ? "edit-modal" : "form-modal"}
          >
            <Spin spinning={loading} tip={selectedCourse ? "Updating course details..." : "Creating new course..."}>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  name: selectedCourse?.name || '',
                  code: selectedCourse?.code || '',
                  department: selectedCourse?.department?._id || '',
                }}
                onValuesChange={(_, allValues) => setFormData(allValues)}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                <Form.Item
                  label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Course Code</span>}
                  name="code"
                  rules={[{ required: true, message: 'Please input the course code' }]}
                >
                  <Input size="large" style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }} />
                </Form.Item>
                <Form.Item
                  label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Course Name</span>}
                  name="name"
                  rules={[{ required: true, message: 'Please input the course name' }]}
                >
                  <Input size="large" style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }} />
                </Form.Item>
                <Form.Item
                  label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Department</span>}
                  name="department"
                  rules={[{ required: true, message: 'Please select a department' }]}
                >
                  <Select
                    placeholder="Select Department"
                    value={formData.department}
                    onChange={(value) => setFormData({ ...formData, department: value })}
                    size="large"
                    dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                    style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                  >
                    {departments.map(dept => (
                      <Option key={dept._id} value={dept._id}>{dept.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Form>
            </Spin>
          </Modal>

          <Modal
            open={showDeleteModal}
            title={
              <div style={{ ...modalStyles.modalTitle, color: themeColors.textInvert }}>
                <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                Confirm Delete
              </div>
            }
            centered
            onCancel={() => setShowDeleteModal(false)}
            footer={[
              <Button
                key="cancel"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  color: isDarkMode ? themeColors.text : themeColors.text,
                  background: isDarkMode ? themeColors.cardBg : '#fff',
                  borderColor: themeColors.border
                }}
              >
                Cancel
              </Button>,
              <Button
                key="delete"
                type="primary"
                danger
                onClick={handleDelete}
                loading={loading}
                style={{
                  background: themeColors.accent,
                  borderColor: themeColors.accent,
                  color: themeColors.textInvert
                }}
              >
                Delete Course
              </Button>,
            ]}
            width={{ xs: '90%', sm: '60%', md: '450px' }[window.innerWidth < 576 ? 'xs' : window.innerWidth < 768 ? 'sm' : 'md']}
            styles={{
              header: modalStyles.modalHeader,
              body: modalStyles.modalBody,
              footer: modalStyles.modalFooter,
              content: modalStyles.modalContainer
            }}
            className="confirmation-modal"
          >
            <Spin spinning={loading} tip="Deleting course...">
              <p style={{ color: themeColors.accent }}>
                <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                Are you sure you want to delete this course? This action cannot be undone.
              </p>
            </Spin>
          </Modal>

          <Modal
            open={showUnitDeleteModal}
            title={
              <div style={{ ...modalStyles.modalTitle, color: themeColors.textInvert }}>
                <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                Confirm Unit Removal
              </div>
            }
            onCancel={() => setShowUnitDeleteModal(false)}
            footer={[
              <Button
                key="cancel"
                onClick={() => setShowUnitDeleteModal(false)}
                style={{
                  color: isDarkMode ? themeColors.text : themeColors.text,
                  background: isDarkMode ? themeColors.cardBg : '#fff',
                  borderColor: themeColors.border
                }}
              >
                Cancel
              </Button>,
              <Button
                key="remove"
                type="primary"
                danger
                onClick={confirmUnitDelete}
                loading={loading}
                style={{
                  background: themeColors.accent,
                  borderColor: themeColors.accent,
                  color: themeColors.textInvert
                }}
              >
                Remove Unit
              </Button>,
            ]}
            width={{ xs: '90%', sm: '60%', md: '450px' }[window.innerWidth < 576 ? 'xs' : window.innerWidth < 768 ? 'sm' : 'md']}
            styles={{
              header: modalStyles.modalHeader,
              body: modalStyles.modalBody,
              footer: modalStyles.modalFooter,
              content: modalStyles.modalContainer
            }}
            className="confirmation-modal"
          >
            <Spin spinning={loading} tip="Removing unit...">
              <p style={{ color: themeColors.accent }}>
                <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                Are you sure you want to remove this unit? This action cannot be undone.
              </p>
            </Spin>
          </Modal>

          <Modal
            open={showUnitsModal}
            title={
              <div style={{ ...modalStyles.modalTitle, color: themeColors.textInvert }}>
                <UnorderedListOutlined style={{ marginRight: 8 }} />
                Manage Units - {selectedCourseForUnits?.name}
              </div>
            }
            centered
            onCancel={() => setShowUnitsModal(false)}
            width={{ xs: '98%', sm: '95%', md: '90%', lg: '85%' }[window.innerWidth < 576 ? 'xs' : window.innerWidth < 768 ? 'sm' : window.innerWidth < 992 ? 'md' : 'lg']}
            footer={null}
            styles={{
              header: modalStyles.modalHeader,
              body: modalStyles.modalBody,
              content: modalStyles.modalContainer
            }}
            className="large-modal"
          >
            <Spin spinning={loading} tip={units.length ? "Managing course units..." : "Loading course units..."}>
              <Form
                form={unitForm}
                layout="vertical"
                onFinish={handleAddUnit}
                style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
              >
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item
                      name="name"
                      label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Unit Name</span>}
                      rules={[{ required: true, message: 'Please enter Unit Name' }]}
                    >
                      <Input
                        placeholder="Unit Name"
                        value={unitInput.name}
                        onChange={(e) => setUnitInput({ ...unitInput, name: e.target.value })}
                        size="large"
                        style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item
                      name="code"
                      label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Unit Code</span>}
                      rules={[{ required: true, message: 'Please enter Unit Code' }]}
                    >
                      <Input
                        placeholder="Unit Code"
                        value={unitInput.code}
                        onChange={(e) => setUnitInput({ ...unitInput, code: e.target.value })}
                        size="large"
                        style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item
                      name="year"
                      label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Year</span>}
                      rules={[{ required: true, message: 'Year', type: 'number', min: 1, max: 4 }]}
                    >
                      <Select
                        placeholder="Select Year"
                        size="large"
                        onChange={(value) => setUnitInput({ ...unitInput, year: value })}
                        dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                        style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                      >
                        <Option value="1">Year 1</Option>
                        <Option value="2">Year 2</Option>
                        <Option value="3">Year 3</Option>
                        <Option value="4">Year 4</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item
                      name="semester"
                      label={<span style={{ color: isDarkMode ? themeColors.text : "#000" }}>Semester</span>}
                      rules={[{ required: true, message: 'Semester', type: 'number', min: 1, max: 3 }]}
                    >
                      <Select
                        placeholder="Select Semester"
                        size="large"
                        onChange={(value) => setUnitInput({ ...unitInput, semester: value })}
                        dropdownStyle={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                        style={{ background: isDarkMode ? themeColors.cardBg : "#fff" }}
                      >
                        <Option value="1">Semester 1</Option>
                        <Option value="2">Semester 2</Option>
                        <Option value="3">Semester 3</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      htmlType="submit"
                      disabled={!unitInput.name.trim() || !unitInput.code.trim()}
                      block
                      style={{ background: themeColors.primary, borderColor: themeColors.primary }}
                    >
                      Add Unit
                    </Button>
                  </Col>
                </Row>
              </Form>

              {error && (
                <Alert
                  message={error}
                  type="error"
                  closable
                  onClose={() => setError('')}
                  style={{ marginBottom: 16, width: 'calc(100% - 16px)', margin: '0 8px' }}
                />
              )}

              {units.length === 0 ? (
                <Alert message="No units found for this course" type="info" style={{ width: 'calc(100% - 16px)', margin: '0 8px' }} />
              ) : (
                <Table
                  dataSource={units}
                  columns={unitColumns}
                  rowKey="_id"
                  pagination={false}
                  scroll={{ x: 'max-content', y: 300 }}
                  style={styles.table}
                  className="ant-table-custom"
                />
              )}
            </Spin>
          </Modal>
        </Spin>
      </Content>
    </Layout>
  );
};

export default ManageCourses;