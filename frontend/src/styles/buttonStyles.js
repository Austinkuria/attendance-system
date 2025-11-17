/**
 * Centralized Button Styles for Theme Consistency
 * 
 * Import and use these styles for all buttons across the application
 * to ensure consistent theming with ThemeContext colors.
 * 
 * Usage:
 * import { getButtonStyles } from '@/styles/buttonStyles';
 * const buttonStyles = getButtonStyles(themeColors);
 * <Button style={buttonStyles.primary}>Primary Action</Button>
 */

/**
 * Get standardized button styles based on theme colors
 * @param {Object} themeColors - Theme colors from ThemeContext
 * @returns {Object} Button style objects for different button types
 */
export const getButtonStyles = (themeColors) => ({
    // Primary Action Button - Main CTAs (Submit, Save, Confirm, Create, Add, etc.)
    primary: {
        backgroundColor: themeColors.primary,
        borderColor: themeColors.primary,
        color: themeColors.textInvert,
    },

    // Create/Add Button - Alias for primary (for semantic clarity)
    create: {
        backgroundColor: themeColors.primary,
        borderColor: themeColors.primary,
        color: themeColors.textInvert,
    },

    // Secondary Action Button - Alternative actions
    secondary: {
        backgroundColor: themeColors.secondary,
        borderColor: themeColors.secondary,
        color: themeColors.textInvert,
    },

    // Success Button - Positive actions (Approve, Accept, etc.)
    success: {
        backgroundColor: themeColors.success,
        borderColor: themeColors.success,
        color: '#FFFFFF',
    },

    // Danger/Delete Button - Destructive actions (Delete, Remove, etc.)
    danger: {
        backgroundColor: themeColors.error,
        borderColor: themeColors.error,
        color: '#FFFFFF',
    },

    // Warning Button - Caution actions
    warning: {
        backgroundColor: themeColors.warning,
        borderColor: themeColors.warning,
        color: '#FFFFFF',
    },

    // Cancel/Default Button - Cancel, Back, Close actions
    cancel: {
        backgroundColor: 'transparent',
        borderColor: themeColors.border,
        color: themeColors.text,
    },

    // Text Button - Subtle actions
    text: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: themeColors.primary,
    },

    // Link Button - Inline link-style buttons
    link: {
        color: themeColors.primary,
        padding: 0,
    },

    // Disabled Button
    disabled: {
        backgroundColor: themeColors.disabled,
        borderColor: themeColors.border,
        color: themeColors.textSecondary,
        cursor: 'not-allowed',
        opacity: 0.6,
    },
});

/**
 * Get standardized props for Ant Design Modal buttons
 * @param {Object} themeColors - Theme colors from ThemeContext
 * @returns {Object} Props objects for modal buttons
 */
export const getModalButtonProps = (themeColors) => ({
    // OK button (primary action)
    okButtonProps: {
        style: {
            backgroundColor: themeColors.primary,
            borderColor: themeColors.primary,
            color: themeColors.textInvert,
        },
    },

    // Cancel button (secondary action)
    cancelButtonProps: {
        style: {
            backgroundColor: 'transparent',
            borderColor: themeColors.border,
            color: themeColors.text,
        },
    },

    // Danger OK button (for delete confirmations)
    dangerOkButtonProps: {
        style: {
            backgroundColor: themeColors.error,
            borderColor: themeColors.error,
            color: '#FFFFFF',
        },
    },
});

/**
 * Get hover styles for buttons
 * @param {Object} themeColors - Theme colors from ThemeContext
 * @returns {Object} Hover style objects
 */
export const getButtonHoverStyles = (themeColors) => ({
    primaryHover: {
        backgroundColor: themeColors.primaryHover,
        borderColor: themeColors.primaryHover,
    },

    secondaryHover: {
        backgroundColor: themeColors.secondaryHover,
        borderColor: themeColors.secondaryHover,
    },

    cancelHover: {
        backgroundColor: themeColors.hover,
        borderColor: themeColors.primary,
        color: themeColors.primary,
    },

    dangerHover: {
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderColor: 'rgba(239, 68, 68, 0.85)',
    },
});

/**
 * CSS class generator for button styling (for use with emotion/css or styled-components)
 * @param {Object} themeColors - Theme colors from ThemeContext
 * @returns {string} CSS string
 */
export const getButtonCSS = (themeColors) => `
  .btn-primary {
    background-color: ${themeColors.primary};
    border-color: ${themeColors.primary};
    color: ${themeColors.textInvert};
  }

  .btn-primary:hover,
  .btn-primary:focus {
    background-color: ${themeColors.primaryHover};
    border-color: ${themeColors.primaryHover};
    color: ${themeColors.textInvert};
  }

  .btn-secondary {
    background-color: ${themeColors.secondary};
    border-color: ${themeColors.secondary};
    color: ${themeColors.textInvert};
  }

  .btn-secondary:hover,
  .btn-secondary:focus {
    background-color: ${themeColors.secondaryHover};
    border-color: ${themeColors.secondaryHover};
    color: ${themeColors.textInvert};
  }

  .btn-success {
    background-color: ${themeColors.success};
    border-color: ${themeColors.success};
    color: #FFFFFF;
  }

  .btn-danger {
    background-color: ${themeColors.error};
    border-color: ${themeColors.error};
    color: #FFFFFF;
  }

  .btn-cancel,
  .btn-default {
    background-color: transparent;
    border-color: ${themeColors.border};
    color: ${themeColors.text};
  }

  .btn-cancel:hover,
  .btn-default:hover {
    background-color: ${themeColors.hover};
    border-color: ${themeColors.primary};
    color: ${themeColors.primary};
  }

  .btn-text {
    background-color: transparent;
    border-color: transparent;
    color: ${themeColors.primary};
  }

  .btn-text:hover {
    color: ${themeColors.primaryHover};
    background-color: ${themeColors.hover};
  }
`;

/**
 * Example usage in a component:
 * 
 * import { useContext } from 'react';
 * import { ThemeContext } from '@/context/ThemeContext';
 * import { getButtonStyles, getModalButtonProps } from '@/styles/buttonStyles';
 * import { Button, Modal } from 'antd';
 * 
 * const MyComponent = () => {
 *   const { themeColors } = useContext(ThemeContext);
 *   const buttonStyles = getButtonStyles(themeColors);
 *   const modalButtonProps = getModalButtonProps(themeColors);
 * 
 *   return (
 *     <>
 *       <Button type="primary" style={buttonStyles.primary}>Submit</Button>
 *       <Button style={buttonStyles.cancel}>Cancel</Button>
 *       <Button danger style={buttonStyles.danger}>Delete</Button>
 *       
 *       <Modal
 *         {...modalButtonProps.okButtonProps}
 *         {...modalButtonProps.cancelButtonProps}
 *       >
 *         Content
 *       </Modal>
 *     </>
 *   );
 * };
 */
