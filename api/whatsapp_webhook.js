require('dotenv').config();
require('../config/firebase');
const axios = require('axios');

const getClientData = require('../helpers/getClientData');
const { saveToFirebase, getHistoryFromFirebase } = require('../helpers/saveToFirebase');
const sendWhatsApp = require('../helpers/sendWhatsApp');
const sendToTelegram = require('../helpers/sendToTelegram');

module.exports = async (req, res) => {
  console.log('\n════════════════════════════════════');
  console.log('� WHATSAPP WEBHOOK STARTED');
  console.log('════════════════════════════════════\n');

  res.status(200).send('OK');

  try {
    console.log('� FULL WEBHOOK BODY:');
    console.log(JSON.stringify(req.body, null, 2));
    
    const data = req.body;
    
    console.log('\n� Ищу phoneNumber...');
    
    let sender = null;
    let messageText = null;

    if (data?.senderData?.sender) {
      sender = data.senderData.sender;
      console.log('✅ Найден sender в senderData.sender');
    } else {
      console.log('❌ sender не найден');
    }

    console.log('\n� Ищу messageText...');
    
    if (data?.messageData?.extendedTextMessageData?.text) {
      messageText = data.messageData.extendedTextMessageData.text;
      console.log('✅ Найден в extendedTextMessageData.text');
    } else if (data?.messageData?.textMessageData?.textMessage) {
      messageText = data.messageData.textMessageData.textMessage;
      console.log('✅ Найден в textMessageData.textMessage');
    } else {
      console.log('❌ messageText не найден');
    }

    if (sender && sender.includes('@c.us')) {
      sender = sender.replace('@c.us', '');
    }

    console.log(`\n� Sender: ${sender}`);
    console.log(`� Message: ${messageText}\n`);

    if (!sender || !messageText) {
      console.log('⚠️ Нет sender или messageText - выходим');
      return;
    }

    console.log('� Ищу клиента в Google Sheets...');
    const clientData = await getClientData(sender);

    if (!clientData) {
      console.log('❌ Клиент не найден - выходим');
      return;
    }

    const { clientId, claudeApiKey, tgToken, tgChatId, greenApiIdInstance, greenApiToken } = clientData;
    console.log(`✅ Клиент найден: ${clientId}\n`);

    const sessionId = `whatsapp_${sender}_${Date.now()}`;
    console.log(`� Session создан: ${sessionId}\n`);

    console.log('� Сохраняю входящее сообщение в Firebase...');
    await saveToFirebase(clientId, sessionId, {
      role: 'user',
      content: messageText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Сообщение сохранено в Firebase\n');

    console.log('� Получаю историю из Firebase...');
    const chatHistory = await getHistoryFromFirebase(clientId, sessionId);
    console.log(`✅ История загружена: ${chatHistory.length} сообщений\n`);

    console.log('� Подготавливаю сообщения для Claude...');
    const systemPrompt = "Ты полезный AI ассистент. Отвечай кратко и полезно.";
    
    const claudeMessages = chatHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    console.log(`� Claude messages подготовлено: ${claudeMessages.length}\n`);

    console.log('� Отправляю запрос в Claude API...');
    
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

    console.log('✅ Claude ответил успешно\n');
    const botText = claudeResponse.data.content[0].text;
    console.log(`� Ответ Ники:\n"${botText}"\n`);

    console.log('� Сохраняю ответ в Firebase...');
    await saveToFirebase(clientId, sessionId, {
      role: 'assistant',
      content: botText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Ответ сохранен в Firebase\n');

    console.log('� Отправляю в WhatsApp...');
    console.log(`� Номер: ${sender}`);
    await sendWhatsApp(sender, botText, greenApiIdInstance, greenApiToken);
    console.log('✅ Отправлено в WhatsApp\n');

    if (tgToken && tgChatId) {
      console.log('� Отправляю уведомление в Telegram...');
      const tgMessage = `� *WhatsApp: ${clientId}*\n\n� *Юзер:* ${messageText}\n\n� *Nika:* ${botText}`;
      await sendToTelegram(tgToken, tgChatId, tgMessage);
      console.log('✅ Telegram отправлен\n');
    }

    console.log('════════════════════════════════════');
    console.log('✅ WEBHOOK УСПЕШНО ОБРАБОТАН!');
    console.log('════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
};
