import React from 'react';
import { ThemeContext } from '../context/ThemeContext';

export const useModalStyles = () => {
  const { isDarkMode, themeColors } = React.useContext(ThemeContext);

  // For debugging purposes - enable this to show debug borders
  const DEBUG_MODE = false;
  const debugBorder = DEBUG_MODE ? '1px dashed red' : 'none';

  return {
    modalContainer: {
      background: themeColors.modalBg || themeColors.cardBg,
      borderRadius: '12px',
      overflow: 'hidden',
      border: debugBorder, // Debug border
      maxWidth: '100%',
    },
    modalHeader: {
      textAlign: 'center',
      padding: '16px 24px',
      background: themeColors.primary,
      color: themeColors.textInvert,
      borderBottom: `1px solid ${themeColors.border}`,
      borderRadius: '12px 12px 0 0',
      fontWeight: 600,
      fontSize: '18px',
      position: 'relative',
      border: debugBorder, // Debug border
    },
    modalTitle: {
      color: themeColors.textInvert, // Ensures text is visible in any mode
      fontSize: '18px',
      fontWeight: 600,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%',
      border: debugBorder, // Debug border
    },
    modalBody: {
      padding: '24px',
      background: themeColors.modalBg || themeColors.cardBg,
      color: themeColors.text,
      border: debugBorder, // Debug border
    },
    modalFooter: {
      borderTop: `1px solid ${themeColors.border}`,
      padding: '12px 16px',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px',
      background: themeColors.modalBg || themeColors.cardBg,
      border: debugBorder, // Debug border
    },
    styles: `
      /* Reset default Ant Design Modal styling */
      .ant-modal {
        margin: 0 auto;
        max-width: 95%;
      }
      
      /* Responsive modal width - ensures modals aren't too large */
      .ant-modal.small-modal {
        max-width: 400px !important;
      }
      
      .ant-modal.medium-modal {
        max-width: 550px !important;
      }
      
      .ant-modal.standard-modal {
        max-width: 700px !important;
      }
      
      .ant-modal.large-modal {
        max-width: 900px !important;
      }
      
      .ant-modal.delete-confirmation-modal {
        max-width: 450px !important;
      }
      
      /* Specific modal sizes for different actions */
      .ant-modal.edit-modal {
        max-width: 500px !important;
      }
      
      .ant-modal.form-modal {
        max-width: 480px !important;
      }
      
      .ant-modal.confirmation-modal {
        max-width: 450px !important;
      }
      
      .ant-modal.view-details-modal {
        max-width: 650px !important;
      }
      
      .ant-modal-content {
        border-radius: 12px !important;
        overflow: hidden !important;
        background: ${themeColors.modalBg || themeColors.cardBg} !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
        padding: 0 !important; /* Remove default padding */
        max-width: 100% !important;
      }
      
      .ant-modal-header {
        margin: 0 !important;
        padding: 16px !important;
        background: ${themeColors.primary} !important; /* Use primary color for modal headers */
        border-bottom: 1px solid ${themeColors.border} !important;
        border-radius: 12px 12px 0 0 !important;
      }
      
      .ant-modal-title {
        color: ${themeColors.textInvert} !important; /* Always use the inverted text color for modal headers */
        font-size: 18px !important;
        font-weight: 600 !important;
        text-align: center !important;
        margin: 0 !important;
      }
      
      .ant-modal-close {
        top: 16px !important;
        inset-inline-end: 16px !important;
        color: ${themeColors.textInvert} !important;
      }
      
      .ant-modal-close:hover {
        color: ${themeColors.textInvert}CC !important;
        background: transparent !important;
      }
      
      .ant-modal-body {
        padding: 24px !important;
        background: ${themeColors.modalBg || themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
      }
      
      .ant-modal-footer {
        margin-top: 0 !important;
        border-top: 1px solid ${themeColors.border} !important;
        padding: 12px 16px !important;
        background: ${themeColors.modalBg || themeColors.cardBg} !important;
      }
      
      /* Override any theme-specific header styles */
      .theme-dark .ant-modal-header,
      .theme-light .ant-modal-header {
        background: ${themeColors.primary} !important;
      }
      
      .theme-dark .ant-modal-title,
      .theme-light .ant-modal-title {
        color: ${themeColors.textInvert} !important;
      }
      
      /* Fix for nested modal title elements */
      .ant-modal-title > div {
        color: ${themeColors.textInvert} !important;
      }
      
      /* Modal responsive styles */
      @media (max-width: 768px) {
        .ant-modal {
          max-width: 90% !important;
        }
        
        .ant-modal-body {
          padding: 16px !important;
        }
        
        .ant-modal-footer {
          padding: 10px !important;
        }
        
        .ant-modal.small-modal,
        .ant-modal.delete-confirmation-modal,
        .ant-modal.confirmation-modal,
        .ant-modal.edit-modal {
          max-width: 85% !important;
        }
      }
      
      @media (max-width: 576px) {
        .ant-modal {
          max-width: 95% !important;
        }
        
        .ant-modal-title {
          font-size: 16px !important;
        }
        
        .ant-modal-body {
          padding: 12px !important;
        }
      }
    `
  };
};
