require('dotenv').config();
require('../config/firebase');
const axios = require('axios');
const getClientData = require('../helpers/getClientData');
const { saveToFirebase } = require('../helpers/saveToFirebase');
const sendWhatsApp = require('../helpers/sendWhatsApp');
const sendToTelegram = require('../helpers/sendToTelegram');

module.exports = async (req, res) => {
  console.log('\n════════════════════════════════════');
  console.log('� WHATSAPP WEBHOOK STARTED');
  console.log('════════════════════════════════════\n');

  res.status(200).send('OK');

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

    console.log(`� Sender: ${sender}`);
    console.log(`� Message: ${messageText}\n`);

    if (!sender || !messageText) {
      console.log('⚠️ Missing data - returning');
      return;
    }

    console.log('� Getting client data...');
    const clientData = await getClientData(sender);

    if (!clientData) {
      console.log('❌ Client not found - returning');
      return;
    }

    const { clientId, claudeApiKey, tgToken, tgChatId, greenApiIdInstance, greenApiToken } = clientData;
    console.log(`✅ Client found: ${clientId}\n`);

    const sessionId = `whatsapp_${sender}_${Date.now()}`;

    // Firebase async
    saveToFirebase(clientId, sessionId, {
      role: 'user',
      content: messageText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(err => console.error('❌ Firebase user save error:', err.message));

    console.log('� Calling Claude API...');
    
    const systemPrompt = "Ты AI ассистент Ника. Отвечай коротко (1-2 предложения). Будь дружелюбной. Подпись: Ника �";
    
    const claudeMessages = [
      {
        role: 'user',
        content: messageText
      }
    ];

    console.error('[CRITICAL-BEFORE-CLAUDE] About to call Claude...');
    
    const claudeResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages
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

    console.error('[CRITICAL-AFTER-CLAUDE] Claude responded!');
    console.error('[CRITICAL-STATUS]', claudeResponse.status);
    console.error('[CRITICAL-DATA]', JSON.stringify(claudeResponse.data, null, 2));

    const botText = claudeResponse.data.content[0].text;
    console.error(`[CRITICAL-BOT-TEXT] "${botText}"`);

    // Firebase async response
    saveToFirebase(clientId, sessionId, {
      role: 'assistant',
      content: botText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(err => console.error('❌ Firebase response save error:', err.message));

    console.error('[CRITICAL-BEFORE-WHATSAPP] About to send WhatsApp...');
    
    await sendWhatsApp(sender, botText, greenApiIdInstance, greenApiToken);
    
    console.error('[CRITICAL-AFTER-WHATSAPP] WhatsApp sent!');

    if (tgToken && tgChatId) {
      const tgMessage = `� *WhatsApp: ${clientId}*\n\n� *Юзер:* ${messageText}\n\n� *Nika:* ${botText}`;
      sendToTelegram(tgToken, tgChatId, tgMessage)
        .catch(err => console.error('❌ Telegram error:', err.message));
      console.error('[CRITICAL-TELEGRAM-SENT]');
    }

    console.error('[CRITICAL-SUCCESS] WEBHOOK COMPLETE!');
    console.log('\n════════════════════════════════════');
    console.log('✅ WEBHOOK УСПЕШНО ОБРАБОТАН!');
    console.log('════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ❌ ❌ КРИТИЧЕСКАЯ ОШИБКА ❌ ❌ ❌');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Stack:', error.stack);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    console.error('════════════════════════════════════\n');
  }
};
