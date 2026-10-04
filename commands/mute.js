const { UNDER_MAINTENANCE } = require('../lib/messages');
const isAdmin = require('../lib/isAdmin');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function muteCommand(sock, chatId, senderId, message, durationInMinutes) {
    const { isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: 'يرجى جعل البوت مشرف أولاً.' }, { quoted: message });
        return;
    }

    const groupMetadata = await sock.groupMetadata(chatId);
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
    const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
    const senderLevel = getRankLevel(senderRank);

    // مدير or higher (level >= 3) can use this
    if (senderLevel < 3 && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' }, { quoted: message });
        return;
    }

    try {
        await sock.groupSettingUpdate(chatId, 'announcement');
        const username = `@${senderId.split('@')[0]}`;
        
        if (durationInMinutes !== undefined && durationInMinutes > 0) {
            const durationInMilliseconds = durationInMinutes * 60 * 1000;
            await sock.sendMessage(chatId, { 
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم قفل القـروب لمدة ${durationInMinutes} دقيقة*`,
                mentions: [senderId]
            }, { quoted: message });
            
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { 
                        text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم فتح القـروب*`,
                        mentions: [senderId]
                    });
                } catch (unmuteError) {
                    console.error('Error unmuting group:', unmuteError);
                }
            }, durationInMilliseconds);
        } else {
            await sock.sendMessage(chatId, { 
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم قفل القـروب*`,
                mentions: [senderId]
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error muting/unmuting the group:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

module.exports = muteCommand;
