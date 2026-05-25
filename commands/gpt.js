const axios = require('axios');

const NVIDIA_TOKEN = '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';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const MODELS = [
    'meta/llama-4-maverick-17b-128e-instruct',
    'meta/llama-3.2-90b-vision-instruct',
    'google/gemma-3n-e4b-it',
    'upstage/solar-10.7b-instruct',
    'google/gemma-3n-e2b-it'
];

async function callNvidia(model, messages, maxTokens = 500) {
    const res = await axios.post(NVIDIA_URL, {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7
    }, {
        headers: {
            'Authorization': `Bearer ${NVIDIA_TOKEN}`,
            'Content-Type': 'application/json'
        },
        timeout: 30000
    });
    return res.data?.choices?.[0]?.message?.content || '';
}

async function gptCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: "يرجى تقديم سؤال بعد ميتا\n\nمثال: ميتا اكتب كود html بسيط"
            }, { quoted: message });
        }

        const query = text.replace(/^\.?ميتا\s*/i, '').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: "يرجى تقديم سؤال بعد ميتا\n\nمثال: ميتا اكتب كود html بسيط"
            }, { quoted: message });
        }

        // Show thinking reaction
        await sock.sendMessage(chatId, {
            react: { text: '🧠', key: message.key }
        });

        // Build messages payload
        const userMessages = [{ role: 'user', content: query }];

        let lastError = '';

        for (const model of MODELS) {
            try {
                console.log(`[META] Trying model: ${model}`);
                const reply = await callNvidia(model, userMessages);
                if (reply && reply.trim()) {
                    // Show success reaction
                    await sock.sendMessage(chatId, {
                        react: { text: '🤖', key: message.key }
                    });
                    await sock.sendMessage(chatId, {
                        text: reply,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363161513685998@newsletter',
                                newsletterName: 'KnightBot MD',
                                serverMessageId: -1
                            }
                        }
                    }, { quoted: message });
                    return;
                }
            } catch (e) {
                lastError = e.message;
                console.log(`[META] Model ${model} failed: ${e.message?.substring(0, 80)}`);
            }
        }

        throw new Error(lastError || 'All models failed');
    } catch (error) {
        console.error('[META] Error:', error.message?.substring(0, 100));
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
        await sock.sendMessage(chatId, {
            text: "❌ فشل في الحصول على رد من ميتا. يرجى المحاولة لاحقاً."
        }, { quoted: message });
    }
}

module.exports = gptCommand;
