/* eslint-env serviceworker */

console.log('Attempting to load Firebase scripts...');
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  console.log('firebase-app.js loaded');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js');
  console.log('firebase-messaging.js loaded');
} catch (error) {
  console.error('Failed to load Firebase scripts:', error);
  throw error;
}

const firebaseConfig = {
  apiKey: "AIzaSyDt9tzcX01IKqAPKjUDk-tOT3NZm4hHl2Y",
  authDomain: "qr-attendance-123.firebaseapp.com",
  projectId: "qr-attendance-123",
  storageBucket: "qr-attendance-123.appspot.com",
  messagingSenderId: "717525071240",
  appId: "1:717525071240:web:917c811cc6036401c3363d",
  measurementId: "G-XFH8TQ70W5"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[Firebase Messaging] Background message received:', payload);

  const notificationTitle = payload?.notification?.title || "Feedback Available";
  const notificationOptions = {
    body: payload?.notification?.body || "A session has ended. Please provide your feedback.",
    icon: "/firebase-logo.png",
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