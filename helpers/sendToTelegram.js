const axios = require('axios');

module.exports = async (tgToken, tgChatId, message) => {
  try {
    await axios.post(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      chat_id: tgChatId,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('❌ Telegram error:', error.message);
    throw error;
  }
};
