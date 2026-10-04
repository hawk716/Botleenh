const { UNDER_MAINTENANCE } = require('../lib/messages');
const { getAllRanks } = require('../lib/ranks');

async function showOwnersCommand(sock, chatId, message) {
    try {
        const allRanks = await getAllRanks(chatId);
        const ownersList = [];
        const mentions = [];
        let ownerCount = 0;

        for (const [userId, rank] of Object.entries(allRanks)) {
            if (rank === 'مالك أساسي') {
                ownerCount++;
                let contactName = userId.split('@')[0];
                try {
                    const meta = await sock.groupMetadata(chatId).catch(() => null);
                    const p = meta?.participants?.find(x => x.id === userId);
                    if (p && p.name) {
                        contactName = p.name;
                    } else {
                        const name = await sock.getName(userId);
                        if (name && !/^\d+$/.test(name)) contactName = name;
                    }
                } catch (e) {}
                ownersList.push(`*${ownerCount} -* @${contactName}`);
                mentions.push(userId);
            }
        }

        const ownersMessage = `*↢ قائـمة المالكين**⋆┄─┄─┄─┄┄─┄─┄─┄⋆*
${ownersList.length > 0 ? ownersList.join('\n') : '*↢ لا يوجد مالكين*'}`;

        await sock.sendMessage(chatId, {
            text: ownersMessage,
            mentions: mentions
        }, { quoted: message });
    } catch (error) {
        console.error('Error in showOwnersCommand:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE });
    }
}

module.exports = showOwnersCommand;
