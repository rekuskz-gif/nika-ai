const admin = require('../config/firebase');
const db = admin.database();

module.exports.saveToFirebase = async (clientId, sessionId, message) => {
  try {
    const ref = db.ref(`chats/${clientId}/${sessionId}/messages`);
    await ref.push(message);
  } catch (error) {
    console.error('❌ Firebase error:', error.message);
  }
};

module.exports.getHistoryFromFirebase = async (clientId, sessionId) => {
  try {
    const snapshot = await db.ref(`chats/${clientId}/${sessionId}/messages`)
      .orderByChild('timestamp')
      .limitToLast(10)
      .once('value');
    const messages = [];
    snapshot.forEach(child => messages.push(child.val()));
    return messages;
  } catch (error) {
    console.error('❌ Firebase error:', error.message);
    return [];
  }
};
