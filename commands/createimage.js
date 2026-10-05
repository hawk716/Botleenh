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
 * أمر إنشاء صورة
 * الاستخدام: انشاء صوره <وصف> | انشاء صورة <وصف> | انشاء <وصف>
 * يدعم أحجام مختلفة: --مربع | --عرضي | --طولي
 */
async function createImageCommand(sock, chatId, message) {
    try {
        const text = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            ''
        ).trim();

        // استخراج البرومبت بعد حذف الأمر
        let imagePrompt = text
            .replace(/^\.?\s*(انشاء\s+صوره|انشاء\s+صورة|انشاء)\s*/i, '')
            .trim();

        // اختيار الحجم
        let width = 1024;
        let height = 1024;
        let sizeLabel = 'مربع 1024×1024';

        if (/--عرضي/i.test(imagePrompt)) {
            width = 1280; height = 720;
            sizeLabel = 'عرضي 1280×720';
            imagePrompt = imagePrompt.replace(/--عرضي/i, '').trim();
        } else if (/--طولي/i.test(imagePrompt)) {
            width = 720; height = 1280;
            sizeLabel = 'طولي 720×1280';
            imagePrompt = imagePrompt.replace(/--طولي/i, '').trim();
        } else if (/--مربع/i.test(imagePrompt)) {
            imagePrompt = imagePrompt.replace(/--مربع/i, '').trim();
        }

        // اختيار النموذج
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
                text: `🖼️ *أمر إنشاء الصورة*\n\n` +
                      `يرجى كتابة وصف الصورة بعد الأمر.\n\n` +
                      `*أمثلة:*\n` +
                      `• انشاء صورة مدينة مستقبلية\n` +
                      `• انشاء غابة خيالية --واقعي\n` +
                      `• انشاء صورة فارس --انمي --طولي\n\n` +
                      `*خيارات النموذج:*\n` +
                      `• --واقعي | --انمي | --سريع | --احترافي\n\n` +
                      `*خيارات الحجم:*\n` +
                      `• --مربع (افتراضي) | --عرضي | --طولي`
            }, { quoted: message });
            return;
        }

        // رسالة الانتظار
        await sock.sendMessage(chatId, {
            text: `🖼️ جاري إنشاء الصورة...\n📝 الوصف: "${imagePrompt}"\n📐 الحجم: ${sizeLabel}\n⏳ يرجى الانتظار...`
        }, { quoted: message });

        // بناء رابط Pollinations.ai
        const seed = Math.floor(Math.random() * 999999);
        const encodedPrompt = encodeURIComponent(imagePrompt);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true`;

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
            caption: `🖼️ *تم إنشاء الصورة*\n\n` +
                     `📝 الوصف: ${imagePrompt}\n` +
                     `📐 الحجم: ${sizeLabel}\n` +
                     `🤖 النموذج: ${model}\n` +
                     `✨ مشغّل بـ Pollinations.ai`
        }, { quoted: message });

    } catch (error) {
        console.error('[createimage] Error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ تعذّر إنشاء الصورة، يرجى المحاولة مرة أخرى أو تغيير الوصف.'
        }, { quoted: message });
    }
}

module.exports = createImageCommand;
