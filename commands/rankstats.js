const { UNDER_MAINTENANCE } = require('../lib/messages');

const { getAllRanks } = require('../lib/ranks');

async function rankStatsCommand(sock, chatId, message) {
    try {
        const allRanks = await getAllRanks(chatId);
        
        const counts = {
            'مالك': 0,
            'مدير': 0,
            'ادمن': 0,
            'مميز': 0
        };
        
        Object.values(allRanks).forEach(rank => {
            if (counts[rank] !== undefined) {
                counts[rank]++;
            }
        });
        
        const statsMessage = `*↫احـصائيـات الـرتـب.*
*ٴ┄─┄─┄─┄┄─┄─┄─┄─┄*
*- المالكين ↢ ${counts['مالك']}*
*- المدراء ↢ ${counts['مدير']}*
*- الادمنيه ↢ ${counts['ادمن']}*
*- المميزين ↢ ${counts['مميز']}*`;
        
        await sock.sendMessage(chatId, { text: statsMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in rankStatsCommand:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE });
    }
}

module.exports = rankStatsCommand;
