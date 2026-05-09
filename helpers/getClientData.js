module.exports = async function getClientData(phoneNumber) {
  try {
    console.log(`\n[getClientData-1] Function called with phoneNumber: ${phoneNumber}`);
    const cleanPhone = String(phoneNumber).trim();
    console.log(`[getClientData-2] Clean phone: ${cleanPhone}`);

    console.log('[getClientData-3] ИСПОЛЬЗУЮТСЯ ТЕСТОВЫЕ ДАННЫЕ!');
    
    if (cleanPhone === '77077503507') {
      console.log('[getClientData-4] Phone matches test number');
      const testData = {
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
      console.log('[getClientData-5] Returning test data:', JSON.stringify(testData, null, 2));
      return testData;
    }

    console.log(`[getClientData-6] Phone ${cleanPhone} not in test data`);
    return null;
  } catch (error) {
    console.error('[getClientData-ERROR] Error:', error.message);
    console.error('[getClientData-ERROR-STACK]', error.stack);
    return null;
  }
};
