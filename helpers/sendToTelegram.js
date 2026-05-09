const axios = require('axios');

module.exports = async (tgToken, tgChatId, message) => {
  try {
    await axios.post(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      chat_id: tgChatId, text: message, parse_mode: 'Markdown'
    });
    console.log(`✅ [Telegram] Отправлено успешно`);
  } catch (error) {
    console.error(`❌ [Telegram] Ошибка:`, error.message);
  }
};
