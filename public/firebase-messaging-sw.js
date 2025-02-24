// Import Firebase scripts properly for service workers
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

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
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log("[Firebase Messaging] Background message received", payload);
  
  const { title, body, icon } = payload.notification;

  self.registration.showNotification(title, {
    body: body,
    icon: icon || "/firebase-logo.png",
    actions: [
      { action: "open_app", title: "Open App" }
    ]
  });
});

// Handle notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        clients.openWindow("/");
      }
    })
  );
});
