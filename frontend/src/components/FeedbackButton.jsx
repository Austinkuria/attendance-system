import SystemFeedbackButton from './SystemFeedback/SystemFeedbackButton';

// This component simply re-exports the SystemFeedbackButton for backwards compatibility
const FeedbackButton = () => {
    return <SystemFeedbackButton />;
};

export default FeedbackButton;
