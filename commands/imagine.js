const axios = require('axios');

// نماذج Pollinations.ai المتاحة
const MODELS = {
    default: 'flux',
    realistic: 'flux-realism',
    anime: 'flux-anime',
    fast: 'turbo',
    pro: 'flux-pro'
};

/**
 * أمر تخيل / توليد صورة
 * الاستخدام: تخيل <وصف> | توليد صوره <وصف> | توليد صورة <وصف>
 * يدعم اختيار النموذج: تخيل --واقعي <وصف> | تخيل --انمي <وصف> | تخيل --سريع <وصف>
 */
async function imagineCommand(sock, chatId, message) {
    try {
        const text = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            ''
        ).trim();

        // استخراج البرومبت بعد حذف أي شكل من أشكال الأمر
        let imagePrompt = text
            .replace(/^\.?\s*(تخيل|توليد\s+صوره|توليد\s+صورة)\s*/i, '')
            .trim();

        // اختيار النموذج من الكلمة المفتاحية
        let model = MODELS.default;
        if (/--واقعي/i.test(imagePrompt)) {
            model = MODELS.realistic;
            imagePrompt = imagePrompt.replace(/--واقعي/i, '').trim();
        } else if (/--انمي|--أنمي/i.test(imagePrompt)) {
            model = MODELS.anime;
            imagePrompt = imagePrompt.replace(/--انمي|--أنمي/i, '').trim();
        } else if (/--سريع/i.test(imagePrompt)) {
            model = MODELS.fast;
            imagePrompt = imagePrompt.replace(/--سريع/i, '').trim();
        } else if (/--احترافي/i.test(imagePrompt)) {
            model = MODELS.pro;
            imagePrompt = imagePrompt.replace(/--احترافي/i, '').trim();
        }

        if (!imagePrompt) {
            await sock.sendMessage(chatId, {
                text: `🎨 *أمر توليد الصورة*\n\n` +
                      `يرجى كتابة وصف الصورة بعد الأمر.\n\n` +
                      `*أمثلة:*\n` +
                      `• تخيل غروب جميل فوق الجبال\n` +
                      `• توليد صورة قطة بجانب النهر\n\n` +
                      `*النماذج المتاحة:*\n` +
                      `• بدون خيار ← جودة عالية (flux)\n` +
                      `• --واقعي ← صور واقعية\n` +
                      `• --انمي ← رسوم أنمي\n` +
                      `• --سريع ← توليد سريع\n` +
                      `• --احترافي ← جودة احترافية`
            }, { quoted: message });
            return;
        }

        // رسالة الانتظار
        await sock.sendMessage(chatId, {
            text: `🎨 جاري توليد صورتك...\n📝 الوصف: "${imagePrompt}"\n⏳ يرجى الانتظار...`
        }, { quoted: message });

        // بناء رابط Pollinations.ai
        const seed = Math.floor(Math.random() * 999999);
        const encodedPrompt = encodeURIComponent(imagePrompt);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=${model}&seed=${seed}&nologo=true&enhance=true`;

        // تنزيل الصورة كـ buffer
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: { 'User-Agent': 'LeenBot/1.0' }
        });

        const imageBuffer = Buffer.from(response.data);

        // إرسال الصورة
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `🎨 *تم توليد الصورة*\n\n` +
                     `📝 الوصف: ${imagePrompt}\n` +
                     `🤖 النموذج: ${model}\n` +
                     `✨ مشغّل بـ Pollinations.ai`
        }, { quoted: message });

    } catch (error) {
        console.error('[imagine] Error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ تعذّر توليد الصورة، يرجى المحاولة مرة أخرى أو تغيير الوصف.'
        }, { quoted: message });
    }
}

module.exports = imagineCommand;
