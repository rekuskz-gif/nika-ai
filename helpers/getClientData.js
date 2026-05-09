const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

module.exports = async function getClientData(phoneNumber) {
  try {
    const cleanPhone = String(phoneNumber).trim();
    console.log(`🔍 Ищу клиента: ${cleanPhone}`);

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

    // НОВЫЙ СИНТАКСИС с JWT
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    await doc.auth.setAuthenticationMethod(serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Nika WhatsApp'];
    if (!sheet) {
      console.log('❌ Лист "Nika WhatsApp" не найден');
      return null;
    }

    const rows = await sheet.getRows();
    console.log(`📊 Всего строк: ${rows.length}`);

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
    return null;
  }
};
