const axios = require('axios');

module.exports = async (phoneNumber, message, greenApiIdInstance, greenApiToken) => {
  try {
    console.error('[WA-1] Starting sendWhatsApp');
    console.error('[WA-2] Phone:', phoneNumber);
    console.error('[WA-3] Message:', message.substring(0, 50));
    
    const url = `https://1105.api.green-api.com/waInstance${greenApiIdInstance}/sendMessage/${greenApiToken}`;
    console.error('[WA-4] URL:', url);
    
    const payload = {
      chatId: `${phoneNumber}@c.us`,
      message: message
    };
    console.error('[WA-5] Payload:', JSON.stringify(payload));

    console.error('[WA-6] Calling axios.post...');
    
    const response = await axios.post(url, payload, {
      timeout: 10000
    });

    console.error('[WA-7] Response received');
    console.error('[WA-8] Status:', response.status);
    console.error('[WA-9] Data:', JSON.stringify(response.data));
    
    return response;
  } catch (error) {
    console.error('[WA-ERROR] Error:', error.message);
    console.error('[WA-ERROR-CODE]', error.code);
    if (error.response) {
      console.error('[WA-ERROR-STATUS]', error.response.status);
      console.error('[WA-ERROR-DATA]', error.response.data);
    }
    throw error;
  }
};
