const axios = require('axios');

module.exports = async (phoneNumber, message, greenApiUrl, greenApiIdInstance, greenApiToken) => {
  try {
    const url = `${greenApiUrl}/waInstance${greenApiIdInstance}/sendMessage/${greenApiToken}`;

    const response = await axios.post(url, {
      chatId: `${phoneNumber}@c.us`,
      message: message
    });

    console.log('✅ Отправлено в WhatsApp');
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка sendWhatsApp:', error.message);
  }
};
