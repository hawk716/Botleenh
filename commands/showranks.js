const { UNDER_MAINTENANCE } = require('../lib/messages');
async function showRanksCommand(sock, chatId, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        
        const groupOwner = groupMetadata.participants.find(p => p.id === groupMetadata.owner);
        const ownerName = groupOwner ? `@${groupOwner.id.split('@')[0]}` : 'غير معروف';
        
        // Get admins from WhatsApp group metadata (real data)
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        const adminsList = groupAdmins.map((v, i) => `${i + 1} - @${v.id.split('@')[0]}`);
        
        const ranksMessage = `*↫المنشئ الأسـاسـي للجــروب :* ${ownerName}
*┈─┈─┈─┈─┈─┈─┈─┈─*
*↫ قائـمة الادمنـية : ( ${groupAdmins.length} )*
${adminsList.length > 0 ? adminsList.join('\n') : 'لا يوجد ادمنية'}`;
        
        const mentions = groupAdmins.map(v => v.id);
        
        if (groupOwner) mentions.push(groupOwner.id);
        
        await sock.sendMessage(chatId, { 
            text: ranksMessage,
            mentions: mentions
        }, { quoted: message });
    } catch (error) {
        console.error('Error in showRanksCommand:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE });
    }
}

module.exports = showRanksCommand;
