const axios = require('axios');

async function gptCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "يرجى تقديم سؤال بعد جبتي\n\nمثال: .جبتي اكتب كود html بسيط"
            }, {
                quoted: message
            });
        }

        // Get the query after جبتي
        const query = text.replace(/^\.?جبتي\s*/i, '').trim();

        if (!query) {
            return await sock.sendMessage(chatId, { 
                text: "يرجى تقديم سؤال بعد جبتي\n\nمثال: .جبتي اكتب كود html بسيط"
            }, {quoted: message});
        }

        try {
            // Show processing message
            await sock.sendMessage(chatId, {
                react: { text: '🤖', key: message.key }
            });

            // Multiple GPT APIs for fallback - sii3.top
            const models = ['gpt-5', 'gpt-4o', 'gpt-4.1', 'o3'];
            
            for (const model of models) {
                try {
                    const response = await axios.get(`https://sii3.top/api/openai.php?${model}=${encodeURIComponent(query)}`, { 
                        timeout: 25000 
                    });
                    
                    const answer = response.data?.response || response.data?.result;
                    
                    if (answer && typeof answer === 'string' && answer.length > 0) {
                        await sock.sendMessage(chatId, {
                            text: answer
                        }, {
                            quoted: message
                        });
                        return;
                    }
                } catch (e) {
                    console.log(`GPT API failed (${model}): ${e.message}`);
                    continue;
                }
            }
            
            throw new Error('All GPT APIs failed');
        } catch (error) {
            console.error('GPT API Error:', error);
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
        console.error('GPT Command Error:', error);
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

module.exports = gptCommand;
