const { getAllRanks } = require('../lib/ranks');

async function showOwnersCommand(sock, chatId, message) {
    try {
        const allRanks = await getAllRanks(chatId);
        const ownersList = [];
        const mentions = [];
        let ownerCount = 0;

        for (const [userId, rank] of Object.entries(allRanks)) {
            if (rank === 'مالك') {
                ownerCount++;
                const contactName = await sock.getName(userId).catch(() => userId.split('@')[0]);
                ownersList.push(`*${ownerCount} -* @${contactName}`);
                mentions.push(userId);
            }
        }

        const ownersMessage = `*↢ قائـمة المالكـين*
*ٴ⋆┄─┄─┄─┄┄─┄─┄─┄⋆*
${ownersList.length > 0 ? ownersList.join('\n') : '*↢ لا يوجد مالكين*'}`;

        await sock.sendMessage(chatId, {
            text: ownersMessage,
            mentions: mentions
        }, { quoted: message });
    } catch (error) {
        console.error('Error in showOwnersCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ حدث خطأ في عرض المالكين!' });
    }
}

module.exports = showOwnersCommand;
