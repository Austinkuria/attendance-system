/**
 * Saves anonymous feedback to localStorage
 * @param {Object} feedbackData - The feedback data to save
 * @param {boolean} [serverSubmit=false] - Whether to also submit to server
 * @returns {Promise<Object>} - Result of the operation
 */
export const saveAnonymousFeedback = async (feedbackData, serverSubmit = false) => {
    try {
        // Add timestamp and default status for local tracking
        const feedbackWithTimestamp = {
            ...feedbackData,
            localTimestamp: new Date().toISOString(),
            status: 'Submitted', // Default status for local feedback
            anonymous: true
        };

        // Get existing feedback
        const existingFeedback = localStorage.getItem('anonymousFeedback');
        const feedbackArray = existingFeedback ? JSON.parse(existingFeedback) : [];

        // Add new feedback to the beginning of the array
        feedbackArray.unshift(feedbackWithTimestamp);

        // Store back in localStorage (limit to 10 most recent to save space)
        localStorage.setItem('anonymousFeedback', JSON.stringify(feedbackArray.slice(0, 10)));

        // If serverSubmit is true, also send to server
        if (serverSubmit) {
            // Import here to avoid circular dependency
            const { submitAnonymousSystemFeedback } = await import('../services/api');
            try {
                // Make sure we're explicitly marking this as completely anonymous feedback
                // by someone who is NOT authenticated
                const response = await submitAnonymousSystemFeedback({
                    ...feedbackData,
                    anonymous: true,
                    isPublicAnonymous: true // This flag helps differentiate between auth and non-auth anonymous submissions
                });

                return {
                    success: true,
                    serverSubmitted: true,
                    response
                };
            } catch (serverError) {
                console.error('Error submitting to server:', serverError);
                // Check if this was an auth error that we can ignore
                if (serverError.response?.status === 401) {
                    // If it's a 401, it means the anonymous endpoint requires auth - fallback to local storage only
                    console.warn('Anonymous submissions require authentication. Falling back to local storage only.');
                    return {
                        success: true,
                        serverSubmitted: false,
                        error: 'Anonymous submissions currently unavailable. Feedback saved locally only.'
                    };
                }
                return {
                    success: true,
                    serverSubmitted: false,
                    error: serverError
                };
            }
        }

        return { success: true, serverSubmitted: false };
    } catch (error) {
        console.error('Error saving feedback to localStorage:', error);
        return { success: false, error };
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
