const admin = require('../config/firebase');
const db = admin.database();

module.exports.saveToFirebase = async (clientId, sessionId, message) => {
  try {
    console.log(`� [Firebase] Сохраняю: ${message.role} - "${message.content.substring(0, 30)}..."`);
    const ref = db.ref(`chats/${clientId}/${sessionId}/messages`);
    const result = await ref.push(message);
    console.log(`✅ [Firebase] Сохранено успешно - ID: ${result.key}`);
    return result;
  } catch (error) {
    console.error(`❌ [Firebase] Ошибка сохранения:`, error.message);
    console.error(`❌ [Firebase] Stack:`, error.stack);
    throw error;
  }
};

module.exports.getHistoryFromFirebase = async (clientId, sessionId) => {
  try {
    console.log(`� [Firebase] Получаю историю ${clientId}/${sessionId}...`);
    const snapshot = await db.ref(`chats/${clientId}/${sessionId}/messages`)
      .orderByChild('timestamp')
      .limitToLast(10)
      .once('value');
    
    console.log(`� [Firebase] Snapshot received`);
    
    const messages = [];
    snapshot.forEach(child => {
      messages.push(child.val());
    });
    
    console.log(`✅ [Firebase] История загружена: ${messages.length} сообщений`);
    return messages;
  } catch (error) {
    console.error(`❌ [Firebase] Ошибка получения:`, error.message);
    console.error(`❌ [Firebase] Stack:`, error.stack);
    return [];
  }
};
