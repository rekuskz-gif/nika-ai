// ============================================================
// Читает данные клиента из Google Sheets с логикой fallback
// ============================================================

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const getClientData = async (phoneNumber) => {
  console.log(`🔍 Ищем клиента по номеру: ${phoneNumber}`);

  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();

    // ШАГ 1: Ищем в "Nika WhatsApp"
    const nikaSheet = doc.sheetsByTitle['Nika WhatsApp'];
    if (!nikaSheet) {
      throw new Error('Лист "Nika WhatsApp" не найден');
    }

    await nikaSheet.loadCells('A1:Z100');

    // Читаем заголовки
    const headers = {};
    for (let col = 0; col < nikaSheet.columnCount; col++) {
      const headerCell = nikaSheet.getCell(0, col).value;
      if (headerCell) {
        const key = String(headerCell).toLowerCase().trim();
        headers[key] = col;
      }
    }

    console.log('📋 Заголовки загружены');

    // Ищем клиента по номеру телефона (колонка B)
    const phoneCol = headers['whatsapp phone'];
    let foundRow = null;
    let clientId = null;

    for (let i = 1; i < Math.min(101, nikaSheet.rowCount); i++) {
      const cellValue = nikaSheet.getCell(i, phoneCol).value;
      if (cellValue === phoneNumber) {
        foundRow = i;
        clientId = nikaSheet.getCell(i, 0).value; // clientId из колонки A
        console.log(`✅ Найден клиент: ${clientId} в строке ${i}`);
        break;
      }
    }

    if (!foundRow) {
      throw new Error(`Клиент с номером ${phoneNumber} не найден`);
    }

    // ШАГ 2: Функция чтения с fallback
    const getByHeader = (headerName) => {
      const lowerName = String(headerName).toLowerCase().trim();
      const col = headers[lowerName];

      if (col === undefined) {
        console.warn(`⚠️ Колонка "${headerName}" не найдена`);
        return null;
      }

      // Попытка 1: Строка клиента в "Nika WhatsApp"
      const nikaValue = nikaSheet.getCell(foundRow, col).value;
      if (nikaValue) {
        console.log(`✅ ${headerName}: "${nikaValue}" (из Nika WhatsApp)`);
        return nikaValue;
      }

      // Попытка 2: Строка клиента в "Authentication"
      const authSheet = doc.sheetsByTitle['Authentication'];
      if (authSheet) {
        await authSheet.loadCells(`A1:Z${foundRow + 1}`);
        const authValue = authSheet.getCell(foundRow, col).value;
        if (authValue) {
          console.log(`📖 ${headerName}: "${authValue}" (из Authentication)`);
          return authValue;
        }
      }

      // Попытка 3: Строка 2 (default) в "Nika WhatsApp"
      const defaultValue = nikaSheet.getCell(2, col).value;
      console.log(`📖 ${headerName}: "${defaultValue}" (из строки 2 - default)`);
      return defaultValue;
    };

    // ШАГ 3: Читаем все данные
    const clientData = {
      clientId,
      whatsappPhone: getByHeader('whatsapp phone'),
      botName: getByHeader('bot Name'),
      googleDocId: getByHeader('google DocId'),
      claudeApiKey: getByHeader('claudeApiKey'),
      tgToken: getByHeader('tgToken'),
      tgChatId: getByHeader('tg ChatId'),
      greenApiUrl: getByHeader('green api url'),
      greenApiIdInstance: getByHeader('green api id instance'),
      greenApiToken: getByHeader('green api token'),
      status: getByHeader('status'),
      balance: parseInt(getByHeader('balance')) || 0,
      pricePerChar: parseInt(getByHeader('price per char')) || 0,
      spentTokens: parseInt(getByHeader('spent tokens')) || 0,
      activateUntil: getByHeader('Active Until'),
    };

    console.log('✅ Данные клиента загружены');
    return clientData;

  } catch (error) {
    console.error('❌ Ошибка getClientData:', error.message);
    throw error;
  }
};

module.exports = getClientData;
