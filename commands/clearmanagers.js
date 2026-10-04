const { UNDER_MAINTENANCE } = require('../lib/messages');

const fs = require('fs');
const path = require('path');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function clearManagersCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '*↢ هذا الأمر يمكن استخدامه في المجموعات فقط!*' }, { quoted: message });
            return;
        }
        
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotSender = senderId === botJid || message.key.fromMe;
        
        if (!isBotSender) {
            const groupMetadata = await sock.groupMetadata(chatId);
            const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
            const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
            const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
            const senderLevel = getRankLevel(senderRank);
            
            if (senderLevel < 4) {
                await sock.sendMessage(chatId, { 
                    text: '*↢ هـذا الامـر يخـص〖 مالك 〗*'
                }, { quoted: message });
                return;
            }
        }
        
        const ranksFilePath = path.join(__dirname, '../data/ranks.json');
        let ranksData = {};
        
        if (fs.existsSync(ranksFilePath)) {
            ranksData = JSON.parse(fs.readFileSync(ranksFilePath, 'utf8'));
        }
        
        let count = 0;
        if (ranksData[chatId]) {
            for (let userId in ranksData[chatId]) {
                if (ranksData[chatId][userId] === 'مدير') {
                    delete ranksData[chatId][userId];
                    count++;
                }
            }
            fs.writeFileSync(ranksFilePath, JSON.stringify(ranksData, null, 2));
        }
        
        if (count === 0) {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً لايوجد مدراء لمسحهم.*'
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { 
                text: `*↢ تم مسح ${count} مدراء*`
            }, { quoted: message });
        }
        
    } catch (error) {
        console.error('Error in clearManagersCommand:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = clearManagersCommand;
