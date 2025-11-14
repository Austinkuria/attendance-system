const mongoose = require('mongoose');
const RefreshToken = require('../models/RefreshToken');
require('dotenv').config();

/**
 * Cleanup script for expired refresh tokens
 * Can be run as a cron job or scheduled task
 */

const cleanupExpiredTokens = async () => {
    try {
        console.log('Starting cleanup of expired refresh tokens...');

        // Connect to database if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('Connected to database');
        }

        // Delete tokens that are expired or revoked for more than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await RefreshToken.deleteMany({
            $or: [
                { expiresAt: { $lt: new Date() } }, // Expired tokens
                { revokedAt: { $lt: thirtyDaysAgo } }, // Revoked tokens older than 30 days
                { isActive: false, updatedAt: { $lt: thirtyDaysAgo } } // Inactive tokens older than 30 days
            ]
        });

        console.log(`Cleanup completed. Deleted ${result.deletedCount} expired/revoked tokens.`);

        // Get statistics
        const activeTokens = await RefreshToken.countDocuments({ isActive: true });
        const totalTokens = await RefreshToken.countDocuments();

        console.log(`Active tokens: ${activeTokens}`);
        console.log(`Total tokens in database: ${totalTokens}`);

        return {
            deleted: result.deletedCount,
            active: activeTokens,
            total: totalTokens
        };
    } catch (error) {
        console.error('Error during token cleanup:', error);
        throw error;
    } finally {
        // Close database connection if we opened it
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('Database connection closed');
        }
    }
};

// Run cleanup if called directly
if (require.main === module) {
    cleanupExpiredTokens()
        .then((stats) => {
            console.log('Cleanup stats:', stats);
            process.exit(0);
        })
        .catch((error) => {
            console.error('Cleanup failed:', error);
            process.exit(1);
        });
}

module.exports = cleanupExpiredTokens;
