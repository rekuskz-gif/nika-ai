require('dotenv').config();
require('../config/firebase');
const { saveToFirebase } = require('../helpers/saveToFirebase');
const sendWhatsApp = require('../helpers/sendWhatsApp');

module.exports = async (req, res) => {
  console.error('� START');
  res.status(200).send('OK');

  try {
    const data = req.body;
    let sender = data?.senderData?.sender;
    let messageText = data?.messageData?.extendedTextMessageData?.text;

    if (sender?.includes('@c.us')) sender = sender.replace('@c.us', '');
    if (!sender || !messageText) return;

    const clientData = {
      clientId: 'mina_001',
      greenApiIdInstance: '1105585279',
      greenApiToken: '07e78d2cfdc3490592b0ac0ec055bc442c9bcbbfc6a244e4b4'
    };

    const sessionId = `whatsapp_${sender}_${Date.now()}`;

    // Сохраняем сообщение
    saveToFirebase(clientData.clientId, sessionId, {
      role: 'user',
      content: messageText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(e => console.error('FB_ERR:', e.message));

    // ТЕСТОВЫЙ ОТВЕТ (БЕЗ CLAUDE!)
    const botText = `Привет! � Я получил твое сообщение: "${messageText}". Ника здесь! �`;
    
    console.error('� Bot:', botText);

    // Сохраняем ответ
    saveToFirebase(clientData.clientId, sessionId, {
      role: 'assistant',
      content: botText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(e => console.error('FB_ERR:', e.message));

    // Отправляем в WhatsApp
    console.error('� Sending to WhatsApp...');
    await sendWhatsApp(sender, botText, clientData.greenApiIdInstance, clientData.greenApiToken);
    
    console.error('✅ SUCCESS');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
};
