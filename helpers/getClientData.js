const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

module.exports = async function getClientData(phoneNumber) {
  try {
    console.log(`🔍 Ищу клиента: ${phoneNumber}`);

    const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);

    // ПРАВИЛЬНЫЙ СПОСОБ для новой версии google-spreadsheet
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    doc.useServiceAccountAuth(auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Nika WhatsApp'];
    
    if (!sheet) {
      console.log('❌ Лист "Nika WhatsApp" не найден');
      return null;
    }

    // Получаем строки (начиная со строки 2, потому что 1 = заголовки)
    const rows = await sheet.getRows({ offset: 1 });

    // Ищем по номеру WhatsApp
    const clientRow = rows.find(row => 
      row['whatsapp phone'] && 
      row['whatsapp phone'].toString().trim() === phoneNumber.toString().trim()
    );

    if (!clientRow) {
      console.log(`❌ Клиент ${phoneNumber} не найден`);
      return null;
    }

    if (!clientRow['clientId']) {
      console.log(`❌ clientId пусто в строке`);
      return null;
    }

    console.log(`✅ Клиент найден: ${clientRow['clientId']}`);

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
      balance: clientRow['balance'],
      pricePerChar: clientRow['price per char'],
    };

  } catch (error) {
    console.error('❌ Ошибка getClientData:', error.message);
    console.error(error);
    return null;
  }
};
