const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

module.exports = async function getClientData(phoneNumber) {
  try {
    console.log(`🔍 getClientData called with: ${phoneNumber} (type: ${typeof phoneNumber})`);

    // Убедись что это строка
    const cleanPhone = String(phoneNumber).trim();
    console.log(`📱 Clean phone: ${cleanPhone}`);

    const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);

    // Правильная авторизация для google-spreadsheet v4
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Nika WhatsApp'];
    
    if (!sheet) {
      console.log('❌ Лист не найден');
      return null;
    }

    const rows = await sheet.getRows();
    console.log(`📊 Всего строк: ${rows.length}`);

    const clientRow = rows.find(row => {
      const rowPhone = String(row['whatsapp phone'] || '').trim();
      console.log(`  Проверяю: ${rowPhone} === ${cleanPhone}? ${rowPhone === cleanPhone}`);
      return rowPhone === cleanPhone;
    });

    if (!clientRow) {
      console.log(`❌ Клиент не найден для номера ${cleanPhone}`);
      return null;
    }

    console.log(`✅ Найден: ${clientRow['clientId']}`);

    return {
      clientId: clientRow['clientId'],
      botName: clientRow['bot Name'],
      googleDocId: clientRow['google DocId'],
      claudeApiKey: clientRow['claudeApiKey'],
      tgToken: clientRow['tgToken'],
      tgChatId: clientRow['tg ChatId'],
      greenApiIdInstance: clientRow['green api id instance'],
      greenApiToken: clientRow['green api token'],
      status: clientRow['status'],
    };

  } catch (error) {
    console.error('❌ getClientData error:', error.message);
    return null;
  }
};
