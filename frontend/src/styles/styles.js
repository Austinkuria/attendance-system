// styles.js
import { useMemo } from 'react';

export const useStyles = (isDarkMode, themeColors) =>
  useMemo(() => ({
    // Layout
    layout: {
      minHeight: '100vh',
      background: themeColors.background,
      color: themeColors.text,
    },
    header: {
      padding: '0 16px',
      background: themeColors.cardBg,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'fixed',
      width: '100%',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${themeColors.border}`,
    },
    sider: {
      background: themeColors.cardBg,
      marginTop: 64,
      position: 'fixed',
      height: 'calc(100vh - 64px)',
      overflow: 'auto',
      zIndex: 11,
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
    },
    content: {
      margin: '64px 16px 16px',
      padding: 24,
      background: themeColors.background,
      minHeight: 'calc(100vh - 64px)',
      overflow: 'auto',
      transition: 'margin-left 0.3s ease-in-out',
    },

    // Cards
    card: {
      background: themeColors.cardBg,
      borderRadius: 16,
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      border: 'none',
    },
    summaryCard1: {
      borderRadius: 16,
      textAlign: 'center',
      cursor: 'pointer',
      height: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'transform 0.3s, box-shadow 0.3s',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    },
    summaryCard2: {
      borderRadius: 16,
      textAlign: 'center',
      cursor: 'pointer',
      height: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'transform 0.3s, box-shadow 0.3s',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    },
    summaryCard3: {
      borderRadius: 16,
      textAlign: 'center',
      cursor: 'pointer',
      height: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'transform 0.3s, box-shadow 0.3s',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    },
    summaryCard4: {
      borderRadius: 16,
      textAlign: 'center',
      cursor: 'pointer',
      height: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'transform 0.3s, box-shadow 0.3s',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    },

    // Buttons
    button: {
      background: themeColors.primary,
      borderColor: themeColors.border,
      color: themeColors.text,
      borderRadius: 8,
      padding: '4px 16px',
      transition: 'all 0.3s',
    },
    backToTopButton: {
      position: 'fixed',
      bottom: 32,
      right: 32,
      zIndex: 1000,
      background: themeColors.primary,
      borderColor: themeColors.border,
      width: 50,
      height: 50,
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    },

    // Global Overrides
    globalStyles: `
      html, body, #root {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: hidden;
        background: ${themeColors.background};
        color: ${themeColors.text};
      }
      .ant-layout, .ant-layout-content {
        background: ${themeColors.background} !important;
      }
      .ant-menu {
        background: ${themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
        border: none !important;
        padding: 8px 0;
      }
      .ant-menu-item {
        color: ${themeColors.text} !important;
        margin: 4px 8px;
      }
      .ant-menu-item:hover, .ant-menu-item-selected {
        background: ${themeColors.hover} !important;
        color: ${themeColors.primary} !important;
      }
      .ant-btn-primary {
        background: ${themeColors.primary} !important;
        border-color: ${themeColors.primary} !important;
        color: ${themeColors.text} !important;
        border-radius: 8px;
        padding: 4px 16px;
      }
      .ant-btn-primary:hover, .ant-btn-primary:focus {
        background: ${themeColors.focus} !important;
        border-color: ${themeColors.focus} !important;
      }
      .ant-btn-default {
        background: ${themeColors.cardBg} !important;
        border-color: ${themeColors.border} !important;
        color: ${themeColors.text} !important;
        border-radius: 8px;
        padding: 4px 16px;
      }
      .ant-btn-default:hover, .ant-btn-default:focus {
        background: ${themeColors.hover} !important;
        border-color: ${themeColors.secondary} !important;
      }
      .ant-btn-dangerous {
        background: ${themeColors.accent} !important;
        border-color: ${themeColors.accent} !important;
        color: ${themeColors.text} !important;
        border-radius: 8px;
      }
      .ant-btn-dangerous:hover, .ant-btn-dangerous:focus {
        background: ${themeColors.accent}CC !important;
        border-color: ${themeColors.accent}CC !important;
      }
      .ant-card {
        background: ${themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
        border: none !important;
        border-radius: 16px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }
      /* Specific styles for summary cards */
      .ant-card.summary-card-1 {
        background: ${themeColors.cardGradient1} !important;
        color: ${themeColors.text} !important;
      }
      .ant-card.summary-card-2 {
        background: ${themeColors.cardGradient2} !important;
        color: ${themeColors.text} !important;
      }
      .ant-card.summary-card-3 {
        background: ${themeColors.cardGradient3} !important;
        color: ${themeColors.text} !important;
      }
      .ant-card.summary-card-4 {
        background: ${themeColors.cardGradient4} !important;
        color: ${themeColors.text} !important;
      }
      .ant-card-hoverable:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
        transform: translateY(-5px);
      }
      .ant-modal-content, .ant-modal-body {
        background: ${themeColors.modalBg} !important;
        color: ${themeColors.text} !important;
        border-radius: 16px;
      }
      .ant-modal-header {
        background: ${themeColors.modalBg} !important;
        border-bottom: 1px solid ${themeColors.border} !important;
        border-radius: 16px 16px 0 0;
      }
      .ant-modal-title, .ant-modal-close-x {
        color: ${themeColors.text} !important;
      }
      .ant-input, .ant-input-affix-wrapper {
        background: ${themeColors.inputBg} !important;
        border-color: ${themeColors.inputBorder} !important;
        color: ${themeColors.text} !important;
        border-radius: 8px;
        padding: 8px 12px;
      }
      .ant-input:hover, .ant-input:focus, .ant-input-affix-wrapper:hover, .ant-input-affix-wrapper:focus {
        background: ${themeColors.inputHover} !important;
        border-color: ${themeColors.primary} !important;
        box-shadow: none;
      }
      .ant-input::placeholder {
        color: ${themeColors.placeholder} !important;
      }
      .ant-table {
        background: ${themeColors.cardBg} !important;
        color: ${themeColors.text} !important;
      }
      .ant-table-thead > tr > th {
        background: ${themeColors.tableHeaderBg} !important;
        color: ${themeColors.text} !important;
        border-bottom: 1px solid ${themeColors.border} !important;
        padding: 8px 16px;
      }
      .ant-table-tbody > tr > td {
        border-bottom: 1px solid ${themeColors.border} !important;
        padding: 8px 16px;
      }
      .ant-table-tbody > tr:hover > td {
        background: ${themeColors.tableRowHover} !important;
      }
      .ant-pagination-item {
        background: ${themeColors.cardBg} !important;
        border-color: ${themeColors.border} !important;
        color: ${themeColors.text} !important;
        border-radius: 8px;
      }
      .ant-pagination-item-active {
        background: ${themeColors.paginationActive} !important;
        border-color: ${themeColors.paginationActive} !important;
        color: ${themeColors.text} !important;
      }
      .ant-pagination-item:hover, .ant-pagination-prev:hover, .ant-pagination-next:hover {
        border-color: ${themeColors.primary} !important;
        color: ${themeColors.primary} !important;
      }
      .ant-select-selector {
        background: ${themeColors.inputBg} !important;
        border-color: ${themeColors.inputBorder} !important;
        color: ${themeColors.text} !important;
        border-radius: 8px;
        padding: 4px 12px;
      }
      .ant-select-selector:hover, .ant-select-selector:focus {
        border-color: ${themeColors.primary} !important;
        background: ${themeColors.inputHover} !important;
      }
      .ant-switch-checked {
        background: ${themeColors.primary} !important;
      }
      .ant-dropdown-menu {
        background: ${themeColors.cardBg} !important;
        border-radius: 8px;
        padding: 8px 0;
      }
      .ant-dropdown-menu-item {
        color: ${themeColors.text} !important;
        padding: 8px 16px;
      }
      .ant-dropdown-menu-item:hover {
        background: ${themeColors.hover} !important;
      }
      @media (max-width: 992px) {
        .ant-layout-content { margin-left: 88px !important; }
      }
      @media (max-width: 576px) {
        .ant-layout-content { padding: 16px !important; }
        .ant-btn { padding: 4px 12px !important; }
      }
    `,
  }), [themeColors]);