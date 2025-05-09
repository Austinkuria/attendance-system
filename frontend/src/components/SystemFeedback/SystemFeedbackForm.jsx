import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Button, Select, Rate, Upload, Modal, message, Typography, Checkbox, Radio, Space, Tooltip } from 'antd';
import { UploadOutlined, BugOutlined, BulbOutlined, ToolOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { submitSystemFeedback } from '../../services/api';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { saveAnonymousFeedback } from '../../utils/feedbackUtils';
import { css } from '@emotion/css';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const useStyles = (themeColors) => ({
    form: css`
    width: 100%;
    max-width: 800px; /* Increased from 600px for larger screens */
    margin: 0 auto;
    padding: 24px;
    border-radius: 8px;
    background: ${themeColors.cardBg};
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    
    @media (min-width: 1200px) {
      max-width: 900px; /* Even wider on very large screens */
      padding: 30px;
    }
    
    @media (max-width: 992px) {
      max-width: 700px;
    }
    
    @media (max-width: 768px) {
      padding: 16px;
      margin: 0;
      max-width: none;
    }
    
    @media (max-width: 480px) {
      padding: 12px;
      border-radius: 4px;
    }
  `,
    title: css`
    color: ${themeColors.text};
    text-align: center;
    margin-bottom: 20px;
    font-size: 24px;
    
    @media (max-width: 768px) {
      font-size: 20px;
      margin-bottom: 16px;
    }
    
    @media (max-width: 480px) {
      font-size: 18px;
      margin-bottom: 12px;
    }
  `,
    submitButton: css`
    margin-top: 16px;
    width: 100%;
  `,
    rateLabel: css`
    color: ${themeColors.text};
    margin-right: 8px;
    font-size: 14px;
    
    @media (max-width: 480px) {
      display: block;
      margin-top: 4px;
      font-size: 12px;
    }
  `,
    divider: css`
    margin: 20px 0 16px;
    border-color: ${themeColors.text}30;
    
    @media (max-width: 480px) {
      margin: 12px 0;
    }
  `,
    uploadBtn: css`
    width: 100%;
    border-color: ${themeColors.primary};
    color: ${themeColors.primary};
    height: auto;
    padding: 6px;
    white-space: normal;
    line-height: 1.2;
    display: flex;
    flex-direction: column;
    align-items: center;
    &:hover {
      border-color: ${themeColors.primary}CC;
      color: ${themeColors.primary}CC;
    }
  `,
    uploadIcon: css`
    margin-bottom: 4px;
    font-size: 16px;
  `,
    uploadText: css`
    font-size: 11px;
    text-align: center;
  `,
    uploadWrapper: css`
    .ant-upload-list-picture-card .ant-upload-list-item,
    .ant-upload-select-picture-card {
      width: 100%;
      max-width: 150px;
      height: auto;
      min-height: 104px;
      margin-right: 8px;
      
      @media (max-width: 480px) {
        max-width: 100px;
        min-height: 90px;
      }
    }
  `,
    imagePreview: css`
    max-width: 100%;
    max-height: 200px;
    margin-top: 16px;
    border-radius: 4px;
  `,
    description: css`
    color: ${themeColors.text}CC;
    margin-bottom: 20px;
    text-align: center;
    font-size: 14px;
    
    @media (max-width: 768px) {
      margin-bottom: 16px;
    }
    
    @media (max-width: 480px) {
      font-size: 12px;
      margin-bottom: 12px;
    }
  `,
    categoryIcon: css`
    margin-right: 8px;
  `,
    formLabel: css`
    color: ${themeColors.text};
    font-size: 14px;
    
    @media (max-width: 480px) {
      font-size: 13px;
    }
  `,
    formItem: css`
    margin-bottom: 16px;
    
    @media (max-width: 480px) {
      margin-bottom: 12px;
    }
  `,
    modalImage: css`
    width: 100%;
    height: auto;
  `,
    formContainer: css`
    width: 100%;
    display: flex;
    flex-direction: column;
  `,
    twoColumnLayout: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 0;
    }
  `
});

const SystemFeedbackForm = ({ onClose }) => {
    const { themeColors } = useContext(ThemeContext);
    const { isAuthenticated } = useContext(AuthContext);
    const styles = useStyles(themeColors);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [anonymousOption, setAnonymousOption] = useState('local'); // 'local' or 'server'
    const [anonymousSubmitType, setAnonymousSubmitType] = useState('local'); // 'local' or 'server'

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImagePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
        }
        return isImage && isLt2M;
    };

    const handleChange = async ({ fileList }) => {
        if (fileList.length > 0 && fileList[0].originFileObj) {
            const base64 = await getBase64(fileList[0].originFileObj);
            setImageUrl(base64);
        } else {
            setImageUrl('');
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            console.log('Submitting feedback with values:', values);

            const feedbackData = {
                title: values.title,
                category: values.category,
                description: values.description,
                severity: values.severity,
                screenshot: imageUrl // Include the image if provided
            };

            // If not authenticated or choosing to submit anonymously
            if (!isAuthenticated || isAnonymous) {
                // Use anonymousSubmitType for non-authenticated users and anonymousOption for authenticated users
                const serverSubmit = isAuthenticated ? (anonymousOption === 'server') : (anonymousSubmitType === 'server');

                // Save feedback locally and optionally to server
                const result = await saveAnonymousFeedback(feedbackData, serverSubmit);

                if (result.success) {
                    if (serverSubmit && result.serverSubmitted) {
                        message.success('Anonymous feedback submitted to developers successfully!');
                    } else if (serverSubmit && !result.serverSubmitted) {
                        if (result.error && result.error.includes('authentication')) {
                            // Specific message for auth errors
                            message.warning('Server requires authentication for anonymous submissions. Your feedback has been saved locally only.');
                        } else {
                            message.warning('Feedback saved locally but server submission failed.');
                        }
                    } else {
                        message.success('Anonymous feedback saved locally.');
                    }

                    form.resetFields();
                    setImageUrl('');
                    if (onClose) onClose();
                    return;
                } else {
                    message.error('Failed to save anonymous feedback');
                    return;
                }
            }

            // Submit to server if authenticated and not anonymous
            const response = await submitSystemFeedback(feedbackData);

            message.success('Feedback submitted successfully!');
            form.resetFields();
            setImageUrl('');
            if (onClose) onClose();
        } catch (error) {
            console.error('Error submitting feedback:', error);

            // Improved error handling with specific messages
            if (error.response) {
                if (error.response.status === 405) {
                    message.error('The server does not allow this operation. Please contact support.');
                } else if (error.response.status === 401) {
                    if (!isAuthenticated && anonymousSubmitType === 'server') {
                        message.warning('Anonymous submissions to server are currently unavailable. Your feedback has been saved locally.');
                    } else {
                        message.error('You need to be logged in to submit feedback.');
                    }
                } else {
                    message.error(`Failed to submit feedback: ${error.response.data?.message || 'Server error'}`);
                }
            } else if (error.message && error.message.includes('authentication')) {
                // Special handling for our specific authentication error
                message.warning('Anonymous submissions to server are currently unavailable. Your feedback has been saved locally.');
            } else if (error.request) {
                message.error('Network error. Please check your connection and try again.');
            } else {
                message.error('Failed to submit feedback. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const uploadButton = (
        <Button className={styles.uploadBtn} type="button">
            <UploadOutlined className={styles.uploadIcon} />
            <span className={styles.uploadText}>Upload Screenshot (Optional)</span>
        </Button>
    );

    return (
        <div className={styles.formContainer}>
            <div className={styles.form}>
                <Title level={3} className={styles.title}>
                    Help Us Improve
                </Title>

                <Text className={styles.description}>
                    Your feedback helps us enhance the attendance system. Please share your thoughts, suggestions, or report any issues you encounter.
                </Text>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ severity: 3 }}
                    size="middle"
                    style={{ width: '100%' }}
                >
                    {/* Use a grid layout for form fields on larger screens */}
                    <div className={styles.twoColumnLayout}>
                        <Form.Item
                            name="category"
                            label={<span className={styles.formLabel}>Category</span>}
                            rules={[{ required: true, message: 'Please select a category' }]}
                            className={styles.formItem}
                        >
                            <Select placeholder="Select the type of feedback">
                                <Option value="Bug">
                                    <BugOutlined className={styles.categoryIcon} /> Bug or Error
                                </Option>
                                <Option value="Feature Request">
                                    <BulbOutlined className={styles.categoryIcon} /> Feature Request
                                </Option>
                                <Option value="UI Improvement">
                                    <ToolOutlined className={styles.categoryIcon} /> UI Improvement
                                </Option>
                                <Option value="Performance Issue">
                                    <ToolOutlined className={styles.categoryIcon} /> Performance Issue
                                </Option>
                                <Option value="Other">Other</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="title"
                            label={<span className={styles.formLabel}>Title</span>}
                            rules={[{ required: true, message: 'Please provide a title' }]}
                            className={styles.formItem}
                        >
                            <Input placeholder="Brief summary of your feedback" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="description"
                        label={<span className={styles.formLabel}>Description</span>}
                        rules={[{ required: true, message: 'Please provide a description' }]}
                        className={styles.formItem}
                    >
                        <TextArea
                            placeholder="Please describe the issue or suggestion in detail..."
                            rows={4}
                            autoSize={{ minRows: 3, maxRows: 6 }}
                        />
                    </Form.Item>

                    <div className={styles.twoColumnLayout}>
                        <Form.Item
                            name="severity"
                            label={<span className={styles.formLabel}>Severity/Importance</span>}
                            rules={[{ required: true, message: 'Please rate the severity' }]}
                            className={styles.formItem}
                        >
                            <div>
                                <Rate />
                                <span className={styles.rateLabel}>(1 = Low, 5 = Critical)</span>
                            </div>
                        </Form.Item>

                        <Form.Item
                            label={<span className={styles.formLabel}>Screenshot</span>}
                            className={styles.formItem}
                        >
                            <div className={styles.uploadWrapper}>
                                <Upload
                                    listType="picture-card"
                                    showUploadList={true}
                                    beforeUpload={beforeUpload}
                                    onChange={handleChange}
                                    onPreview={handleImagePreview}
                                    maxCount={1}
                                    accept="image/*"
                                >
                                    {imageUrl ? null : uploadButton}
                                </Upload>
                            </div>
                        </Form.Item>
                    </div>

                    {/* Fix anonymous options section - Unified experience for auth/non-auth users */}
                    {isAuthenticated ? (
                        <Form.Item name="isAnonymous" className={styles.formItem}>
                            <Checkbox
                                checked={isAnonymous}
                                onChange={e => setIsAnonymous(e.target.checked)}
                            >
                                Submit anonymously
                            </Checkbox>
                        </Form.Item>
                    ) : (
                        <Form.Item className={styles.formItem}>
                            <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: 8 }}>
                                You are not logged in. How would you like to submit your feedback?
                            </Text>
                        </Form.Item>
                    )}

                    {/* Show radio options either if not authenticated OR if authenticated and anonymous is checked */}
                    {(!isAuthenticated || (isAuthenticated && isAnonymous)) && (
                        <Form.Item name="anonymousType" className={styles.formItem}>
                            <Radio.Group
                                value={isAuthenticated ? anonymousOption : anonymousSubmitType}
                                onChange={e => {
                                    if (isAuthenticated) {
                                        setAnonymousOption(e.target.value);
                                    } else {
                                        setAnonymousSubmitType(e.target.value);
                                    }
                                }}
                            >
                                <Space direction="vertical">
                                    <Radio value="local">
                                        Store locally only (developers won&apos;t see this)
                                    </Radio>
                                    <Radio value="server">
                                        Submit to developers anonymously
                                        <Tooltip title="Your feedback will be sent to the development team without your personal information.">
                                            <InfoCircleOutlined style={{ marginLeft: 8 }} />
                                        </Tooltip>
                                    </Radio>
                                </Space>
                            </Radio.Group>
                        </Form.Item>
                    )}

                    {/* Only show login encouragement if not authenticated */}
                    {!isAuthenticated && (
                        <Form.Item className={styles.formItem}>
                            <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                For better tracking and to receive updates on your feedback, consider
                                <Button type="link" style={{ padding: '0 4px', fontSize: '12px', height: 'auto' }} onClick={() => window.location.href = '/auth/login'}>
                                    logging in
                                </Button>
                            </Text>
                        </Form.Item>
                    )}

                    <Form.Item className={styles.formItem}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className={styles.submitButton}
                        >
                            {anonymousOption === 'server' ? 'Submit Feedback' : 'Save Feedback'}
                        </Button>
                    </Form.Item>
                </Form>

                <Modal
                    open={previewOpen}
                    title="Screenshot Preview"
                    footer={null}
                    onCancel={() => setPreviewOpen(false)}
                    width="auto"
                    style={{ maxWidth: '95vw' }}
                    centered
                >
                    <img alt="Preview" className={styles.modalImage} src={previewImage} />
                </Modal>
            </div>
        </div>
    );
};

SystemFeedbackForm.propTypes = {
    onClose: PropTypes.func
};

export default SystemFeedbackForm;
