const { UNDER_MAINTENANCE } = require('../lib/messages');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { getPinlock, addPinnedMessage, isMessagePinned, removePinnedMessage } = require('../lib/index');
const { getUserRank, getRankLevel } = require('../lib/ranks');

const rulesStates = new Map();

const defaultRules = `#قوانين المجموعه
*• ممنوع نشر الروابط بشكل عام  ☑️*
*• ممنوع العنصرية بكافة انواعها 👍🏻*
*• ممنوع مشاركة اي محتوى اباحي ⛔*
*• احترام المشرفين والتعامل بآدب 🤝*`;

async function ensureGroupAndAdmin(sock, chatId, senderId) {
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: 'هذا الأمر يمكن استخدامه في المجموعات فقط.' });
        return { ok: false };
    }
    // Check admin status of sender and bot
    const isAdmin = require('../lib/isAdmin');
    const adminStatus = await isAdmin(sock, chatId, senderId);
    if (!adminStatus.isBotAdmin) {
        await sock.sendMessage(chatId, { text: 'يرجى جعل البوت مشرف أولاً.' });
        return { ok: false };
    }
    if (!adminStatus.isSenderAdmin) {
        await sock.sendMessage(chatId, { text: 'فقط مشرفي المجموعة يمكنهم استخدام هذا الأمر.' });
        return { ok: false };
    }
    return { ok: true };
}

