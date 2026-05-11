const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('event_registrations').get();
  const counts = { open: 0, '2t': 0, '4t': 0, alto: 0 };
  let openPilots = [];
  
  snapshot.forEach(d => {
    const data = d.data();
    const cats = data.categoria || data.categorias;
    if (cats && data.estadoPago === 'aprobado') {
      if (Array.isArray(cats)) {
        cats.forEach(c => {
          counts[c] = (counts[c] || 0) + 1;
          if (c === 'open' || c === 'OPEN') openPilots.push(data.uid);
        });
      } else {
        counts[cats] = (counts[cats] || 0) + 1;
        if (cats === 'open' || cats === 'OPEN') openPilots.push(data.uid);
      }
    }
  });
  
  console.log('Category Counts:', counts);
  process.exit(0);
}

run().catch(console.error);
