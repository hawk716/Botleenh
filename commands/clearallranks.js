const fs = require('fs');
const path = require('path');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function clearAllRanksCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط!' });
            return;
        }

        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotSender = senderId === botJid || message.key.fromMe;

        const groupMetadata = await sock.groupMetadata(chatId);

        if (!isBotSender) {
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
        const actualGroupOwner = groupMetadata.owner;

        const ranksFilePath = path.join(__dirname, '../data/ranks.json');
        let ranksData = {};

        if (fs.existsSync(ranksFilePath)) {
            ranksData = JSON.parse(fs.readFileSync(ranksFilePath, 'utf8'));
        }

        const counts = {
            'مدير': 0,
            'ادمن': 0,
            'مميز': 0
        };

        if (ranksData[chatId]) {
            // Count non-owner ranks before deletion
            Object.entries(ranksData[chatId]).forEach(([userId, rank]) => {
                if (rank !== 'مالك' && counts[rank] !== undefined) {
                    counts[rank]++;
                }
            });

            // Delete only non-owner ranks, keep actual group owner
            Object.keys(ranksData[chatId]).forEach(userId => {
                if (ranksData[chatId][userId] !== 'مالك' && userId !== actualGroupOwner) {
                    delete ranksData[chatId][userId];
                }
            });
            
            // Ensure actual group owner has مالك rank
            if (!ranksData[chatId]) {
                ranksData[chatId] = {};
            }
            ranksData[chatId][actualGroupOwner] = 'مالك';
            
            fs.writeFileSync(ranksFilePath, JSON.stringify(ranksData, null, 2));
        }

        await sock.sendMessage(chatId, { 
            text: `*- تم مسح الكل بنجاح*
*- المدراء ↢「 0 」*
*- الادمنيه ↢「 0 」*
*- المميزين ↢「 0 」*`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in clearAllRanksCommand:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ حدث خطأ أثناء مسح الرتب!'
        }, { quoted: message });
    }
}

module.exports = clearAllRanksCommand;