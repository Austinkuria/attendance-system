import { useState, useEffect, useContext } from 'react';
// Remove the unused Badge import
import { Drawer, List, Tag, Typography, Spin, Empty, Tooltip, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { getUserSystemFeedback } from '../../services/api';
import { ThemeContext } from '../../context/ThemeContext';
import PropTypes from 'prop-types';
import moment from 'moment';
import { css } from '@emotion/css';

const { Text, Title } = Typography;

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
    const styles = useStyles(themeColors);

    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchFeedback();
        }
    }, [visible]);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const data = await getUserSystemFeedback();
            setFeedback(data);
        } catch (error) {
            console.error('Error fetching feedback history:', error);
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
                {feedback.length === 0 ? (
                    <Empty description="No feedback submitted yet" />
                ) : (
                    <List
                        dataSource={feedback}
                        renderItem={(item) => (
                            <List.Item className={styles.item}>
                                <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Title level={5} className={styles.title}>{item.title}</Title>
                                        <Tag color={statusColors[item.status]}>{item.status}</Tag>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                        <Tag>{item.category}</Tag>
                                        <Tag color={item.severity > 3 ? 'red' : item.severity > 2 ? 'orange' : 'green'}>
                                            Severity: {item.severity}/5
                                        </Tag>
                                    </div>
                                    <Tooltip title={item.description}>
                                        <Text className={styles.description}>
                                            {item.description.length > 100
                                                ? `${item.description.substring(0, 100)}...`
                                                : item.description}
                                        </Text>
                                    </Tooltip>
                                    <Text className={styles.date}>
                                        Submitted: {moment(item.createdAt).format('YYYY-MM-DD HH:mm')}
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
