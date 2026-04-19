const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        // مدير or higher (level >= 3) can use this
        if (senderLevel < 3 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' },{quoted :message});
            return;
        }

        const username = `@${senderId.split('@')[0]}`;

        // معالجة الأوامر العربية مباشرة
        if (userMessage === 'فتح التاك') {
            const existingConfig = await getAntitag(chatId, 'on');
            if (existingConfig?.enabled) {
                await removeAntitag(chatId, 'on');
            }
            await setAntitag(chatId, 'on', 'delete');
            await sock.sendMessage(chatId, { 
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم فتح التـاك*`,
                mentions: [senderId]
            }, { quoted: message });
            return;
        }

        if (userMessage === 'قفل التاك') {
            await removeAntitag(chatId, 'on');
            await sock.sendMessage(chatId, { 
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم قفل التـاك*`,
                mentions: [senderId]
            }, { quoted: message });
            return;
        }

        if (userMessage.startsWith('إعدادات التاك')) {
            const parts = userMessage.split(' ');
            if (parts.length < 3) {
                await sock.sendMessage(chatId, { 
                    text: `*_يرجى تحديد إجراء: إعدادات التاك delete | kick_*` 
                }, { quoted: message });
                return;
            }
            const setAction = parts[2];
            if (!['delete', 'kick'].includes(setAction)) {
                await sock.sendMessage(chatId, { 
                    text: '*_إجراء غير صالح. اختر delete أو kick._*' 
                },{quoted :message});
                return;
            }
            await setAntitag(chatId, 'on', setAction);
            await sock.sendMessage(chatId, { 
                text: `*_تم تعيين إجراء مكافحة المنشن إلى ${setAction}_*`
            },{quoted :message});
            return;
        }

    } catch (error) {
        console.error('Error in antitag command:', error);
        await sock.sendMessage(chatId, { text: '*_خطأ في معالجة أمر مكافحة المنشن_*' },{quoted :message});
    }
}

async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        const antitagSetting = await getAntitag(chatId, 'on');
        if (!antitagSetting || !antitagSetting.enabled) return;

        // Check if message contains mentions
        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || 
                        message.message?.conversation?.match(/@\d+/g) ||
                        [];

        // Check if it's a group message and has multiple mentions
        if (mentions.length > 0 && mentions.length >= 3) {
            // Get group participants to check if it's tagging most/all members
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants || [];

            // If mentions are more than 50% of group members, consider it as tagall
            const mentionThreshold = Math.ceil(participants.length * 0.5);

            if (mentions.length >= mentionThreshold) {

                const action = antitagSetting.action || 'delete';

                if (action === 'delete') {
                    // Delete the message
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });

                    // Send warning
                    await sock.sendMessage(chatId, {
                        text: `⚠️ *تم اكتشاف منشن للكل!*`
                    }, { quoted: message });

                } else if (action === 'kick') {
                    // First delete the message
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });

                    // Then kick the user
                    await sock.groupParticipantsUpdate(chatId, [senderId], "remove");

                    // Send notification
                    const usernames = [`@${senderId.split('@')[0]}`];
                    await sock.sendMessage(chatId, {
                        text: `🚫 *تم اكتشاف منشن للكل!*\n\n${usernames.join(', ')} تم طرده لعمل منشن لجميع الأعضاء.`,
                        mentions: [senderId]
                    }, { quoted: message });
                }
            }
        }
    } catch (error) {
        console.error('Error in tag detection:', error);
    }
}

module.exports = {
    handleAntitagCommand,
    handleTagDetection
};