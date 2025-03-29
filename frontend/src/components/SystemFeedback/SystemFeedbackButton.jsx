import { useState, useContext } from 'react';
import { Button, Modal } from 'antd';
import { CommentOutlined } from '@ant-design/icons';
import SystemFeedbackForm from './SystemFeedbackForm';
import { ThemeContext } from '../../context/ThemeContext';
import { css } from '@emotion/css';

const useStyles = (themeColors) => ({
    feedbackButton: css`
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    background: ${themeColors.primary};
    color: white;
    border: none;
    border-radius: 24px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    &:hover {
      background: ${themeColors.primary}CC;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  `,
    icon: css`
    margin-right: 8px;
  `,
    modal: css`
    .ant-modal-content {
      background: ${themeColors.background};
    }
    .ant-modal-header {
      background: ${themeColors.background};
    }
    .ant-modal-title {
      color: ${themeColors.text};
    }
    .ant-modal-close {
      color: ${themeColors.text};
    }
  `,
});

const SystemFeedbackButton = () => {
    const { themeColors } = useContext(ThemeContext);
    const styles = useStyles(themeColors);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleClose = () => {
        setIsModalVisible(false);
    };

    return (
        <>
            <Button className={styles.feedbackButton} onClick={showModal}>
                <CommentOutlined className={styles.icon} />
                Feedback
            </Button>
            <Modal
                title="System Feedback"
                open={isModalVisible}
                onCancel={handleClose}
                footer={null}
                width={700}
                className={styles.modal}
                destroyOnClose
            >
                <SystemFeedbackForm onClose={handleClose} />
            </Modal>
        </>
    );
};

export default SystemFeedbackButton;