async function setGroupDescription(sock, chatId, senderId, text, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId);
    if (!check.ok) return;
    const desc = (text || '').trim();
    if (!desc) {
        await sock.sendMessage(chatId, { text: '*↫ قـم بإرسال الأمر هكذا: وصف القروب + الوصف*' }, { quoted: message });
        return;
    }
    // WhatsApp limits group description to 512 characters
    const maxLength = 512;
    const finalDesc = desc.length > maxLength ? desc.substring(0, maxLength) : desc;
    
    try {
        await sock.groupUpdateDescription(chatId, finalDesc);
        await sock.sendMessage(chatId, { text: '*↫ تــم تحديث صورة الوصف بنجاح ☑️*' }, { quoted: message });
        
        // Notify if description was truncated
        if (desc.length > maxLength) {
            await sock.sendMessage(chatId, { text: `⚠️ تم اختصار البايو إلى ${maxLength} حرف (حد واتساب الأقصى)` }, { quoted: message });
        }
    } catch (e) {
        console.error('Error updating description:', e);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

async function clearGroupDescription(sock, chatId, senderId, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId);
    if (!check.ok) return;
    try {
        await sock.groupUpdateDescription(chatId, '');
        await sock.sendMessage(chatId, { text: '*↫ تــم اعادة تعيين وصف الجروب بنجاح ☑️*' }, { quoted: message });
    } catch (e) {
        console.error('Error clearing description:', e);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

async function setGroupName(sock, chatId, senderId, text, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId);
    if (!check.ok) return;
    const name = (text || '').trim();
    if (!name) {
        await sock.sendMessage(chatId, { text: '⇜ قم بإرسال الأمر هكذا: تغيير الاسم <الاسم>' }, { quoted: message });
        return;
    }
    try {
        await sock.groupUpdateSubject(chatId, name);
        await sock.sendMessage(chatId, { text: `*↫ تــم تحديث اسم الجروب بنجاح ☑️*\n*↫ الاسـم الجديد:* ${name}` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

async function setGroupPhoto(sock, chatId, senderId, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId);
    if (!check.ok) return;

    let imageMessage = message.message?.imageMessage || message.message?.stickerMessage;

    if (!imageMessage) {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        imageMessage = quoted?.imageMessage || quoted?.stickerMessage;
    }

    if (!imageMessage) {
        await sock.sendMessage(chatId, { 
            text: '*↫ قم أولاً بإرسال الصوره/الملصق، ثم قم بالرد عليها بـ "صوره القروب" لتعينها.*' 
        }, { quoted: message });
        return;
    }
    try {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        const imgPath = path.join(tmpDir, `gpp_${Date.now()}.jpg`);
        fs.writeFileSync(imgPath, buffer);

        await sock.updateProfilePicture(chatId, { url: imgPath });
        try { fs.unlinkSync(imgPath); } catch (_) {}
        await sock.sendMessage(chatId, { text: '*↫ تــم تحديث صورة الجروب بنجاح ☑️*' }, { quoted: message });
    } catch (e) {
        console.error('Error updating group photo:', e);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

async function setRules(sock, chatId, senderId, text, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId);
    if (!check.ok) return;

    if (!text) {
        rulesStates.set(chatId, { senderId, waiting: true });
        return sock.sendMessage(chatId, { text: '*↫ ارسل القوانين التي تريد وضعها*' }, { quoted: message });
    }

    saveRules(chatId, text);
    await sock.sendMessage(chatId, { text: '*↫ تـم حفظ القوانين لـ لمجموعه.*' }, { quoted: message });
}

function saveRules(chatId, text) {
    const dataPath = path.join(__dirname, '../data/grouprules.json');
    let rules = {};
    if (fs.existsSync(dataPath)) {
        rules = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    rules[chatId] = text.trim();
    fs.writeFileSync(dataPath, JSON.stringify(rules, null, 2));
}

async function handleRulesText(sock, chatId, senderId, text) {
    const state = rulesStates.get(chatId);
    if (!state || !state.waiting || state.senderId !== senderId) return false;

    saveRules(chatId, text);
    rulesStates.delete(chatId);
    await sock.sendMessage(chatId, { text: '*↫ تـم حفظ القوانين لـ لمجموعه.*' });
    return true;
}

async function getRules(sock, chatId, message) {
    const dataPath = path.join(__dirname, '../data/grouprules.json');
    if (!fs.existsSync(dataPath)) {
        return sock.sendMessage(chatId, { text: defaultRules }, { quoted: message });
    }

    const rules = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!rules[chatId]) {
        return sock.sendMessage(chatId, { text: defaultRules }, { quoted: message });
    }

    await sock.sendMessage(chatId, { text: rules[chatId] }, { quoted: message });
}

async function clearRules(sock, chatId, senderId, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId);
    if (!check.ok) return;

    const dataPath = path.join(__dirname, '../data/grouprules.json');
    if (fs.existsSync(dataPath)) {
        const rules = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        delete rules[chatId];
        fs.writeFileSync(dataPath, JSON.stringify(rules, null, 2));
    }
    await sock.sendMessage(chatId, { text: '*↢ تـم مسح القوانين بنجاح... ☑️*' }, { quoted: message });
}

async function setNickname(sock, chatId, senderId, text, message) {
    let isGroupAdmin = false;
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participant = groupMetadata.participants.find(p => p.id === senderId);
        isGroupAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (e) {}

    const rank = require('../lib/ranks').getRank;
    const userRank = await rank(chatId, senderId, isGroupAdmin);
    if (!['مالك', 'مدير', 'ادمن'].includes(userRank) && !message.key.fromMe) {
        return sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 الادمن 〗فقط.*' }, { quoted: message });
    }

    const quoted = message.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.participant) {
        return sock.sendMessage(chatId, { text: '*↢ قـم بالرد على عضو مع كتابة اللقب.*' }, { quoted: message });
    }

    const targetId = quoted.participant;
    const nickname = text.trim();
    if (!nickname) {
        return sock.sendMessage(chatId, { text: '*↢ قـم بكتابة اللقب.*' }, { quoted: message });
    }

    const dataPath = path.join(__dirname, '../data/nicknames.json');
    let nicks = {};
    if (fs.existsSync(dataPath)) {
        nicks = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }

    if (!nicks[chatId]) nicks[chatId] = {};
    nicks[chatId][targetId] = nickname;
    fs.writeFileSync(dataPath, JSON.stringify(nicks, null, 2));
    await sock.sendMessage(chatId, { text: `*↢ تـم تعيين اللقب بنجاح... ☑️*\n*اللقب:* ${nickname}` }, { quoted: message });
}

async function getNickname(sock, chatId, senderId, message) {
    const dataPath = path.join(__dirname, '../data/nicknames.json');
    if (!fs.existsSync(dataPath)) {
        return sock.sendMessage(chatId, { text: '*↢ لم يتم تعيين لقب لك.*' }, { quoted: message });
    }

    const nicks = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const nick = nicks[chatId]?.[senderId];
    if (!nick) {
        return sock.sendMessage(chatId, { text: '*↢ لم يتم تعيين لقب لك.*' }, { quoted: message });
    }

    const rank = require('../lib/ranks').getRank;
    const userRank = await rank(chatId, senderId);
    const isRanked = ['owner', 'manager', 'admin'].includes(userRank);
    const text = isRanked ? `*↢ لقبـك هو ↤ ${nick}*` : `*↢ لقبـه هو ↤ ${nick}*`;
    await sock.sendMessage(chatId, { text }, { quoted: message });
}

async function pinMessage(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.stanzaId) {
        return;
    }

    const pinlock = await getPinlock(chatId);

    if (pinlock && !pinlock.enabled) {
        await sock.sendMessage(chatId, { text: '*↢ تـم تثبيت الرسالة لمدة 𝟑𝟎 يوم بنجاح... ☑️*' }, { quoted: message });
        return;
    }

    if (pinlock && pinlock.enabled) {
        let isGroupAdmin = false;
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participant = groupMetadata.participants.find(p => p.id === message.key.participant);
            isGroupAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        } catch (e) {}

        const userRank = await getUserRank(chatId, message.key.participant, isGroupAdmin);
        const userLevel = getRankLevel(userRank);
        if (userLevel < 2) {
            try {
                await sock.sendMessage(chatId, { delete: message.key });
            } catch (e) {}
            await sock.sendMessage(chatId, {
                text: `*↢ المستخدم〖 @${message.key.participant.split('@')[0]} 〗*\n*↢ عـذراً ممنوع التثبيت.*`,
                mentions: [message.key.participant]
            });
            return;
        }
    }

    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const isFromMe = quoted.participant === botJid;
    await sock.sendMessage(chatId, {
        pin: {
            remoteJid: chatId,
            fromMe: isFromMe,
            id: quoted.stanzaId,
            participant: quoted.participant
        },
        type: 1,
        time: 2592000
    });
    await addPinnedMessage(chatId, quoted.stanzaId);
    await sock.sendMessage(chatId, { text: '*↢ تـم تثبيت الرسالة لمدة 𝟑𝟎 يوم بنجاح... ☑️*' }, { quoted: message });
}

async function unpinMessage(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.stanzaId) {
        return;
    }

    const pinned = await isMessagePinned(chatId, quoted.stanzaId);
    if (!pinned) {
        await sock.sendMessage(chatId, { text: '*↢ عـذراً الرسالة غير مثبته.*' }, { quoted: message });
        return;
    }

    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const isFromMe = quoted.participant === botJid;
    await sock.sendMessage(chatId, {
        pin: {
            remoteJid: chatId,
            fromMe: isFromMe,
            id: quoted.stanzaId,
            participant: quoted.participant
        },
        type: 0
    });
    await removePinnedMessage(chatId, quoted.stanzaId);
    await sock.sendMessage(chatId, { text: '*↢ تـم الغاء تثبيت الرسالة بنجاح... ☑️*' }, { quoted: message });
}

async function unpinAll(sock, chatId, message) {
    await sock.sendMessage(chatId, { unpinAll: true });
    await sock.sendMessage(chatId, { text: '*↢ تـم الغاء تثبيت جميع الرسائل المثبته بنجاح... ☑️*' }, { quoted: message });
}

module.exports = {
    setGroupDescription,
    clearGroupDescription,
    setGroupName,
    setGroupPhoto,
    setRules,
    getRules,
    clearRules,
    handleRulesText,
    setNickname,
    getNickname,
    pinMessage,
    unpinMessage,
    unpinAll
};


