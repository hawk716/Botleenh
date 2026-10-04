const { UNDER_MAINTENANCE } = require('../lib/messages');
const axios = require('axios');

// معطّل مؤقتاً: مزوّد الصور غير متاح. نرد برسالة الصيانة الموحّدة.
const DISABLED = true;

async function createImageCommand(sock, chatId, message) {
    try {
        if (DISABLED) {
            await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
            return;
        }

        // Get the prompt from the message
        const text = message.message?.conversation?.trim() || 
                     message.message?.extendedTextMessage?.text?.trim() || '';
        
        // Remove command prefix: انشاء OR انشاء صوره OR انشاء صورة
        const imagePrompt = text.replace(/^\.?(انشاء|انشاء\s+صوره|انشاء\s+صورة)\s*/i, '').trim();
        
        if (!imagePrompt) {
            await sock.sendMessage(chatId, {
                text: 'يرجى تقديم وصف لإنشاء الصورة.\n\nمثال: .انشاء قطة جميلة في العراق'
            }, {
                quoted: message
            });
            return;
        }

        // Send processing message
        await sock.sendMessage(chatId, {
            text: '🎨 جاري إنشاء صورتك... يرجى الانتظار.'
        }, {
            quoted: message
        });

        try {
            // Make API request to sii3.top
            const response = await axios.get(`https://sii3.top/api/gpt-img.php?text=${encodeURIComponent(imagePrompt)}`, {
                timeout: 30000
            });

            if (response.data && response.data.image_url) {
                // Send the generated image URL
                await sock.sendMessage(chatId, {
                    image: { url: response.data.image_url },
                    caption: `🎨 الصورة المولدة للوصف: "${imagePrompt}"`
                }, {
                    quoted: message
                });
            } else {
                throw new Error('No image URL in response');
            }
        } catch (apiError) {
            console.error('Error calling image API:', apiError);
            await sock.sendMessage(chatId, {
                text: UNDER_MAINTENANCE
            }, {
                quoted: message
            });
        }

    } catch (error) {
        console.error('Error in createimage command:', error);
        await sock.sendMessage(chatId, {
            text: UNDER_MAINTENANCE
        }, {
            quoted: message
        });
    }
}

module.exports = createImageCommand;
