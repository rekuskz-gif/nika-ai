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

    const rows = await sheet.getRows();

    const clientRow = rows.find(row => 
      row['whatsapp phone'] && row['whatsapp phone'].toString() === phoneNumber.toString()
    );

    if (!clientRow) {
      console.log(`❌ Клиент ${phoneNumber} не найден`);
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
      greenApiUrl: clientRow['green api url'],
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
