import { Row, Col, Card, Statistic, Table, Tag, Spin, Empty } from 'antd';
import {
    UserOutlined,
    TeamOutlined,
    BankOutlined,
    BookOutlined,
    RiseOutlined,
    FallOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getSystemStats } from '../../services/superAdminAPI';
import './Dashboard.css';

const Dashboard = () => {
    // Fetch system statistics
    const { data: stats, isLoading } = useQuery({
        queryKey: ['systemStats'],
        queryFn: getSystemStats,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Stats cards data
    const statsCards = [
        {
            title: 'Total Departments',
            value: stats?.departments || 0,
            icon: <BankOutlined />,
            color: '#667eea',
            prefix: null,
        },
        {
            title: 'Department Admins',
            value: stats?.departmentAdmins || 0,
            icon: <TeamOutlined />,
            color: '#764ba2',
            prefix: null,
        },
        {
            title: 'Total Lecturers',
            value: stats?.lecturers || 0,
            icon: <UserOutlined />,
            color: '#f093fb',
            prefix: null,
        },
        {
            title: 'Total Students',
            value: stats?.students || 0,
            icon: <UserOutlined />,
            color: '#4facfe',
            prefix: null,
        },
        {
            title: 'Total Courses',
            value: stats?.courses || 0,
            icon: <BookOutlined />,
            color: '#43e97b',
            prefix: null,
        },
        {
            title: 'Total Units',
            value: stats?.units || 0,
            icon: <BookOutlined />,
            color: '#fa709a',
            prefix: null,
        },
        {
            title: 'Active Sessions',
            value: stats?.activeSessions || 0,
            icon: <RiseOutlined />,
            color: '#30cfd0',
            prefix: null,
        },
        {
            title: 'Attendance Rate',
            value: stats?.attendanceRate || 0,
            icon: <RiseOutlined />,
            color: '#a8edea',
            suffix: '%',
        },
    ];

    // Recent activity columns
    const activityColumns = [
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (text) => <span className="activity-action">{text}</span>,
        },
        {
            title: 'User',
            dataIndex: 'user',
            key: 'user',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                const colors = {
                    create: 'green',
                    update: 'blue',
                    delete: 'red',
                    login: 'purple',
                };
                return <Tag color={colors[type] || 'default'}>{type?.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
        },
    ];

    // Mock recent activity data (replace with real data from API)
    const recentActivity = stats?.recentActivity || [
        {
            key: '1',
            action: 'Created new department',
            user: 'Super Admin',
            type: 'create',
            time: '2 minutes ago',
        },
        {
            key: '2',
            action: 'Updated department admin',
            user: 'Super Admin',
            type: 'update',
            time: '15 minutes ago',
        },
        {
            key: '3',
            action: 'Student login',
            user: 'Amina Kamau',
            type: 'login',
            time: '1 hour ago',
        },
    ];

    if (isLoading) {
        return (
            <div className="loading-container">
                <Spin size="large" tip="Loading dashboard..." />
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Welcome Section */}
            <div className="welcome-section">
                <h1>Welcome back, Super Admin! 👋</h1>
                <p>Here's what's happening in your system today.</p>
            </div>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="stats-section">
                {statsCards.map((stat, index) => (
                    <Col xs={24} sm={12} md={12} lg={6} key={index}>
                        <Card
                            className="stat-card"
                            style={{ borderTop: `4px solid ${stat.color}` }}
                            hoverable
                        >
                            <div className="stat-card-content">
                                <div className="stat-icon" style={{ background: stat.color }}>
                                    {stat.icon}
                                </div>
                                <div className="stat-details">
                                    <Statistic
                                        title={stat.title}
                                        value={stat.value}
                                        prefix={stat.prefix}
                                        suffix={stat.suffix}
                                        valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
                                    />
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Charts and Activity */}
            <Row gutter={[16, 16]} className="content-section">
                {/* Recent Activity */}
                <Col xs={24} lg={24}>
                    <Card
                        title="Recent Activity"
                        className="activity-card"
                        extra={<a href="/super-admin/logs">View All</a>}
                    >
                        <Table
                            columns={activityColumns}
                            dataSource={recentActivity}
                            pagination={false}
                            locale={{
                                emptyText: (
                                    <Empty
                                        description="No recent activity"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                ),
                            }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
