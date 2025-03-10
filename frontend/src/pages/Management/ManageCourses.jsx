import { useState, useEffect, useContext } from 'react';
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
  Switch, // Added Switch import
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
import 'antd/dist/reset.css';
import { ThemeContext } from '../../context/ThemeContext'; // New import

const { Content } = Layout;
const { Option } = Select;
const { Title } = Typography;

const ManageCourses = () => {
  const { isDarkMode, setIsDarkMode, themeColors } = useContext(ThemeContext); // Get theme and setIsDarkMode from context
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(false); // Global loading state
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

  const courseCodes = [...new Set(courses.map(course => course.code))];

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

  const filteredCourses = courses.filter(course => {
    const matchesCode = selectedCode ? course.code === selectedCode : true;
    const matchesDepartment = selectedDepartment ? course.department?._id === selectedDepartment : true;
    return matchesCode && matchesDepartment;
  });

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

  // Move and compute styles dynamically based on the theme
  const styles = {
    layout: {
      minHeight: '100vh',
      background: themeColors.background,
      color: themeColors.text,
      padding: 0,
      margin: 0,
      width: '100%',
      overflowX: 'hidden',
    },
    content: {
      maxWidth: '100%',
      width: '100%',
      margin: 0,
      padding: '8px',
      background: themeColors.cardBg,
      color: themeColors.text,
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    },
    headerRow: {
      marginBottom: '16px',
      padding: '8px',
      background: themeColors.cardBg,
      color: themeColors.text,
      borderRadius: '8px 8px 0 0',
      flexWrap: 'wrap',
      gap: '8px',
      alignItems: 'center',
      width: '100%',
      boxSizing: 'border-box',
    },
    filterRow: {
      marginBottom: '16px',
      padding: '0 8px',
      width: '100%',
      boxSizing: 'border-box',
    },
    actionsContainer: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    backToTopButton: {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 1000,
      background: '#1890ff',
      borderColor: '#1890ff',
    },
    table: {
      borderRadius: 8,
      overflow: 'hidden',
      background: themeColors.cardBg,
      color: themeColors.text,
      width: '100%',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
    },
    modalHeader: {
      padding: '12px 16px',
      background: '#1890ff',
      color: '#fff',
      borderRadius: '8px 8px 0 0',
    },
    modalContent: {
      padding: '16px',
      boxSizing: 'border-box',
    },
    responsiveOverrides: `
      /* Reset browser defaults */
      html, body, #root {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: hidden;
        background: ${themeColors.background};
        color: ${themeColors.text};
      }
  
      /* Reset Ant Design's Layout defaults */
      .ant-layout, .ant-layout-content {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent;
      }
  
      @media (max-width: 768px) {
        .ant-layout-content { 
          padding: 4px !important; 
        }
        .header-row { 
          padding: 4px !important; 
        }
        .filter-row { 
          padding: 0 4px !important; 
        }
      }
      @media (max-width: 480px) {
        .ant-layout-content { 
          padding: 2px !important; 
        }
        .header-row { 
          padding: 2px !important; 
        }
        .filter-row { 
          padding: 0 2px !important; 
        }
      }
      .ant-table {
        background-color: ${themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
      }
      .ant-table-thead > tr > th,
      .ant-table-tbody > tr > td {
        background-color: ${themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
      }
      .ant-table-tbody > tr.ant-table-row:hover > td {
        background-color: ${themeColors.background} !important;
      }
      .ant-modal-content,
      .ant-modal-header,
      .ant-modal-body,
      .ant-modal-footer {
        background-color: ${themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
      }
      .ant-modal-title {
        color: ${themeColors.text} !important;
      }
      .ant-select-dropdown,
      .ant-select-dropdown-menu {
        background-color: ${themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
      }
      .ant-select-selector {
        background-color: ${themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
      }
      .ant-select-item-option-content {
        color: ${themeColors.text} !important;
      }
      .ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
        background-color: ${themeColors.background} !important;
      }
      .ant-modal-content .ant-input,
      .ant-modal-content .ant-select-selector {
        background-color: ${themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
      }
      .ant-modal-content .ant-input::placeholder,
      .ant-select:not(.ant-select-customize-input)
      .ant-select-selector
      .ant-select-selection-placeholder {
        color: ${themeColors.text}80 !important;
      }
      .ant-modal-content .ant-form {
        background-color: ${themeColors.cardBg} !important;
      }
      .ant-modal-content .ant-form .ant-form-item-label > label,
      .ant-modal-content .ant-form .ant-form-item-control-input-content {
        color: ${themeColors.text} !important;
      }
      .ant-modal-content .ant-form .ant-input,
      .ant-modal-content .ant-form .ant-select-selector {
        width: 100% !important;
      }
      .ant-modal-content .ant-input:-webkit-autofill,
      .ant-modal-content input:-webkit-autofill {
        box-shadow: 0 0 0 30px ${themeColors.cardBg} inset !important;
        -webkit-box-shadow: 0 0 0 30px ${themeColors.cardBg} inset !important;
        -webkit-text-fill-color: ${themeColors.text} !important;
      }
    `,
  };

  const columns = [
    {
      title: (
        <>
          <IdcardOutlined style={{ marginRight: 4, color: '#1890ff' }} />
          Code
        </>
      ),
      dataIndex: 'code',
      key: 'code',
      render: text => <span style={{ color: '#1890ff', fontWeight: 500 }}>{text}</span>,
      width: 100,
    },
    {
      title: (
        <>
          <BookOutlined style={{ marginRight: 4, color: '#1890ff' }} />
          Name
        </>
      ),
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: (
        <>
          <ApartmentOutlined style={{ marginRight: 4, color: '#1890ff' }} />
          Department
        </>
      ),
      dataIndex: ['department', 'name'],
      key: 'department',
      render: dept => dept || 'N/A',
      width: 150,
      responsive: ['md'],
    },
    {
      title: (
        <>
          <FilterOutlined style={{ marginRight: 4, color: '#1890ff' }} />
          Units
        </>
      ),
      key: 'units',
      render: (_, record) => <Tag color="#1890ff">{record.units ? record.units.length : 0}</Tag>,
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
            style={{ background: '#1890ff', borderColor: '#1890ff' }}
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
            onClick={() => handleManageUnits(record)}
          >
            Units
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="small"
            style={{ background: '#f5222d', borderColor: '#f5222d' }}
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
      title: (
        <>
          <IdcardOutlined style={{ marginRight: 4, color: '#1890ff' }} />
          Code
        </>
      ),
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
      render: year => <Tag color="#1890ff">{year}</Tag>,
      width: 80,
      responsive: ['sm'],
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      key: 'semester',
      render: sem => <Tag color="#1890ff">{sem}</Tag>,
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
          style={{ background: '#f5222d', borderColor: '#f5222d' }}
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
        <Spin spinning={loading} tip="Loading data...">
          {showBackToTop && (
            <Button
              type="primary"
              shape="circle"
              icon={<ArrowUpOutlined />}
              style={styles.backToTopButton}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          )}

          <Row justify="space-between" align="middle" style={styles.headerRow} className="header-row">
            <Button type="link" icon={<LeftOutlined />} onClick={() => navigate('/admin')}>
              Back to Admin
            </Button>
            <Title
              level={3}
              style={{ margin: 0, color: '#1890ff', display: 'flex', alignItems: 'center' }} // Modified style to flex
            >
              <BookOutlined style={{ marginRight: 8 }} />
              Course Management
              <Switch
                checked={isDarkMode}
                onChange={(checked) => setIsDarkMode(checked)}
                checkedChildren="Dark"
                unCheckedChildren="Light"
                style={{ marginLeft: 16 }}
              />
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#1890ff', borderColor: '#1890ff' }}
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
            title={<span style={styles.modalHeader}>{selectedCourse ? "Edit Course" : "Add Course"}</span>}
            onCancel={() => {
              setShowCourseModal(false);
              setSelectedCourse(null);
              form.resetFields();
            }}
            footer={[
              <Button key="cancel" onClick={() => setShowCourseModal(false)}>Cancel</Button>,
              <Button key="submit" type="primary" onClick={handleCourseSubmit} loading={loading} style={{ background: '#1890ff', borderColor: '#1890ff' }}>
                Save Course
              </Button>,
            ]}
            width={{ xs: '90%', sm: '70%', md: '50%' }[window.innerWidth < 576 ? 'xs' : window.innerWidth < 768 ? 'sm' : 'md']}
            styles={{ body: styles.modalContent }}
            className="responsive-modal"
          >
            <Spin spinning={loading} tip="Loading data...">
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  name: selectedCourse?.name || '',
                  code: selectedCourse?.code || '',
                  department: selectedCourse?.department?._id || '',
                }}
                onValuesChange={(_, allValues) => setFormData(allValues)}
              >
                <Form.Item label="Course Code" name="code" rules={[{ required: true, message: 'Please input the course code' }]}>
                  <Input size="large" />
                </Form.Item>
                <Form.Item label="Course Name" name="name" rules={[{ required: true, message: 'Please input the course name' }]}>
                  <Input size="large" />
                </Form.Item>
                <Form.Item label="Department" name="department" rules={[{ required: true, message: 'Please select a department' }]}>
                  <Select
                    placeholder="Select Department"
                    value={formData.department}
                    onChange={(value) => setFormData({ ...formData, department: value })}
                    size="large"
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
            title={<span style={styles.modalHeader}>Confirm Delete</span>}
            centered
            onCancel={() => setShowDeleteModal(false)}
            footer={[
              <Button key="cancel" onClick={() => setShowDeleteModal(false)}>Cancel</Button>,
              <Button key="delete" type="primary" danger onClick={handleDelete} loading={loading} style={{ background: '#f5222d', borderColor: '#f5222d' }}>
                Delete Course
              </Button>,
            ]}
            width={{ xs: '90%', sm: '50%' }[window.innerWidth < 576 ? 'xs' : 'sm']}
            styles={{ body: styles.modalContent }}
          >
            <Spin spinning={loading} tip="Loading data...">
              <p style={{ color: '#f5222d' }}>
                <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                Are you sure you want to delete this course? This action cannot be undone.
              </p>
            </Spin>
          </Modal>

          <Modal
            open={showUnitDeleteModal}
            title={<span style={styles.modalHeader}>Confirm Unit Removal</span>}
            onCancel={() => setShowUnitDeleteModal(false)}
            footer={[
              <Button key="cancel" onClick={() => setShowUnitDeleteModal(false)}>Cancel</Button>,
              <Button key="remove" type="primary" danger onClick={confirmUnitDelete} loading={loading} style={{ background: '#f5222d', borderColor: '#f5222d' }}>
                Remove Unit
              </Button>,
            ]}
            width={{ xs: '90%', sm: '50%' }[window.innerWidth < 576 ? 'xs' : 'sm']}
            styles={{ body: styles.modalContent }}
          >
            <Spin spinning={loading} tip="Loading data...">
              <p style={{ color: '#f5222d' }}>
                <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                Are you sure you want to remove this unit? This action cannot be undone.
              </p>
            </Spin>
          </Modal>

          <Modal
            open={showUnitsModal}
            title={
              <span style={styles.modalHeader}>
                <UnorderedListOutlined style={{ marginRight: 8 }} />
                Manage Units - {selectedCourseForUnits?.name}
              </span>
            }
            centered
            onCancel={() => setShowUnitsModal(false)}
            width={{ xs: '95%', sm: '90%', md: '80%' }[window.innerWidth < 576 ? 'xs' : window.innerWidth < 768 ? 'sm' : 'md']}
            footer={null}
            styles={{ body: styles.modalContent }}
            className="responsive-modal"
          >
            <Spin spinning={loading} tip="Loading data...">
              <Form form={unitForm} layout="vertical" onFinish={handleAddUnit}>
                <Row gutter={[16, 16]} style={{ marginBottom: 16, width: '100%' }}>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="name" rules={[{ required: true, message: 'Please enter Unit Name' }]}>
                      <Input
                        placeholder="Unit Name"
                        value={unitInput.name}
                        onChange={(e) => setUnitInput({ ...unitInput, name: e.target.value })}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="code" rules={[{ required: true, message: 'Please enter Unit Code' }]}>
                      <Input
                        placeholder="Unit Code"
                        value={unitInput.code}
                        onChange={(e) => setUnitInput({ ...unitInput, code: e.target.value })}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="year" rules={[{ required: true, message: 'Year', type: 'number', min: 1, max: 4 }]}>
                      <Select placeholder="Select Year" size="large">
                        <Option value="1">Year 1</Option>
                        <Option value="2">Year 2</Option>
                        <Option value="3">Year 3</Option>
                        <Option value="4">Year 4</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="semester" rules={[{ required: true, message: 'Semester', type: 'number', min: 1, max: 3 }]}>
                      <Select placeholder="Select Semester" size="large">
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
                      style={{ background: '#1890ff', borderColor: '#1890ff' }}
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