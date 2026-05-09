const axios = require('axios');
console.log('[sendToTelegram-INIT] Module initialized');

module.exports = async (tgToken, tgChatId, message) => {
  try {
    console.log(`\n[sendToTelegram-1] Called with tgChatId=${tgChatId}`);
    console.log(`[sendToTelegram-2] tgToken: ${tgToken.substring(0, 20)}...`);
    console.log(`[sendToTelegram-3] Message length: ${message.length}`);
    
    const url = `https://api.telegram.org/bot${tgToken}/sendMessage`;
    console.log(`[sendToTelegram-4] URL: https://api.telegram.org/bot...`);
    
    const payload = {
      chat_id: tgChatId,
      text: message,
      parse_mode: 'Markdown'
    };
    console.log(`[sendToTelegram-5] Payload prepared`);
    
    console.log(`[sendToTelegram-6] Sending POST request...`);
    const response = await axios.post(url, payload);
    console.log(`[sendToTelegram-7] Response status: ${response.status}`);
    console.log(`[sendToTelegram-8] Response data:`, JSON.stringify(response.data));
    
    return response;
  } catch (error) {
    console.error(`[sendToTelegram-ERROR] Error:`, error.message);
    if (error.response) {
      console.error(`[sendToTelegram-ERROR-STATUS]`, error.response.status);
      console.error(`[sendToTelegram-ERROR-DATA]`, error.response.data);
    }
    throw error;
  }
};
