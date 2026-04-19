
const fs = require('fs');
const path = require('path');

const wishes = [
    "تصير دكتور",
    "تصير ملياردير",
    "تصير راعي غنم",
    "تصير مشهور",
    "يكون معاك بلايستيشن",
    "تكون مثل المحقق كونان",
    "آيفون",
    "تسافر اليابان",
    "تطلع القمر",
    "تزور الكعبة",
    "تتحرر فلسطين 🇵🇸",
    "تنام اسبوع بدون ازعاج",
    "يختفوا الناس كلهم وتبقى انت وحدك"
];

const moods = [
    "سعيد 😊",
    "حزين 😢",
    "غاضب 😠",
    "متوتر 😰",
    "متحمس 🤩",
    "ممل 😑",
    "مرتاح 😌",
    "قلق 😟",
    "فرحان 😄",
    "متعب 😫"
];

const faces = [
    "😊", "😢", "😠", "😰", "🤩", "😑", "😌", "😟", "😄", "😫",
    "🥰", "😎", "🤔", "😴", "🤗", "😳", "🙄", "😏", "🤨", "😬"
];

const zodiac = [
    { name: "الحمل", start: [3, 21], end: [4, 19] },
    { name: "الثور", start: [4, 20], end: [5, 20] },
    { name: "الجوزاء", start: [5, 21], end: [6, 20] },
    { name: "السرطان", start: [6, 21], end: [7, 22] },
    { name: "الأسد", start: [7, 23], end: [8, 22] },
    { name: "العذراء", start: [8, 23], end: [9, 22] },
    { name: "الميزان", start: [9, 23], end: [10, 22] },
    { name: "العقرب", start: [10, 23], end: [11, 21] },
    { name: "القوس", start: [11, 22], end: [12, 21] },
    { name: "الجدي", start: [12, 22], end: [1, 19] },
    { name: "الدلو", start: [1, 20], end: [2, 18] },
    { name: "الحوت", start: [2, 19], end: [3, 20] }
];

function getZodiac(day, month) {
    for (let z of zodiac) {
        const [sm, sd] = z.start;
        const [em, ed] = z.end;
        if ((month === sm && day >= sd) || (month === em && day <= ed)) {
            return z.name;
        }
    }
    return "غير معروف";
}

function getUserData(chatId) {
    const p = path.join(process.cwd(), 'data', 'userGroupData.json');
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveUserData(chatId, userId, field, value) {
    const p = path.join(process.cwd(), 'data', 'userGroupData.json');
    let data = {};
    if (fs.existsSync(p)) {
        data = JSON.parse(fs.readFileSync(p, 'utf8'));
    }
    if (!data[chatId]) data[chatId] = {};
    if (!data[chatId][userId]) data[chatId][userId] = {};
    data[chatId][userId][field] = value;
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function getMessageCount(chatId, user1, user2) {
    const data = getUserData(chatId);
    const c1 = (data[chatId] && data[chatId][user1] && data[chatId][user1].messages) || 0;
    const c2 = (data[chatId] && data[chatId][user2] && data[chatId][user2].messages) || 0;
    return c1 + c2;
}

async function loveCommand(sock, chatId, message, senderId) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.participant;
    if (!quoted) {
        return await sock.sendMessage(chatId, { text: '*↢ قـم بالرد على رسالة المستخدم.*' }, { quoted: message });
    }
    
    const count = getMessageCount(chatId, senderId, quoted);
    let percent = Math.min(Math.floor(count / 10) + Math.floor(Math.random() * 30), 100);
    
    const emoji = percent >= 50 ? "❤️" : "🖤";
    const name = quoted.split('@')[0];
    await sock.sendMessage(chatId, { 
        text: `*↢ نسبة حبـك لـ @${name} هي ${percent}% ${emoji}.*`,
        mentions: [quoted]
    }, { quoted: message });
}

async function hateCommand(sock, chatId, message, senderId) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.participant;
    if (!quoted) {
        return await sock.sendMessage(chatId, { text: '*↢ قـم بالرد على رسالة المستخدم.*' }, { quoted: message });
    }
    
    const count = getMessageCount(chatId, senderId, quoted);
    let percent = Math.max(100 - Math.floor(count / 10) - Math.floor(Math.random() * 30), 0);
    
    const emoji = percent >= 50 ? "💔" : "🥺🖤";
    const name = quoted.split('@')[0];
    await sock.sendMessage(chatId, { 
        text: `*↢ نسبة كرهـك لـ @${name} هي ${percent}% ${emoji}.*`,
        mentions: [quoted]
    }, { quoted: message });
}

