const admin = require('firebase-admin');
const path = require('path');

// NOTE: To run this locally, you need a service account key JSON file
// or you need to be logged in via 'firebase login' and have default credentials.
// For the purpose of this script, we assume 'firebase-admin' will find credentials.

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'orthopedic-follow-app'
  });
}

const db = admin.firestore();

async function seedAdmin() {
  const adminData = {
    name: 'Hospital Admin',
    username: 'admin',
    role: 'admin',
    created_at: admin.firestore.FieldValue.serverTimestamp()
  };

  const email = 'admin@hospital.com';
  const password = 'admin123';

  console.log(`Setting up Admin: ${email}...`);

  try {
    // 1. Create in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('Admin already exists in Auth.');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: adminData.name,
        });
        console.log('Admin created in Auth.');
      } else {
        throw err;
      }
    }

    // 2. Create in Firestore
    await db.collection('users').doc(userRecord.uid).set(adminData);
    console.log('Admin profile created in Firestore.');

    console.log('\n✅ Admin Seed Successful!');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
}

seedAdmin();
