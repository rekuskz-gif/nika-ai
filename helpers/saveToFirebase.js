// ============================================================
// Сохраняет сообщения и историю в Firebase
// ============================================================

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const saveToFirebase = async (clientId, sessionId, message) => {
  console.log(`🔥 Сохраняем в Firebase для ${clientId}`);

  try {
    const db = admin.database();
    const historyRef = db.ref(`chats/${clientId}/${sessionId}`);
    
    const snapshot = await historyRef.once('value');
    let chatHistory = snapshot.val() || [];

    // Добавляем сообщение
    chatHistory.push({
      ...message,
      timestamp: Date.now(),
      channel: 'whatsapp'
    });

    await historyRef.set(chatHistory);
    console.log('✅ Сохранено в Firebase');

    return chatHistory;

  } catch (error) {
    console.error('❌ Ошибка saveToFirebase:', error.message);
    throw error;
  }
};

const getHistoryFromFirebase = async (clientId, sessionId) => {
  console.log(`📚 Читаем историю из Firebase`);

  try {
    const db = admin.database();
    const historyRef = db.ref(`chats/${clientId}/${sessionId}`);
    
    const snapshot = await historyRef.once('value');
    const chatHistory = snapshot.val() || [];

    console.log(`✅ Загружено ${chatHistory.length} сообщений`);
    return chatHistory;

  } catch (error) {
    console.error('❌ Ошибка getHistoryFromFirebase:', error.message);
    throw error;
  }
};

module.exports = {
  saveToFirebase,
  getHistoryFromFirebase
};
