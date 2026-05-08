const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Green-API данные
const API_URL = 'https://1105.api.green-api.com';
const ID_INSTANCE = '1105585279';
const API_TOKEN = '07e78d2cfdc3490592b0ac0ec055bc442c9bcbbfc6a244e4b4';

// Claude API
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Firebase (подключим позже)
let botEnabled = {}; // { phoneNumber: true/false }

// Получить сообщения из Green-API
app.post('/webhook', async (req, res) => {
  try {
    const data = req.body;
    
    // Проверяем что это сообщение от клиента
    if (!data.body || !data.body.senderData) {
      return res.status(200).send('OK');
    }

    const phoneNumber = data.body.senderData.chatId;
    const messageText = data.body.messageData.textMessageData.textMessage;

    console.log(`📱 Сообщение от ${phoneNumber}: ${messageText}`);

    // Проверяем включен ли бот для этого чата
    if (!botEnabled[phoneNumber]) {
      console.log(`🔴 Бот отключен для ${phoneNumber}`);
      return res.status(200).send('OK');
    }

    // Отправляем в Claude
    const nicolaResponse = await askNicola(messageText, phoneNumber);

    // Отправляем ответ в WhatsApp
    await sendWhatsAppMessage(phoneNumber, nicolaResponse);

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).send('Error');
  }
});

// Отправить сообщение в Claude
async function askNicola(message, phoneNumber) {
  try {
    // TODO: Получить промт из Google Диска
    const prompt = `Ты Ника - вежливый ИИ ассистент. Помогай клиентам.`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-20250805',
      max_tokens: 1000,
      system: prompt,
      messages: [
        { role: 'user', content: message }
      ]
    }, {
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    let nicolaText = response.data.content[0].text;
    nicolaText += '\n\n— Ника 🤖';

    return nicolaText;
  } catch (error) {
    console.error('❌ Ошибка Claude:', error);
    return 'Извините, произошла ошибка. Попробуйте позже.';
  }
}

// Отправить сообщение в WhatsApp через Green-API
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    await axios.post(
      `${API_URL}/waAPI/sendMessage/${ID_INSTANCE}/${API_TOKEN}`,
      {
        chatId: phoneNumber,
        message: message
      }
    );
    console.log(`✅ Сообщение отправлено ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Ошибка отправки:', error);
  }
}

// Включить бота для чата
app.post('/enable-bot/:phone', (req, res) => {
  const phone = req.params.phone;
  botEnabled[phone] = true;
  console.log(`🟢 Ника включена для ${phone}`);
  res.send('OK');
});

// Отключить бота для чата
app.post('/disable-bot/:phone', (req, res) => {
  const phone = req.params.phone;
  botEnabled[phone] = false;
  console.log(`🔴 Ника отключена для ${phone}`);
  res.send('OK');
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Бот запущен на порту ${PORT}`);
});
