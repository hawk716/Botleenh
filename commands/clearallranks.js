const { UNDER_MAINTENANCE } = require('../lib/messages');
const fs = require('fs');
const path = require('path');
const { getUserRank, getRankLevel } = require('../lib/ranks');
const { getPrimaryOwner, isPrimaryOwner } = require('../lib/primaryOwner');

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
        const primaryOwner = getPrimaryOwner(chatId);

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
            Object.entries(ranksData[chatId]).forEach(([userId, rank]) => {
                if (rank !== 'مالك' && counts[rank] !== undefined) {
                    counts[rank]++;
                }
            });

            Object.keys(ranksData[chatId]).forEach(userId => {
                if (ranksData[chatId][userId] !== 'مالك' && userId !== actualGroupOwner) {
                    delete ranksData[chatId][userId];
                }
            });

            if (!ranksData[chatId]) {
                ranksData[chatId] = {};
            }
            ranksData[chatId][actualGroupOwner] = 'مالك';

            fs.writeFileSync(ranksFilePath, JSON.stringify(ranksData, null, 2));
        }

        const norm = (a) => { const s = typeof a === 'string' ? a : (a && (a.id || a.jid || a.phoneNumber) ? (a.id || a.jid || a.phoneNumber) : String(a)); return s.split('@')[0].split(':')[0]; };
        const botIdNum = norm(sock.user.id);
        const protectedIds = new Set([botIdNum, norm(actualGroupOwner)]);
        if (primaryOwner) protectedIds.add(norm(primaryOwner));

        const toDemote = groupMetadata.participants.filter(p => {
            if (!p.admin) return false;
            const idNorm = norm(p.id);
            if (protectedIds.has(idNorm)) return false;
            if (isPrimaryOwner(chatId, p.id)) return false;
            return true;
        });

        if (toDemote.length > 0) {
            await sock.groupParticipantsUpdate(chatId, toDemote.map(p => p.id), 'demote');
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
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = clearAllRanksCommand;