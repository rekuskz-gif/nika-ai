module.exports = async function getClientData(phoneNumber) {
  try {
    const cleanPhone = String(phoneNumber).trim();
    console.log(`� [getClientData] Ищу клиента: ${cleanPhone}`);

    // � ТЕСТОВЫЕ ДАННЫЕ
    console.log('⚠️ [getClientData] ИСПОЛЬЗУЮТСЯ ТЕСТОВЫЕ ДАННЫЕ!');
    
    if (cleanPhone === '77077503507') {
      console.log('✅ [getClientData] Найден: mina_001');
      return {
        clientId: 'mina_001',
        botName: 'Ника',
        googleDocId: '1q1YfdlbMeBWRVBAdzsGcC0OMSwF-4lOYHTdBNlmX33c',
        claudeApiKey: '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',
        tgToken: '8738435659:AAEV4tmSO8OLmCP3e22NaUg4Gb5x8grEUk0',
        tgChatId: '-1003909426405',
        greenApiIdInstance: '1105585279',
        greenApiToken: '07e78d2cfdc3490592b0ac0ec055bc442c9bcbbfc6a244e4b4',
        status: 'active',
        balance: 10000,
      };
    }

    console.log(`❌ [getClientData] Клиент ${cleanPhone} не найден`);
    return null;
  } catch (error) {
    console.error('❌ [getClientData] Ошибка:', error.message);
    return null;
  }
};
