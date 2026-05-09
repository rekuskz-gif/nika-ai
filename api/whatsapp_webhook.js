require('dotenv').config();
require('../config/firebase');
const axios = require('axios');

module.exports = async (req, res) => {
  console.error('� START');
  res.status(200).send('OK');

  try {
    const testKey = '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';
    
    console.error('� TEST 1: Simple request');
    console.error('[TEST] Key length:', testKey.length);
    console.error('[TEST] Key first 30:', testKey.substring(0, 30));

    console.error('� TEST 2: Calling Claude');
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Say hello' }]
      },
      {
        headers: {
          'x-api-key': testKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.error('✅ SUCCESS:', response.data.content[0].text);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('CODE:', error.code);
    if (error.response) {
      console.error('STATUS:', error.response.status);
      console.error('DATA:', JSON.stringify(error.response.data));
    }
  }
};
