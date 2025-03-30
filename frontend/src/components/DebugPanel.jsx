import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Card, Typography, Collapse, Switch, Button, Divider } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Debug panel to help diagnose auth and routing issues
 * Can be added to any dashboard page to check authentication status
 */
const DebugPanel = () => {
    const [visible, setVisible] = useState(false);
    const [token, setToken] = useState(null);
    const [tokenData, setTokenData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [apiStatus, setApiStatus] = useState('Not checked');

    useEffect(() => {
        // Get token from localStorage
        const storedToken = localStorage.getItem('token');
        setToken(storedToken);

        // Decode token if it exists
        if (storedToken) {
            try {
                const decoded = jwtDecode(storedToken);
                setTokenData(decoded);

                // Check token expiration
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    setApiStatus('Token expired');
                }
            } catch (err) {
                console.error("Error decoding token:", err);
            }
        }

        // Get user data from localStorage
        try {
            const userDataStr = localStorage.getItem('userData');
            if (userDataStr) {
                setUserData(JSON.parse(userDataStr));
            }
        } catch (err) {
            console.error("Error parsing user data:", err);
        }
    }, []);

    const checkApiConnection = async () => {
        setApiStatus('Checking...');
        try {
            const API_URL = 'https://attendance-system-w70n.onrender.com/api';
            const response = await fetch(`${API_URL}/health`);
            if (response.ok) {
                setApiStatus('API is online');
            } else {
                setApiStatus(`API error: ${response.status}`);
            }
        } catch (err) {
            setApiStatus(`Connection error: ${err.message}`);
        }
    };

    const clearStorage = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    if (!visible) {
        return (
            <Button
                type="dashed"
                size="small"
                onClick={() => setVisible(true)}
                style={{ position: 'fixed', bottom: 10, right: 10, opacity: 0.7 }}
            >
                Debug
            </Button>
        );
    }

    return (
        <Card
            title="Debug Panel"
            style={{
                position: 'fixed',
                bottom: 10,
                right: 10,
                width: 300,
                zIndex: 1000,
                opacity: 0.9
            }}
            extra={<Switch checked={visible} onChange={setVisible} size="small" />}
            size="small"
        >
            <Collapse>
                <Panel header="Authentication" key="1">
                    <Paragraph>
                        <Text strong>Token Status: </Text>
                        <Text type={token ? "success" : "danger"}>
                            {token ? "Present" : "Missing"}
                        </Text>
                    </Paragraph>

                    {tokenData && (
                        <>
                            <Paragraph>
                                <Text strong>User ID: </Text>
                                <Text>{tokenData.userId}</Text>
                            </Paragraph>
                            <Paragraph>
                                <Text strong>Role: </Text>
                                <Text>{tokenData.role}</Text>
                            </Paragraph>
                            <Paragraph>
                                <Text strong>Expires: </Text>
                                <Text>{new Date(tokenData.exp * 1000).toLocaleString()}</Text>
                            </Paragraph>
                        </>
                    )}
                </Panel>

                <Panel header="Local Storage" key="2">
                    <Paragraph>
                        <Text strong>User Data: </Text>
                        <Text type={userData ? "success" : "danger"}>
                            {userData ? "Present" : "Missing"}
                        </Text>
                    </Paragraph>

                    {userData && (
                        <>
                            <Paragraph>
                                <Text strong>ID: </Text>
                                <Text>{userData.id}</Text>
                            </Paragraph>
                            <Paragraph>
                                <Text strong>Role: </Text>
                                <Text>{userData.role}</Text>
                            </Paragraph>
                        </>
                    )}
                </Panel>

                <Panel header="API Connection" key="3">
                    <Paragraph>
                        <Text strong>Status: </Text>
                        <Text>{apiStatus}</Text>
                    </Paragraph>
                    <Button size="small" onClick={checkApiConnection}>
                        Check API Connection
                    </Button>
                </Panel>
            </Collapse>

            <Divider style={{ margin: '10px 0' }} />

            <Button
                size="small"
                danger
                type="primary"
                onClick={clearStorage}
                style={{ width: '100%' }}
            >
                Clear Storage & Reload
            </Button>
        </Card>
    );
};

export default DebugPanel;
