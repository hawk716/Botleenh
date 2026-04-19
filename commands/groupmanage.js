const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

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
        await sock.sendMessage(chatId, { text: '⇜ قم بإرسال الأمر هكذا: تغيير البايو <البايو>' }, { quoted: message });
        return;
    }
    // WhatsApp limits group description to 512 characters
    const maxLength = 512;
    const finalDesc = desc.length > maxLength ? desc.substring(0, maxLength) : desc;
    
    try {
        await sock.groupUpdateDescription(chatId, finalDesc);
        await sock.sendMessage(chatId, { text: '⇜ أبشر تم تحديث البايو' }, { quoted: message });
        
        // Notify if description was truncated
        if (desc.length > maxLength) {
            await sock.sendMessage(chatId, { text: `⚠️ تم اختصار البايو إلى ${maxLength} حرف (حد واتساب الأقصى)` }, { quoted: message });
        }
    } catch (e) {
        console.error('Error updating description:', e);
        await sock.sendMessage(chatId, { text: '❌ فشل تحديث البايو' }, { quoted: message });
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
        await sock.sendMessage(chatId, { text: '⇜ أبشر تم تحديث اسم الجروب' }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: '❌ فشل تحديث اسم المجموعة.' }, { quoted: message });
    }
}

async function setGroupPhoto(sock, chatId, senderId, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId);
    if (!check.ok) return;

    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMessage = quoted?.imageMessage || quoted?.stickerMessage;
    if (!imageMessage) {
        await sock.sendMessage(chatId, { text: '⇜ قم أولاً بإرسال *الصورة/الملصق* ثم قم بالرد عليها بتغيير الصورة لتعينها' }, { quoted: message });
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
        await sock.sendMessage(chatId, { text: '⇜ أبشر تم تحديث صورة الجروب' }, { quoted: message });
    } catch (e) {
        console.error('Error updating group photo:', e);
        await sock.sendMessage(chatId, { text: '❌ فشل تحديث صورة المجموعة.' }, { quoted: message });
    }
}

async function setRules(sock, chatId, senderId, text, message) {
    const check = await ensureGroupAndAdmin(sock, chatId, senderId);
    if (!check.ok) return;

    const dataPath = path.join(__dirname, '../data/grouprules.json');
    let rules = {};
    if (fs.existsSync(dataPath)) {
        rules = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }

    rules[chatId] = text.trim();
    fs.writeFileSync(dataPath, JSON.stringify(rules, null, 2));
    await sock.sendMessage(chatId, { text: '*↢ تـم تحديث القوانين بنجاح... ☑️*' }, { quoted: message });
}

async function getRules(sock, chatId, message) {
    const dataPath = path.join(__dirname, '../data/grouprules.json');
    if (!fs.existsSync(dataPath)) {
        return sock.sendMessage(chatId, { text: '*↢ لم يتم اضافة القوانين بعد.*' }, { quoted: message });
    }

    const rules = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!rules[chatId]) {
        return sock.sendMessage(chatId, { text: '*↢ لم يتم اضافة القوانين بعد.*' }, { quoted: message });
    }

    await sock.sendMessage(chatId, { text: `*القوانين:*\n${rules[chatId]}` }, { quoted: message });
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
    const rank = require('../lib/ranks').getRank;
    const userRank = await rank(chatId, senderId);
    if (!['owner', 'manager', 'admin'].includes(userRank) && !message.key.fromMe) {
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
    await sock.sendMessage(chatId, { pin: quoted.stanzaId });
}

async function unpinMessage(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.stanzaId) {
        return;
    }
    await sock.sendMessage(chatId, { unpin: quoted.stanzaId });
}

async function unpinAll(sock, chatId, message) {
    await sock.sendMessage(chatId, { unpinAll: true });
    await sock.sendMessage(chatId, { text: '*↢ تـم الغاء تثبيت جميع الرسائل بنجاح... ☑️*' }, { quoted: message });
}

module.exports = {
    setGroupDescription,
    setGroupName,
    setGroupPhoto,
    setRules,
    getRules,
    clearRules,
    setNickname,
    getNickname,
    pinMessage,
    unpinMessage,
    unpinAll
};


