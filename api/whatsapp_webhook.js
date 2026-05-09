// Получает сообщения от Green-API (WhatsApp)
// Ищет клиента в Google Sheets
// Сохраняет в Firebase
// Отправляет в Claude.
// Отправляет ответ в WhatsApp
// Уведомляет менеджера в Telegram
// ============================================================
// ГЛАВНЫЙ ФАЙЛ: Получает WhatsApp → Claude → WhatsApp
// ============================================================

require('dotenv').config();
const axios = require('axios');
const { google } = require('googleapis');

const getClientData = require('../helpers/getClientData');
const { saveToFirebase, getHistoryFromFirebase } = require('../helpers/saveToFirebase');
const sendWhatsApp = require('../helpers/sendWhatsApp');
const sendToTelegram = require('../helpers/sendToTelegram');

module.exports = async (req, res) => {
  console.log('\n════════════════════════════════════');
  console.log('📱 WHATSAPP WEBHOOK - НАЧАЛО');
  console.log('════════════════════════════════════\n');

  // Всегда отвечаем OK Green-API (чтобы не переотправлял)
  res.status(200).send('OK');

  try {
    // ============================================================
    // ШАГ 1: Получаем данные из Green-API
    // ============================================================
    console.log('📥 ШАГ 1: Получаем данные от Green-API');

    const data = req.body;
    const phoneNumber = data?.body?.senderData?.chatId;
    let messageText = data?.body?.messageData?.textMessageData?.textMessage ||
                      data?.body?.messageData?.extendedTextMessageData?.text;

    if (!phoneNumber || !messageText) {
      console.log('⚠️ Нет номера или текста - игнорируем');
      return;
    }

    console.log(`📱 От: ${phoneNumber}`);
    console.log(`💬 Текст: ${messageText}\n`);

    // ============================================================
    // ШАГ 2: Ищем клиента в Google Sheets
    // ============================================================
    console.log('🔍 ШАГ 2: Ищем клиента');

    const clientData = await getClientData(phoneNumber);
    const { clientId, googleDocId, claudeApiKey, tgToken, tgChatId, 
            greenApiUrl, greenApiIdInstance, greenApiToken, balance, pricePerChar } = clientData;

    console.log(`✅ Клиент найден: ${clientId}\n`);

    // ============================================================
    // ШАГ 3: Создаём sessionId
    // ============================================================
    console.log('📝 ШАГ 3: Создаём session');

    const sessionId = `whatsapp_${phoneNumber}_${Date.now()}`;
    console.log(`✅ Session ID: ${sessionId}\n`);

    // ============================================================
    // ШАГ 4: Читаем историю из Firebase
    // ============================================================
    console.log('📚 ШАГ 4: Читаем историю');

    let chatHistory = await getHistoryFromFirebase(clientId, sessionId);
    console.log(`✅ Загружено ${chatHistory.length} сообщений\n`);

    // ============================================================
    // ШАГ 5: Сохраняем входящее сообщение
    // ============================================================
    console.log('💾 ШАГ 5: Сохраняем входящее сообщение');

    await saveToFirebase(clientId, sessionId, {
      role: 'user',
      content: messageText
    });
    console.log('✅ Сохранено\n');

    // Обновляем историю локально
    chatHistory = await getHistoryFromFirebase(clientId, sessionId);

    // ============================================================
    // ШАГ 6: Читаем промпт из Google Docs
    // ============================================================
    console.log('📄 ШАГ 6: Читаем промпт');

    let systemPrompt = "Ты полезный помощник";

    if (googleDocId) {
      try {
        const auth = new google.auth.JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/documents.readonly']
        });

        const docsClient = google.docs({ version: 'v1', auth });
        const docRes = await docsClient.documents.get({ documentId: googleDocId });
        
        systemPrompt = docRes.data.body.content
          .filter(block => block.paragraph)
          .map(block => block.paragraph.elements
            .map(el => el.textRun ? el.textRun.content : '')
            .join(''))
          .join('')
          .trim();

        console.log(`✅ Промпт загружен (${systemPrompt.length} символов)\n`);
      } catch (e) {
        console.error(`⚠️ Ошибка чтения промпта: ${e.message}\n`);
      }
    }

    // ============================================================
    // ШАГ 7: Отправляем в Claude
    // ============================================================
    console.log('🚀 ШАГ 7: Отправляем в Claude');

    const cleanMessages = chatHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10) // Последние 10 сообщений
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: cleanMessages
    }, {
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    if (!claudeResponse.data.content[0]) {
      throw new Error('Claude не вернул ответ');
    }

    const botText = claudeResponse.data.content[0].text;
    console.log(`✅ Claude ответил (${botText.length} символов)\n`);

    // ============================================================
    // ШАГ 8: Сохраняем ответ в Firebase
    // ============================================================
    console.log('💾 ШАГ 8: Сохраняем ответ');

    await saveToFirebase(clientId, sessionId, {
      role: 'assistant',
      content: botText
    });
    console.log('✅ Сохранено\n');

    // ============================================================
    // ШАГ 9: Отправляем ответ в WhatsApp
    // ============================================================
    console.log('📤 ШАГ 9: Отправляем в WhatsApp');

    await sendWhatsApp(phoneNumber, botText, greenApiUrl, greenApiIdInstance, greenApiToken);
    console.log('✅ Отправлено в WhatsApp\n');

    // ============================================================
    // ШАГ 10: Отправляем уведомление менеджеру в Telegram
    // ============================================================
    console.log('📤 ШАГ 10: Отправляем в Telegram');

    if (tgToken && tgChatId) {
      const tgMessage = `📱 WhatsApp: ${clientId}

👤 Юзер: ${messageText}
🤖 Nika: ${botText}

💰 Баланс: ${balance} токенов`;

      const buttons = [[
        { text: '🔴 Выключить ИИ', callback_data: `off|${clientId}|${sessionId}|whatsapp` }
      ]];

      await sendToTelegram(tgToken, tgChatId, tgMessage, buttons);
      console.log('✅ Отправлено в Telegram\n');
    }

    console.log('════════════════════════════════════');
    console.log('✅ WEBHOOK УСПЕШНО ОБРАБОТАН');
    console.log('════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
    console.error(error);
  }
};
