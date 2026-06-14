const admin = require('firebase-admin');
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyMatch = envContent.match(/FIREBASE_PRIVATE_KEY="(.*?)"/s);
const privateKey = keyMatch ? keyMatch[1].replace(/\\n/g, '\n') : '';

console.log("Length:", privateKey.length);
console.log("Start:", privateKey.substring(0, 30));
console.log("End:", privateKey.substring(privateKey.length - 30));

// admin.initializeApp({

const db = admin.firestore();

function getInitials(name) {
  if (!name) return 'XX';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'XX';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function fixCodigos() {
  try {
    const codigosRef = db.collection('codigos');
    const snapshot = await codigosRef.get();
    
    // First, find all wrong codigos
    const wrongCodigos = [];
    const userMaxNum = {}; // uid -> maxNum
    
    snapshot.forEach(doc => {
      const id = doc.id;
      const data = doc.data();
      
      const isWrongFormat = !id.startsWith('PKS-');
      
      if (isWrongFormat) {
        wrongCodigos.push({ id, data });
      } else {
        // It's correct format, track the max number
        const uid = data.asignadoAUid;
        if (uid) {
          const name = data.asignadoANombre || 'XX';
          const prefix = `PKS-${getInitials(name)}`;
          
          if (id.startsWith(prefix)) {
            const numStr = id.replace(prefix, '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num)) {
              if (!userMaxNum[uid] || num > userMaxNum[uid]) {
                userMaxNum[uid] = num;
              }
            }
          }
        }
      }
    });

    // Sort wrongCodigos by creation date to maintain sequence if possible
    wrongCodigos.sort((a, b) => {
      const timeA = new Date(a.data.creadoEl || 0).getTime();
      const timeB = new Date(b.data.creadoEl || 0).getTime();
      return timeA - timeB;
    });

    console.log(`Found ${wrongCodigos.length} codes to fix.`);

    for (const item of wrongCodigos) {
      const { id, data } = item;
      const uid = data.asignadoAUid;
      if (!uid) {
        console.log(`Skipping doc ${id} because no asignadoAUid`);
        continue;
      }
      
      const name = data.asignadoANombre || 'XX';
      const prefix = `PKS-${getInitials(name)}`;
      
      if (!userMaxNum[uid]) userMaxNum[uid] = 0;
      
      userMaxNum[uid]++;
      const nextNumStr = userMaxNum[uid].toString().padStart(3, '0');
      const newId = `${prefix}${nextNumStr}`;
      
      console.log(`Migrating ${id} -> ${newId}`);
      
      // Save new doc
      await codigosRef.doc(newId).set(data);
      // Delete old doc
      await codigosRef.doc(id).delete();
    }
    
    console.log("Migration complete!");
  } catch(e) {
    console.error(e);
  }
}

fixCodigos();
