// ============================================================
// Отправляет уведомление менеджеру в Telegram
// ============================================================

const axios = require('axios');

const sendToTelegram = async (tgToken, tgChatId, message, buttons = null) => {
  console.log(`📤 Отправляем в Telegram`);

  try {
    const msgBody = {
      chat_id: tgChatId,
      text: message,
      parse_mode: 'HTML'
    };

    if (buttons) {
      msgBody.reply_markup = { inline_keyboard: buttons };
    }

    const response = await axios.post(
      `https://api.telegram.org/bot${tgToken}/sendMessage`,
      msgBody
    );

    console.log(`✅ Отправлено в Telegram`);
    return response.data;

  } catch (error) {
    console.error('❌ Ошибка sendToTelegram:', error.message);
    throw error;
  }
};

module.exports = sendToTelegram;
