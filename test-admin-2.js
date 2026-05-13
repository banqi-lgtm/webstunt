const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

async function test() {
  try {
    const link = await admin.auth().generatePasswordResetLink('randomemaildoesntexist123123@gmail.com', {
      url: 'http://localhost:3000/#login'
    });
    console.log('Link:', link);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
