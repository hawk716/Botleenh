const isAdmin = require('../lib/isAdmin');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
    // Check if user is owner
    const isOwner = message.key.fromMe;
    if (!isOwner) {
        const { isBotAdmin } = await isAdmin(sock, chatId, senderId);
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: 'يرجى جعل البوت مشرف أولاً.' }, { quoted: message });
            return;
        }

        // مدير or higher (level >= 3)
        if (!message.key.fromMe && senderLevel < 3) {
            await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 المدير 〗*' }, { quoted: message });
            return;
        }
    }

    let usersToKick = [];

    // Check for mentioned users
    if (mentionedJids && mentionedJids.length > 0) {
        usersToKick = mentionedJids;
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
    }

    // If no user found through either method
    if (usersToKick.length === 0) {
        await sock.sendMessage(chatId, { 
            text: 'يرجى عمل منشن للمستخدم أو الرد على رسالته لطرده!'
        }, { quoted: message });
        return;
    }

    // Get bot's ID
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    // Check if any of the users to kick is the bot itself
    if (usersToKick.includes(botId)) {
        await sock.sendMessage(chatId, { 
            text: "لا يمكنني طرد نفسي! 🤖"
        }, { quoted: message });
        return;
    }

    try {
        // Get usernames before kicking
        const usernames = usersToKick.map(jid => `@${jid.split('@')[0]}`);

        // Perform the kick
        await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");

        // Send single confirmation message
        await sock.sendMessage(chatId, { 
            text: `*↢ لعيونك ما يظل ولا ثانية*\n*↢ المستخدم ↫ ${usernames.join(', ')}*`,
            mentions: usersToKick
        });
    } catch (error) {
        console.error('Error in kick command:', error);
        await sock.sendMessage(chatId, { 
            text: 'فشل طرد المستخدم!'
        });
    }
}

module.exports = kickCommand;