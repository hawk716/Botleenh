const { UNDER_MAINTENANCE } = require('../lib/messages');

const { getAllRanks } = require('../lib/ranks');
const { getUserRank, getRankLevel } = require('../lib/ranks');
const fs = require('fs');
const path = require('path');

async function clearVipsCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '*↢ هذا الأمر يمكن استخدامه في المجموعات فقط!*' }, { quoted: message });
            return;
        }
        
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);
        
        if (senderLevel < 3 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '*↢ هـذا الامـر يخـص〖 مدير 〗*'
            }, { quoted: message });
            return;
        }
        
        const ranksFilePath = path.join(__dirname, '../data/ranks.json');
        const ranksData = JSON.parse(fs.readFileSync(ranksFilePath, 'utf8'));
        
        let count = 0;
        if (ranksData[chatId]) {
            Object.keys(ranksData[chatId]).forEach(userId => {
                if (ranksData[chatId][userId] === 'مميز') {
                    delete ranksData[chatId][userId];
                    count++;
                }
            });
            fs.writeFileSync(ranksFilePath, JSON.stringify(ranksData, null, 2));
        }
        
        if (count === 0) {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً لايوجد مميزين لمسحهم.*'
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { 
                text: `*↢ تم مسح ${count} مميزين*`
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in clearVipsCommand:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

module.exports = clearVipsCommand;
