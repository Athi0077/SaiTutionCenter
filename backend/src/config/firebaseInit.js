const admin = require('firebase-admin');
let serviceAccount = null;

try {
  serviceAccount = require('./firebase-admin.json');
} catch (err) {
  console.warn("firebase-admin.json not found. Checking FIREBASE_SERVICE_ACCOUNT env var...");
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error("Invalid JSON in FIREBASE_SERVICE_ACCOUNT");
    }
  }
}

const apps = admin.getApps ? admin.getApps() : (admin.apps || []);

if (!apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.cert(serviceAccount)
  });
} else if (!serviceAccount) {
  console.warn("Firebase not initialized! Mocking messaging to prevent crashes.");
  admin.messaging = () => ({
    send: async () => console.warn("Firebase mock send called"),
    sendMulticast: async () => console.warn("Firebase mock sendMulticast called")
  });
}

module.exports = admin;
