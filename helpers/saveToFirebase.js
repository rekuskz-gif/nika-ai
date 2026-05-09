const admin = require('../config/firebase');
const db = admin.database();

console.log('[saveToFirebase-INIT] Module initialized');

module.exports.saveToFirebase = async (clientId, sessionId, message) => {
  try {
    console.log(`\n[saveToFirebase-1] Called with clientId=${clientId}, sessionId=${sessionId}`);
    console.log(`[saveToFirebase-2] Message:`, JSON.stringify(message));
    
    const path = `chats/${clientId}/${sessionId}/messages`;
    console.log(`[saveToFirebase-3] Database path: ${path}`);
    
    const ref = db.ref(path);
    console.log(`[saveToFirebase-4] Reference created`);
    
    console.log(`[saveToFirebase-5] Pushing message...`);
    const result = await ref.push(message);
    console.log(`[saveToFirebase-6] Push completed`);
    console.log(`[saveToFirebase-7] Generated key: ${result.key}`);
    
    return result;
  } catch (error) {
    console.error(`[saveToFirebase-ERROR] Error:`, error.message);
    console.error(`[saveToFirebase-ERROR-STACK]`, error.stack);
    throw error;
  }
};

module.exports.getHistoryFromFirebase = async (clientId, sessionId) => {
  try {
    console.log(`\n[getHistory-1] Called with clientId=${clientId}, sessionId=${sessionId}`);
    
    const path = `chats/${clientId}/${sessionId}/messages`;
    console.log(`[getHistory-2] Database path: ${path}`);
    
    console.log(`[getHistory-3] Fetching data...`);
    const snapshot = await db.ref(path)
      .orderByChild('timestamp')
      .limitToLast(10)
      .once('value');
    console.log(`[getHistory-4] Snapshot received`);
    
    const messages = [];
    snapshot.forEach(child => {
      messages.push(child.val());
      console.log(`[getHistory-5] Message added:`, child.val());
    });
    
    console.log(`[getHistory-6] Total messages: ${messages.length}`);
    return messages;
  } catch (error) {
    console.error(`[getHistory-ERROR] Error:`, error.message);
    console.error(`[getHistory-ERROR-STACK]`, error.stack);
    return [];
  }
};
