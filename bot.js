cat > bot.js << 'EOF'
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const API_URL = 'https://1105.api.green-api.com';
const ID_INSTANCE = '1105585279';
const API_TOKEN = '07e78d2cfdc3490592b0ac0ec055bc442c9bcbbfc6a244e4b4';
const CLAUDE_API_KEY = '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';

app.post('/webhook', async (req, res) => {
  try {
    console.log('📩 Webhook получен');
    const data = req.body;
    
    if (!data || !data.body) {
      console.log('⚠️ Нет данных');
      return res.status(200).send('OK');
    }

    const phoneNumber = data.body?.senderData?.chatId;
    const messageText = data.body?.messageData?.textMessageData?.textMessage;

    if (!phoneNumber || !messageText) {
      console.log('⚠️ Нет номера или текста');
      return res.status(200).send('OK');
    }

    console.log(`📱 От ${phoneNumber}: ${messageText}`);

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-20250805',
      max_tokens: 1000,
      system: 'Ты Ника - вежливый ИИ помощник',
      messages: [{ role: 'user', content: messageText }]
    }, { headers: { 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' } });

    const answer = response.data.content[0].text + '\n\n— Ника 🤖';

    await axios.post(`${API_URL}/waAPI/sendMessage/${ID_INSTANCE}/${API_TOKEN}`, {
      chatId: phoneNumber,
      message: answer
    });

    console.log(`✅ Отправлено`);
    res.status(200).send('OK');
  } catch(e) {
    console.error('❌ Ошибка:', e.message);
    res.status(500).send('Error');
  }
});

app.listen(3000, () => console.log('🚀 Бот Ника запущен на порту 3000'));
EOF
