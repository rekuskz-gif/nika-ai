require('dotenv').config();
require('../config/firebase');
const axios = require('axios');
const getClientData = require('../helpers/getClientData');
const { saveToFirebase } = require('../helpers/saveToFirebase');
const sendWhatsApp = require('../helpers/sendWhatsApp');
const sendToTelegram = require('../helpers/sendToTelegram');

module.exports = async (req, res) => {
  console.log('\n════════════════════════════════════');
  console.log('WHATSAPP WEBHOOK STARTED');
  console.log('════════════════════════════════════\n');

  try {
    const data = req.body;

    let sender = null;
    let messageText = null;

    if (data?.senderData?.sender) {
      sender = data.senderData.sender;
    }

    if (data?.messageData?.extendedTextMessageData?.text) {
      messageText = data.messageData.extendedTextMessageData.text;
    } else if (data?.messageData?.textMessageData?.textMessage) {
      messageText = data.messageData.textMessageData.textMessage;
    }

    if (sender && sender.includes('@c.us')) {
      sender = sender.replace('@c.us', '');
    }

    console.log(`Sender: ${sender}`);
    console.log(`Message: ${messageText}\n`);

    if (!sender || !messageText) {
      console.log('Missing data - returning');
      res.status(200).send('OK');
      return;
    }

    console.log('Getting client data...');
    const clientData = await getClientData(sender);

    if (!clientData) {
      console.log('Client not found - returning');
      res.status(200).send('OK');
      return;
    }

    const { clientId, claudeApiKey, tgToken, tgChatId, greenApiIdInstance, greenApiToken } = clientData;
    console.log(`Client found: ${clientId}\n`);

    const sessionId = `whatsapp_${sender}_${Date.now()}`;

    saveToFirebase(clientId, sessionId, {
      role: 'user',
      content: messageText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(err => console.error('Firebase user save error:', err.message));

    console.log('Calling Claude API...');

    const systemPrompt = "Ты AI ассистент Ника. Отвечай коротко (1-2 предложения). Будь дружелюбной. Подпись: Ника";

    const claudeResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: messageText }]
      },
      {
        headers: {
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 25000
      }
    );

    console.log('Claude ответил успешно\n');
    const botText = claudeResponse.data.content[0].text;
    console.log(`Ответ Ники: "${botText}"\n`);

    saveToFirebase(clientId, sessionId, {
      role: 'assistant',
      content: botText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(err => console.error('Firebase response save error:', err.message));

    console.log('Отправляю в WhatsApp...');
    await sendWhatsApp(sender, botText, greenApiIdInstance, greenApiToken);
    console.log('Отправлено в WhatsApp\n');

    if (tgToken && tgChatId) {
      console.log('Отправляю в Telegram...');
      const tgMessage = `WhatsApp: ${clientId}\n\nЮзер: ${messageText}\n\nНика: ${botText}`;
      sendToTelegram(tgToken, tgChatId, tgMessage)
        .catch(err => console.error('Telegram error:', err.message));
      console.log('Telegram отправлен\n');
    }

    console.log('════════════════════════════════════');
    console.log('WEBHOOK УСПЕШНО ОБРАБОТАН!');
    console.log('════════════════════════════════════\n');

    res.status(200).send('OK');

  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data));
    }
    res.status(500).send('ERROR');
  }
};
