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

// يقرأ اللغة من أي موضع: الأولى أو الأخيرة.
// «نص الى صوت عربي مرحبا» و«نص الى صوت مرحبا عربي» كلاهما صحيح.
function findLangToken(token) {
    if (!token) return null;
    const t = token.toLowerCase().replace(/[.,!?؟،]$/u, '');
    if (LANG_MAP[t]) return LANG_MAP[t];
    if (/^[a-z]{2}(-[A-Z]{2})?$/.test(token) || /^[a-z]{2}-[a-z]{2}$/.test(t)) return t;
    return null;
}

function parseTtsArgs(text) {
    const trimmed = text.trim();
    if (!trimmed) return { lang: 'en', text: '' };
    const parts = trimmed.split(/\s+/);

    // 1) اللغة في البداية: «عربي مرحبا بك»
    const first = findLangToken(parts[0]);
    if (first) {
        return { lang: first, text: parts.slice(1).join(' ') };
    }

    // 2) اللغة في النهاية: «مرحبا بك عربي»
    const last = findLangToken(parts[parts.length - 1]);
    if (last && parts.length > 1) {
        return { lang: last, text: parts.slice(0, -1).join(' ') };
    }

    // 3) بلا لغة محددة: الإنجليزية، والنص كاملاً
    return { lang: 'en', text: trimmed };
}

async function ttsCommand(sock, chatId, text, msg) {
    try {
        const cleanedText = text.trim();

        if (!cleanedText) {
            const sendOpts = msg?.key ? { quoted: msg } : {};
            await sock.sendMessage(chatId, {
                text: `*الاستخدام:*\n*1. نص الى صوت + اللغة ↢بالرد*\n*2. نص الى صوت + اللغة + النص*\n────────────\n*مثال:*\n• نص الى صوت مرحبا عربي\n• نص الى صوت مرحبا ar\n────────────\n*يدعم أكثر من 70 لغة*`
            }, sendOpts);
            return;
        }

        const { lang, text: actualText } = parseTtsArgs(cleanedText);

        if (!actualText) {
            const sendOpts = msg?.key ? { quoted: msg } : {};
            await sock.sendMessage(chatId, {
                text: `*يرجى تقديم النص بعد اللغة.*\n*مثال: نص الى صوت مرحبا عربي*`
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
