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

    // Firebase async - don't wait
    console.log('� Saving incoming message to Firebase...');
    saveToFirebase(clientId, sessionId, {
      role: 'user',
      content: messageText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(err => console.error('❌ Firebase user save error:', err.message));
    console.log('✅ Firebase save triggered (async)');

    console.log('\n� Preparing Claude API request...');
    
    const systemPrompt = "Ты AI ассистент Ника. Отвечай коротко (1-2 предложения). Будь дружелюбной. Подпись: Ника �";
    
    const claudeMessages = [
      {
        role: 'user',
        content: messageText
      }
    ];

    console.log(`� Messages prepared: ${claudeMessages.length}`);
    console.error('[CRITICAL-BEFORE-CLAUDE] About to call Claude API...');
    console.error('[CLAUDE-TIMEOUT-SET] 20000ms');
    
    let claudeResponse;
    
    try {
      // Create promise with explicit timeout
      const claudePromise = axios.post(
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
          timeout: 20000
        }
      );

      console.error('[CLAUDE-PROMISE-CREATED] Promise created, waiting for response...');
      
      // Wait with race condition for timeout
      claudeResponse = await Promise.race([
        claudePromise,
        new Promise((_, reject) => 
          setTimeout(() => {
            console.error('[CLAUDE-RACE-TIMEOUT] Race timeout triggered!');
            reject(new Error('Claude API timeout - 20 seconds exceeded'));
          }, 20000)
        )
      ]);

      console.error('[CRITICAL-AFTER-CLAUDE] ✅✅✅ Claude responded! ✅✅✅');
      console.error('[CRITICAL-STATUS] Status:', claudeResponse.status);
      console.error('[CRITICAL-DATA] Full response:', JSON.stringify(claudeResponse.data, null, 2));

      if (!claudeResponse.data || !claudeResponse.data.content || !claudeResponse.data.content[0]) {
        throw new Error('Invalid Claude response structure');
      }

      const botText = claudeResponse.data.content[0].text;
      console.error(`[CRITICAL-BOT-TEXT] Bot response: "${botText}"`);
      console.log(`\n� Nika: ${botText}\n`);

      // Firebase async - save response
      console.log('� Saving bot response to Firebase...');
      saveToFirebase(clientId, sessionId, {
        role: 'assistant',
        content: botText,
        channel: 'whatsapp',
        timestamp: new Date().toISOString()
      }).catch(err => console.error('❌ Firebase response save error:', err.message));
      console.log('✅ Firebase response save triggered (async)');

      console.error('[CRITICAL-BEFORE-WHATSAPP] About to send WhatsApp message...');
      console.log(`\n� Sending to WhatsApp: ${sender}`);
      console.log(`� Message: "${botText}"`);
      
      await sendWhatsApp(sender, botText, greenApiIdInstance, greenApiToken);
      
      console.error('[CRITICAL-AFTER-WHATSAPP] ✅ WhatsApp message sent successfully!');
      console.log('✅ Sent to WhatsApp\n');

      if (tgToken && tgChatId) {
        console.error('[CRITICAL-BEFORE-TELEGRAM] About to send Telegram notification...');
        const tgMessage = `� *WhatsApp: ${clientId}*\n\n� *Юзер:* ${messageText}\n\n� *Nika:* ${botText}`;
        sendToTelegram(tgToken, tgChatId, tgMessage)
          .then(() => console.error('[CRITICAL-AFTER-TELEGRAM] ✅ Telegram sent!'))
          .catch(err => console.error('❌ Telegram error:', err.message));
        console.error('[CRITICAL-TELEGRAM-TRIGGERED] Telegram send triggered (async)');
      }

      console.error('[CRITICAL-SUCCESS] ✅✅✅ WEBHOOK COMPLETE SUCCESSFULLY! ✅✅✅');
      console.log('\n════════════════════════════════════');
      console.log('✅ WEBHOOK УСПЕШНО ОБРАБОТАН!');
      console.log('════════════════════════════════════\n');

    } catch (claudeError) {
      console.error('\n[CLAUDE-ERROR] ❌❌❌ CLAUDE API FAILED ❌❌❌');
      console.error('[CLAUDE-ERROR-MSG]', claudeError.message);
      console.error('[CLAUDE-ERROR-CODE]', claudeError.code);
      console.error('[CLAUDE-ERROR-TIME]', new Date().toISOString());
      
      if (claudeError.response) {
        console.error('[CLAUDE-ERROR-STATUS]', claudeError.response.status);
        console.error('[CLAUDE-ERROR-HEADERS]', claudeError.response.headers);
        console.error('[CLAUDE-ERROR-DATA]', JSON.stringify(claudeError.response.data));
      }
      
      if (claudeError.request && !claudeError.response) {
        console.error('[CLAUDE-ERROR-NO-RESPONSE] Request made but no response received');
      }
      
      console.error('[CLAUDE-ERROR-STACK]', claudeError.stack);
      
      // Still try to send WhatsApp with error message
      try {
        console.error('[FALLBACK] Attempting fallback response...');
        const fallbackText = `Ошибка: Claude API не отвечает. Код: ${claudeError.code || claudeError.message}`;
        await sendWhatsApp(sender, fallbackText, greenApiIdInstance, greenApiToken);
        console.error('[FALLBACK-SUCCESS] Fallback message sent');
      } catch (fallbackError) {
        console.error('[FALLBACK-FAILED] Even fallback failed:', fallbackError.message);
      }
      
      throw claudeError;
    }

  } catch (error) {
    console.error('\n❌ ❌ ❌ КРИТИЧЕСКАЯ ОШИБКА В WEBHOOK ❌ ❌ ❌');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Name:', error.name);
    console.error('Time:', new Date().toISOString());
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    
    if (error.request) {
      console.error('Request made but no response');
    }
    
    console.error('Full Stack:', error.stack);
    console.error('════════════════════════════════════\n');
  }
};
