const { UNDER_MAINTENANCE } = require('../lib/messages');
const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

// Mapping of common Arabic language names to gTTS codes
const LANG_MAP = {
    'عربي': 'ar',
    'انجليزي': 'en',
    'فرنسي': 'fr',
    'ألماني': 'de',
    'إيطالي': 'it',
    'إسباني': 'es',
    'اسباني': 'es',
    'برتغالي': 'pt',
    'روسي': 'ru',
    'ياباني': 'ja',
    'كوري': 'ko',
    'صيني': 'zh-CN',
    'هندي': 'hi',
    'هولندي': 'nl',
    'دنماركي': 'da',
    'سويدي': 'sv',
    'نرويجي': 'no',
    'فنلندي': 'fi',
    'يوناني': 'el',
    'بولندي': 'pl',
    'تشيكي': 'cs',
    'تركي': 'tr',
    'فارسي': 'fa',
    'عبري': 'he',
    'كاتالاني': 'ca',
    'روماني': 'ro',
    'سلوفاكي': 'sk',
    'سلوفيني': 'sl',
    'كرواتي': 'hr',
    'صربي': 'sr',
    'أوكراني': 'uk',
    'بلغاري': 'bg',
    'هنغاري': 'hu',
    'ماليزي': 'ms',
    'اندونيسي': 'id',
    'تايلاندي': 'th',
    'فيتنامي': 'vi',
    'فلبيني': 'tl',
    'سواحيلي': 'sw'
};

function parseTtsArgs(text) {
    const trimmed = text.trim();
    if (!trimmed) return { lang: 'en', text: '' };
    const parts = trimmed.split(/\s+/);
    const first = parts[0].toLowerCase();

    if (LANG_MAP[first]) {
        return { lang: LANG_MAP[first], text: parts.slice(1).join(' ') };
    }
    if (/^[a-z]{2}(-[A-Z]{2})?$/.test(first)) {
        return { lang: first, text: parts.slice(1).join(' ') };
    }
    return { lang: 'en', text: trimmed };
}

async function ttsCommand(sock, chatId, text, msg) {
    try {
        const cleanedText = text.trim();

        if (!cleanedText) {
            const sendOpts = msg?.key ? { quoted: msg } : {};
            await sock.sendMessage(chatId, {
                text: `_*الاستخدام:*_\n*1. نص الى صوت + اللغة ↢بالرد*\n*2. نص الى صوت + النص + اللغة*\n────────────\n_*مثال:*_\n• نص الى صوت كيف حالك انجليزي\n• نص الى صوت كيف حالك en\n────────────\n*يدعم أكثر من 70 لغة*`
            }, sendOpts);
            return;
        }

        const { lang, text: actualText } = parseTtsArgs(cleanedText);

        if (!actualText) {
            const sendOpts = msg?.key ? { quoted: msg } : {};
            await sock.sendMessage(chatId, {
                text: `يرجى تقديم النص بعد اللغة.\nمثال: *نص الى صوت ar مرحبا*`
            }, sendOpts);
            return;
        }

        const fileName = `tts-${Date.now()}.mp3`;
        const filePath = path.join(__dirname, '..', 'assets', fileName);

        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        const gtts = new gTTS(actualText, lang);
        gtts.save(filePath, async function (err) {
            if (err) {
                console.error('gTTS save error:', err);
                const sendOpts = msg?.key ? { quoted: msg } : {};
                await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, sendOpts);
                return;
            }

            const sendOpts = msg?.key ? { quoted: msg } : {};
            await sock.sendMessage(chatId, {
                audio: { url: filePath },
                mimetype: 'audio/mpeg',
                ptt: false
            }, sendOpts);

            try { fs.unlinkSync(filePath); } catch (e) {}
        });

    } catch (error) {
        console.error('❌ Error in TTS command:', error);
        const sendOpts = msg?.key ? { quoted: msg } : {};
        await sock.sendMessage(chatId, {
            text: UNDER_MAINTENANCE
        }, sendOpts);
    }
}

module.exports = ttsCommand;
