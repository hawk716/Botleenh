
const { getAllRanks } = require('../lib/ranks');

async function showOwnersCommand(sock, chatId, message) {
    try {
        const allRanks = await getAllRanks(chatId);
        
        const ownersList = [];
        let ownerCount = 0;
        
        Object.entries(allRanks).forEach(([userId, rank]) => {
            if (rank === 'مالك') {
                ownerCount++;
                ownersList.push(`*${ownerCount} - @${userId.split('@')[0]}*`);
            }
        });
        
        const ownersMessage = `*↢ قائـمة المالكـين*
*ٴ⋆┄─┄─┄─┄┄─┄─┄─┄⋆*
${ownersList.length > 0 ? ownersList.join('\n') : '*↢ لا يوجد مالكين*'}`;
        
        const mentions = ownersList.map(owner => {
            const match = owner.match(/@(\d+)/);
            return match ? match[1] + '@s.whatsapp.net' : null;
        }).filter(Boolean);
        
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
