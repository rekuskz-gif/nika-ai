const axios = require('axios');

module.exports = async (phoneNumber, message, greenApiIdInstance, greenApiToken) => {
  console.log(`[WA-1] Starting sendWhatsApp`);
  console.log(`[WA-2] Phone: ${phoneNumber}`);
  console.log(`[WA-3] Message: ${message.substring(0, 50)}`);

  const url = `https://1105.api.green-api.com/waInstance${greenApiIdInstance}/sendMessage/${greenApiToken}`;
  console.log(`[WA-4] URL: ${url}`);

  const payload = { chatId: `${phoneNumber}@c.us`, message };
  console.log(`[WA-5] Payload: ${JSON.stringify(payload)}`);

  try {
    console.log(`[WA-6] Calling axios.post...`);
    const response = await axios.post(url, payload, { timeout: 10000 });
    console.log(`[WA-7] ✅ Отправлено успешно`);
    console.log(`[WA-8] Response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[WA-ERROR] ❌ Ошибка:`, error.message);
    if (error.code === 'ECONNABORTED') {
      console.error(`[WA-ERROR] Таймаут — Green-API не ответил за 10 секунд`);
    }
    if (error.response) {
      console.error(`[WA-ERROR] Status:`, error.response.status);
      console.error(`[WA-ERROR] Data:`, error.response.data);
    }
    throw error;
  }
};
