import { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Space } from 'antd';
import { MailOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph, Text } = Typography;

const VerifyEmailManually = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleVerify = async (values) => {
        setLoading(true);
        setResult(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://attendance-system-w70n.onrender.com/api';
            const response = await axios.post(`${apiUrl}/auth/manual-verify-email`, {
                email: values.email
            });

            if (response.data.success) {
                setResult({
                    type: 'success',
                    message: response.data.message,
                    user: response.data.user
                });
                form.resetFields();
            }
        } catch (error) {
            setResult({
                type: 'error',
                message: error.response?.data?.message || 'Failed to verify email. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <Card
                style={{
                    maxWidth: 500,
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    borderRadius: 12
                }}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <CheckCircleOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
                        <Title level={2} style={{ marginBottom: 8 }}>Manual Email Verification</Title>
                        <Paragraph type="secondary">
                            This tool allows you to manually verify a user&apos;s email address.
                            Enter the email address below to verify it.
                        </Paragraph>
                    </div>

                    <Alert
                        message="API Endpoint"
                        description={
                            <Text code style={{ wordBreak: 'break-all' }}>
                                {import.meta.env.VITE_API_URL || 'https://attendance-system-w70n.onrender.com/api'}/auth/manual-verify-email
                            </Text>
                        }
                        type="info"
                        showIcon
                    />

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleVerify}
                    >
                        <Form.Item
                            label="Email Address"
                            name="email"
                            rules={[
                                { required: true, message: 'Please enter an email address' },
                                { type: 'email', message: 'Please enter a valid email address' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="user@example.com"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={loading}
                                block
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    height: 48
                                }}
                            >
                                Verify Email
                            </Button>
                        </Form.Item>
                    </Form>

                    {result && (
                        <Alert
                            message={result.type === 'success' ? 'Success' : 'Error'}
                            description={
                                result.type === 'success' ? (
                                    <Space direction="vertical" size="small">
                                        <Text>{result.message}</Text>
                                        {result.user && (
                                            <>
                                                <Text strong>User Details:</Text>
                                                <Text>Email: {result.user.email}</Text>
                                                <Text>Role: {result.user.role}</Text>
                                                <Text>Verified: {result.user.isVerified ? 'Yes' : 'No'}</Text>
                                            </>
                                        )}
                                    </Space>
                                ) : (
                                    result.message
                                )
                            }
                            type={result.type}
                            showIcon
                            closable
                            onClose={() => setResult(null)}
                        />
                    )}
                </Space>
            </Card>
        </div>
    );
};

export default VerifyEmailManually;
