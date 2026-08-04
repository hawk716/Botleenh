const fetch = require('node-fetch');

// Map Arabic language names to ISO codes
const LANG_MAP = {
    'عربي': 'ar',
    'انجليزي': 'en',
    'ألماني': 'de',
    'إيطالي': 'it',
    'برتغالي': 'pt',
    'روسي': 'ru',
    'ياباني': 'ja',
    'كوري': 'ko',
    'صيني': 'zh',
    'فرنسي': 'fr',
    'هندي': 'hi',
    'إسباني': 'es',
    'اسباني': 'es'
};

function normalizeLang(lang) {
    const lower = lang.toLowerCase().trim();
    if (LANG_MAP[lower]) return LANG_MAP[lower];
    // Already a code?
    if (/^[a-z]{2}$/.test(lower)) return lower;
    return null;
}

async function handleTranslateCommand(sock, chatId, message, match) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        let textToTranslate = '';
        let lang = '';

        // Check if it's a reply
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            textToTranslate = quotedMessage.conversation ||
                            quotedMessage.extendedTextMessage?.text ||
                            quotedMessage.imageMessage?.caption ||
                            quotedMessage.videoMessage?.caption || '';
            lang = match.trim();
        } else {
            const args = match.trim().split(' ');
            if (args.length < 2) {
                const usage = `_*الاســتــخــدام:*_ 
*1. ترجم + اللغة ↢بـالرد*
*2.اكتب↢ترجم + النص + اللغة*
────────────
_*مــثال:*_
• ترجم مرحباً انجليزي
• ترجم مرحباً en
────────────
 _*رمــوز اللغــات:*_ 
> *ar - عربي | en - انجليزي*
> *de - ألماني | it - إيطالي*
> *pt - برتغالي | ru - روسي*
> *ja - ياباني | ko - كوري*
> *zh - صيني | fr - فرنسي*
> *hi - هندي | es - إسباني*`;
                return sock.sendMessage(chatId, { text: usage }, { quoted: message });
            }
            lang = args.pop();
            textToTranslate = args.join(' ');
        }

        // Normalize language
        const normalizedLang = normalizeLang(lang);
        if (!normalizedLang) {
            return sock.sendMessage(chatId, {
                text: `*↢ عـذراً لغة غير معروفة.*`,
                quoted: message
            });
        }
        lang = normalizedLang;

        if (!textToTranslate) {
            return sock.sendMessage(chatId, {
                text: '❌ لم يتم العثور على نص للترجمة. يرجى تقديم نص أو الرد على رسالة.',
                quoted: message
            });
        }

        // Try multiple translation APIs in sequence
        let translatedText = null;
        let error = null;

        // Try API 1 (Google Translate API)
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data[0] && data[0][0] && data[0][0][0]) {
                    translatedText = data[0][0][0];
                }
            }
        } catch (e) {
            error = e;
        }

        // If API 1 fails, try API 2
        if (!translatedText) {
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.responseData && data.responseData.translatedText) {
                        translatedText = data.responseData.translatedText;
                    }
                }
            } catch (e) {
                error = e;
            }
        }

        // If API 2 fails, try API 3
        if (!translatedText) {
            try {
                const response = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.translated) {
                        translatedText = data.translated;
                    }
                }
            } catch (e) {
                error = e;
            }
        }

        if (!translatedText) {
            throw new Error('All translation APIs failed');
        }

        // Send translation
        await sock.sendMessage(chatId, {
            text: `${translatedText}`,
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('❌ Error in translate command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ فشلت ترجمة النص. يرجى المحاولة لاحقاً.\n\nالاستخدام:\n1. رد على رسالة بـ: ترجم <اللغة>\n2. أو اكتب: ترجم <النص> <اللغة>',
            quoted: message
        });
    }
}

module.exports = {
    handleTranslateCommand
}; 