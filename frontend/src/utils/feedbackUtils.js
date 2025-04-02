/**
 * Saves anonymous feedback to localStorage
 * @param {Object} feedbackData - The feedback data to save
 * @returns {boolean} - Success status
 */
export const saveAnonymousFeedback = (feedbackData) => {
    try {
        // Add timestamp and default status for local tracking
        const feedbackWithTimestamp = {
            ...feedbackData,
            localTimestamp: new Date().toISOString(),
            status: 'Submitted' // Default status for local feedback
        };

        // Get existing feedback
        const existingFeedback = localStorage.getItem('anonymousFeedback');
        const feedbackArray = existingFeedback ? JSON.parse(existingFeedback) : [];

        // Add new feedback to the beginning of the array
        feedbackArray.unshift(feedbackWithTimestamp);

        // Store back in localStorage (limit to 10 most recent to save space)
        localStorage.setItem('anonymousFeedback', JSON.stringify(feedbackArray.slice(0, 10)));

        return true;
    } catch (error) {
        console.error('Error saving feedback to localStorage:', error);
        return false;
    }
};

/**
 * Gets anonymous feedback from localStorage
 * @returns {Array} - Array of feedback items
 */
export const getAnonymousFeedback = () => {
    try {
        const storedFeedback = localStorage.getItem('anonymousFeedback');
        return storedFeedback ? JSON.parse(storedFeedback) : [];
    } catch (error) {
        console.error('Error retrieving anonymous feedback from localStorage:', error);
        return [];
    }
};
