import { useState, useEffect, useContext } from 'react';
import { Table, Tag, Card, Typography, Select, Input, Button, Space, Spin, Badge, message, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { getAllSystemFeedback, updateSystemFeedbackStatus } from '../../services/api';
import { ThemeContext } from '../../context/ThemeContext';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const useStyles = (themeColors) => ({
    container: css`
    padding: 24px;
    background: ${themeColors.background};
    min-height: 100vh;
  `,
    header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  `,
    title: css`
    color: ${themeColors.text};
  `,
    filters: css`
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  `,
    tableCard: css`
    background: ${themeColors.cardBg};
    .ant-table-thead > tr > th {
      background: ${themeColors.cardBg};
      color: ${themeColors.text};
    }
    .ant-table-tbody > tr > td {
      background: ${themeColors.cardBg};
      color: ${themeColors.text};
    }
    .ant-table-tbody > tr:hover > td {
      background: ${themeColors.cardBg}90;
    }
  `,
    statusSelect: css`
    min-width: 140px;
  `,
    description: css`
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
    backButton: css`
    margin-bottom: 16px;
  `,
    filterWrapper: css`
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  `,
});

const statusColors = {
    'New': 'blue',
    'Under Review': 'gold',
    'In Progress': 'geekblue',
    'Resolved': 'green',
    'Closed': 'gray'
};

const SystemFeedbackList = () => {
    const { themeColors } = useContext(ThemeContext);
    const navigate = useNavigate();
    const styles = useStyles(themeColors);

    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: null,
        category: null,
        searchText: '',
    });
    const [statusLoading, setStatusLoading] = useState({});

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const data = await getAllSystemFeedback();
            setFeedback(data);
        } catch (error) {
            console.error('Error fetching system feedback:', error);
            message.error('Failed to load system feedback');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (feedbackId, newStatus) => {
        try {
            setStatusLoading({ ...statusLoading, [feedbackId]: true });
            await updateSystemFeedbackStatus(feedbackId, newStatus);

            // Update local state
            setFeedback(feedback.map(item => {
                if (item._id === feedbackId) {
                    return { ...item, status: newStatus };
                }
                return item;
            }));

            message.success(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating feedback status:', error);
            message.error('Failed to update status');
        } finally {
            setStatusLoading({ ...statusLoading, [feedbackId]: false });
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const resetFilters = () => {
        setFilters({ status: null, category: null, searchText: '' });
    };

    const filteredFeedback = feedback.filter(item => {
        const matchesStatus = !filters.status || item.status === filters.status;
        const matchesCategory = !filters.category || item.category === filters.category;
        const matchesSearch = !filters.searchText ||
            item.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
            item.description.toLowerCase().includes(filters.searchText.toLowerCase());

        return matchesStatus && matchesCategory && matchesSearch;
    });

    // Get unique categories and statuses
    const categories = [...new Set(feedback.map(item => item.category))];
    const statuses = ['New', 'Under Review', 'In Progress', 'Resolved', 'Closed'];

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text) => <Text style={{ color: themeColors.text }}>{text}</Text>,
            sorter: (a, b) => a.title.localeCompare(b.title),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category) => {
                let icon;
                switch (category) {
                    case 'Bug': icon = <Badge status="error" />; break;
                    case 'Feature Request': icon = <Badge status="processing" />; break;
                    case 'UI Improvement': icon = <Badge status="warning" />; break;
                    default: icon = <Badge status="default" />;
                }
                return (
                    <Space>
                        {icon}
                        <Text style={{ color: themeColors.text }}>{category}</Text>
                    </Space>
                );
            },
            sorter: (a, b) => a.category.localeCompare(b.category),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => (
                <Tooltip title={text}>
                    <Text className={styles.description} style={{ color: themeColors.text }}>
                        {text}
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: 'Severity',
            dataIndex: 'severity',
            key: 'severity',
            render: (severity) => {
                let color = 'green';
                if (severity > 3) color = 'red';
                else if (severity > 2) color = 'orange';
                return <Tag color={color}>{severity}/5</Tag>;
            },
            sorter: (a, b) => a.severity - b.severity,
        },
        {
            title: 'Submitted By',
            dataIndex: 'userId',
            key: 'userId',
            render: (user) => (
                <Text style={{ color: themeColors.text }}>
                    {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : 'Unknown User'}
                </Text>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'userRole',
            key: 'userRole',
            render: (role) => <Tag>{role || 'Unknown'}</Tag>,
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => <Text style={{ color: themeColors.text }}>{moment(date).format('YYYY-MM-DD HH:mm')}</Text>,
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            defaultSortOrder: 'descend',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    className={styles.statusSelect}
                    defaultValue={status}
                    onChange={(value) => handleStatusChange(record._id, value)}
                    loading={statusLoading[record._id]}
                    style={{ color: themeColors.text }}
                >
                    {statuses.map(s => (
                        <Option key={s} value={s}>
                            <Tag color={statusColors[s]}>{s}</Tag>
                        </Option>
                    ))}
                </Select>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<FileTextOutlined style={{ color: themeColors.primary }} />}
                            onClick={() => console.log('View details', record._id)}
                        />
                    </Tooltip>
                    <Tooltip title="Mark as Resolved">
                        <Button
                            type="text"
                            icon={<CheckCircleOutlined style={{ color: themeColors.success || 'green' }} />}
                            onClick={() => handleStatusChange(record._id, 'Resolved')}
                            disabled={record.status === 'Resolved' || record.status === 'Closed'}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <Button
                type="primary"
                className={styles.backButton}
                onClick={() => navigate('/admin')}
            >
                Back to Dashboard
            </Button>

            <div className={styles.header}>
                <Title level={2} className={styles.title}>System Feedback Management</Title>
                <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={fetchFeedback}
                    loading={loading}
                >
                    Refresh
                </Button>
            </div>

            <div className={styles.filterWrapper}>
                <Select
                    placeholder="Filter by Status"
                    style={{ width: 200 }}
                    allowClear
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                >
                    {statuses.map(status => (
                        <Option key={status} value={status}>
                            <Tag color={statusColors[status]}>{status}</Tag>
                        </Option>
                    ))}
                </Select>

                <Select
                    placeholder="Filter by Category"
                    style={{ width: 200 }}
                    allowClear
                    value={filters.category}
                    onChange={(value) => handleFilterChange('category', value)}
                >
                    {categories.map(category => (
                        <Option key={category} value={category}>{category}</Option>
                    ))}
                </Select>

                <Input
                    placeholder="Search by title or description"
                    style={{ width: 300 }}
                    value={filters.searchText}
                    onChange={(e) => handleFilterChange('searchText', e.target.value)}
                    prefix={<SearchOutlined />}
                    allowClear
                />

                <Button onClick={resetFilters}>Reset Filters</Button>
            </div>

            <Card className={styles.tableCard}>
                <Spin spinning={loading}>
                    <Table
                        dataSource={filteredFeedback}
                        columns={columns}
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                    />
                </Spin>
            </Card>
        </div>
    );
};

export default SystemFeedbackList;
