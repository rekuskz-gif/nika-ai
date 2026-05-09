const admin = require('../config/firebase');

const db = admin.database();

module.exports.saveToFirebase = async (clientId, sessionId, message) => {
  try {
    const ref = db.ref(`chats/${clientId}/${sessionId}/messages`);
    await ref.push(message);
    console.log('✅ Сохранено в Firebase');
  } catch (error) {
    console.error('❌ Ошибка Firebase:', error.message);
  }
};

module.exports.getHistoryFromFirebase = async (clientId, sessionId) => {
  try {
    const ref = db.ref(`chats/${clientId}/${sessionId}/messages`);
    const snapshot = await ref.orderByChild('timestamp').limitToLast(10).once('value');
    const messages = [];
    
    snapshot.forEach(child => {
      messages.push(child.val());
    });
    
    return messages;
  } catch (error) {
    console.error('❌ Ошибка Firebase:', error.message);
    return [];
  }
};
