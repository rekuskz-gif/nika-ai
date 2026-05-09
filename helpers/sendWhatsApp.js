// ============================================================
// Отправляет ответ в WhatsApp через Green-API
// ============================================================

const axios = require('axios');

const sendWhatsApp = async (phoneNumber, message, greenApiUrl, greenApiIdInstance, greenApiToken) => {
  console.log(`📱 Отправляем в WhatsApp: ${phoneNumber}`);

  try {
    const response = await axios.post(
      `${greenApiUrl}/waAPI/sendMessage/${greenApiIdInstance}/${greenApiToken}`,
      {
        chatId: phoneNumber,
        message: message
      }
    );

    console.log(`✅ Сообщение отправлено в WhatsApp`);
    return response.data;

  } catch (error) {
    console.error('❌ Ошибка sendWhatsApp:', error.message);
    throw error;
  }
};

module.exports = sendWhatsApp;
