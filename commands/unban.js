const { UNDER_MAINTENANCE } = require('../lib/messages');
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');
const isAdmin = require('../lib/isAdmin');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function unbanCommand(sock, chatId, message, senderId) {
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
    if (senderLevel < 2 && !message.key.fromMe) {
        await sock.sendMessage(chatId, { 
            text: '*↢ هـذا الامـر يخـص〖 المدير 〗*'
        }, { quoted: message });
        return;
    }

    let userToUnban;

    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToUnban = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToUnban = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToUnban) {
        await sock.sendMessage(chatId, { 
            text: '*↢ الرجاء عمل منشن للمستخدم أو الرد على رسالته لإلغاء حظره!*'
        }, { quoted: message });
        return;
    }

    try {
        const bannedFilePath = path.join(process.cwd(), 'data', 'banned.json');

        if (!fs.existsSync(bannedFilePath)) {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً لايوجد محظورين لمسحهم.*'
            }, { quoted: message });
            return;
        }

        let bannedData = JSON.parse(fs.readFileSync(bannedFilePath, 'utf8'));

        if (Array.isArray(bannedData)) {
            const newBannedData = {};
            bannedData.forEach(userId => {
                newBannedData['default'] = newBannedData['default'] || [];
                newBannedData['default'].push(userId);
            });
            bannedData = newBannedData;
        }

        if (!bannedData[chatId] || bannedData[chatId].length === 0) {
            await sock.sendMessage(chatId, { 
                text: `*↢غـير مـحـظـور مـسـبــقآً*\n*↢المستخدم ↢* @${(userToUnban || '').split('@')[0]}`,
                mentions: userToUnban ? [userToUnban] : []
            }, { quoted: message });
            return;
        }

        const userNumber = userToUnban.split('@')[0];

        // نجمع كل صيغ المستخدم (LID + رقم الهاتف) لضمان مسح الحظر بالكامل
        const userNumbers = [userNumber];
        const targetInfo = groupMetadata.participants.find(p =>
            p.id === userToUnban ||
            (p.phoneNumber && (p.phoneNumber + '@s.whatsapp.net') === userToUnban) ||
            (p.id && p.id.split('@')[0] === userNumber)
        );
        if (targetInfo) {
            if (targetInfo.id) userNumbers.push(targetInfo.id.split('@')[0]);
            if (targetInfo.phoneNumber) userNumbers.push(targetInfo.phoneNumber.split('@')[0]);
        }

        const userIndex = bannedData[chatId].findIndex(banned => userNumbers.includes(banned.split('@')[0]));

        if (userIndex === -1) {
            await sock.sendMessage(chatId, { 
                text: `*↢غـير مـحـظـور مـسـبــقآً*\n*↢المستخدم ↢* @${userNumber}`,
                mentions: [userToUnban]
            }, { quoted: message });
            return;
        }

        // نحذف كل صيغ المستخدم دفعة واحدة
        bannedData[chatId] = bannedData[chatId].filter(banned => !userNumbers.includes(banned.split('@')[0]));

        if (bannedData[chatId].length === 0) {
            delete bannedData[chatId];
        }

        fs.writeFileSync(bannedFilePath, JSON.stringify(bannedData, null, 2), 'utf8');

        await sock.sendMessage(chatId, { 
            text: `*↢ الطيـب* @${userNumber}\n*↢ تـم الـغاء حظـره*`,
            mentions: [userToUnban]
        }, { quoted: message });

    } catch (error) {
        console.error('خطأ في إلغاء الحظر:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = unbanCommand;