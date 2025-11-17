import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RocketOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const ComingSoon = ({ title = 'Coming Soon', description = 'This feature is currently under development.' }) => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 200px)'
        }}>
            <Result
                icon={<RocketOutlined style={{ fontSize: 72, color: '#6C5CE7' }} />}
                title={<h2 style={{ fontSize: 28, fontWeight: 600 }}>{title}</h2>}
                subTitle={description}
                extra={[
                    <Button
                        type="primary"
                        key="dashboard"
                        onClick={() => navigate('/super-admin')}
                        size="large"
                    >
                        Back to Dashboard
                    </Button>,
                ]}
            />
        </div>
    );
};

ComingSoon.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
};

export default ComingSoon;
