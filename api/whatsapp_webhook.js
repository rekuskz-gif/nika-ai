// Сохраняем входящее сообщение БЕЗ ОЖИДАНИЯ
    console.log('� Сохраняю входящее сообщение в Firebase...');
    saveToFirebase(clientId, sessionId, {
      role: 'user',
      content: messageText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(err => console.error('❌ Firebase save error:', err));
    console.log('✅ Сообщение отправлено на сохранение (async)\n');

    // СРАЗУ ОТПРАВЛЯЕМ В CLAUDE БЕЗ ИСТОРИИ
    console.log('� Отправляю запрос в Claude API...');
    
    const systemPrompt = "Ты полезный AI ассистент Ника. Отвечай кратко и дружелюбно (1-2 предложения). Подпись: Ника �";
    
    const claudeMessages = [
      {
        role: 'user',
        content: messageText
      }
    ];

    console.log(`� Claude messages: ${claudeMessages.length}\n`);

    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages
    }, {
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 25000
    });

    console.log('✅ Claude ответил успешно\n');
    const botText = claudeResponse.data.content[0].text;
    console.log(`� Ответ Ники:\n"${botText}"\n`);

    // Сохраняем ответ БЕЗ ОЖИДАНИЯ
    console.log('� Сохраняю ответ в Firebase...');
    saveToFirebase(clientId, sessionId, {
      role: 'assistant',
      content: botText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    }).catch(err => console.error('❌ Firebase save error:', err));
    console.log('✅ Ответ отправлен на сохранение (async)\n');

    // Отправляем в WhatsApp
    console.log('� Отправляю в WhatsApp...');
    console.log(`� Номер: ${sender}`);
    console.log(`� Текст: "${botText}"\n`);
    await sendWhatsApp(sender, botText, greenApiIdInstance, greenApiToken);
    console.log('✅ Отправлено в WhatsApp\n');

    if (tgToken && tgChatId) {
      console.log('� Отправляю уведомление в Telegram...');
      const tgMessage = `� *WhatsApp: ${clientId}*\n\n� *Юзер:* ${messageText}\n\n� *Nika:* ${botText}`;
      sendToTelegram(tgToken, tgChatId, tgMessage).catch(err => console.error('❌ Telegram error:', err));
      console.log('✅ Telegram отправлен (async)\n');
    }

    console.log('════════════════════════════════════');
    console.log('✅ WEBHOOK УСПЕШНО ОБРАБОТАН!');
    console.log('════════════════════════════════════\n');
