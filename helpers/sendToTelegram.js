const axios = require('axios');

module.exports = async (tgToken, tgChatId, message) => {
  try {
    const url = `https://api.telegram.org/bot${tgToken}/sendMessage`;

    await axios.post(url, {
      chat_id: tgChatId,
      text: message,
      parse_mode: 'Markdown'
    });

    console.log('✅ Отправлено в Telegram');
  } catch (error) {
    console.error('❌ Ошибка sendToTelegram:', error.message);
  }
};
