const axios = require('axios');

module.exports = async (tgToken, tgChatId, message) => {
  try {
    const url = `https://api.telegram.org/bot${tgToken}/sendMessage`;
    console.log(`� [Telegram] URL: ${url}`);
    console.log(`� [Telegram] Chat ID: ${tgChatId}`);
    console.log(`� [Telegram] Сообщение: "${message.substring(0, 50)}..."`);
    
    const response = await axios.post(url, {
      chat_id: tgChatId,
      text: message,
      parse_mode: 'Markdown'
    });
    
    console.log(`✅ [Telegram] Отправлено успешно`);
    console.log(`� [Telegram] Response:`, response.data);
  } catch (error) {
    console.error(`❌ [Telegram] Ошибка:`, error.message);
    if (error.response) {
      console.error(`❌ [Telegram] Status:`, error.response.status);
      console.error(`❌ [Telegram] Data:`, error.response.data);
    }
  }
};
