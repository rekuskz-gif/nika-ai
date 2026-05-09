require('dotenv').config();
require('../config/firebase');
const axios = require('axios');
const getClientData = require('../helpers/getClientData');
const { saveToFirebase } = require('../helpers/saveToFirebase');
const sendWhatsApp = require('../helpers/sendWhatsApp');
const sendToTelegram = require('../helpers/sendToTelegram');

module.exports = async (req, res) => {
  console.error('� START');
  res.status(200).send('OK');

  try {
    const data = req.body;
    let sender = data?.senderData?.sender;
    let messageText = data?.messageData?.extendedTextMessageData?.text;

    if (sender?.includes('@c.us')) sender = sender.replace('@c.us', '');

    if (!sender || !messageText) {
      console.error('❌ NO DATA');
      return;
    }

    const clientData = await getClientData(sender);
    if (!clientData) {
      console.error('❌ NO CLIENT');
      return;
    }

    const { clientId, claudeApiKey, greenApiIdInstance, greenApiToken, tgToken, tgChatId } = clientData;
    const sessionId = `whatsapp_${sender}_${Date.now()}`;

    saveToFirebase(clientId, sessionId, {
      role: 'user',
      content: messageText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(e => console.error('FB_ERR:', e.message));

    console.error('� CALLING CLAUDE');

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
        timeout: 20000
      }
    );

    console.error('✅ CLAUDE OK');
    const botText = claudeResponse.data.content[0].text;
    console.error('� BOT:', botText);

    saveToFirebase(clientId, sessionId, {
      role: 'assistant',
      content: botText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(e => console.error('FB_ERR:', e.message));

    console.error('� SENDING WHATSAPP');
    await sendWhatsApp(sender, botText, greenApiIdInstance, greenApiToken);
    console.error('✅ WHATSAPP OK');

    if (tgToken && tgChatId) {
      sendToTelegram(tgToken, tgChatId, `� ${clientId}\n� ${messageText}\n� ${botText}`)
        .catch(e => console.error('TG_ERR:', e.message));
    }

    console.error('✅ SUCCESS');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('STATUS:', error.response.status);
      console.error('DATA:', error.response.data);
    }
  }
};
