const axios = require('axios');

async function soraCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // Extract prompt after command keyword(s) or use quoted text
        const prefixes = ['فيديو ذكي', 'توليد فيديو', 'انشاء فيديو', 'sora', '.sora'];
        let input = rawText;
        let matched = false;
        for (const p of prefixes) {
            if (rawText.toLowerCase().startsWith(p.toLowerCase())) {
                input = rawText.slice(p.length).trim();
                matched = true;
                break;
            }
        }
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        if (!input) input = quotedText;

        if (!input) {
            await sock.sendMessage(chatId, { text: 'قدم وصفاً. مثال: .sora فتاة أنمي بشعر أزرق قصير' }, { quoted: message });
            return;
        }

        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(input)}`;
        const { data } = await axios.get(apiUrl, { timeout: 60000, headers: { 'user-agent': 'Mozilla/5.0' } });

        const videoUrl = data?.videoUrl || data?.result || data?.data?.videoUrl;
        if (!videoUrl) {
            throw new Error('No videoUrl in API response');
        }

        await sock.sendMessage(chatId, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `الوصف: ${input}`
        }, { quoted: message });

    } catch (error) {
        console.error('[SORA] error:', error?.message || error);
        await sock.sendMessage(chatId, { text: 'فشل في توليد الفيديو. جرب وصفاً مختلفاً لاحقاً.' }, { quoted: message });
    }
}

module.exports = soraCommand;

