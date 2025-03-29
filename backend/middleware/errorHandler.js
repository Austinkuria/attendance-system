const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Server error:', err);

    // Don't expose stack traces in production
    const errorMessage = process.env.NODE_ENV === 'production'
        ? 'Something went wrong!'
        : err.message;

    res.status(500).json({
        success: false,
        message: errorMessage
    });
};

module.exports = errorHandler;
