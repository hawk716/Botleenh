const { UNDER_MAINTENANCE } = require('../lib/messages');

const { isFeatureEnabled } = require('../lib/groupSettings');

async function kickmeCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: '❌ هذا الأمر يعمل فقط في المجموعات!' 
            }, { quoted: message });
            return;
        }

        // Check if kickme feature is enabled
        if (!isFeatureEnabled(chatId, 'kickme_enabled')) {
            await sock.sendMessage(chatId, { 
                text: UNDER_MAINTENANCE
            }, { quoted: message });
            return;
        }

        // Check if user is the group owner
        const groupMetadata = await sock.groupMetadata(chatId);
        const groupOwner = groupMetadata.owner;
        
        if (senderId === groupOwner) {
            await sock.sendMessage(chatId, { 
                text: '*↢ انا آسف ماقدر انت المالك، وبدونك القروب منو يمسكه؟!*'
            }, { quoted: message });
            return;
        }

        // Get user name
        const userName = message.pushName || senderId.split('@')[0];

        // Remove user from group
        await sock.groupParticipantsUpdate(chatId, [senderId], "remove");

        // Send confirmation message
        await sock.sendMessage(chatId, { 
            text: `*↢ الطيـب「 ${userName} 」*\n*↢ تم إزالتك من القــروب*`
        });

    } catch (error) {
        console.error('Error in kickme command:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = kickmeCommand;
