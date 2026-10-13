// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzHMnsecGQ-x0waHrqjV4g0hjreoWx_LY",
  authDomain: "homework-8991e.firebaseapp.com",
  projectId: "homework-8991e",
  storageBucket: "homework-8991e.firebasestorage.app",
  messagingSenderId: "766063201557",
  appId: "1:766063201557:web:97f73a209d53ce1a71ad1c",
  measurementId: "G-T5YL6HGR69"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: 'BLt4jX4g5SlaN1uVigrD7zXrw0NmegFDm34wibSdYhQaRKL887kGydPyMOoULM5a71DeQKiiv5UJR5gpW-ayZ-8' 
    });
    if (currentToken) {
      console.log('FCM Token generated:', currentToken);
      // Here you would send the token to your server
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = (callback) => {
  onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export { messaging };
