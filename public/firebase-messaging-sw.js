importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDt9tzcX01IKqAPKjUDk-tOT3NZm4hHl2Y",
  authDomain: "qr-attendance-123.firebaseapp.com",
  projectId: "qr-attendance-123",
  storageBucket: "qr-attendance-123.appspot.com",
  messagingSenderId: "717525071240",
  appId: "1:717525071240:web:917c811cc6036401c3363d",
  measurementId: "G-XFH8TQ70W5"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[Firebase Messaging] Background message received", payload);

  const notificationTitle = payload?.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload?.notification?.body || "You have a new message!",
    icon: payload?.notification?.icon || "/firebase-logo.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});