const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('🔥 Initialized with Service Account');
    } catch (err) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', err);
      admin.initializeApp();
    }
  } else {
    // In Cloud Functions or with GOOGLE_APPLICATION_CREDENTIALS
    admin.initializeApp();
  }
}

const db = admin.firestore();

/**
 * Migration Mapping:
 * - users: Collection 'users'
 * - quotas: Collection 'quotas', ID format: '${userId}_${month}'
 * - schedules: Collection 'schedules', ID format: '${userId}_${date}_${shiftType}'
 */

const getDb = () => db;

// Helper to simulate Knex-like behavior or just provide the Firestore instance
async function initDb() {
  console.log('🔥 Connected to Firebase Firestore');
  // Firestore doesn't need table initialization like SQL
  return db;
}

module.exports = { getDb, initDb, admin };
