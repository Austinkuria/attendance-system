// backend/services/firebaseService.js
const admin = require('firebase-admin');
const User = require('../models/User');

// Use environment variable for Vercel
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendNotification = async (userIds, payload) => {
  try {
    const users = await User.find({ _id: { $in: userIds } });
    const fcmTokens = users.filter(u => u.fcmToken).map(u => u.fcmToken);
    if (fcmTokens.length === 0) {
      console.log('No FCM tokens found for users:', userIds);
      return;
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.message,
      },
      data: payload.data,
      tokens: fcmTokens,
    };
    const response = await admin.messaging().sendMulticast(message);
    console.log('Notification sent:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};