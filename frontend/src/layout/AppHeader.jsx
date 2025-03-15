import { Layout, Row, Col, Typography, Space } from 'antd';
import PropTypes from 'prop-types';
import { useContext } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { ThemeContext } from '../context/ThemeContext';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader = ({
    title,
    leftComponent = null,
    rightComponents = [],
    onBack = null,
    showToggle = false // The toggle is hidden by default
}) => {
    const { themeColors, isDarkMode } = useContext(ThemeContext);

    return (
        <Header
            style={{
                background: isDarkMode ? themeColors.backgroundLight : '#ffffff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                padding: '0 16px',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                borderBottom: `1px solid ${themeColors.border}`,
                height: 64,
            }}
        >
            <Row
                justify="space-between"
                align="middle"
                style={{ width: '100%' }}
            >
                <Col>
                    <Space align="center">
                        {leftComponent}
                        <Title
                            level={4}
                            style={{
                                margin: 0,
                                color: themeColors.text,
                                fontSize: '18px',
                                fontWeight: 600,
                                cursor: onBack ? 'pointer' : 'default'
                            }}
                            onClick={onBack ? () => onBack() : undefined}
                        >
                            {title}
                        </Title>
                    </Space>
                </Col>
                <Col>
                    <Space align="center" size="middle">
                        {rightComponents}
                        {showToggle && <ThemeToggle />}
                    </Space>
                </Col>
            </Row>
        </Header>
    );
};

// Add PropTypes validation
AppHeader.propTypes = {
    title: PropTypes.node,
    leftComponent: PropTypes.node,
    rightComponents: PropTypes.arrayOf(PropTypes.node),
    onBack: PropTypes.func,
    showToggle: PropTypes.bool
};

export default AppHeader;
