// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js');

firebase.initializeApp(firebaseConfig);
console.log('Firebase initialized');
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[Firebase Messaging] Background message received:', payload);

  const notificationTitle = payload?.notification?.title || "Feedback Available";
  const notificationOptions = {
    body: payload?.notification?.body || "A session has ended. Please provide your feedback.",
    icon: "/icon-512x512.png",
    data: payload.data,
    tag: `feedback-${payload.data.sessionId}`,
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = '/student-dashboard';
  event.waitUntil(clients.openWindow(url));
});