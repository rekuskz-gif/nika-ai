require('dotenv').config();
require('../config/firebase');
const axios = require('axios');
const getClientData = require('../helpers/getClientData');

module.exports = async (req, res) => {
  console.error('� START');
  res.status(200).send('OK');

  try {
    console.error('\n═══ INCOMING DATA ═══');
    console.error('req.body:', JSON.stringify(req.body, null, 2));

    const data = req.body;
    let sender = data?.senderData?.sender;
    let messageText = data?.messageData?.extendedTextMessageData?.text;

    if (sender?.includes('@c.us')) sender = sender.replace('@c.us', '');

    console.error('\n═══ EXTRACTED ═══');
    console.error('sender:', sender);
    console.error('messageText:', messageText);

    if (!sender || !messageText) {
      console.error('❌ NO DATA');
      return;
    }

    console.error('\n═══ GETTING CLIENT DATA ═══');
    const clientData = await getClientData(sender);
    console.error('clientData:', JSON.stringify(clientData, null, 2));

    if (!clientData) {
      console.error('❌ NO CLIENT');
      return;
    }

    const { clientId, claudeApiKey, greenApiIdInstance, greenApiToken } = clientData;

    console.error('\n═══ CLAUDE API KEY ═══');
    console.error('Full key:', claudeApiKey);
    console.error('Length:', claudeApiKey.length);
    console.error('First 30 chars:', claudeApiKey.substring(0, 30));
    console.error('Last 30 chars:', claudeApiKey.substring(claudeApiKey.length - 30));

    console.error('\n═══ CALLING CLAUDE ═══');
    console.error('URL: https://api.anthropic.com/v1/messages');
    console.error('Model: claude-haiku-4-5-20251001');
    console.error('Message:', messageText);

    const startTime = Date.now();
    console.error('Request sent at:', new Date().toISOString());

    const claudeResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'Ты Ника. Отвечай 1-2 предложения.',
        messages: [{ role: 'user', content: messageText }]
      },
      {
        headers: {
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 15000
      }
    );

    const duration = Date.now() - startTime;
    console.error('\n═══ CLAUDE RESPONSE ═══');
    console.error('Duration:', duration, 'ms');
    console.error('Status:', claudeResponse.status);
    console.error('Response:', JSON.stringify(claudeResponse.data, null, 2));

    const botText = claudeResponse.data.content[0].text;
    console.error('Bot text:', botText);
    console.error('\n✅ SUCCESS');

  } catch (error) {
    console.error('\n═══ ERROR ═══');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Time:', new Date().toISOString());
    
    if (error.response) {
      console.error('\n═══ RESPONSE ERROR ═══');
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }

    if (error.request && !error.response) {
      console.error('\n═══ NO RESPONSE ═══');
      console.error('Request was made but no response received');
      console.error('Request:', error.request);
    }

    console.error('Stack:', error.stack);
  }
};
