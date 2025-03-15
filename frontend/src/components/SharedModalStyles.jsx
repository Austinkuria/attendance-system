import React from 'react';
import { ThemeContext } from '../context/ThemeContext';

export const useModalStyles = () => {
    const { isDarkMode, themeColors } = React.useContext(ThemeContext);

    return {
        modalContainer: {
            background: themeColors.modalBg || themeColors.cardBg,
            borderRadius: '12px',
            overflow: 'hidden',
        },
        modalHeader: {
            textAlign: 'center',
            padding: '16px',
            background: themeColors.primary,
            color: themeColors.textInvert,
            borderBottom: `1px solid ${themeColors.border}`,
            borderRadius: '12px 12px 0 0',
            fontWeight: 600,
            fontSize: '18px'
        },
        modalTitle: {
            color: themeColors.textInvert,
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
        },
        modalBody: {
            padding: '24px',
            background: themeColors.modalBg || themeColors.cardBg,
            color: themeColors.text,
        },
        modalFooter: {
            borderTop: `1px solid ${themeColors.border}`,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            background: themeColors.modalBg || themeColors.cardBg,
        },
        styles: `
      .ant-modal-header {
        text-align: center !important;
        padding: 16px !important;
        background: ${themeColors.primary} !important;
        border-bottom: 1px solid ${themeColors.border} !important;
        border-radius: 12px 12px 0 0 !important;
      }
      
      .ant-modal-title {
        color: ${themeColors.textInvert} !important;
        font-size: 18px !important;
        font-weight: 600 !important;
        text-align: center !important;
      }
      
      .ant-modal-close {
        color: ${themeColors.textInvert} !important;
      }
      
      .ant-modal-content {
        border-radius: 12px !important;
        overflow: hidden !important;
        background: ${themeColors.modalBg || themeColors.cardBg} !important;
      }
      
      .ant-modal-body {
        padding: 24px !important;
        background: ${themeColors.modalBg || themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
      }
      
      .ant-modal-footer {
        border-top: 1px solid ${themeColors.border} !important;
        padding: 12px 16px !important;
        background: ${themeColors.modalBg || themeColors.cardBg} !important;
      }
    `
    };
};
