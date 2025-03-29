import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Button, Select, Rate, Upload, Modal, message, Typography, Divider } from 'antd';
import { UploadOutlined, BugOutlined, BulbOutlined, ToolOutlined } from '@ant-design/icons';
import { submitSystemFeedback } from '../../services/api';
import { ThemeContext } from '../../context/ThemeContext';
import { css } from '@emotion/css';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const useStyles = (themeColors) => ({
    form: css`
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
    border-radius: 8px;
    background: ${themeColors.cardBg};
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `,
    title: css`
    color: ${themeColors.text};
    text-align: center;
    margin-bottom: 24px;
  `,
    submitButton: css`
    margin-top: 16px;
    width: 100%;
  `,
    rateLabel: css`
    color: ${themeColors.text};
    margin-right: 8px;
  `,
    divider: css`
    margin: 24px 0 16px;
    border-color: ${themeColors.text}30;
  `,
    uploadBtn: css`
    width: 100%;
    border-color: ${themeColors.primary};
    color: ${themeColors.primary};
    &:hover {
      border-color: ${themeColors.primary}CC;
      color: ${themeColors.primary}CC;
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
    margin-bottom: 24px;
    text-align: center;
  `,
    categoryIcon: css`
    margin-right: 8px;
  `,
    formLabel: css`
    color: ${themeColors.text};
  `
});

const SystemFeedbackForm = ({ onClose }) => {
    const { themeColors } = useContext(ThemeContext);
    const styles = useStyles(themeColors);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

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
            const feedbackData = {
                ...values,
                screenshot: imageUrl || null
            };

            await submitSystemFeedback(feedbackData);

            message.success('Your feedback has been submitted successfully!');
            form.resetFields();
            setImageUrl('');
            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            message.error('Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const uploadButton = (
        <Button className={styles.uploadBtn} icon={<UploadOutlined />}>
            Upload Screenshot (Optional)
        </Button>
    );

    return (
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
            >
                <Form.Item
                    name="category"
                    label={<span className={styles.formLabel}>Category</span>}
                    rules={[{ required: true, message: 'Please select a category' }]}
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
                >
                    <Input placeholder="Brief summary of your feedback" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label={<span className={styles.formLabel}>Description</span>}
                    rules={[{ required: true, message: 'Please provide a description' }]}
                >
                    <TextArea
                        placeholder="Please describe the issue or suggestion in detail..."
                        rows={4}
                    />
                </Form.Item>

                <Form.Item
                    name="severity"
                    label={<span className={styles.formLabel}>Severity/Importance</span>}
                    rules={[{ required: true, message: 'Please rate the severity' }]}
                >
                    <div>
                        <Rate />
                        <span className={styles.rateLabel}>(1 = Low, 5 = Critical)</span>
                    </div>
                </Form.Item>

                <Divider className={styles.divider} />

                <Form.Item label={<span className={styles.formLabel}>Screenshot</span>}>
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
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        className={styles.submitButton}
                    >
                        Submit Feedback
                    </Button>
                </Form.Item>
            </Form>

            <Modal
                open={previewOpen}
                title="Screenshot Preview"
                footer={null}
                onCancel={() => setPreviewOpen(false)}
            >
                <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>
        </div>
    );
};
SystemFeedbackForm.propTypes = {
    onClose: PropTypes.func
};

export default SystemFeedbackForm;
