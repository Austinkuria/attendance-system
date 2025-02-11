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
  Skeleton,
  message,
  App,
  Switch,
  Space,
  Tag,
  Row,
  Col,
  Checkbox,
  Dropdown,
  Empty,
  Popconfirm,
  DatePicker,
  Collapse,
  Badge,
  Pagination,
  Divider,
  Modal,
} from 'antd';
import {
  DashboardOutlined,
  FileAddOutlined,
  FolderOutlined,
  BarChartOutlined,
  UploadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { getLecturerUnits, getDepartments, createQuiz, getPastQuizzes } from '../services/api';
import '../styles.css';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

// Define PropTypes for CreateQuizForm component
const createQuizFormPropTypes = {
  units: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      course: PropTypes.shape({
        name: PropTypes.string,
      }),
    })
  ).isRequired,
  loading: PropTypes.shape({
    units: PropTypes.bool,
  }).isRequired,
};

const CreateQuizForm = ({ units, loading }) => {
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

      // Build payload with properly mapped questions and options
      const payload = {
        title: values.title,
        description: values.description,
        method: creationMethod,
        unit: values.unit,
        createdAt: new Date().toISOString(), // Automatically add the current date
        questions: values.questions.map((question) => ({
          question: question.questionText, // Map questionText to question
          options: question.options.map((option) => ({
            optionText: option.optionText,
            isCorrect: option.isCorrect || false,
          })),
          answer:
            question.options.find((option) => option.isCorrect)?.optionText ||
            "Not provided",
        })),
      };

      if (creationMethod === 'upload') {
        const fileList = values.quizFile;
        if (fileList && fileList.length > 0) {
          const file = fileList[0].originFileObj;
          const text = await file.text();
          const quizData = JSON.parse(text);
          if (!quizData.title || !quizData.questions) {
            throw new Error('Invalid quiz file structure');
          }
          payload.quizData = quizData;
        } else {
          throw new Error('No file uploaded');
        }
      }

      await createQuiz(payload);
      message.success('Quiz created successfully!');
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
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
              {units.map((unit) => (
                <Option key={unit._id} value={unit._id} label={`${unit.name} (${unit.code})`}>
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
          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card key={field.key} title={`Question ${index + 1}`} style={{ marginBottom: 16 }}>
                    <Form.Item
                      name={[field.name, 'questionText']}
                      label="Question"
                      rules={[{ required: true, message: 'Missing question text' }]}
                    >
                      <Input placeholder="Enter question text" />
                    </Form.Item>

                    <Form.List name={[field.name, 'options']}>
                      {(optionFields, { add: addOption, remove: removeOption }) => (
                        <>
                          {optionFields.map((optionField, idx) => (
                            <Space key={optionField.key} align="baseline">
                              <Form.Item
                                name={[optionField.name, 'optionText']}
                                label={idx === 0 ? 'Options' : ''}
                                rules={[{ required: true, message: 'Missing option text' }]}
                              >
                                <Input placeholder={`Option ${idx + 1}`} />
                              </Form.Item>
                              <Form.Item
                                name={[optionField.name, 'isCorrect']}
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

                    {fields.length > 1 && (
                      <Button type="link" danger onClick={() => remove(field.name)}>
                        Remove Question
                      </Button>
                    )}
                  </Card>
                ))}

                {fields.length < 20 && (
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block>
                      Add Question
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
        ) : (
          <Form.Item
            name="quizFile"
            label="Quiz File"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
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

const QuizCard = ({ quiz }) => {
  const status = quiz.status || 'active';
  const unit = quiz.unit || 'No Unit'; // Use the mapped unit name
  const createdAt = new Date(quiz.createdAt).toLocaleDateString(); // Format the creation date

  return (
    <Badge.Ribbon text={status} color={status === 'active' ? 'green' : 'red'}>
      <Card
        title={quiz.title}
        actions={[
          <EyeOutlined key="preview" onClick={() => previewQuiz(quiz)} />,
          <DownloadOutlined key="download" onClick={() => exportQuiz(quiz)} />,
          <Popconfirm key="delete" title="Delete this quiz?" onConfirm={() => deleteQuiz(quiz._id)}>
            <DeleteOutlined />
          </Popconfirm>
        ]}
      >
        <div className="quiz-card-content">
          <Tag color="blue">{unit}</Tag> {/* Display the unit name */}
          <Tag color="geekblue">{quiz.course}</Tag>
          <div className="quiz-meta">
            <small>Year: {quiz.year}</small>
            <small>Semester: {quiz.semester}</small>
            <small>Created: {createdAt}</small> {/* Display the creation date */}
          </div>
          {quiz.description && <p className="quiz-description">{quiz.description}</p>}
        </div>
      </Card>
    </Badge.Ribbon>
  );
};

QuizCard.propTypes = {
  quiz: PropTypes.shape({
    status: PropTypes.string,
    title: PropTypes.string.isRequired,
    _id: PropTypes.string.isRequired,
    unit: PropTypes.string, // Updated to use unit instead of department
    course: PropTypes.string.isRequired,
    year: PropTypes.number.isRequired,
    semester: PropTypes.number.isRequired,
    description: PropTypes.string,
    createdAt: PropTypes.string.isRequired, // Added createdAt
  }).isRequired,
};

const QuizPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState({ units: true, quizzes: false });
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [filters, setFilters] = useState({
    department: null,
    course: null,
    year: null,
    semester: null,
    date: null, // Add date filter
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode] = useState(false);
  const lecturerId = localStorage.getItem('userId');
  const { token } = theme.useToken();

  // Fetch departments and units
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [departmentsData, unitsData] = await Promise.all([
          getDepartments(),
          getLecturerUnits(lecturerId),
        ]);
        setDepartments(departmentsData);
        setUnits(unitsData);
      } catch {
        message.error('Failed to fetch data');
      } finally {
        setLoading((prev) => ({ ...prev, units: false }));
      }
    };

    if (lecturerId) fetchData();
  }, [lecturerId]);

  // Fetch past quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading((prev) => ({ ...prev, quizzes: true }));
        const quizData = await getPastQuizzes(lecturerId);
  
        // Map unit ObjectId to unit name
        const validatedQuizData = quizData.map(quiz => {
          const unit = units.find(unit => unit._id === quiz.unit); // Find the unit by its ID
          return {
            ...quiz,
            unit: unit ? unit.name : 'No Unit', // Use the unit name if found, otherwise default to 'No Unit'
          };
        });
  
        setQuizzes(validatedQuizData || []);
      } catch {
        message.error('Failed to load quizzes');
      } finally {
        setLoading((prev) => ({ ...prev, quizzes: false }));
      }
    };
  
    if (lecturerId && units.length > 0) fetchQuizzes(); // Ensure units are fetched before mapping
  }, [lecturerId, units]);
  
  // Compute filter options
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

  // Enhanced filtering, search and sort
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuizzes, setSelectedQuizzes] = useState([]);
  const [sortBy, setSortBy] = useState('title_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const filteredQuizzes = useMemo(() => {
    return quizzes
      .filter((quiz) => {
        const matchesSearch =
          quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Filter by date
        const quizDate = new Date(quiz.createdAt).toDateString();
        const filterDate = filters.date ? new Date(filters.date).toDateString() : null;

        return (
          matchesSearch &&
          (!filters.unit || quiz.unit === filters.unit) &&
          (!filters.course || quiz.course === filters.course) &&
          (!filters.year || quiz.year === filters.year) &&
          (!filters.semester || quiz.semester === filters.semester) &&
          (!filters.date || quizDate === filterDate) // Filter by date
        );
      })
      .sort((a, b) => {
        if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
        if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
        if (sortBy === 'date_asc') return new Date(a.createdAt) - new Date(b.createdAt);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [quizzes, filters, searchQuery, sortBy]);

  // Bulk actions
  const handleBulkDelete = () => {
    // Implement API call for bulk delete
    setSelectedQuizzes([]);
    message.success('Selected quizzes deleted successfully');
  };

  const clearFilters = () => {
    setFilters({ department: null, course: null, year: null, semester: null, date: null });
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
          <div className="logo" style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)' }} />
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
              <div className="quiz-library">
                <div className="library-controls" style={{ marginBottom: 16 }}>
                  <Input.Search
                    placeholder="Search quizzes..."
                    prefix={<SearchOutlined />}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: 300 }}
                  />
                  <Space>
                    <Dropdown
                      menu={{
                        items: [
                          { key: 'title_asc', label: 'Title (A-Z)' },
                          { key: 'title_desc', label: 'Title (Z-A)' },
                          { key: 'date_asc', label: 'Date (Oldest)' },
                          { key: 'date_desc', label: 'Date (Newest)' },
                        ],
                        onClick: ({ key }) => setSortBy(key),
                      }}
                    >
                      <Button icon={<FilterOutlined />}>Sort By</Button>
                    </Dropdown>
                    <DatePicker
                      placeholder="Filter by date"
                      onChange={(date) => setFilters({ ...filters, date })}
                    />
                    <Collapse
                      ghost
                      items={[
                        {
                          key: '1',
                          header: 'Advanced Filters',
                          children: (
                            <>
                              {/* Insert advanced filter controls here */}
                            </>
                          ),
                        },
                      ]}
                    />
                    {selectedQuizzes.length > 0 && (
                      <Space>
                        <Button danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                          Delete ({selectedQuizzes.length})
                        </Button>
                        <Button icon={<DownloadOutlined />}>Export Selected</Button>
                      </Space>
                    )}
                  </Space>
                </div>
                {loading.quizzes ? (
                  <Row gutter={[16, 16]}>
                    {[...Array(6)].map((_, i) => (
                      <Col key={i} xs={24} sm={12} md={8} lg={6}>
                        <Skeleton active />
                      </Col>
                    ))}
                  </Row>
                ) : filteredQuizzes.length > 0 ? (
                  <>
                    <Row gutter={[16, 16]}>
                      {filteredQuizzes
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((quiz) => (
                          <Col key={quiz._id} xs={24} sm={12} md={8} lg={6}>
                            <Checkbox
                              checked={selectedQuizzes.includes(quiz._id)}
                              onChange={(e) =>
                                setSelectedQuizzes(
                                  e.target.checked
                                    ? [...selectedQuizzes, quiz._id]
                                    : selectedQuizzes.filter((id) => id !== quiz._id)
                                )
                              }
                            >
                              <QuizCard quiz={quiz} />
                            </Checkbox>
                          </Col>
                        ))}
                    </Row>
                    <div className="pagination" style={{ marginTop: 16, textAlign: 'center' }}>
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredQuizzes.length}
                        onChange={setCurrentPage}
                        showSizeChanger={false}
                      />
                    </div>
                  </>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span>
                        No quizzes found {searchQuery && `for "${searchQuery}"`}
                      </span>
                    }
                  >
                    <Button type="primary" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </Empty>
                )}
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

const exportQuiz = (quiz) => {
  const jsonString = JSON.stringify(quiz, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${quiz.title.replace(/ /g, '_')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const previewQuiz = (quiz) => {
  Modal.info({
    title: quiz.title,
    width: 800,
    content: (
      <div className="quiz-preview">
        <div className="quiz-meta">
          <Tag color="blue">{quiz.department}</Tag>
          <Tag color="geekblue">{quiz.course}</Tag>
          <span>Year: {quiz.year}</span>
          <span>Semester: {quiz.semester}</span>
          <span>Created: {new Date(quiz.createdAt).toLocaleDateString()}</span>
        </div>
        {quiz.description && <p>{quiz.description}</p>}
        <Divider>Questions</Divider>
        {quiz.questions.map((q, i) => (
          <div key={i} className="question">
            <h4>
              {i + 1}. {q.question}
            </h4>
            <ul>
              {q.options.map((opt, j) => (
                <li key={j} style={opt.isCorrect ? { color: 'green', fontWeight: 'bold' } : {}}>
                  {opt.optionText}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
  });
};

const deleteQuiz = (quizId) => {
  // Implement delete functionality (e.g., API call to delete quiz)

  message.success(`Quiz ${quizId} deleted successfully`);
};

export default QuizPage;