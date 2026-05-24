
const { addWelcome, delWelcome, isWelcomeOn } = require('../lib/index');
const { getJoinDate, getEditCount, getMessageCount } = require('./members');
const { getUserRank } = require('./ranks');
const { delay } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const welcomeStates = new Map();

const quotes = [
    'جراحات السنان لها التئامٌ، ولا يلتام ما جرح اللسانُ',
    'إذا لم يكن للمرءِ عينٌ بصيرةٌ، فما تنفعُ العينانِ والقلبُ مظلمُ',
    'واختر لنفسك منزلاً تعلو به، أو اعتزل فبينَ العزِّ والذلِّ مفرقُ',
    'لسانُ الفتى نصفٌ ونصفٌ فؤادُهُ، فلم يبقَ إلا صورةُ اللحمِ والدمِ',
    'إنما الأممُ الأخلاقُ ما بقيت، فإن همُ ذهبت أخلاقهم ذهبوا',
    'ولا خيرَ في ودِّ امرئٍ متلونٍ، إذا الريحُ مالت مالَ حيثُ تميلُ',
    'أحسن إلى الناس تستعبد قلوبهم، فطالما استعبدَ الإنسانَ إحسانُ',
    'إذا نطق السفيهُ فلا تجبهُ، فخيرٌ من إجابتهِ السكوتُ',
    'وما من كاتبٍ إلا سيفنى، ويُبقي الدهرُ ما كتبت يداهُ',
    'زنِ الكلامَ إذا نطقتَ ولا تكن، ثرثارةً في كلِّ نادٍ تخطبُ',
    'أهلاً وسهلاً بمن وافى بطلعتهِ، كأنما أقبلت من بعدِها النعمُ',
    'يا ضيفنا لو زرتنا لوجدتنا، نحنُ الضيوفُ وأنت ربُّ المنزلِ',
    'أهلاً بطلعتك التي بجمالها، أنست قلوباً بالودادِ تُساقُ',
    'إنَّ القلوبَ لأجنادٌ مجندةٌ، فما تعارفَ منها بالصفا ائتلفا',
    'نزلتَ على السويداء من قلوبنا، فلك المحلُّ ولك الودُّ ممدودُ',
    'أنت الحبيبُ الذي نرجو مودتهُ، وأنت الضيفُ الذي بقدومه نسعدُ',
    'يا مرحباً بمن أنارَ دياجينا، وبطيبِ منطقهِ زانَ نوادينا',
    'سلامٌ كريحِ الوردِ يُهدى إليكمُ، وأهلاً بمن بجميلِ خُلقهِ وافانا',
    'أقبلتَ كالغيثِ في أرضٍ مجدبةٍ، فأزهرت بقدومك كلُّ نواحينا',
    'الجمالُ ليس بجمالِ الثيابِ بل بجمالِ الأدبِ',
    'من غلبَ كرمهُ لسانهُ، سادَ في القلوبِ مكانهُ',
    'الكلمةُ الطيبةُ صدقةٌ، فاجعل لسانك ميزانَ المودةِ',
    'إنَّ من البيانِ لسحراً، فاجعل سحرك في اللطفِ لا في الجفاءِ',
    'كُن كالنخلِ يرميه الناسُ بالحجرِ، فيرميهم بأطيبِ الثمرِ',
    'ليس العطاءُ من الفضولِ وإنما، جُودُ الفتى من قلةِ الإمكانِ',
    'من زادَ في أدبهِ زادَ في هيبتهِ، ومن لانت كلمتهُ وجبت محبتهُ',
    'عاملِ الناسَ بخلقٍ تكن سيّداً، فالناسُ لا تملكها إلا الأخلاقُ',
    'إنَّ ضاقَ بك الردُّ فاصمت بجلالٍ، فالصمتُ أحياناً أبلغُ من المقالِ',
    'احفظ لسانك أن تقولَ فتبتلى، إنَّ البلاءَ موكلٌ بالمنطقِ',
];

function randomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(date) {
    const parts = date.toLocaleDateString('en-US', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [month, day, year] = parts.split('/');
    return `${year}/${month}/${day}`;
}

const defaultWelcome = `#عباره

*حيّاك الله* #الاسم
*• وقت دخولك ↤︎* #الوقت
*• بـتاريخ ↤︎* #التاريخ`;

async function replaceWelcomeVars(text, sock, chatId, userId) {
    userId = typeof userId === 'string' ? userId : (userId?.id || userId?.jid || String(userId));
    const name = `@${userId.split('@')[0]}`;
    const now = new Date();
    const time = formatTime(now);
    const date = formatDate(now);

    const joinedAt = getJoinDate(chatId, userId);
    const joinDate = joinedAt ? formatDate(new Date(joinedAt)) : formatDate(now);
    const joinTime = joinedAt ? formatTime(new Date(joinedAt)) : formatTime(now);

    const msgCount = getMessageCount(chatId, userId);
    const editCount = getEditCount(chatId, userId);

    let rank = 'عضو';
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participant = groupMetadata.participants.find(p => p.id === userId);
        const isGroupAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        rank = await getUserRank(chatId, userId, isGroupAdmin);
    } catch (e) {}

    let creationDate = 'غير متوفر';
    try {
        const profile = await sock.getBusinessProfile(userId);
        if (profile && profile.about) {
            creationDate = 'متاح';
        }
    } catch (e) {}

    return text
        .replace(/{quote}/g, randomQuote())
        .replace(/#عباره/g, randomQuote())
        .replace(/{name}/g, name)
        .replace(/#الاسم/g, name)
        .replace(/{time}/g, time)
        .replace(/#الوقت/g, time)
        .replace(/{date}/g, date)
        .replace(/#التاريخ/g, date)
        .replace(/#الرسائل/g, String(msgCount))
        .replace(/#الايدي/g, userId)
        .replace(/#الرتبه/g, rank)
        .replace(/#التعديل/g, String(editCount))
        .replace(/#الانشاء/g, creationDate);
}

async function sendWelcome(sock, chatId, userId) {
    try {
        const data = await isWelcomeOn(chatId);
        if (!data) return;

        const welcomeMessage = data.message || defaultWelcome;
        const msg = await replaceWelcomeVars(welcomeMessage, sock, chatId, userId);

        await sock.sendMessage(chatId, { text: msg, mentions: [userId] });
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
}

async function handleWelcome(sock, chatId, message, match) {
    const senderId = message.key.remoteJid === chatId ? message.key.participant : message.key.remoteJid;

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*إعداد رسائل الترحيب*\n\n*تفعيل الترحيب* — تفعيل رسائل الترحيب\n*ضع ترحيب* — تخصيص رسالة الترحيب\n*الترحيب* — عرض الترحيب الحالي\n*مسح الترحيب* — إعادة للافتراضي\n*تعطيل الترحيب* — تعطيل رسائل الترحيب\n\n*المتغيرات المتاحة:*\n#الاسم, #الرسائل, #الايدي, #الرتبه, #التعديل, #الانشاء, #التاريخ, #الوقت`,
            quoted: message
        });
    }

    const lower = match.toLowerCase();

    if (lower === 'تفعيل') {
        const raw = await isWelcomeOn(chatId, true);
        if (raw && raw.enabled) {
            return sock.sendMessage(chatId, { text: '*رسائل الترحيب مفعلة بالفعل.*' }, { quoted: message });
        }
        const msg = raw?.message || defaultWelcome;
        await addWelcome(chatId, true, msg);
        return sock.sendMessage(chatId, { text: '*↢ تـم تفعيل الترحيب بنجاح... ☑️*' }, { quoted: message });
    }

    if (lower === 'تعطيل') {
        const raw = await isWelcomeOn(chatId, true);
        if (!raw || !raw.enabled) {
            return sock.sendMessage(chatId, { text: '*رسائل الترحيب معطلة بالفعل.*' }, { quoted: message });
        }
        const msg = raw.message || defaultWelcome;
        await addWelcome(chatId, false, msg);
        return sock.sendMessage(chatId, { text: '*↢ تـم تعطيل الترحيب بنجاح... ☑️*' }, { quoted: message });
    }

    if (lower === 'ضع') {
        welcomeStates.set(chatId, { senderId, waiting: true });
        return sock.sendMessage(chatId, {
            text: `*↫ حسناً ارسل الترحيب الجديد يمكنك اضافة.*\n#الاسم  -   *اسم العضو*\n#الرسائل - *عدد رسائل المستخدم*\n#الايدي  - *ايدي المستخدم*\n#الرتبه   - *رتبة المستخدم*\n#التعديل - *عدد تعديلات*\n#الانشاء  - *تاريخ انشاء حسابه*\n#التاريخ  - *تاريخ دخوله*\n#الوقت   - *وقت دخوله*\n#عباره  - *عبارة عشوائية*`
        }, { quoted: message });
    }

    if (lower === 'الترحيب') {
        const data = await isWelcomeOn(chatId, true);
        const msg = data?.message || defaultWelcome;
        const status = data ? (data.enabled ? 'مفعل' : 'معطل') : 'معطل';
        return sock.sendMessage(chatId, { text: `*↫ الترحيب ↢ ${status}*\n*↫الترحيب الحالي:*\n\n${msg}` }, { quoted: message });
    }

    if (lower === 'مسح') {
        await addWelcome(chatId, true, defaultWelcome);
        return sock.sendMessage(chatId, { text: '*↢ تـم إعادة تعين الترحيب الى الافتراضي بنجاح ... ☑️*' }, { quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: '*أمر غير صالح. استخدم: تفعيل الترحيب، ضع ترحيب، الترحيب، مسح الترحيب، تعطيل الترحيب*',
        quoted: message
    });
}

async function handleWelcomeText(sock, chatId, senderId, text) {
    const state = welcomeStates.get(chatId);
    if (!state || !state.waiting || state.senderId !== senderId) return false;

    await addWelcome(chatId, true, text);
    welcomeStates.delete(chatId);
    await sock.sendMessage(chatId, { text: '*↫ تـم حفظ الترحيب الجديد بنجاح... ☑️*' });
    return true;
}

module.exports = { handleWelcome, handleWelcomeText, sendWelcome, defaultWelcome };
