// ============================================
// HELPER: Получить данные клиента из Google Sheets
// ============================================

const { GoogleSpreadsheet } = require('google-spreadsheet');

// ✅ ДОБАВИТЬ async!
module.exports = async (phoneNumber) => {
  try {
    const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

    // Создаём объект Google Sheets
    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);

    // Авторизуемся
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    // Загружаем информацию
    await doc.loadInfo();

    // Открываем лист "Nika WhatsApp"
    const sheet = doc.sheetsByTitle['Nika WhatsApp'];

    // Получаем все строки
    const rows = await sheet.getRows();

    // Ищем клиента по номеру
    const clientRow = rows.find(row => row['whatsapp phone'] === phoneNumber);

    if (!clientRow) {
      console.log(`❌ Клиент ${phoneNumber} не найден`);
      return null;
    }

    // Возвращаем данные
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
    };

  } catch (error) {
    console.error('❌ Ошибка getClientData:', error);
    return null;
  }
};
