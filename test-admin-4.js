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
  let uid = null;
  try {
    const user = await admin.auth().createUser({
      email: 'test_real_user_12345@gmail.com',
      password: 'password123'
    });
    uid = user.uid;
    console.log('User created:', uid);
    
    const link = await admin.auth().generatePasswordResetLink('test_real_user_12345@gmail.com', {
      url: 'http://localhost:3000/#login'
    });
    console.log('Link:', link);
  } catch(e) {
    console.error('Error:', e);
  } finally {
    if (uid) {
      await admin.auth().deleteUser(uid);
      console.log('User deleted');
    }
  }
}
test();
