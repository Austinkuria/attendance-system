import { useState, useEffect, useContext } from 'react';
import { Drawer, Typography, List, Tag, Spin, Empty, Button, Tooltip, Alert, Tabs } from 'antd';
import { SyncOutlined, LoginOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { getUserSystemFeedback } from '../../services/api';
import { getAnonymousFeedback } from '../../utils/feedbackUtils';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { css } from '@emotion/css';
import moment from 'moment';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

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
    const [localFeedback, setLocalFeedback] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (visible) {
            loadLocalFeedback();
            if (isAuthenticated) {
                fetchFeedback();
            }
        }
    }, [visible, isAuthenticated]);

    const loadLocalFeedback = () => {
        try {
            const anonymousFeedback = getAnonymousFeedback();
            setLocalFeedback(anonymousFeedback);
        } catch (error) {
            console.error('Error loading local feedback:', error);
            setLocalFeedback([]);
        }
    };

    const fetchFeedback = async () => {
        if (!isAuthenticated) {
            setError('Please log in to view your feedback history');
            setFeedback([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Add a timeout to handle potential hanging requests
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 15000)
            );

            // Race between the actual request and the timeout
            const response = await Promise.race([
                getUserSystemFeedback(),
                timeoutPromise
            ]);

            console.log('API Response:', response);

            if (Array.isArray(response)) {
                setFeedback(response);
            } else if (response && response.authRequired) {
                setError(response.message || 'Please log in to view your feedback history');
                setFeedback([]);
            } else if (response && typeof response === 'object') {
                if (Array.isArray(response.data)) {
                    setFeedback(response.data);
                } else if (Array.isArray(response.feedback)) {
                    setFeedback(response.feedback);
                } else if (Array.isArray(response.items)) {
                    setFeedback(response.items);
                } else if (response.title || response.description || response.category) {
                    setFeedback([response]);
                } else {
                    const possibleArrays = Object.values(response).filter(value =>
                        Array.isArray(value) && value.length > 0
                    );

                    if (possibleArrays.length > 0) {
                        setFeedback(possibleArrays[0]);
                    } else {
                        setFeedback([]);
                    }
                }
            } else {
                setFeedback([]);
            }
        } catch (error) {
            console.error('Error fetching feedback history:', error);

            // Improve error message for network issues
            if (error.message && (error.message.includes('Network') || error.message.includes('CORS'))) {
                setError('Network issue when retrieving feedback. Your browser might be blocking cross-origin requests.');
            } else if (error.message === 'Request timed out') {
                setError('Request timed out. The server might be unavailable or slow to respond.');
            } else if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                setError('You need to be logged in to view your feedback history');
            } else {
                setError('Failed to load feedback history. Please try again later.');
            }

            setFeedback([]);
        } finally {
            setLoading(false);
        }
    };

    const renderFeedbackItem = (item) => (
        <List.Item className={styles.item}>
            <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5} className={styles.title}>{item.title || 'No Title'}</Title>
                    <Tag color={statusColors[item.status] || 'default'}>{item.status || 'Submitted'}</Tag>
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
                        : item.localTimestamp
                            ? moment(item.localTimestamp).format('YYYY-MM-DD HH:mm')
                            : 'Unknown date'}
                </Text>
            </div>
        </List.Item>
    );

    return (
        <Drawer
            title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: themeColors.text }}>Your Feedback History</Title>
                    {isAuthenticated && (
                        <Button
                            type="text"
                            icon={<SyncOutlined />}
                            onClick={fetchFeedback}
                            loading={loading}
                            className={styles.refreshButton}
                        />
                    )}
                </div>
            }
            placement="right"
            onClose={onClose}
            open={visible}
            width={380}
            className={styles.drawer}
        >
            <Spin spinning={loading}>
                {!isAuthenticated && localFeedback.length === 0 ? (
                    <Alert
                        message="Note about anonymous feedback"
                        description="Your anonymous feedback is stored locally in your browser. To maintain a permanent history and receive responses, please log in."
                        type="info"
                        showIcon
                        icon={<LoginOutlined />}
                    />
                ) : (
                    <Tabs defaultActiveKey={isAuthenticated ? "account" : "local"}>
                        {isAuthenticated && (
                            <TabPane tab="Account Feedback" key="account">
                                {error ? (
                                    <Empty description={error} />
                                ) : feedback.length === 0 ? (
                                    <Empty description="No feedback submitted with your account yet" />
                                ) : (
                                    <List
                                        dataSource={feedback}
                                        renderItem={renderFeedbackItem}
                                    />
                                )}
                            </TabPane>
                        )}

                        <TabPane tab="Local Feedback" key="local">
                            {localFeedback.length === 0 ? (
                                <Empty description="No local feedback history" />
                            ) : (
                                <List
                                    dataSource={localFeedback}
                                    renderItem={renderFeedbackItem}
                                />
                            )}
                        </TabPane>
                    </Tabs>
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
