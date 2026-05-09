const admin = require('firebase-admin');

// Инициализируем Firebase ОДИН РАЗ
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
  
  console.log('✅ Firebase инициализирован');
} else {
  console.log('✅ Firebase уже инициализирован');
}

module.exports = admin;
