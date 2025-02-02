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
  // Grid
} from 'antd';
import {
  DashboardOutlined,
  FileAddOutlined,
  FolderOutlined,
  BarChartOutlined,
  UploadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
// const { useBreakpoint } = Grid;
const { Option } = Select;

const QuizPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedYear, setSelectedYear] = useState();
  const [selectedSemester, setSelectedSemester] = useState();
  const [selectedCourse, setSelectedCourse] = useState();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quizes, setQuizes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { token } = theme.useToken();

  const filteredQuizes = useMemo(() => quizes.filter(q => 
    q.year === selectedYear &&
    q.semester === selectedSemester &&
    q.course === selectedCourse
  ), [quizes, selectedYear, selectedSemester, selectedCourse]);

  useEffect(() => {
    fetchQuizes();
  }, []);

  const fetchQuizes = async () => {
    try {
      setLoading(true);
      // API call to fetch quizes
      setQuizes([]);
    } catch {
      message.error('Failed to fetch quizes');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'create', icon: <FileAddOutlined />, label: 'Create Quiz' },
    { key: 'library', icon: <FolderOutlined />, label: 'Quiz Library' },
    { key: 'results', icon: <BarChartOutlined />, label: 'Results' },
  ];

  const handleUpload = async (file) => {
    try {
      // Handle file upload logic
      message.success(`${file.name} uploaded successfully`);
    } catch {
      message.error('Upload failed');
    }
  };

  const renderContent = () => {
    if (loading) return <Skeleton active />;

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="responsive-grid">
            <Card title="Recent Quizes">
              <Table
                dataSource={filteredQuizes}
                columns={[
                  { title: 'Title', dataIndex: 'title' },
                  { title: 'Course', dataIndex: 'course' },
                  { title: 'Status', dataIndex: 'status' },
                ]}
              />
            </Card>
            <Card title="Quick Actions">
              <Button type="primary" onClick={() => setActiveTab('create')}>
                Create New Quiz
              </Button>
              <Button icon={<UploadOutlined />} onClick={() => document.getElementById('upload')?.click()}>
                Upload Quiz
              </Button>
            </Card>
          </div>
        );

      case 'create':
        return (
          <Card title="Create New Quiz">
            <Form layout="vertical">
              <Form.Item label="Quiz Title" required>
                <Input placeholder="Enter quiz title" />
              </Form.Item>
              <Form.Item label="Quiz Type">
                <Select>
                  <Option value="multiple">Multiple Choice</Option>
                  <Option value="essay">Essay</Option>
                  <Option value="mixed">Mixed</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Time Limit (minutes)">
                <Input type="number" />
              </Form.Item>
              <Form.List name="questions">
                {(fields, { add }) => (
                  <>
                    {fields.map(field => (
                      <div key={field.key}>
                        {/* Question fields */}
                      </div>
                    ))}
                    <Button onClick={() => add()}>Add Question</Button>
                  </>
                )}
              </Form.List>
            </Form>
          </Card>
        );

      case 'library':
        return (
          <Table
            dataSource={quizes}
            columns={[
              { title: 'Title', dataIndex: 'title' },
              { title: 'Course', dataIndex: 'course' },
              { title: 'Year', dataIndex: 'year' },
              { title: 'Semester', dataIndex: 'semester' },
              {
                title: 'Actions',
                render: () => (
                  <>
                    <Button size="small">Edit</Button>
                    <Button danger size="small">Delete</Button>
                  </>
                )
              }
            ]}
          />
        );

      case 'results':
        return (
          <Card title="Student Results">
            <Table
              expandable={{
                expandedRowRender: record => <p>{record.description}</p>,
              }}
              columns={[
                { title: 'Student', dataIndex: 'name' },
                { title: 'Score', dataIndex: 'score' },
                { title: 'Average', dataIndex: 'average' },
              ]}
            />
          </Card>
        );
    }
  };

  return (
    <App theme={{ algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          theme={darkMode ? 'dark' : 'light'}
        >
          <div className="logo" style={{ height: 64, background: token.colorBgContainer }} />
          <Menu
            theme={darkMode ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            onSelect={({ key }) => setActiveTab(key)}
          />
        </Sider>

        <Layout>
          <Header style={{ padding: 0, background: token.colorBgContainer }}>
            <div className="flex-between" style={{ padding: '0 24px' }}>
              <Button
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
              <div className="flex gap-md">
                <Switch
                  checkedChildren="Dark"
                  unCheckedChildren="Light"
                  checked={darkMode}
                  onChange={setDarkMode}
                />
                <Button danger>
                  Logout
                </Button>
              </div>
            </div>
          </Header>

          <Content style={{ margin: '24px 16px' }}>
            <div className="flex gap-md mb-lg">
              <Select
                placeholder="Select Year"
                onChange={setSelectedYear}
                options={[1, 2, 3, 4].map(year => ({ label: `Year ${year}`, value: year }))}
              />
              <Select
                placeholder="Select Semester"
                onChange={setSelectedSemester}
                options={[1, 2, 3].map(sem => ({ label: `Semester ${sem}`, value: sem }))}
              />
              <Select
                placeholder="Select Course"
                onChange={setSelectedCourse}
                options={['Mathematics', 'Physics', 'Chemistry'].map(c => ({ label: c, value: c }))}
              />
            </div>

            {renderContent()}
          </Content>
        </Layout>
      </Layout>

      <Upload
        id="upload"
        customRequest={({ file }) => handleUpload(file)}
        showUploadList={false}
        accept=".csv,.json"
      >
        <div />
      </Upload>
    </App>
  );
};

export default QuizPage;