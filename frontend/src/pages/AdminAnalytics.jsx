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

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.data);
    } catch (error) {
      message.error('Failed to fetch courses');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await getDepartments();
      setDepartments(response.data);
    } catch (error) {
      message.error('Failed to fetch departments');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await deleteCourse(courseId);
      message.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      message.error('Failed to delete course');
    }
  };

  const handleAddUnitToCourse = async (courseId, unitId) => {
    try {
      await addUnitToCourse(courseId, unitId);
      message.success('Unit added to course successfully');
      fetchCourses();
    } catch (error) {
      message.error('Failed to add unit to course');
    }
  };

  const handleRemoveUnitFromCourse = async (courseId, unitId) => {
    try {
      await removeUnitFromCourse(courseId, unitId);
      message.success('Unit removed from course successfully');
      fetchCourses();
    } catch (error) {
      message.error('Failed to remove unit from course');
    }
  };

  const handleGetUnitsByCourse = async (courseId) => {
    try {
      const response = await getUnitsByCourse(courseId);
      return response.data;
    } catch (error) {
      message.error('Failed to fetch units for course');
      return [];
    }
  };

  return (
    <Layout>
      <Content>
        <Title level={2}>Manage Courses</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCourseModal(true)}>
          Add Course
        </Button>
        <Table
          dataSource={courses}
          columns={[
            {
              title: 'Course Name',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: 'Department',
              dataIndex: 'department',
              key: 'department',
              render: (department) => department.name,
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (text, record) => (
                <span>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      form.setFieldsValue(record);
                      setShowCourseModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="link"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    type="link"
                    icon={<UnorderedListOutlined />}
                    onClick={() => {
                      handleGetUnitsByCourse(record._id).then((units) => {
                        unitForm.setFieldsValue({ units });
                        setShowUnitsModal(true);
                      });
                    }}
                  >
                    Units
                  </Button>
                </span>
              ),
            },
          ]}
        />
        <Modal
          title="Add/Edit Course"
          visible={showCourseModal}
          onCancel={() => setShowCourseModal(false)}
          onOk={() => {
            form.validateFields().then((values) => {
              // Handle form submission
              setShowCourseModal(false);
            });
          }}
        >
          <Form form={form}>
            <Form.Item
              name="name"
              label="Course Name"
              rules={[{ required: true, message: 'Please enter course name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Please select department' }]}
            >
              <Select>
                {departments.map((department) => (
                  <Option key={department._id} value={department._id}>
                    {department.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title="Delete Course"
          visible={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          onOk={() => {
            // Handle delete course
            setShowDeleteModal(false);
          }}
        >
          <p>Are you sure you want to delete this course?</p>
        </Modal>
        <Modal
          title="Manage Units"
          visible={showUnitsModal}
          onCancel={() => setShowUnitsModal(false)}
          onOk={() => {
            unitForm.validateFields().then((values) => {
              // Handle unit form submission
              setShowUnitsModal(false);
            });
          }}
        >
          <Form form={unitForm}>
            <Form.Item
              name="units"
              label="Units"
              rules={[{ required: true, message: 'Please select units' }]}
            >
              <Select mode="multiple">
                {/* Commenting out Unit selection
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Select Unit (Optional)"
                    allowClear
                    onChange={setSelectedUnit}
                    value={selectedUnit}
                    style={{ width: '100%' }}
                  >
                    {courseUnits.map(unit => (
                      <Option key={unit._id} value={unit._id}>
                        {unit.name} - {unit.code || 'No Code'}
                        {unit.year && unit.semester &&
                          <Tag color={themeColors.secondary} style={{ marginLeft: 8 }}>
                            Y{unit.year} S{unit.semester}
                          </Tag>
                        }
                      </Option>
                    ))}
                  </Select>
                </Col>
                */}
                <Col xs={12} sm={8}>
                  <Select
                    value={viewMode}
                    style={{ width: '100%' }}
                    onChange={value => {
                      setViewMode(value);
                    }}
                  >
                    <Option value="table">Table View</Option>
                    <Option value="chart">Chart View</Option>
                  </Select>
                </Col>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ManageCourses;