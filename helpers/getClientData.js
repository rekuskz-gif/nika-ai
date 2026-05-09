const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = async function getClientData(phoneNumber) {
  try {
    console.log(`🔍 Ищу клиента: ${phoneNumber}`);

    const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Nika WhatsApp'];
    
    if (!sheet) {
      console.log('❌ Лист "Nika WhatsApp" не найден');
      return null;
    }

    // ВАЖНО! Начинаем с СТРОКИ 5 (индекс 4, потому что 0-based)
    // Пропускаем: строка 1 (заголовки), строки 2-4 (пустые)
    const rows = await sheet.getRows({ limit: 1000 });

    // Фильтруем от строки 5 и дальше (индекс >= 4)
    const validRows = rows.filter((row, index) => {
      return index >= 4 && row['clientId']; // Строка 5+ и clientId не пусто
    });

    // Ищем по номеру WhatsApp
    const clientRow = validRows.find(row => 
      row['whatsapp phone'] && row['whatsapp phone'].toString() === phoneNumber.toString()
    );

    if (!clientRow) {
      console.log(`❌ Клиент ${phoneNumber} не найден (поиск начинался со строки 5)`);
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
    return null;
  }
};
