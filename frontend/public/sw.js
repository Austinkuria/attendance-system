// Import Firebase scripts
importScripts('./firebase-app.js');
importScripts('./firebase-messaging.js');



// Initialize Firebase Messaging
const messaging = self.messaging();

// Handle background messages
messaging.setBackgroundMessageHandler((payload) => {
  console.log('Background message received:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png' // Customize the icon path as needed
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
