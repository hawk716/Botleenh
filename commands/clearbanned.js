
const fs = require('fs');
const path = require('path');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function clearBannedCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط!' });
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
        
        const bannedFilePath = path.join(__dirname, '../data/banned.json');
        
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
        
        const groupBanned = bannedData[chatId] || [];
        const count = groupBanned.length;
        
        if (count === 0) {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً لايوجد محظورين لمسحهم.*'
            }, { quoted: message });
            return;
        }
        
        delete bannedData[chatId];
        fs.writeFileSync(bannedFilePath, JSON.stringify(bannedData, null, 2));
        
        await sock.sendMessage(chatId, { 
            text: `*↢ تم مسح ${count} محظورين*`
        }, { quoted: message });
        
    } catch (error) {
        console.error('Error in clearBannedCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ حدث خطأ أثناء مسح المحظورين!'
        }, { quoted: message });
    }
}

module.exports = clearBannedCommand;
