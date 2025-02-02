import { useState, useEffect } from 'react';
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
  LoadingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  getCourses,
  createCourse,
  deleteCourse,
  getDepartments,
  updateCourse,
  addUnitToCourse,
  removeUnitFromCourse,
  getUnitsByCourse,
} from '../services/api';

const { Content } = Layout;
const { Option } = Select;

const ManageCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showUnitDeleteModal, setShowUnitDeleteModal] = useState(false);
  const [form] = Form.useForm();
  const [unitForm] = Form.useForm();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
  });
  const [unitInput, setUnitInput] = useState({
    name: '',
    code: '',
    year: '',
    semester: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseForUnits, setSelectedCourseForUnits] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [units, setUnits] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll handler for "Back to Top" button
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Extract unique course codes from courses
  const courseCodes = [...new Set(courses.map(course => course.code))];

  // Fetch courses and departments on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, deptsRes] = await Promise.all([
        getCourses(),
        getDepartments(),
      ]);
      setCourses(coursesRes);
      setDepartments(deptsRes);
      setError('');
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter courses based on selected code and department
  const filteredCourses = courses.filter(course => {
    const matchesCode = selectedCode ? course.code === selectedCode : true;
    const matchesDepartment = selectedDepartment
      ? course.department?._id === selectedDepartment
      : true;
    return matchesCode && matchesDepartment;
  });

  // Called when the course form fields change
  const handleCourseFormChange = (changedValues, allValues) => {
    setFormData(allValues);
  };

  const handleCourseSubmit = async () => {
    try {
      setLoading(true);
      if (selectedCourse) {
        // Update existing course
        await updateCourse(selectedCourse._id, formData);
      } else {
        // Create new course
        await createCourse(formData);
      }
      setShowCourseModal(false);
      message.success('Operation successful');
      await fetchData();
      setFormData({ name: '', code: '', department: '' });
      setSelectedCourse(null);
      form.resetFields();
    } catch (err) {
      setError(err.message || 'Operation failed');
      message.error('Operation failed');
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
    if (!unitInput.name.trim() || !unitInput.code.trim()) {
      setError('Unit name and code are required');
      return;
    }
    try {
      setLoading(true);
      const newUnit = await addUnitToCourse(selectedCourseForUnits._id, unitInput);
      setUnits(prevUnits => [...prevUnits, newUnit]);
      setUnitInput({ name: '', code: '', year: '', semester: '' });
      unitForm.resetFields();
      message.success('Unit added successfully');
    } catch (err) {
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
    setSelectedCourse(courseId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteCourse(selectedCourse);
      message.success('Course deleted successfully');
      await fetchData();
      setShowDeleteModal(false);
    } catch (err) {
      setError(`Failed to delete course: ${err.message}`);
      message.error('Failed to delete course');
    }
  };

  // Columns for the Courses Table
  const columns = [
    {
      title: (
        <>
          <IdcardOutlined style={{ marginRight: 4 }} />
          Code
        </>
      ),
      dataIndex: 'code',
      key: 'code',
      render: text => <span style={{ color: '#1890ff', fontWeight: 500 }}>{text}</span>,
    },
    {
      title: (
        <>
          <BookOutlined style={{ marginRight: 4 }} />
          Name
        </>
      ),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: (
        <>
          <ApartmentOutlined style={{ marginRight: 4 }} />
          Department
        </>
      ),
      dataIndex: ['department', 'name'],
      key: 'department',
      render: (dept) => dept || 'N/A',
    },
    {
      title: (
        <>
          <FilterOutlined style={{ marginRight: 4 }} />
          Units
        </>
      ),
      key: 'units',
      render: (_, record) => (
        <Tag color="blue">
          {record.units ? record.units.length : 0}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setSelectedCourse(record);
              setFormData({
                name: record.name,
                code: record.code,
                department: record.department?._id,
              });
              form.setFieldsValue({
                name: record.name,
                code: record.code,
                department: record.department?._id,
              });
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
            onClick={() => handleDeleteConfirmation(record._id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', padding: '20px' }}>
      <Content>
        {/* Back to Top Button */}
        {showBackToTop && (
          <Button
            type="primary"
            shape="circle"
            icon={<ArrowUpOutlined />}
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 1000,
            }}
            onClick={() =>
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          />
        )}

        {/* Header Section */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Button type="link" icon={<LeftOutlined />} onClick={() => navigate('/admin')}>
            Back to Admin
          </Button>
          <h2 style={{ margin: 0 }}>
            <BookOutlined style={{ marginRight: 8 }} />
            Course Management
          </h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setShowCourseModal(true);
            setSelectedCourse(null);
            setFormData({ name: '', code: '', department: '' });
            form.resetFields();
          }}>
            Add Course
          </Button>
        </Row>

        {/* Filter Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} md={12}>
            <Select
              placeholder="All Courses"
              style={{ width: '100%' }}
              value={selectedCode || undefined}
              onChange={value => setSelectedCode(value)}
              allowClear
            >
              {courseCodes.map(code => (
                <Option key={code} value={code}>
                  {code}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={12}>
            <Select
              placeholder="All Departments"
              style={{ width: '100%' }}
              value={selectedDepartment || undefined}
              onChange={value => setSelectedDepartment(value)}
              allowClear
            >
              {departments.map(dept => (
                <Option key={dept._id} value={dept._id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Alerts */}
        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => setError('')}
            style={{ marginBottom: 16 }}
          />
        )}
        {loading && (
          <Alert
            message="Loading..."
            type="info"
            icon={<LoadingOutlined spin />}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Courses Table */}
        <Table
          dataSource={filteredCourses}
          columns={columns}
          rowKey="_id"
          scroll={{ y: 400 }}
        />

        {/* Course Add/Edit Modal */}
        <Modal
          open={showCourseModal}
          title={
            selectedCourse ? (
              <>
                <EditOutlined style={{ marginRight: 8 }} />
                Edit Course
              </>
            ) : (
              <>
                <PlusOutlined style={{ marginRight: 8 }} />
                Add Course
              </>
            )
          }
          onCancel={() => {
            setShowCourseModal(false);
            setSelectedCourse(null);
            setFormData({ name: '', code: '', department: '' });
            form.resetFields();
          }}
          footer={[
            <Button key="cancel" onClick={() => {
              setShowCourseModal(false);
              setSelectedCourse(null);
              form.resetFields();
            }}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleCourseSubmit} loading={loading}>
              {loading ? <LoadingOutlined spin /> : 'Save Course'}
            </Button>,
          ]}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={formData}
            onValuesChange={handleCourseFormChange}
          >
            <Form.Item
              label={
                <>
                  <IdcardOutlined style={{ marginRight: 4 }} />
                  Course Code
                </>
              }
              name="code"
              rules={[{ required: true, message: 'Please input the course code' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={
                <>
                  <BookOutlined style={{ marginRight: 4 }} />
                  Course Name
                </>
              }
              name="name"
              rules={[{ required: true, message: 'Please input the course name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={
                <>
                  <ApartmentOutlined style={{ marginRight: 4 }} />
                  Department
                </>
              }
              name="department"
              rules={[{ required: true, message: 'Please select a department' }]}
            >
              <Select placeholder="Select Department">
                {departments.map(dept => (
                  <Option key={dept._id} value={dept._id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Course Delete Confirmation Modal */}
        <Modal
          open={showDeleteModal}
          title="Confirm Delete"
          onCancel={() => setShowDeleteModal(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>,
            <Button key="delete" type="primary" danger onClick={handleDelete}>
              Delete Course
            </Button>,
          ]}
        >
          <p>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            Are you sure you want to delete this course? This action cannot be undone.
          </p>
        </Modal>

        {/* Unit Delete Confirmation Modal */}
        <Modal
          open={showUnitDeleteModal}
          title="Confirm Unit Removal"
          onCancel={() => setShowUnitDeleteModal(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowUnitDeleteModal(false)}>
              Cancel
            </Button>,
            <Button key="remove" type="primary" danger onClick={confirmUnitDelete}>
              Remove Unit
            </Button>,
          ]}
        >
          <p>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            Are you sure you want to remove this unit? This action cannot be undone.
          </p>
        </Modal>

        {/* Units Management Modal */}
        <Modal
          open={showUnitsModal}
          title={
            <>
              <UnorderedListOutlined style={{ marginRight: 8 }} />
              Manage Units - {selectedCourseForUnits?.name}
            </>
          }
          onCancel={() => setShowUnitsModal(false)}
          width="80%"
          footer={null}
        >
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Unit Name"
                value={unitInput.name}
                onChange={(e) => setUnitInput({ ...unitInput, name: e.target.value })}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Unit Code"
                value={unitInput.code}
                onChange={(e) => setUnitInput({ ...unitInput, code: e.target.value })}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Input
                placeholder="Year"
                type="number"
                value={unitInput.year}
                onChange={(e) => setUnitInput({ ...unitInput, year: e.target.value })}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Input
                placeholder="Semester"
                type="number"
                value={unitInput.semester}
                onChange={(e) => setUnitInput({ ...unitInput, semester: e.target.value })}
              />
            </Col>
            <Col xs={24} sm={24} md={4}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddUnit}
                disabled={!unitInput.name.trim() || !unitInput.code.trim()}
              >
                Add Unit
              </Button>
            </Col>
          </Row>

          {error && (
            <Alert
              message={error}
              type="error"
              closable
              onClose={() => setError('')}
              style={{ marginBottom: 16 }}
            />
          )}

          {units.length === 0 ? (
            <Alert message="No units found for this course" type="info" />
          ) : (
            <Table
              dataSource={units}
              rowKey="_id"
              pagination={false}
              scroll={{ y: 300 }}
              columns={[
                {
                  title: (
                    <>
                      <IdcardOutlined style={{ marginRight: 4 }} />
                      Code
                    </>
                  ),
                  dataIndex: 'code',
                  key: 'code',
                },
                {
                  title: 'Name',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Year',
                  dataIndex: 'year',
                  key: 'year',
                  render: year => <Tag color="blue">{year}</Tag>,
                },
                {
                  title: 'Semester',
                  dataIndex: 'semester',
                  key: 'semester',
                  render: sem => <Tag>{sem}</Tag>,
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
                      onClick={() => promptRemoveUnit(record._id)}
                    >
                      Remove
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default ManageCourses;
