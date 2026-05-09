module.exports = async function getClientData(phoneNumber) {
  try {
    const cleanPhone = String(phoneNumber).trim();
    
    if (cleanPhone === '77077503507') {
      return {
        clientId: 'mina_001',
        claudeApiKey: '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',
        tgToken: '8738435659:AAEV4tmSO8OLmCP3e22NaUg4Gb5x8grEUk0',
        tgChatId: '-1003909426405',
        greenApiIdInstance: '1105585279',
        greenApiToken: '07e78d2cfdc3490592b0ac0ec055bc442c9bcbbfc6a244e4b4',
      };
    }
    return null;
  } catch (error) {
    console.error('❌ getClientData error:', error.message);
    return null;
  }
};
