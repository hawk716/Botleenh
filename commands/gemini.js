const fetch = require('node-fetch');

async function geminiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "يرجى تقديم سؤال بعد جيمني\n\nمثال: .جيمني ما هي عاصمة فرنسا؟"
            }, {
                quoted: message
            });
        }

        // Get the query after جيمني
        const query = text.replace(/^\.?جيمني\s*/i, '').trim();

        if (!query) {
            return await sock.sendMessage(chatId, { 
                text: "يرجى تقديم سؤال بعد جيمني\n\nمثال: .جيمني ما هي عاصمة فرنسا؟"
            }, {quoted: message});
        }

        try {
            // Show processing message
            await sock.sendMessage(chatId, {
                react: { text: '🤖', key: message.key }
            });

            // Gemini APIs from sii3.top
            const apis = [
                {
                    url: `https://sii3.top/DARK/gemini.php?text=${encodeURIComponent(query)}`,
                    name: 'gemini-2.5-flash'
                },
                {
                    url: `https://sii3.top/api/gemini-dark.php?gemini-pro=${encodeURIComponent(query)}`,
                    name: 'gemini-2.5-pro'
                },
                {
                    url: `https://sii3.top/api/gemini-dark.php?gemini-deep=${encodeURIComponent(query)}`,
                    name: 'gemini-2.5-deep'
                }
            ];

            for (const api of apis) {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 25000);
                    
                    const response = await fetch(api.url, { signal: controller.signal });
                    clearTimeout(timeout);
                    
                    if (!response.ok) {
                        console.log(`Gemini API ${api.name} returned ${response.status}`);
                        continue;
                    }
                    
                    const data = await response.json();
                    const answer = data.response || data.message || data.data || data.answer || data.result;
                    
                    if (answer && typeof answer === 'string' && answer.length > 0) {
                        await sock.sendMessage(chatId, {
                            text: answer
                        }, {
                            quoted: message
                        });
                        
                        return;
                    }
                } catch (e) {
                    console.log(`Gemini API failed (${api.name}): ${e.message}`);
                    continue;
                }
            }
            throw new Error('All Gemini APIs failed');
        } catch (error) {
            console.error('Gemini API Error:', error);
            await sock.sendMessage(chatId, {
                text: "❌ فشل في الحصول على رد. يرجى المحاولة لاحقاً.",
                contextInfo: {
                    mentionedJid: [message.key.participant || message.key.remoteJid],
                    quotedMessage: message.message
                }
            }, {
                quoted: message
            });
        }
    } catch (error) {
        console.error('Gemini Command Error:', error);
        await sock.sendMessage(chatId, {
            text: "❌ حدث خطأ. يرجى المحاولة لاحقاً.",
            contextInfo: {
                mentionedJid: [message.key.participant || message.key.remoteJid],
                quotedMessage: message.message
            }
        }, {
            quoted: message
        });
    }
}

module.exports = geminiCommand;
