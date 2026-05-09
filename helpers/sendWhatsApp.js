const axios = require('axios');
console.log('[sendWhatsApp-INIT] Module initialized');

module.exports = async (phoneNumber, message, greenApiIdInstance, greenApiToken) => {
  try {
    console.log(`\n[sendWhatsApp-1] Called with phoneNumber=${phoneNumber}`);
    console.log(`[sendWhatsApp-2] Message: "${message}"`);
    console.log(`[sendWhatsApp-3] greenApiIdInstance: ${greenApiIdInstance}`);
    console.log(`[sendWhatsApp-4] greenApiToken: ${greenApiToken.substring(0, 20)}...`);
    
    const url = `https://1105.api.green-api.com/waInstance${greenApiIdInstance}/sendMessage/${greenApiToken}`;
    console.log(`[sendWhatsApp-5] URL: ${url}`);
    
    const payload = {
      chatId: `${phoneNumber}@c.us`,
      message: message
    };
    console.log(`[sendWhatsApp-6] Payload:`, JSON.stringify(payload));
    
    console.log(`[sendWhatsApp-7] Sending POST request...`);
    const response = await axios.post(url, payload);
    console.log(`[sendWhatsApp-8] Response status: ${response.status}`);
    console.log(`[sendWhatsApp-9] Response data:`, JSON.stringify(response.data));
    
    return response;
  } catch (error) {
    console.error(`[sendWhatsApp-ERROR] Error:`, error.message);
    if (error.response) {
      console.error(`[sendWhatsApp-ERROR-STATUS]`, error.response.status);
      console.error(`[sendWhatsApp-ERROR-DATA]`, error.response.data);
    }
    throw error;
  }
};
