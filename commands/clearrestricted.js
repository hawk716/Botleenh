
const { getUserRank, getRankLevel } = require('../lib/ranks');
const fs = require('fs');
const path = require('path');

async function clearRestrictedCommand(sock, chatId, message, senderId) {
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
        
        const restrictionsFilePath = path.join(__dirname, '../data/restrictions.json');
        let restrictionsData = {};
        
        if (fs.existsSync(restrictionsFilePath)) {
            restrictionsData = JSON.parse(fs.readFileSync(restrictionsFilePath, 'utf8'));
        }
        
        const count = restrictionsData[chatId] ? Object.keys(restrictionsData[chatId]).length : 0;
        
        if (count === 0) {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً لايوجد مقيدين لمسحهم.*'
            }, { quoted: message });
        } else {
            if (restrictionsData[chatId]) {
                delete restrictionsData[chatId];
                fs.writeFileSync(restrictionsFilePath, JSON.stringify(restrictionsData, null, 2));
            }
            
            await sock.sendMessage(chatId, { 
                text: `*↢ تم مسح ${count} مقيدين*`
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in clearRestrictedCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ فشل في مسح المقيدين!' });
    }
}

module.exports = clearRestrictedCommand;
