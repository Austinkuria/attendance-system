import React from 'react';
import SystemFeedbackButton from '../SystemFeedback/SystemFeedbackButton';

/**
 * Higher-order component that wraps any page with the SystemFeedbackButton
 * @param {React.ComponentType} Component - The component to wrap
 * @returns {React.FC} The wrapped component with feedback button
 */
const WithFeedbackButton = (Component) => {
    const WrappedComponent = (props) => {
        return (
            <>
                <Component {...props} />
                <SystemFeedbackButton />
            </>
        );
    };

    // Copy the display name from the wrapped component
    WrappedComponent.displayName = `WithFeedbackButton(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
};

export default WithFeedbackButton;
