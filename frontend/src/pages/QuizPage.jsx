import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Layout,
  Menu,
  theme,
  Card,
  Button,
  Form,
  Input,
  Select,
  Upload,
  Table,
  Skeleton,
  message,
  App,
  Switch,
  Space,
  Tag,
} from 'antd';
import {
  DashboardOutlined,
  FileAddOutlined,
  FolderOutlined,
  BarChartOutlined,
  UploadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
// Ensure these functions are exported from your API service.
import { getLecturerUnits, getDepartments, createQuiz, getPastQuizzes } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

/**
 * CreateQuizForm Component
 * Provides two methods to create a quiz:
 *  1. Manually: Lecturer fills out a form with quiz title, description, and a dynamic list of questions.
 *  2. Upload: Lecturer uploads a JSON file containing quiz data.
 */
// Define PropTypes for CreateQuizForm component
const createQuizFormPropTypes = {
  units: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    course: PropTypes.shape({
      name: PropTypes.string
    })
  })).isRequired,
  loading: PropTypes.shape({
    units: PropTypes.bool
  }).isRequired
};

const CreateQuizForm = ({ units, loading }) => {
  CreateQuizForm.propTypes = {
    units: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      course: PropTypes.shape({
        name: PropTypes.string
      })
    })).isRequired,
    loading: PropTypes.shape({
      units: PropTypes.bool
    }).isRequired
  };
  const [form] = Form.useForm();
  const [creationMethod, setCreationMethod] = useState('manual'); // 'manual' or 'upload'
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (!values.unit) {
        message.error('Please select a unit');
        return;
      }

      // Build the payload with common fields
      const payload = {
        title: values.title,
        description: values.description,
        method: creationMethod,
        unit: values.unit,
      };

      if (creationMethod === 'manual') {
        // For manual creation, attach the questions list.
        payload.questions = values.questions;
      } else {
        // For upload, read and parse the JSON file.
        const fileList = values.quizFile;
        if (fileList && fileList.length > 0) {
          const file = fileList[0].originFileObj;
          const text = await file.text();
          const quizData = JSON.parse(text);
          payload.quizData = quizData;
        } else {
          throw new Error("No file uploaded");
        }
      }

      // Call the API to create the quiz
      await createQuiz(payload);
      message.success('Quiz created successfully!');
      form.resetFields();
    } catch {
      message.error('Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Mode Switcher */}
      <Space style={{ marginBottom: 16 }}>
        <Button
          type={creationMethod === 'manual' ? 'primary' : 'default'}
          onClick={() => setCreationMethod('manual')}
        >
          Create Manually
        </Button>
        <Button
          type={creationMethod === 'upload' ? 'primary' : 'default'}
          onClick={() => setCreationMethod('upload')}
        >
          Upload Quiz File
        </Button>
      </Space>

      <Form form={form} onFinish={onFinish} layout="vertical">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Form.Item
            name="unit"
            label="Select Unit"
            rules={[{ required: true, message: 'Please select a unit' }]}
          >
            <Select
              placeholder="Select Unit"
              style={{ width: '100%' }}
              loading={loading.units}
              optionLabelProp="label"
            >
              {units.map(unit => (
                <Option 
                  key={unit._id} 
                  value={unit._id}
                  label={`${unit.name} (${unit.code})`}
                >
                  <Space>
                    {unit.name}
                    <Tag color="blue">{unit.code}</Tag>
                    {unit.course && <Tag color="green">{unit.course.name}</Tag>}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Quiz Title"
            rules={[{ required: true, message: 'Please input the quiz title' }]}
          >
            <Input placeholder="Enter quiz title" />
          </Form.Item>
        </Space>

        <Form.Item name="description" label="Quiz Description">
          <Input.TextArea rows={4} placeholder="Enter quiz description (optional)" />
        </Form.Item>

        {creationMethod === 'manual' ? (
          // Manual creation: dynamic list of questions and options
          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    title={`Question ${index + 1}`}
                    style={{ marginBottom: 16 }}
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, 'questionText']}
                      fieldKey={[field.fieldKey, 'questionText']}
                      label="Question"
                      rules={[{ required: true, message: 'Missing question text' }]}
                    >
                      <Input placeholder="Enter question text" />
                    </Form.Item>
                    {/* Dynamic list of options for each question */}
                    <Form.List name={[field.name, 'options']}>
                      {(optionFields, { add: addOption, remove: removeOption }) => (
                        <>
                          {optionFields.map((optionField, idx) => (
                            <Space key={optionField.key} align="baseline">
                              <Form.Item
                                {...optionField}
                                name={[optionField.name, 'optionText']}
                                fieldKey={[optionField.fieldKey, 'optionText']}
                                label={idx === 0 ? 'Options' : ''}
                                rules={[{ required: true, message: 'Missing option text' }]}
                              >
                                <Input placeholder={`Option ${idx + 1}`} />
                              </Form.Item>
                              <Form.Item
                                {...optionField}
                                name={[optionField.name, 'isCorrect']}
                                fieldKey={[optionField.fieldKey, 'isCorrect']}
                                valuePropName="checked"
                                label="Correct?"
                              >
                                <Switch />
                              </Form.Item>
                              <Button type="link" danger onClick={() => removeOption(optionField.name)}>
                                Remove
                              </Button>
                            </Space>
                          ))}
                          <Form.Item>
                            <Button type="dashed" onClick={() => addOption()} block>
                              Add Option
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                    <Button type="link" danger onClick={() => remove(field.name)}>
                      Remove Question
                    </Button>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    Add Question
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        ) : (
          // Upload mode: file upload field
          <Form.Item
            name="quizFile"
            label="Quiz File"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) return e;
              return e && e.fileList;
            }}
            rules={[{ required: true, message: 'Please upload a quiz file' }]}
          >
            <Upload name="file" accept=".json" beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>Click to upload JSON file</Button>
            </Upload>
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Submit Quiz
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

CreateQuizForm.propTypes = createQuizFormPropTypes;

const QuizPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState({ units: true, quizzes: false });
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [quizzes, setQuizzes] = useState([]); // Updated to allow setting fetched quizzes
  const [filters, setFilters] = useState({
    department: null,
    course: null,
    year: null,
    semester: null,
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode] = useState(false);
  const lecturerId = localStorage.getItem("userId");
  const { token } = theme.useToken();

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch {
        message.error('Failed to fetch departments');
      }
    };

    fetchDepartments();
  }, []);

  // Fetch lecturer units
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!lecturerId) {
          message.error("User session expired");
          return;
        }

        setLoading(prev => ({ ...prev, units: true }));
        const unitsData = await getLecturerUnits(lecturerId);

        if (unitsData?.length > 0) {
          setUnits(unitsData);
        } else {
          message.info("No units assigned to your account");
        }
      } catch {
        message.error("Failed to load unit data");
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };

    if (lecturerId) fetchData();
  }, [lecturerId]);

  // Fetch past quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(prev => ({ ...prev, quizzes: true }));
        const quizData = await getPastQuizzes(lecturerId);
        setQuizzes(quizData || []);
      } catch {
        message.error("Failed to load quizzes");
      } finally {
        setLoading(prev => ({ ...prev, quizzes: false }));
      }
    };

    if (lecturerId) fetchQuizzes();
  }, [lecturerId]);

  // Compute filter options:
  // - Departments come from the departments API call.
  // - Courses, years, and semesters are derived from the units data.
  const filterOptions = useMemo(() => {
    const deptOptions = departments.map((dept) => dept.name).sort();

    const courses = new Set();
    const years = new Set();
    const semesters = new Set();

    units.forEach((unit) => {
      if (unit.course?.name) courses.add(unit.course.name);
      if (unit.year) years.add(unit.year);
      if (unit.semester) semesters.add(unit.semester);
    });

    return {
      departments: deptOptions,
      courses: Array.from(courses).sort(),
      years: Array.from(years).sort((a, b) => a - b),
      semesters: Array.from(semesters).sort((a, b) => a - b),
    };
  }, [units, departments]);

  // Calculate available options based on current filters
  const availableCourses = useMemo(() => {
    if (!filters.department) return filterOptions.courses;
    return units
      .filter((unit) => unit.department?.name === filters.department)
      .map((unit) => unit.course?.name)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [filters.department, units, filterOptions.courses]);

  const availableYears = useMemo(() => {
    if (!filters.department || !filters.course) return filterOptions.years;
    return units
      .filter(
        (unit) =>
          unit.department?.name === filters.department &&
          unit.course?.name === filters.course
      )
      .map((unit) => unit.year)
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [filters.department, filters.course, units, filterOptions.years]);

  const availableSemesters = useMemo(() => {
    if (!filters.department || !filters.course || !filters.year)
      return filterOptions.semesters;
    return units
      .filter(
        (unit) =>
          unit.department?.name === filters.department &&
          unit.course?.name === filters.course &&
          unit.year === filters.year
      )
      .map((unit) => unit.semester)
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [filters.department, filters.course, filters.year, units, filterOptions.semesters]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(
      (quiz) =>
        (!filters.department || quiz.department === filters.department) &&
        (!filters.course || quiz.course === filters.course) &&
        (!filters.year || quiz.year === filters.year) &&
        (!filters.semester || quiz.semester === filters.semester)
    );
  }, [quizzes, filters]);

  // Handle department filter change
  const handleDepartmentChange = (value) => {
    setFilters(prev => ({ 
      ...prev, 
      department: value,
      course: null,
      year: null,
      semester: null 
    }));
  };

  // Handle course filter change
  const handleCourseChange = (value) => {
    setFilters(prev => ({ 
      ...prev, 
      course: value,
      year: null,
      semester: null 
    }));
  };

  // Handle year filter change
  const handleYearChange = (value) => {
    setFilters(prev => ({ 
      ...prev, 
      year: value,
      semester: null 
    }));
  };

  // Handle semester filter change
  const handleSemesterChange = (value) => {
    setFilters(prev => ({ 
      ...prev, 
      semester: value 
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      department: null,
      course: null,
      year: null,
      semester: null,
    });
  };

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'create', icon: <FileAddOutlined />, label: 'Create Quiz' },
    { key: 'library', icon: <FolderOutlined />, label: 'Quiz Library' },
    { key: 'results', icon: <BarChartOutlined />, label: 'Results' },
  ];

  return (
    <App theme={{ algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
          <div
            className="logo"
            style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)' }}
          />
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={({ key }) => setActiveTab(key)}
            items={menuItems}
          />
        </Sider>
        <Layout>
          <Header style={{ padding: 0, background: token.colorBgContainer }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
          </Header>
          <Content style={{ margin: '24px 16px' }}>
            {activeTab === 'create' ? (
              <CreateQuizForm units={units} loading={loading} />
            ) : activeTab === 'library' ? (
              <div>
                <div className="flex gap-md mb-lg">
                  <Space wrap style={{ width: '100%' }}>
                    <Select
                      placeholder="Select Department"
                      style={{ width: 160 }}
                      onChange={handleDepartmentChange}
                      value={filters.department}
                      allowClear
                    >
                      {departments.map(department => (
                        <Option key={department._id} value={department.name}>
                          {department.name}
                        </Option>
                      ))}
                    </Select>

                    <Select
                      placeholder="Course"
                      style={{ width: 180 }}
                      onChange={handleCourseChange}
                      value={filters.course}
                      allowClear
                      disabled={!filters.department}
                    >
                      {availableCourses.map((course) => (
                        <Option key={course} value={course}>{course}</Option>
                      ))}
                    </Select>

                    <Select
                      placeholder="Year"
                      style={{ width: 120 }}
                      onChange={handleYearChange}
                      value={filters.year}
                      allowClear
                      disabled={!filters.course}
                    >
                      {availableYears.map((year) => (
                        <Option key={year} value={year}>Year {year}</Option>
                      ))}
                    </Select>

                    <Select
                      placeholder="Semester"
                      style={{ width: 140 }}
                      onChange={handleSemesterChange}
                      value={filters.semester}
                      allowClear
                      disabled={!filters.year}
                    >
                      {availableSemesters.map((sem) => (
                        <Option key={sem} value={sem}>Sem {sem}</Option>
                      ))}
                    </Select>

                    <Button
                      type="link"
                      onClick={clearFilters}
                      disabled={!Object.values(filters).some(Boolean)}
                    >
                      Clear Filters
                    </Button>
                  </Space>
                </div>
                <div>
                  <h2>Quiz Library</h2>
                  {loading.quizzes ? (
                    <Skeleton active />
                  ) : (
                    <Table dataSource={filteredQuizzes} rowKey="id">
                      <Table.Column title="Quiz Title" dataIndex="title" key="title" />
                      <Table.Column title="Department" dataIndex="department" key="department" />
                      <Table.Column title="Course" dataIndex="course" key="course" />
                      <Table.Column title="Year" dataIndex="year" key="year" />
                      <Table.Column title="Semester" dataIndex="semester" key="semester" />
                      <Table.Column
                        title="Status"
                        key="status"
                        render={(_, record) => (
                          <Tag color={record.status === 'active' ? 'green' : 'red'}>
                            {record.status}
                          </Tag>
                        )}
                      />
                    </Table>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h2>Dashboard</h2>
                <p>Dashboard content goes here...</p>
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
    </App>
  );
};

export default QuizPage;
