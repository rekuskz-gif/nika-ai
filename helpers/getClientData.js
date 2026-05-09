const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

module.exports = async function getClientData(phoneNumber) {
  try {
    const cleanPhone = String(phoneNumber).trim();
    console.log(`[getClientData] Ищу клиента по телефону: ${cleanPhone}`);

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const part1 = process.env.GOOGLE_PRIVATE_KEY_PART1 || '';
    const part2 = process.env.GOOGLE_PRIVATE_KEY_PART2 || '';
    const privateKey = (part1 + part2).replace(/\\n/g, '\n');

    console.log('[ENV] email:', email);
    console.log('[ENV] sheet_id:', sheetId);
    console.log('[KEY] Начало:', privateKey.substring(0, 40));
    console.log('[KEY] Конец:', privateKey.substring(privateKey.length - 40));

    if (!email || !sheetId || !privateKey) {
      console.error('[getClientData] Отсутствуют ENV переменные!');
      return null;
    }

    const serviceAccountAuth = new JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    console.log('[getClientData] JWT создан, подключаюсь к таблице...');

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    console.log(`[getClientData] Таблица загружена: ${doc.title}`);

    const sheet = doc.sheetsByTitle['Nika WhatsApp'];
    if (!sheet) {
      console.error('[getClientData] Лист "Nika WhatsApp" не найден!');
      console.log('[getClientData] Доступные листы:', Object.keys(doc.sheetsByTitle));
      return null;
    }

    const rows = await sheet.getRows();
    console.log(`[getClientData] Строк в таблице: ${rows.length}`);

    const row = rows.find(r => String(r.get('whatsapp phone')).trim() === cleanPhone);

    if (!row) {
      console.log(`[getClientData] Клиент ${cleanPhone} не найден`);
      console.log('[getClientData] Все телефоны в таблице:', rows.map(r => r.get('whatsapp phone')));
      return null;
    }

    console.log(`[getClientData] Найден клиент: ${row.get('clientId')}`);

    const getValue = async (fieldName) => {
      const val = row.get(fieldName);
      if (val && String(val).trim() !== '') {
        return String(val).trim();
      }

      console.log(`[getClientData] Поле "${fieldName}" пустое — ищу в Authentication`);
      const authSheet = doc.sheetsByTitle['Authentication'];
      if (!authSheet) return null;

      const authRows = await authSheet.getRows();
      const clientIdVal = String(row.get('clientId')).trim();
      const authRow = authRows.find(r => String(r.get('clientId')).trim() === clientIdVal);
      if (!authRow) return null;

      const authVal = authRow.get(fieldName);
      return authVal ? String(authVal).trim() : null;
    };

    const clientId = await getValue('clientId');
    const botName = await getValue('bot Name');
    const googleDocId = await getValue('google DocId');
    const claudeApiKey = await getValue('claudeApiKey');
    const tgToken = await getValue('tgToken');
    const tgChatId = await getValue('tg ChatId');
    const greenApiIdInstance = await getValue('green api id instance');
    const greenApiToken = await getValue('green api token');
    const status = await getValue('status');
    const balance = await getValue('balance');

    console.log(`[getClientData] status: ${status}`);
    console.log(`[getClientData] claudeApiKey: ${claudeApiKey ? claudeApiKey.substring(0, 20) + '...' : 'НЕТ'}`);

    if (status !== 'active') {
      console.log(`[getClientData] Клиент ${clientId} неактивен`);
      return null;
    }

    console.log(`[getClientData] Все данные загружены для: ${clientId}`);

    return {
      clientId,
      botName,
      googleDocId,
      claudeApiKey,
      tgToken,
      tgChatId,
      greenApiIdInstance,
      greenApiToken,
      status,
      balance: Number(balance) || 0,
    };

  } catch (error) {
    console.error('[getClientData] Ошибка:', error.message);
    console.error('[getClientData] Stack:', error.stack);
    return null;
  }
};
