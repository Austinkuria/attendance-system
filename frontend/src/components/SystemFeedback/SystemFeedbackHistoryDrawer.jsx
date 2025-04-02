import { useState, useEffect, useContext } from 'react';
import { Drawer, Typography, List, Tag, Spin, Empty, Button, Tooltip, Alert } from 'antd';
import { SyncOutlined, LoginOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { getUserSystemFeedback } from '../../services/api';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { css } from '@emotion/css';
import moment from 'moment';

const { Title, Text } = Typography;

const useStyles = (themeColors) => ({
    drawer: css`
    .ant-drawer-content {
      background-color: ${themeColors.cardBg};
    }
    .ant-drawer-header {
      background-color: ${themeColors.cardBg};
      border-bottom: 1px solid ${themeColors.border};
    }
    .ant-drawer-title {
      color: ${themeColors.text};
    }
  `,
    item: css`
    background-color: ${themeColors.background};
    border-radius: 6px;
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid ${themeColors.border};
  `,
    title: css`
    color: ${themeColors.text};
    margin-bottom: 8px;
  `,
    date: css`
    color: ${themeColors.textSecondary || themeColors.text + '80'};
    font-size: 12px;
  `,
    description: css`
    color: ${themeColors.text};
    margin: 8px 0;
  `,
    refreshButton: css`
    margin-left: auto;
  `,
});

const statusColors = {
    'New': 'blue',
    'Under Review': 'gold',
    'In Progress': 'geekblue',
    'Resolved': 'green',
    'Closed': 'gray'
};

const SystemFeedbackHistoryDrawer = ({ visible, onClose }) => {
    const { themeColors } = useContext(ThemeContext);
    const { isAuthenticated } = useContext(AuthContext);
    const styles = useStyles(themeColors);

    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (visible && isAuthenticated) {
            fetchFeedback();
        }
    }, [visible, isAuthenticated]);

    const fetchFeedback = async () => {
        if (!isAuthenticated) {
            setError('Please log in to view your feedback history');
            setFeedback([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await getUserSystemFeedback();

            console.log('API Response:', response);

            const data = response?.data || response;

            if (Array.isArray(data)) {
                setFeedback(data);
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.feedback)) {
                    setFeedback(data.feedback);
                } else if (Array.isArray(data.items)) {
                    setFeedback(data.items);
                } else if (data.title || data.description || data.category) {
                    setFeedback([data]);
                } else if (Object.values(data).length > 0 && typeof Object.values(data)[0] === 'object') {
                    const feedbackArray = Object.values(data).filter(item =>
                        item && typeof item === 'object' && (item.title || item.description || item.category)
                    );
                    if (feedbackArray.length > 0) {
                        setFeedback(feedbackArray);
                    } else {
                        setFeedback([]);
                        setError('No feedback items found');
                    }
                } else {
                    setFeedback([]);
                    setError('No feedback data available');
                }
            } else {
                console.warn('Unexpected response type from server:', data);
                setFeedback([]);
                setError('No feedback data available');
            }
        } catch (error) {
            console.error('Error fetching feedback history:', error);

            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                setError('You need to be logged in to view your feedback history');
            } else {
                setError('Failed to load feedback history. Please try again later.');
            }

            setFeedback([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: themeColors.text }}>Your Feedback History</Title>
                    <Button
                        type="text"
                        icon={<SyncOutlined />}
                        onClick={fetchFeedback}
                        loading={loading}
                        className={styles.refreshButton}
                        disabled={!isAuthenticated}
                    />
                </div>
            }
            placement="right"
            onClose={onClose}
            open={visible}
            width={380}
            className={styles.drawer}
        >
            <Spin spinning={loading}>
                {!isAuthenticated ? (
                    <Alert
                        message="Authentication Required"
                        description="Please log in to view your feedback history."
                        type="info"
                        showIcon
                        icon={<LoginOutlined />}
                    />
                ) : error ? (
                    <Empty description={error} />
                ) : feedback.length === 0 ? (
                    <Empty description="No feedback submitted yet" />
                ) : (
                    <List
                        dataSource={feedback}
                        renderItem={(item) => (
                            <List.Item className={styles.item}>
                                <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Title level={5} className={styles.title}>{item.title || 'No Title'}</Title>
                                        <Tag color={statusColors[item.status] || 'default'}>{item.status || 'Unknown'}</Tag>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                        <Tag>{item.category || 'Other'}</Tag>
                                        <Tag color={item.severity > 3 ? 'red' : item.severity > 2 ? 'orange' : 'green'}>
                                            Severity: {item.severity || 0}/5
                                        </Tag>
                                    </div>
                                    <Tooltip title={item.description || 'No description provided'}>
                                        <Text className={styles.description}>
                                            {item.description
                                                ? (item.description.length > 100
                                                    ? `${item.description.substring(0, 100)}...`
                                                    : item.description)
                                                : 'No description provided'}
                                        </Text>
                                    </Tooltip>
                                    <Text className={styles.date}>
                                        Submitted: {item.createdAt
                                            ? moment(item.createdAt).format('YYYY-MM-DD HH:mm')
                                            : 'Unknown date'}
                                    </Text>
                                </div>
                            </List.Item>
                        )}
                    />
                )}
            </Spin>
        </Drawer>
    );
};

SystemFeedbackHistoryDrawer.propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default SystemFeedbackHistoryDrawer;
