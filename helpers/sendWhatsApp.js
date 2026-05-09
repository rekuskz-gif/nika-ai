const axios = require('axios');

module.exports = async (phoneNumber, message, greenApiIdInstance, greenApiToken) => {
  try {
    const url = `https://1105.api.green-api.com/waInstance${greenApiIdInstance}/sendMessage/${greenApiToken}`;
    await axios.post(url, {
      chatId: `${phoneNumber}@c.us`,
      message: message
    });
  } catch (error) {
    console.error('❌ WhatsApp error:', error.message);
    throw error;
  }
};
