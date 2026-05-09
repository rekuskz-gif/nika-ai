const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

module.exports = async function getClientData(instanceId) {
  try {
    console.log(`[getClientData] Ищу клиента по instanceId: ${instanceId}`);

    const email = 'mina-ai@ai-mina-system.iam.gserviceaccount.com';
    const sheetId = '1DYCnjY4n5KsiOUC76YsaHUqOG3sJpbj72psQKFqNuIg';
    const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDSDiWDGdNui1fe\nbae1Z1FwsIWo8k+rCYMd98OrYe+WgVq4nBKwdqUHz9qsKMDkoUOA3NKcbBVKqqfH\nvj8xMNTcQSRdwnb4P2JGLJAD0csSHdJrCKJeUlWMx09Lk8e8xV0QhUGdQfxUGbym\nI4PLQaZdW28t7aIqD03DYyYfolIeFxidy8TPoShPaku7NOmgJrn7C4bPuB+LvOUa\nfaCK/BOY92fjdTQQxPD48KgVWjl/23ijUZNGIEOm62h1jGAaH++8Kv3a1htGC/va\nx96NRxN1vwWT3QJE+Afdmr6e/UnVJ8W5zlcA0QVkYu6yA6SnKwzAffuktiVmCpjd\n3KBMcWhxAgMBAAECggEALOkRZCJVbkEknE3dmY9pfip/qUuFdRAnlHSwxSe/TfKC\nLw5PgKMdTbpHCp/7/eXsxNRxwzfopXovPSmT4TSLjjvvRoyZWyJSJKbKc8abIFh3\n8KJ79Kat29eRQJtsDRQ1fZ7AFJtTE7gc+XiGaSK0Kymtb6hrD4sOGURNll3iKMRr\n+Sfpo7A+E817nuN6Ku30ZqJFRg9SxiXs/bBVYnyDKfAJWQ3WnVT7ON8vqqrohT2v\nVZAc3SK46HW6kBm4q9wEXk8AQUQiteIusfpwmpLMbzI1lw32Zjmb6dLAPjVj8oUd\nrzdsQfjbWC0TMmJTKDZfbwkSTauVQLhY5Sptysl/cQKBgQD5EGvbsmj4dRRLCxVh\nCxTIkETNqT53NFxe8Tzq86KNrXMF4N/pYb7njIwx1/PJdH3H8FBeM/oj3Esu9jFx\nOK2AcSM0sdqbpEMvFrwbE/e+jMzzJ8/l2qE8BMH0HEokHfKglgBfNK3fG4DLeE26\nJ0F1zY+kOFRmNrrnrvz0tHhD/wKBgQDX56F8ThNlM1sORixgWB5ztVekm9TF/Cj/\ns1mliP3G/V0Bc4HJDfZQfyFKk7viHrEjKBbeJ9x+vNav7VXzFyX9GWujvPZ02i+c\n9+mDzW+muS0IiHzS92I7FeSqVnTX9b6tpctGCnRRT2E8TUSvxRdq2xj+8jr1/UuR\n80CqsciTjwKBgQDvq26vLiK3HCsX/6VmCfzI95NN+NPkb92He0rsqOA+x68M9BVk\nBqxnMydhe3bb4B59vPIJhKjrwzwSB9USJ8FF/Rksxw0fgtUnxg/jWranheRfBGuZ\nu2Y2VDmzx1lNIghtoYrgEthR/qxUoALj5IyoaNQV6iLFbVs0QX6nl9a3TwKBgBjS\nwedX1rUI/Ywbl1iQaRfmnqgHXqRQxKn5hfIZWQw67ymOjTp/h3Vj2IEJkU2DN9yR\n7GcocBqGPazGfd5QKAb8mDqgLDntKBJFEq0bvp2NptbXUnqzBLFEaCEJha+ayoyO\nhluMMilzFfvn6mDHKVUY0bvmP88uizTBogq+HBCTAoGAXDB3CkCXYnZKpA3XxvL6\nv8BhbysuuKmyPA7ha3EqEqqpuwx/nBlKL2X55cnIL8SNrWRPTsVwVBXb72yX2zm3\nVxljYOW3Zaiugxl1OlgBgkI0mbio1OPbAy1fsbrG+6IMloOVYbOPFjrze3JHExNu\nRywOLUl8tYsqPJDuPkJQCN8=\n-----END PRIVATE KEY-----\n";

    const serviceAccountAuth = new JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    console.log(`[getClientData] Таблица загружена: ${doc.title}`);

    const sheet = doc.sheetsByTitle['Nika WhatsApp'];
    if (!sheet) {
      console.error('[getClientData] Лист "Nika WhatsApp" не найден!');
      return null;
    }

    const rows = await sheet.getRows();
    console.log(`[getClientData] Строк: ${rows.length}`);

    const row = rows.find(r => String(r.get('green api id instance')).trim() === String(instanceId).trim());

    if (!row) {
      console.log(`[getClientData] Клиент с instanceId ${instanceId} не найден`);
      console.log('[getClientData] Инстансы в таблице:', rows.map(r => r.get('green api id instance')));
      return null;
    }

    console.log(`[getClientData] Найден: ${row.get('clientId')}`);

    const getValue = async (fieldName) => {
      const val = row.get(fieldName);
      if (val && String(val).trim() !== '') {
        return String(val).trim();
      }
      console.log(`[getClientData] "${fieldName}" пустое — ищу в Authentication`);
      const authSheet = doc.sheetsByTitle['Authentication'];
      if (!authSheet) return null;
      const authRows = await authSheet.getRows();
      const authRow = authRows.find(r => String(r.get('clientId')).trim() === String(row.get('clientId')).trim());
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
      console.log(`[getClientData] Клиент неактивен`);
      return null;
    }

    console.log(`[getClientData] Готово для: ${clientId}`);

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
    return null;
  }
};
