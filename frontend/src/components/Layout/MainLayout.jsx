import { useContext } from 'react';
import { Layout, ConfigProvider } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';
import SystemFeedbackButton from '../SystemFeedback/SystemFeedbackButton';
import PropTypes from 'prop-types';

const { Content } = Layout;

const MainLayout = ({ children }) => {
    const { themeColors } = useContext(ThemeContext);

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: themeColors.primary,
                    colorBgContainer: themeColors.background,
                    colorBgLayout: themeColors.background,
                    colorText: themeColors.text,
                },
            }}
        >
            <Layout style={{ minHeight: '100vh', background: themeColors.background }}>
                <Content style={{ margin: '0 auto', width: '100%', maxWidth: '1200px' }}>
                    {children}
                </Content>

                {/* Floating feedback button that appears on all pages */}
                <SystemFeedbackButton />
            </Layout>
        </ConfigProvider>
    );
};

MainLayout.propTypes = {
    children: PropTypes.node.isRequired,
};

export default MainLayout;
