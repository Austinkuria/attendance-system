import { useState, useMemo, useEffect } from 'react';
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
// IMPORTANT: Ensure createQuiz is exported in your ../services/api.js file.
import { getLecturerUnits, createQuiz } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

/**
 * CreateQuizForm Component
 * Provides two methods to create a quiz:
 *  1. Manually: Lecturer fills out a form with quiz title, description, and a dynamic list of questions.
 *  2. Upload: Lecturer uploads a JSON file containing quiz data.
 */
const CreateQuizForm = () => {
  const [form] = Form.useForm();
  const [creationMethod, setCreationMethod] = useState('manual'); // 'manual' or 'upload'
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      // Build the payload with common fields
      const payload = {
        title: values.title,
        description: values.description,
        method: creationMethod,
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
        <Form.Item
          name="title"
          label="Quiz Title"
          rules={[{ required: true, message: 'Please input the quiz title' }]}
        >
          <Input placeholder="Enter quiz title" />
        </Form.Item>

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
                      key={[field.key, 'questionText']}
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
                                key={[optionField.key, 'optionText']}
                                label={idx === 0 ? 'Options' : ''}
                                rules={[{ required: true, message: 'Missing option text' }]}
                              >
                                <Input placeholder={`Option ${idx + 1}`} />
                              </Form.Item>
                              <Form.Item
                                {...optionField}
                                name={[optionField.name, 'isCorrect']}
                                key={[optionField.key, 'isCorrect']}
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

const QuizPage = () => {
  const [darkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState({ units: true, quizzes: false });
  const [filters, setFilters] = useState({
    department: null,
    course: null,
    year: null,
    semester: null,
  });
  const [units, setUnits] = useState([]);
  const [quizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const lecturerId = localStorage.getItem("userId");
  const { token } = theme.useToken();

  // Fetch lecturer's units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const unitsData = await getLecturerUnits(lecturerId);
        setUnits(unitsData);
      } catch {
        message.error('Failed to load unit data');
      } finally {
        setLoading(prev => ({ ...prev, units: false }));
      }
    };

    if (lecturerId) fetchUnits();
  }, [lecturerId]);

  // Calculate filter options from units
  const filterOptions = useMemo(() => {
    const departments = new Set();
    const courses = new Set();
    const years = new Set();
    const semesters = new Set();

    units.forEach(unit => {
      if (unit.department?.name) departments.add(unit.department.name);
      if (unit.course?.name) courses.add(unit.course.name);
      if (unit.year) years.add(unit.year);
      if (unit.semester) semesters.add(unit.semester);
    });

    return {
      departments: Array.from(departments).sort(),
      courses: Array.from(courses).sort(),
      years: Array.from(years).sort((a, b) => a - b),
      semesters: Array.from(semesters).sort((a, b) => a - b),
    };
  }, [units]);

  // Calculate available options based on current filters
  const availableCourses = useMemo(() => {
    if (!filters.department) return filterOptions.courses;
    return units
      .filter(unit => unit.department?.name === filters.department)
      .map(unit => unit.course?.name)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [filters.department, units, filterOptions.courses]);

  const availableYears = useMemo(() => {
    if (!filters.department || !filters.course) return filterOptions.years;
    return units
      .filter(
        unit =>
          unit.department?.name === filters.department &&
          unit.course?.name === filters.course
      )
      .map(unit => unit.year)
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [filters.department, filters.course, units, filterOptions.years]);

  const availableSemesters = useMemo(() => {
    if (!filters.department || !filters.course || !filters.year) return filterOptions.semesters;
    return units
      .filter(
        unit =>
          unit.department?.name === filters.department &&
          unit.course?.name === filters.course &&
          unit.year === filters.year
      )
      .map(unit => unit.semester)
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [filters.department, filters.course, filters.year, units, filterOptions.semesters]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(quiz =>
      (!filters.department || quiz.department === filters.department) &&
      (!filters.course || quiz.course === filters.course) &&
      (!filters.year || quiz.year === filters.year) &&
      (!filters.semester || quiz.semester === filters.semester)
    );
  }, [quizzes, filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
      // Reset dependent filters when a parent filter changes
      if (name === 'department') {
        newFilters.course = null;
        newFilters.year = null;
        newFilters.semester = null;
      }
      if (name === 'course') {
        newFilters.year = null;
        newFilters.semester = null;
      }
      if (name === 'year') {
        newFilters.semester = null;
      }
      return newFilters;
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
              <CreateQuizForm />
            ) : (
              <div>
                <div className="flex gap-md mb-lg">
                  <Select
                    placeholder="Select Department"
                    style={{ width: 200 }}
                    onChange={(value) => handleFilterChange('department', value)}
                    value={filters.department}
                    loading={loading.units}
                  >
                    {filterOptions.departments.map((dept) => (
                      <Option key={dept} value={dept}>
                        {dept}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    placeholder="Select Course"
                    style={{ width: 200 }}
                    onChange={(value) => handleFilterChange('course', value)}
                    value={filters.course}
                    disabled={!filters.department}
                    loading={loading.units}
                  >
                    {availableCourses.map((course) => (
                      <Option key={course} value={course}>
                        {course}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    placeholder="Select Year"
                    style={{ width: 120 }}
                    onChange={(value) => handleFilterChange('year', value)}
                    value={filters.year}
                    disabled={!filters.course}
                    loading={loading.units}
                  >
                    {availableYears.map((year) => (
                      <Option key={year} value={year}>
                        Year {year}
                      </Option>
                    ))}
                  </Select>

                  <Select
                    placeholder="Select Semester"
                    style={{ width: 140 }}
                    onChange={(value) => handleFilterChange('semester', value)}
                    value={filters.semester}
                    disabled={!filters.year}
                    loading={loading.units}
                  >
                    {availableSemesters.map((sem) => (
                      <Option key={sem} value={sem}>
                        Sem {sem}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <h2>Dashboard</h2>
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
            )}
          </Content>
        </Layout>
      </Layout>
    </App>
  );
};

export default QuizPage;
