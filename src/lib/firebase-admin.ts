import * as admin from 'firebase-admin';

export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      if (process.env.FIREBASE_PRIVATE_KEY) {
        // Entorno local: usar variables de entorno explícitas
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        // Entorno de producción (Firebase App Hosting/Functions): usar credenciales por defecto
        admin.initializeApp();
      }
      console.log('Firebase Admin Initialized Successfully');
    } catch (error) {
      console.error('Firebase Admin Initialization Error', error);
    }
  }
  return admin;
}

export const getAdminAuth = () => getFirebaseAdmin().auth();
export const getAdminDb = () => getFirebaseAdmin().firestore();
