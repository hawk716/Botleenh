const { UNDER_MAINTENANCE } = require('../lib/messages');
async function groupInfoCommand(sock, chatId, msg) {
    try {
        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);
        
        // Get group profile picture
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image
        }
        
        // Get admins from participants
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        const adminNumbers = ['❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿'];
        const listAdmin = groupAdmins.map((v, i) => `${adminNumbers[i] || (i + 1)}⁃ @${v.id.split('@')[0]}`).join('\n');
        
        // Get group owner
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';
        
        // Get group ID without @g.us
        const groupId = groupMetadata.id.split('@')[0];
        
        // Create info text
        const text = `
*معلومات المجموعة*
༺═─────────────═༻
▢ *الايدي: 【 ${groupId} 】*
▢ *اسم المجموعة :【 ${groupMetadata.subject} 】*
▢ *عدد الأعضاء:【 ${participants.length} 】*
▢ *المالك:*【 @${owner.split('@')[0]} 】*
▢ *الادمنيه:*
${listAdmin}
▢  *البايو :【 ${groupMetadata.desc?.toString() || 'لا يوجد'} 】`
        .trim();
    
        // Send the message with image and mentions
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner]
        });
    
    } catch (error) {
        console.error('Error in groupinfo command:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE });
    }
}

module.exports = groupInfoCommand;