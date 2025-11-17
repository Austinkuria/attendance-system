import { useState, useContext } from 'react';
import {
    Card,
    Table,
    Button,
    Input,
    Space,
    Tag,
    Modal,
    Form,
    message,
    Popconfirm,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '../../hooks/useDepartments';
import { ThemeContext } from '../../context/ThemeContext';
import { getButtonStyles, getModalButtonProps } from '../../styles/buttonStyles';
import './Departments.css';

const { TextArea } = Input;

const Departments = () => {
    const { themeColors } = useContext(ThemeContext);
    const buttonStyles = getButtonStyles(themeColors);
    const modalButtonProps = getModalButtonProps(themeColors);

    const [searchText, setSearchText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [form] = Form.useForm();

    // Fetch departments
    const { data, isLoading, refetch } = useDepartments();
    const departments = data?.departments || [];

    // Mutations
    const createMutation = useCreateDepartment();
    const updateMutation = useUpdateDepartment();
    const deleteMutation = useDeleteDepartment();

    // Table columns
    const columns = [
        {
            title: 'Department Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text) => <span className="department-name">{text}</span>,
        },
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            width: 100,
            render: (text) => text || <Tag color="default">N/A</Tag>,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text) => text || <span style={{ color: '#999' }}>No description</span>,
        },
        {
            title: 'Courses',
            dataIndex: 'courses',
            key: 'courses',
            width: 100,
            align: 'center',
            render: (courses) => (
                <Tag color="blue">{courses?.length || 0}</Tag>
            ),
        },
        {
            title: 'Students',
            dataIndex: 'studentCount',
            key: 'studentCount',
            width: 100,
            align: 'center',
            render: (count) => (
                <Tag color="green">{count || 0}</Tag>
            ),
        },
        {
            title: 'Lecturers',
            dataIndex: 'lecturerCount',
            key: 'lecturerCount',
            width: 100,
            align: 'center',
            render: (count) => (
                <Tag color="purple">{count || 0}</Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete Department"
                        description="Are you sure you want to delete this department? This action cannot be undone."
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete">
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Filter departments by search
    const filteredDepartments = departments.filter((dept) =>
        dept.name.toLowerCase().includes(searchText.toLowerCase()) ||
        dept.code?.toLowerCase().includes(searchText.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchText.toLowerCase())
    );

    // Handlers
    const handleCreate = () => {
        setEditingDepartment(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (department) => {
        setEditingDepartment(department);
        form.setFieldsValue({
            name: department.name,
            code: department.code,
            description: department.description,
        });
        setIsModalOpen(true);
    };

    const handleView = (department) => {
        Modal.info({
            title: department.name,
            width: 600,
            content: (
                <div className="department-details">
                    <p><strong>Code:</strong> {department.code || 'N/A'}</p>
                    <p><strong>Description:</strong> {department.description || 'No description'}</p>
                    <p><strong>Total Courses:</strong> {department.courses?.length || 0}</p>
                    <p><strong>Total Students:</strong> {department.studentCount || 0}</p>
                    <p><strong>Total Lecturers:</strong> {department.lecturerCount || 0}</p>
                    <p><strong>Created:</strong> {new Date(department.createdAt).toLocaleDateString()}</p>
                </div>
            ),
        });
    };

    const handleDelete = async (id) => {
        try {
            await deleteMutation.mutateAsync(id);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingDepartment) {
                await updateMutation.mutateAsync({
                    id: editingDepartment._id,
                    data: values,
                });
            } else {
                await createMutation.mutateAsync(values);
            }
            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            // Error handled by mutation
        }
    };

    return (
        <div className="departments-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2>Department Management</h2>
                    <p>Manage all departments in the system</p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                    size="large"
                    style={buttonStyles.primary}
                >
                    Create Department
                </Button>
            </div>

            {/* Filters */}
            <Card className="filters-card">
                <Space size="middle" style={{ width: '100%' }}>
                    <Input
                        placeholder="Search departments..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                    />
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetch()}
                    >
                        Refresh
                    </Button>
                    <Tag color="blue">Total: {filteredDepartments.length}</Tag>
                </Space>
            </Card>

            {/* Table */}
            <Card className="table-card">
                <Table
                    columns={columns}
                    dataSource={filteredDepartments}
                    loading={isLoading}
                    rowKey="_id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} departments`,
                    }}
                />
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                title={editingDepartment ? 'Edit Department' : 'Create New Department'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 24 }}
                >
                    <Form.Item
                        label="Department Name"
                        name="name"
                        rules={[
                            { required: true, message: 'Please enter department name' },
                            { min: 3, message: 'Name must be at least 3 characters' },
                        ]}
                    >
                        <Input placeholder="e.g., Computer Science" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Department Code"
                        name="code"
                        rules={[
                            { pattern: /^[A-Z0-9]+$/, message: 'Code must be uppercase letters and numbers only' },
                        ]}
                    >
                        <Input placeholder="e.g., CS" size="large" maxLength={10} />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                    >
                        <TextArea
                            placeholder="Brief description of the department..."
                            rows={4}
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => setIsModalOpen(false)}
                                style={buttonStyles.cancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={createMutation.isLoading || updateMutation.isLoading}
                                style={buttonStyles.primary}
                            >
                                {editingDepartment ? 'Update' : 'Create'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Departments;
