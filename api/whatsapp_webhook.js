require('dotenv').config();
require('../config/firebase');
const axios = require('axios');

const getClientData = require('../helpers/getClientData');
const { saveToFirebase, getHistoryFromFirebase } = require('../helpers/saveToFirebase');
const sendWhatsApp = require('../helpers/sendWhatsApp');
const sendToTelegram = require('../helpers/sendToTelegram');

module.exports = async (req, res) => {
  console.log('\n════════════════════════════════════');
  console.log('📱 WHATSAPP WEBHOOK');
  console.log('════════════════════════════════════\n');

  res.status(200).send('OK');

  try {
    // 🔍 ЛОГИРУЕМ ВСЕ ДАННЫЕ
    console.log('📥 FULL WEBHOOK BODY:');
    console.log(JSON.stringify(req.body, null, 2));
    
    const data = req.body;
    
    console.log('\n🔍 Ищу phoneNumber...');
    
    let sender = null;
    let messageText = null;

    // Пробуем разные варианты
    if (data?.webhook_body?.senderData?.sender) {
      sender = data.webhook_body.senderData.sender;
      console.log('✅ Найден в webhook_body.senderData.sender');
    } else if (data?.senderData?.sender) {
      sender = data.senderData.sender;
      console.log('✅ Найден в senderData.sender');
    } else if (data?.body?.senderData?.sender) {
      sender = data.body.senderData.sender;
      console.log('✅ Найден в body.senderData.sender');
    } else {
      console.log('❌ Не найден sender');
    }

    if (data?.webhook_body?.messageData?.textMessageData?.textMessage) {
      messageText = data.webhook_body.messageData.textMessageData.textMessage;
      console.log('✅ Найден messageText');
    } else if (data?.messageData?.textMessageData?.textMessage) {
      messageText = data.messageData.textMessageData.textMessage;
      console.log('✅ Найден messageText');
    } else if (data?.body?.messageData?.textMessageData?.textMessage) {
      messageText = data.body.messageData.textMessageData.textMessage;
      console.log('✅ Найден messageText');
    } else {
      console.log('❌ messageText не найден');
    }

    if (sender && sender.includes('@c.us')) {
      sender = sender.replace('@c.us', '');
    }

    console.log(`\n📱 Sender: ${sender}`);
    console.log(`💬 Message: ${messageText}\n`);

    if (!sender || !messageText) {
      console.log('⚠️ Нет sender или messageText - выходим');
      return;
    }

    // Ищем клиента
    console.log('🔍 Ищу клиента...');
    const clientData = await getClientData(sender);

    if (!clientData) {
      console.log('❌ Клиент не найден');
      return;
    }

    const { clientId, claudeApiKey, tgToken, tgChatId, greenApiIdInstance, greenApiToken } = clientData;
    console.log(`✅ Клиент найден: ${clientId}\n`);

    // Создаём sessionId
    const sessionId = `whatsapp_${sender}_${Date.now()}`;
    console.log(`📝 Session: ${sessionId}\n`);

    // Сохраняем входящее сообщение
    console.log('💾 Сохраняю входящее сообщение...');
    await saveToFirebase(clientId, sessionId, {
      role: 'user',
      content: messageText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    });

    // Получаем историю
    const chatHistory = await getHistoryFromFirebase(clientId, sessionId);
    console.log(`✅ История загружена (${chatHistory.length} сообщений)\n`);

    // Отправляем в Claude
    console.log('🚀 Отправляю в Claude...');
    
    const systemPrompt = "Ты полезный AI ассистент. Отвечай кратко и полезно.";
    
    const claudeMessages = chatHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages
    }, {
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 25000
    });

    const botText = claudeResponse.data.content[0].text;
    console.log(`✅ Claude ответил\n`);

    // Сохраняем ответ в Firebase
    console.log('💾 Сохраняю ответ...');
    await saveToFirebase(clientId, sessionId, {
      role: 'assistant',
      content: botText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    });

    // Отправляем в WhatsApp
    console.log('📤 Отправляю в WhatsApp...');
    await sendWhatsApp(sender, botText, greenApiIdInstance, greenApiToken);

    // Отправляем в Telegram
    if (tgToken && tgChatId) {
      console.log('📤 Отправляю в Telegram...');
      const tgMessage = `📱 *WhatsApp: ${clientId}*\n\n👤 *Юзер:* ${messageText}\n\n🤖 *Nika:* ${botText}`;
      await sendToTelegram(tgToken, tgChatId, tgMessage);
    }

    console.log('\n════════════════════════════════════');
    console.log('✅ WEBHOOK УСПЕШНО ОБРАБОТАН');
    console.log('════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ОШИБКА:', error.message);
    console.error(error);
  }
};
