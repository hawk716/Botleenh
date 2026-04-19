
const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function banCommand(sock, chatId, message, senderId) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: '⚠️ هذا الأمر يعمل فقط في المجموعات!'
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
            text: 'يرجى عمل منشن للمستخدم أو الرد على رسالته لحظره!'
        }, { quoted: message });
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
        const alreadyBanned = bannedData[chatId].some(banned => banned.split('@')[0] === userNumber);

        if (!alreadyBanned) {
            bannedData[chatId].push(userToBan);
            fs.writeFileSync(bannedFilePath, JSON.stringify(bannedData, null, 2), 'utf8');

            await sock.sendMessage(chatId, { 
                text: `⇜ تم حظرته\n⇜ المستخدم ↤︎ @${userToBan.split('@')[0]}`,
                mentions: [userToBan]
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { 
                text: `*- مـا يحتاج محظور مسـبقاً.*\n*↫ المستخدم: @${userToBan.split('@')[0]}*`,
                mentions: [userToBan]
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in ban command:', error);
        await sock.sendMessage(chatId, { 
            text: 'فشل حظر المستخدم!'
        }, { quoted: message });
    }
}

module.exports = banCommand;
