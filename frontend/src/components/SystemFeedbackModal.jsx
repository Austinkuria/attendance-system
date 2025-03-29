import { Modal } from 'antd';
import PropTypes from 'prop-types';
import SystemFeedbackForm from './SystemFeedback/SystemFeedbackForm';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { css } from '@emotion/css';

const useStyles = (themeColors) => ({
    modal: css`
    .ant-modal-content {
      background: ${themeColors.cardBg};
    }
    .ant-modal-header {
      background: ${themeColors.cardBg};
      border-bottom: 1px solid ${themeColors.border};
    }
    .ant-modal-title {
      color: ${themeColors.text};
    }
    .ant-modal-close {
      color: ${themeColors.text};
    }
  `,
});

const SystemFeedbackModal = ({ visible, onClose }) => {
    const { themeColors } = useContext(ThemeContext);
    const styles = useStyles(themeColors);

    return (
        <Modal
            title="System Feedback"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            className={styles.modal}
            destroyOnClose
        >
            <SystemFeedbackForm onClose={onClose} />
        </Modal>
    );
};

SystemFeedbackModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default SystemFeedbackModal;
