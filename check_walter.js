import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve('.env.local') });

const serviceAccount = JSON.parse(readFileSync('public/sponsors/studio-7782861871-351ce-firebase-adminsdk-fbsvc-67a10efe2a.json', 'utf8'));
serviceAccount.project_id = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function main() {
  const usersRef = db.collection('users');
  const q = await usersRef.where('email', '==', 'walter12345@hotmail.com').get();
  
  if (q.empty) {
    console.log('User not found');
    return;
  }
  
  const user = q.docs[0];
  const uid = user.id;
  console.log('Walter UID:', uid);
  
  const regRef = db.collection('event_registrations').doc(`f2r_${uid}`);
  const reg = await regRef.get();
  
  if (!reg.exists) {
    console.log('Registration not found');
  } else {
    console.log('Registration Data:', reg.data());
  }
  process.exit(0);
}

main().catch(console.error);
