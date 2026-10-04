const { UNDER_MAINTENANCE } = require('../lib/messages');

const { isFeatureEnabled } = require('../lib/groupSettings');
const { getUserRank, removeUserRank } = require('../lib/ranks');

const pendingDemotions = new Map();

async function demotemeCommand(sock, chatId, message, senderId, userMessage) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: '❌ هذا الأمر يعمل فقط في المجموعات!' 
            }, { quoted: message });
            return;
        }

        // Check if demoteme feature is enabled
        if (!isFeatureEnabled(chatId, 'demoteme_enabled')) {
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

        // Check if this is a confirmation response
        if (userMessage === 'نعم') {
            const pendingKey = `${chatId}_${senderId}`;
            if (pendingDemotions.has(pendingKey)) {
                // Remove all ranks
                await removeUserRank(chatId, senderId);
                
                // Demote in WhatsApp if admin
                try {
                    await sock.groupParticipantsUpdate(chatId, [senderId], "demote");
                } catch (e) {
                    // User might not be admin
                }
                
                pendingDemotions.delete(pendingKey);
                
                await sock.sendMessage(chatId, { 
                    text: '*↢ تم تنزيلك من جميع رتبك.*'
                }, { quoted: message });
            }
            return;
        } else if (userMessage === 'لا') {
            const pendingKey = `${chatId}_${senderId}`;
            if (pendingDemotions.has(pendingKey)) {
                pendingDemotions.delete(pendingKey);
                await sock.sendMessage(chatId, { 
                    text: '*↢ تـم الغاء الامـر.*'
                }, { quoted: message });
            }
            return;
        }

        // Show confirmation message
        const pendingKey = `${chatId}_${senderId}`;
        pendingDemotions.set(pendingKey, true);
        
        // Auto-expire after 30 seconds
        setTimeout(() => {
            pendingDemotions.delete(pendingKey);
        }, 30000);

        await sock.sendMessage(chatId, { 
            text: '*↢ هل انت متأكد من انك تريد تنزيلك من جميع رتبك؟!*\n*↢ " نعم ","  لا "*'
        }, { quoted: message });

    } catch (error) {
        console.error('Error in demoteme command:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = demotemeCommand;
