require('dotenv').config();
console.log('✅ [1] .env config loaded');

require('../config/firebase');
console.log('✅ [2] Firebase config loaded');

const axios = require('axios');
console.log('✅ [3] axios loaded');

const getClientData = require('../helpers/getClientData');
console.log('✅ [4] getClientData loaded');

const { saveToFirebase } = require('../helpers/saveToFirebase');
console.log('✅ [5] saveToFirebase loaded');

const sendWhatsApp = require('../helpers/sendWhatsApp');
console.log('✅ [6] sendWhatsApp loaded');

const sendToTelegram = require('../helpers/sendToTelegram');
console.log('✅ [7] sendToTelegram loaded');

module.exports = async (req, res) => {
  console.log('\n════════════════════════════════════');
  console.log('� WHATSAPP WEBHOOK STARTED');
  console.log('════════════════════════════════════\n');

  res.status(200).send('OK');
  console.log('[STEP-0] Response sent 200 OK');

  try {
    console.log('[STEP-1] Try block entered');
    
    console.log('[STEP-2] Logging webhook body...');
    console.log('� FULL WEBHOOK BODY:');
    console.log(JSON.stringify(req.body, null, 2));
    
    const data = req.body;
    console.log('[STEP-3] req.body assigned to data:', typeof data);
    
    let sender = null;
    let messageText = null;
    console.log('[STEP-4] sender and messageText initialized as null');

    // Извлекаем sender
    console.log('[STEP-5] Checking senderData...');
    if (data?.senderData?.sender) {
      sender = data.senderData.sender;
      console.log('✅ [STEP-5a] Найден sender в senderData.sender:', sender);
    } else {
      console.log('❌ [STEP-5b] sender не найден в senderData');
    }

    // Извлекаем messageText
    console.log('[STEP-6] Checking messageData...');
    if (data?.messageData?.extendedTextMessageData?.text) {
      messageText = data.messageData.extendedTextMessageData.text;
      console.log('✅ [STEP-6a] Найден в extendedTextMessageData.text:', messageText);
    } else if (data?.messageData?.textMessageData?.textMessage) {
      messageText = data.messageData.textMessageData.textMessage;
      console.log('✅ [STEP-6b] Найден в textMessageData.textMessage:', messageText);
    } else {
      console.log('❌ [STEP-6c] messageText не найден');
    }

    // Убираем @c.us
    console.log('[STEP-7] Checking @c.us in sender...');
    if (sender && sender.includes('@c.us')) {
      console.log('[STEP-7a] Found @c.us, removing...');
      sender = sender.replace('@c.us', '');
      console.log('[STEP-7b] Sender after replace:', sender);
    } else {
      console.log('[STEP-7c] No @c.us found');
    }

    console.log(`\n[STEP-8] Final values:`);
    console.log(`� Sender: ${sender}`);
    console.log(`� Message: ${messageText}`);

    // Проверка наличия данных
    console.log('[STEP-9] Validating sender and messageText...');
    if (!sender || !messageText) {
      console.log('⚠️ [STEP-9a] Missing sender or messageText - RETURNING');
      console.log(`sender=${sender}, messageText=${messageText}`);
      return;
    }
    console.log('✅ [STEP-9b] Both sender and messageText present');

    // Получаем данные клиента
    console.log('\n[STEP-10] Getting client data...');
    console.log(`[STEP-10a] Calling getClientData("${sender}")`);
    const clientData = await getClientData(sender);
    console.log('[STEP-10b] getClientData returned:', clientData ? 'object' : 'null');

    if (!clientData) {
      console.log('❌ [STEP-10c] clientData is null - RETURNING');
      return;
    }
    console.log('✅ [STEP-10d] clientData received');

    const { clientId, claudeApiKey, tgToken, tgChatId, greenApiIdInstance, greenApiToken } = clientData;
    console.log('[STEP-11] Extracted from clientData:');
    console.log(`  - clientId: ${clientId}`);
    console.log(`  - claudeApiKey: ${claudeApiKey.substring(0, 20)}...`);
    console.log(`  - tgToken: ${tgToken ? '✅' : '❌'}`);
    console.log(`  - tgChatId: ${tgChatId}`);
    console.log(`  - greenApiIdInstance: ${greenApiIdInstance}`);
    console.log(`  - greenApiToken: ${greenApiToken.substring(0, 20)}...`);

    // Создаём sessionId
    const sessionId = `whatsapp_${sender}_${Date.now()}`;
    console.log(`\n[STEP-12] Session created: ${sessionId}`);

    // Сохраняем сообщение (БЕЗ ОЖИДАНИЯ)
    console.log('[STEP-13] Saving incoming message to Firebase (async)...');
    const firebaseData = {
      role: 'user',
      content: messageText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    };
    console.log('[STEP-13a] Firebase data prepared:', JSON.stringify(firebaseData));
    
    saveToFirebase(clientId, sessionId, firebaseData)
      .then(() => console.log('[STEP-13b] Firebase save completed'))
      .catch(err => console.error('[STEP-13c] Firebase save error:', err.message));
    console.log('[STEP-13d] Firebase save triggered (not waiting)');

    // Отправляем в Claude
    console.log('\n[STEP-14] Preparing Claude request...');
    const systemPrompt = "Ты AI ассистент Ника. Отвечай коротко (1-2 предложения). Будь дружелюбной. Подпись: Ника �";
    console.log('[STEP-14a] System prompt set');
    
    const claudeMessages = [
      {
        role: 'user',
        content: messageText
      }
    ];
    console.log('[STEP-14b] Claude messages prepared:', JSON.stringify(claudeMessages));

    console.log('\n[STEP-15] Calling Claude API...');
    console.log('[STEP-15a] URL: https://api.anthropic.com/v1/messages');
    console.log(`[STEP-15b] Model: claude-haiku-4-5-20251001`);
    console.log(`[STEP-15c] Max tokens: 1024`);
    console.log(`[STEP-15d] API Key (first 20 chars): ${claudeApiKey.substring(0, 20)}...`);
    console.log('[STEP-15e] Sending POST request...');

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
    console.log('[STEP-15f] Claude response received');
    console.log('[STEP-15g] Response status:', claudeResponse.status);
    console.log('[STEP-15h] Response data:', JSON.stringify(claudeResponse.data, null, 2));

    const botText = claudeResponse.data.content[0].text;
    console.log(`\n[STEP-16] Extracted bot response: "${botText}"`);

    // Сохраняем ответ (БЕЗ ОЖИДАНИЯ)
    console.log('\n[STEP-17] Saving bot response to Firebase (async)...');
    const responseData = {
      role: 'assistant',
      content: botText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    };
    console.log('[STEP-17a] Response data prepared:', JSON.stringify(responseData));
    
    saveToFirebase(clientId, sessionId, responseData)
      .then(() => console.log('[STEP-17b] Firebase response save completed'))
      .catch(err => console.error('[STEP-17c] Firebase response save error:', err.message));
    console.log('[STEP-17d] Firebase response save triggered (not waiting)');

    // Отправляем в WhatsApp
    console.log('\n[STEP-18] Sending to WhatsApp...');
    console.log(`[STEP-18a] Phone: ${sender}`);
    console.log(`[STEP-18b] Message: "${botText}"`);
    console.log(`[STEP-18c] Green API Instance: ${greenApiIdInstance}`);
    console.log(`[STEP-18d] Calling sendWhatsApp()...`);
    
    await sendWhatsApp(sender, botText, greenApiIdInstance, greenApiToken);
    console.log('[STEP-18e] WhatsApp send completed');

    // Отправляем в Telegram (БЕЗ ОЖИДАНИЯ)
    console.log('\n[STEP-19] Checking Telegram credentials...');
    if (tgToken && tgChatId) {
      console.log('[STEP-19a] Telegram token and chat ID found');
      const tgMessage = `� *WhatsApp: ${clientId}*\n\n� *Юзер:* ${messageText}\n\n� *Nika:* ${botText}`;
      console.log('[STEP-19b] Telegram message prepared:', tgMessage);
      console.log('[STEP-19c] Calling sendToTelegram()...');
      
      sendToTelegram(tgToken, tgChatId, tgMessage)
        .then(() => console.log('[STEP-19d] Telegram send completed'))
        .catch(err => console.error('[STEP-19e] Telegram send error:', err.message));
      console.log('[STEP-19f] Telegram send triggered (not waiting)');
    } else {
      console.log('[STEP-19g] Telegram credentials missing - skipping');
    }

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
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', error.response.data);
    }
    if (error.request) {
      console.error('Request Info:', error.request);
    }
    console.error('════════════════════════════════════\n');
  }
};
