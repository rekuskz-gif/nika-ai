// После сохранения сообщения:
    await saveToFirebase(clientId, sessionId, {
      role: 'user',
      content: messageText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Сообщение сохранено\n');

    // Получаем историю
    console.log('� Получаю историю из Firebase...');
    const chatHistory = await getHistoryFromFirebase(clientId, sessionId);
    console.log(`✅ История загружена (${chatHistory.length} сообщений)\n`);

    // Отправляем в Claude
    console.log('� Отправляю в Claude...');
    const systemPrompt = "Ты полезный AI ассистент. Отвечай кратко и полезно.";
    
    const claudeMessages = chatHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    console.log(`� Claude messages count: ${claudeMessages.length}`);

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

    console.log('✅ Claude ответил\n');
    const botText = claudeResponse.data.content[0].text;
    console.log(`� Ответ Ники: "${botText}"\n`);

    // Сохраняем ответ
    console.log('� Сохраняю ответ в Firebase...');
    await saveToFirebase(clientId, sessionId, {
      role: 'assistant',
      content: botText,
      channel: 'whatsapp',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Ответ сохранен\n');

    // Отправляем в WhatsApp
    console.log('� Отправляю в WhatsApp...');
    await sendWhatsApp(sender, botText, greenApiIdInstance, greenApiToken);
    console.log('✅ Отправлено в WhatsApp\n');

    // Telegram
    if (tgToken && tgChatId) {
      console.log('� Отправляю в Telegram...');
      const tgMessage = `� *WhatsApp: ${clientId}*\n\n� *Юзер:* ${messageText}\n\n� *Nika:* ${botText}`;
      await sendToTelegram(tgToken, tgChatId, tgMessage);
      console.log('✅ Telegram отправлен\n');
    }

    console.log('════════════════════════════════════');
    console.log('✅ WEBHOOK УСПЕШНО ОБРАБОТАН');
    console.log('════════════════════════════════════\n');
