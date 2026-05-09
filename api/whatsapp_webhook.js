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
    
    // Логируем что ищем
    console.log('\n🔍 Ищу phoneNumber...');
    console.log('Keys в body:', Object.keys(data));
    
    let sender = null;
    let messageText = null;

    // Пробуем разные варианты и логируем
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
      console.log('❌ Не найден sender в всех вариантах');
    }

    if (data?.webhook_body?.messageData?.textMessageData?.textMessage) {
      messageText = data.webhook_body.messageData.textMessageData.textMessage;
      console.log('✅ Найден messageText в webhook_body');
    } else if (data?.messageData?.textMessageData?.textMessage) {
      messageText = data.messageData.textMessageData.textMessage;
      console.log('✅ Найден messageText');
    } else if (data?.body?.messageData?.textMessageData?.textMessage) {
      messageText = data.body.messageData.textMessageData.textMessage;
      console.log('✅ Найден messageText в body');
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

    // ОСТ АЛЬНОЙ КОД...
