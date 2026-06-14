const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Parse private key correctly
let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
const privateKey = rawKey.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

const db = admin.firestore();

async function checkCodigos() {
  const snapshot = await db.collection('codigos').get();
  console.log(`Found ${snapshot.size} codigos.`);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}

checkCodigos().catch(console.error);
