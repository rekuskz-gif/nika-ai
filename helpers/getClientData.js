const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

module.exports = async function getClientData(phoneNumber) {
  try {
    const cleanPhone = String(phoneNumber).trim();
    console.log(`� Ищу клиента: ${cleanPhone}`);

    // Используем FIREBASE_PRIVATE_KEY (он уже целый)
    const fullPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!fullPrivateKey) {
      console.error('❌ FIREBASE_PRIVATE_KEY не найден!');
      return null;
    }

    console.log(`� FullPrivateKey length: ${fullPrivateKey.length}`);

    // Создаём JWT токен
    console.log('� Создаю JWT токен...');
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: fullPrivateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    console.log('� Инициализирую GoogleSpreadsheet...');
    // Инициализируем документ с JWT
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    
    console.log('⏳ Загружаю информацию о документе...');
    await Promise.race([
      doc.loadInfo(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: Google Sheets loadInfo')), 10000))
    ]);
    console.log('✅ Google Sheets загружена');

    const sheet = doc.sheetsByTitle['Nika WhatsApp'];
    if (!sheet) {
      console.log('❌ Лист "Nika WhatsApp" не найден');
      console.log('� Доступные листы:', Object.keys(doc.sheetsByTitle));
      return null;
    }

    console.log('� Получаю строки...');
    const rows = await sheet.getRows();
    console.log(`� Всего строк: ${rows.length}`);

    const clientRow = rows.find(row => {
      const rowPhone = String(row.get('whatsapp phone') || '').trim();
      return rowPhone === cleanPhone && row.get('clientId');
    });

    if (!clientRow) {
      console.log(`❌ Клиент ${cleanPhone} не найден`);
      return null;
    }

    console.log(`✅ Найден: ${clientRow.get('clientId')}`);
    return {
      clientId: clientRow.get('clientId'),
      botName: clientRow.get('bot Name'),
      googleDocId: clientRow.get('google DocId'),
      claudeApiKey: clientRow.get('claudeApiKey'),
      tgToken: clientRow.get('tgToken'),
      tgChatId: clientRow.get('tg ChatId'),
      greenApiIdInstance: clientRow.get('green api id instance'),
      greenApiToken: clientRow.get('green api token'),
      status: clientRow.get('status'),
      balance: clientRow.get('balance'),
    };
  } catch (error) {
    console.error('❌ getClientData error:', error.message);
    console.error(error);
    return null;
  }
};
