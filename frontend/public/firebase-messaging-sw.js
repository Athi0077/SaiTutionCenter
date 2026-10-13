importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// "Default" Firebase configuration (prevents errors)
const firebaseConfig = {
  apiKey: "AIzaSyDzHMnsecGQ-x0waHrqjV4g0hjreoWx_LY",
  authDomain: "homework-8991e.firebaseapp.com",
  projectId: "homework-8991e",
  storageBucket: "homework-8991e.firebasestorage.app",
  messagingSenderId: "766063201557",
  appId: "1:766063201557:web:97f73a209d53ce1a71ad1c",
  measurementId: "G-T5YL6HGR69"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg' // You can update this to your app's icon
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
