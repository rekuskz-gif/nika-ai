const axios = require('axios');

module.exports = async (phoneNumber, message, greenApiIdInstance, greenApiToken) => {
  try {
    const url = `https://1105.api.green-api.com/waInstance${greenApiIdInstance}/sendMessage/${greenApiToken}`;
    console.log(`� [WhatsApp] Телефон: ${phoneNumber}`);
    const response = await axios.post(url, { chatId: `${phoneNumber}@c.us`, message });
    console.log(`✅ [WhatsApp] Отправлено успешно`);
    console.log(`� [WhatsApp] Response:`, response.data);
  } catch (error) {
    console.error(`❌ [WhatsApp] Ошибка:`, error.message);
    if (error.response) {
      console.error(`❌ [WhatsApp] Status:`, error.response.status);
      console.error(`❌ [WhatsApp] Data:`, error.response.data);
    }
  }
};