async function luckCommand(sock, chatId, message) {
    const percent = Math.floor(Math.random() * 101);
    const msgs = [
        `*↢ نسبة حظـك اليوم هي ${percent}% ☘️.*`,
        `*↢ نسبة حظـك اليوم هي ${percent}% 😑.*`,
        "*↢ الحـظ مبتسم لك اليوم 😁💝*",
        "*↢ تـوكل على الله، فالحظ من عنده 🤍*"
    ];
    await sock.sendMessage(chatId, { text: msgs[Math.floor(Math.random() * msgs.length)] }, { quoted: message });
}

async function faceCommand(sock, chatId, message) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    await sock.sendMessage(chatId, { text: `*↢ وجـهك اليوم ${face}*` }, { quoted: message });
}

async function wishCommand(sock, chatId, message) {
    const wish = wishes[Math.floor(Math.random() * wishes.length)];
    await sock.sendMessage(chatId, { text: `*↢ امـنيتك ${wish}*` }, { quoted: message });
}

async function starsCommand(sock, chatId, message) {
    const num = Math.floor(Math.random() * 5) + 1;
    const stars = "⭐".repeat(num);
    await sock.sendMessage(chatId, { text: stars }, { quoted: message });
}

async function moodCommand(sock, chatId, message) {
    const mood = moods[Math.floor(Math.random() * moods.length)];
    await sock.sendMessage(chatId, { text: `*↢ مـزاجك اليوم ${mood}*` }, { quoted: message });
}

async function stupidCommand(sock, chatId, message) {
    const percent = Math.floor(Math.random() * 101);
    await sock.sendMessage(chatId, { text: `*↢ نسـبة غبـائك ${percent}%*` }, { quoted: message });
}

async function whoLovesCommand(sock, chatId, message) {
    const meta = await sock.groupMetadata(chatId);
    const members = meta.participants.map(p => p.id);
    const random = members[Math.floor(Math.random() * members.length)];
    const name = random.split('@')[0];
    
    const msgs = [
        `*↢ @${name} يسلم عليك ويقلك 𝐈 𝐥𝐨𝐯𝐞 𝐲𝐨𝐮 😘*`,
        `*↢ @${name} يحبك في الله 🤍*`,
        `*↢ @${name} محرج يصارحك ولكن هذا كلامه انا بـحرقك اقصد بـحبك 😁💔*`
    ];
    
    await sock.sendMessage(chatId, { 
        text: msgs[Math.floor(Math.random() * msgs.length)],
        mentions: [random]
    }, { quoted: message });
}

async function whoHatesCommand(sock, chatId, message) {
    const meta = await sock.groupMetadata(chatId);
    const members = meta.participants.map(p => p.id);
    const random = members[Math.floor(Math.random() * members.length)];
    const name = random.split('@')[0];
    
    const msgs = [
        `*↢ @${name} بـحبك بس حساب الكافي عليك 😉*`,
        `*↢ @${name} يتمنى لك يوماً سعيداً ومصائب بلا حدوداً*`,
        `*↢ @${name} نفسه يقول اكرهك بس بالاملاء ضعيف يكتب احبك بدل اكرهك 🙂*`,
        `*↢ @${name} يحاول يكرهك بس ما يقدر... على اساس في درع يمنعه 🙃*`
    ];
    
    await sock.sendMessage(chatId, { 
        text: msgs[Math.floor(Math.random() * msgs.length)],
        mentions: [random]
    }, { quoted: message });
}

module.exports = {
    loveCommand,
    hateCommand,
    luckCommand,
    faceCommand,
    wishCommand,
    starsCommand,
    moodCommand,
    stupidCommand,
    whoLovesCommand,
    whoHatesCommand
};
