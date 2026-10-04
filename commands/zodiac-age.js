const { UNDER_MAINTENANCE } = require('../lib/messages');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const botNumber = settings.ownerNumber;

function normalizeNum(jid) {
    return jid.split('@')[0].split(':')[0];
}

const jokes = [
    'متى يجي اليوم اللي أدخل فيه البيت... وأسمعها تقول: "أص! أص! يا أولاد، أبوكم جاء..." 😢',
    'مليت، كلما أدخل البيت أسمع:\n"جاء الصايع الضايع..." 🤡🤕',
    'حكمة اليوم: إذا طعنك صاحبك في الظهر، اطعنه بالمغرب لأن ليل، ظلام...\nفهمت؟ 😂😹',
    'تكره نفسك لما تمزح مع واحد عندك له فلوس تجلس خائف على مشاعره\nأكثر من حبيبتك 🌞🌝💔',
    'لا تاخد الامور بشكل جدي 😐\nخذها بشكل جدك انت 😒\nجدي ما دخلو بالموضوع احترم نفسك 💔',
    'كم أرغب بالجلوس في مكان خالي، ولكن خالي الله يهديه مش راضي يقوم 🤣😢',
    'واحد يقول من الزهق شخبطت على ورقة ونزلت اعطيتها للصيدلاني\nقال الصيدلاني:\nهذا منقطع من فتره، لكن عندنا بديل له 🤣😂'
];

const pendingZodiac = new Map();
const ageRequests = new Map();

function genId() {
    return Math.random().toString(36).substr(2, 8);
}

function getZodiac(day, month) {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'الحمل';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'الثور';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'الجوزاء';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'السرطان';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'الأسد';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'العذراء';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'الميزان';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'العقرب';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'القوس';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'الجدي';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'الدلو';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'الحوت';
    return 'غير معروف';
}

function getAgeComment(age) {
    if (age < 10) return 'احلى عمر لا همّ ولا وجع راس 😗';
    if (age <= 14) return 'بداية المراهقة الله يعين اهلك عليك 🙂';
    if (age <= 19) return 'أحلامك كثيرة بس الجيب فاضي 😁💔';
    if (age <= 29) return 'تعرف كل شي بس ما تطبق ولا شي';
    if (age <= 45) return 'تعرف تتعامل مع الناس بس ما تعرف تتعامل مع فواتيرك 👌🏻😂';
    return 'جيلك ذهبي بس ركبتك تقول غير كذا 💔😂';
}

async function zodiacCmd(sock, chatId, msg, senderId) {
    pendingZodiac.set(senderId, { chatId, msgKey: msg.key });
    await sock.sendMessage(chatId, {
        text: '*↢ قـم بارسال تاريخ ميلادك اليوم والشهر.*\n*↢ مثال: 15/5 أو 15-5*'
    }, { quoted: msg });
}

async function handleZodiacResponse(sock, chatId, msg, senderId, text) {
    if (!pendingZodiac.has(senderId)) return false;
    
    let match = text.match(/(\d{1,2})[\/\-\s](\d{1,2})/);
    if (!match) return false;
    
    let day = parseInt(match[1]);
    let month = parseInt(match[2]);
    
    if (day < 1 || day > 31 || month < 1 || month > 12) {
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE });
        return true;
    }
    
    let zodiac = getZodiac(day, month);
    pendingZodiac.delete(senderId);
    
    await sock.sendMessage(chatId, {
        text: `*↢ بـرجك هـو↫ ${zodiac}*`
    }, { quoted: msg });
    
    return true;
}

async function ageCmd(sock, chatId, msg, senderId, groupLink) {
    let reqId = genId();
    let userNum = normalizeNum(senderId);
    
    ageRequests.set(reqId, { 
        groupId: chatId,
        groupLink,
        originalMsg: msg,
        userId: senderId,
        userNum,
        step: 'waiting',
        created: Date.now()
    });
    
    let link = `https://wa.me/${botNumber}?text=عمر_${reqId}`;
    
    await sock.sendMessage(chatId, {
        text: `*↢ قـم بارسال سيلفي لك هنا*\n\n*» ${link}*`
    }, { quoted: msg });
    
    setTimeout(() => ageRequests.delete(reqId), 10 * 60 * 1000);
}

async function handleAgeTrigger(sock, chatId, msg, senderId, rawText) {
    let text = rawText || msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    text = text.trim();
    
    let match = text.match(/عمر_([a-z0-9]+)/i);
    if (!match) return false;
    
    let reqId = match[1];
    let req = ageRequests.get(reqId);
    
    if (!req) return false;
    
    let userNum = normalizeNum(senderId);
    if (userNum !== req.userNum) return false;
    
    req.step = 'photo';
    req.privateChat = chatId;
    ageRequests.set(reqId, req);
    
    await sock.sendMessage(chatId, {
        text: '*↢ قـم بارسال صورت وجهك الآن لتقدير عمرك*\n\n*↢ ملاحـظة للبنات: البوت آمن ولكن للإحتياط لاتقومي بمشاركة صور شخصية لك مع البوت، رغم ان البوت يقوم بتخزينها بذاكرة التخزين المؤقت ويقوم بحذفها مباشرة بعد الانتهاء.*'
    });
    
    return true;
}

async function handleAgeImage(sock, chatId, msg, senderId) {
    let imgMsg = msg.message?.imageMessage;
    if (!imgMsg) return false;
    
    let userNum = normalizeNum(senderId);
    let req = null;
    let reqId = null;
    
    for (let [id, r] of ageRequests) {
        if (r.userNum === userNum && r.step === 'photo') {
            req = r;
            reqId = id;
            break;
        }
    }
    
    if (!req) return false;
    
    ageRequests.delete(reqId);
    
    let age = Math.floor(Math.random() * 35) + 12;
    let comment = getAgeComment(age);
    
    let linkText = req.groupLink ? `\n*- 𝑳𝒊𝒏𝒌: ${req.groupLink}*` : '';
    
    await sock.sendMessage(chatId, {
        text: `*↢ تـم ارسال عمرك تقريباً في القروب*${linkText}`
    });
    
    if (req.groupId && req.groupId.endsWith('@g.us')) {
        await sock.sendMessage(req.groupId, {
            text: `*↢ عـمرك هـو \`${age}\` ${comment}*`
        }, { quoted: req.originalMsg });
    }
    
    return true;
}

async function jokeCmd(sock, chatId, msg) {
    let joke = jokes[Math.floor(Math.random() * jokes.length)];
    await sock.sendMessage(chatId, { text: `*↢ نكتـه:*\n${joke}` }, { quoted: msg });
}

module.exports = {
    zodiacCmd,
    handleZodiacResponse,
    ageCmd,
    handleAgeImage,
    handleAgeTrigger,
    jokeCmd,
    pendingZodiac,
    ageRequests,
    botNumber
};
