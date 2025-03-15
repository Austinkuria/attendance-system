import React from 'react';
import { ThemeContext } from '../context/ThemeContext';

export const useTableStyles = () => {
    const { isDarkMode, themeColors } = React.useContext(ThemeContext);

    return `
    /* Consistent table styling */
    .ant-table {
      background: ${themeColors.cardBg} !important;
      color: ${themeColors.text} !important;
      border: 1px solid ${themeColors.tableBorder || themeColors.border} !important;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      width: 100%;
    }
    
    /* Table header styling */
    .ant-table-thead > tr > th {
      background: ${themeColors.tableHeaderBg || (isDarkMode ? themeColors.backgroundLight : '#EDF2FF')} !important;
      color: ${themeColors.tableHeaderText || themeColors.text} !important;
      font-weight: 600 !important;
      border-bottom: 2px solid ${themeColors.tableBorder || themeColors.border} !important;
      padding: 12px 16px !important;
    }
    
    /* Table cell styling */
    .ant-table-tbody > tr > td {
      border-bottom: 1px solid ${themeColors.tableBorder || themeColors.border} !important;
      color: ${themeColors.text} !important;
      background: ${themeColors.cardBg} !important;
      padding: 12px 16px !important;
    }
    
    /* Table row hover effect - enhanced for better visibility in light mode */
    .ant-table-tbody > tr:hover > td {
      background: ${isDarkMode ? themeColors.hover : '#E6F1FF'} !important;
      transition: background-color 0.2s ease;
    }
    
    /* Striped rows */
    .ant-table-row:nth-child(even) {
      background-color: ${themeColors.tableStripedRow || (isDarkMode ? themeColors.backgroundLight : '#F7FAFC')} !important;
    }
    
    .ant-table-row:nth-child(even) > td {
      background-color: ${themeColors.tableStripedRow || (isDarkMode ? themeColors.backgroundLight : '#F7FAFC')} !important;
    }
    
    /* Striped rows hover */
    .ant-table-row:nth-child(even):hover > td {
      background-color: ${isDarkMode ? themeColors.hover : '#E6F1FF'} !important;
    }
    
    /* Table title styling */
    .ant-table-title {
      padding: 16px;
      font-weight: 600;
      background: ${themeColors.primary} !important;
      color: ${themeColors.textInvert} !important;
      border-radius: 8px 8px 0 0;
    }
    
    /* Fixed columns */
    .ant-table-cell-fix-left, .ant-table-cell-fix-right {
      background: ${themeColors.tableHeaderBg || (isDarkMode ? themeColors.backgroundLight : '#EDF2FF')} !important;
    }
    
    /* Fixed columns hover */
    .ant-table-cell-fix-left-last:after, .ant-table-cell-fix-right-first:after {
      box-shadow: inset 10px 0 8px -8px rgba(0, 0, 0, 0.08) !important;
    }
    
    /* Selected row styling */
    .ant-table-tbody > tr.ant-table-row-selected > td {
      background: ${isDarkMode ? themeColors.primaryLight : '#EBF5FF'} !important;
      border-color: rgba(0, 0, 0, 0.03) !important;
    }
    
    /* Selected row hover */
    .ant-table-tbody > tr.ant-table-row-selected:hover > td {
      background: ${isDarkMode ? themeColors.primary + '50' : '#D9EBFF'} !important;
    }
  `;
};
