const { UNDER_MAINTENANCE } = require('../lib/messages');

const { isFeatureEnabled } = require('../lib/groupSettings');

async function grouplinkCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: '❌ هذا الأمر يعمل فقط في المجموعات!' 
            }, { quoted: message });
            return;
        }

        // Check if link feature is enabled
        if (!isFeatureEnabled(chatId, 'link_enabled')) {
            await sock.sendMessage(chatId, { 
                text: UNDER_MAINTENANCE
            }, { quoted: message });
            return;
        }

        const groupCode = await sock.groupInviteCode(chatId);
        const groupLink = `https://chat.whatsapp.com/${groupCode}`;

        await sock.sendMessage(chatId, { 
            text: `*- 𝒈𝒓𝒐𝒖𝒑 𝒍𝒊𝒏𝒌: ${groupLink}*`,
            detectLinks: false
        }, { quoted: message });

    } catch (error) {
        console.error('Error in grouplink command:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = grouplinkCommand;
