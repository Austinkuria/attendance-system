import { useState, useContext } from 'react';
import { Button, Modal, Dropdown } from 'antd';
import { CommentOutlined, PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import SystemFeedbackForm from './SystemFeedbackForm';
import SystemFeedbackHistoryDrawer from './SystemFeedbackHistoryDrawer';
import { ThemeContext } from '../../context/ThemeContext';
import { css } from '@emotion/css';

const useStyles = (themeColors) => ({
  feedbackButton: css`
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    background: ${themeColors.primary};
    color: white;
    border: none;
    border-radius: 24px;
    padding: 8px 16px;
    min-width: 120px; /* Add minimum width */
    text-align: center; /* Center text */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    &:hover {
      background: ${themeColors.primary}CC;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    @media (min-width: 768px) {
      width: 140px; /* Wider on larger screens */
    }
    
    @media (max-width: 480px) {
      min-width: 100px; /* Slightly narrower on small screens */
      padding: 6px 12px;
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
    
    @media (min-width: 1200px) {
      min-width: 800px; /* Wider modal on large screens */
    }
  `,
  dropdownMenu: css`
    width: 180px; /* Fixed width for dropdown menu */
    
    .ant-dropdown-menu-item {
      padding: 10px 16px; /* More padding for menu items */
    }
  `,
});

const SystemFeedbackButton = () => {
  const { themeColors } = useContext(ThemeContext);
  const styles = useStyles(themeColors);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleClose = () => {
    setIsModalVisible(false);
  };

  const showHistoryDrawer = () => {
    setIsDrawerVisible(true);
  };

  const closeHistoryDrawer = () => {
    setIsDrawerVisible(false);
  };

  // Add dropdown menu items with explicit widths
  const items = [
    {
      key: '1',
      label: 'Submit Feedback',
      icon: <PlusOutlined />,
      onClick: showModal,
      style: { width: '100%' }
    },
    {
      key: '2',
      label: 'View My Feedback',
      icon: <HistoryOutlined />,
      onClick: showHistoryDrawer,
      style: { width: '100%' }
    }
  ];

  // Define custom dropdown styles
  const dropdownStyles = {
    menu: {
      width: '180px', // Fixed width for the dropdown menu
    },
    item: {
      padding: '10px 16px', // More padding for menu items
    }
  };

  return (
    <>
      <Dropdown
        menu={{
          items,
          style: dropdownStyles.menu
        }}
        placement="topRight"
        trigger={['click']}
        overlayClassName={styles.dropdownMenu}
      >
        <Button className={styles.feedbackButton}>
          <CommentOutlined className={styles.icon} />
          Feedback
        </Button>
      </Dropdown>

      <Modal
        title="System Feedback"
        open={isModalVisible}
        onCancel={handleClose}
        footer={null}
        width="85%" // Use percentage for responsive width
        className={styles.modal}
        destroyOnClose
        style={{ maxWidth: '1000px' }} // Set maximum width
      >
        <SystemFeedbackForm onClose={handleClose} />
      </Modal>

      <SystemFeedbackHistoryDrawer
        visible={isDrawerVisible}
        onClose={closeHistoryDrawer}
      />
    </>
  );
};

export default SystemFeedbackButton;
