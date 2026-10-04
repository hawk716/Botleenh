const { UNDER_MAINTENANCE } = require('../lib/messages');

const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function banCommand(sock, chatId, message, senderId) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: '*↢ هذا الأمر يعمل فقط في المجموعات!*'
        }, { quoted: message });
        return;
    }

    if (!senderId) {
        senderId = message.key.participant || message.key.remoteJid;
    }

    const groupMetadata = await sock.groupMetadata(chatId);
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
    const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
    const senderLevel = getRankLevel(senderRank);
    
    // مدير or higher (level >= 3) OR bot owner
    if (senderLevel < 3 && !message.key.fromMe) {
        await sock.sendMessage(chatId, { 
            text: '*↢ هـذا الامـر يخـص〖 المدير 〗*'
        }, { quoted: message });
        return;
    }

    let userToBan;

    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToBan) {
        await sock.sendMessage(chatId, { 
            text: '*↢ يرجى عمل منشن للمستخدم أو الرد على رسالته لحظره!*'
        }, { quoted: message });
        return;
    }

    if (!message.key.fromMe && senderLevel === 4) {
        const targetParticipant = groupMetadata.participants.find(p => p.id === userToBan);
        const targetRank = await getUserRank(chatId, userToBan, targetParticipant && targetParticipant.admin);
        if (targetRank === 'مالك') {
            await sock.sendMessage(chatId, {
                text: '*↢ عـذراً الامـر يـخص  ↤︎〖  المـالك الاسـاسـي 〗فـقط .*'
            }, { quoted: message });
            return;
        }
    }

    // لا يمكن حظر البوت نفسه
    const { isTargetBot, rejectBotTarget } = require('../lib/isBotTarget');
    if (isTargetBot(sock, groupMetadata, userToBan)) {
        await rejectBotTarget(sock, chatId, message);
        return;
    }

    try {
        const bannedFilePath = path.join(process.cwd(), 'data', 'banned.json');
        let bannedData = {};

        if (fs.existsSync(bannedFilePath)) {
            bannedData = JSON.parse(fs.readFileSync(bannedFilePath, 'utf8'));

            if (Array.isArray(bannedData)) {
                const newBannedData = {};
                bannedData.forEach(userId => {
                    newBannedData['default'] = newBannedData['default'] || [];
                    newBannedData['default'].push(userId);
                });
                bannedData = newBannedData;
            }
        }

        if (!bannedData[chatId]) {
            bannedData[chatId] = [];
        }

        const userNumber = userToBan.split('@')[0];

        // نجمع كل صيغ المستخدم (LID + رقم الهاتف) لضمان عمل الحظر أياً كانت صيغة المُرسِل
        const banJids = [userToBan];
        const targetInfo = groupMetadata.participants.find(p =>
            p.id === userToBan ||
            (p.phoneNumber && (p.phoneNumber + '@s.whatsapp.net') === userToBan) ||
            (p.id && p.id.split('@')[0] === userNumber)
        );
        if (targetInfo) {
            if (targetInfo.id && !banJids.includes(targetInfo.id)) banJids.push(targetInfo.id);
            if (targetInfo.phoneNumber) {
                const phoneJid = targetInfo.phoneNumber + '@s.whatsapp.net';
                if (!banJids.includes(phoneJid)) banJids.push(phoneJid);
            }
        }
        const userNumbers = banJids.map(j => j.split('@')[0]);
        const alreadyBanned = bannedData[chatId].some(banned => userNumbers.includes(banned.split('@')[0]));

        if (!alreadyBanned) {
            bannedData[chatId].push(...banJids);
            fs.writeFileSync(bannedFilePath, JSON.stringify(bannedData, null, 2), 'utf8');

            await sock.sendMessage(chatId, {
                text: `*↢ تم حظـرهہ*\n*↢ المستخدم ↢* @${userToBan.split('@')[0]}`,
                mentions: [userToBan]
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { 
                text: `*↢ مـا يحتاج محظور مسـبقاً.*\n*↢ المستخدم:* @${userToBan.split('@')[0]}`,
                mentions: [userToBan]
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in ban command:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = banCommand;
