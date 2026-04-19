const isAdmin = require('../lib/isAdmin');

async function tagNotAdminCommand(sock, chatId, senderId, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: 'يرجى جعل البوت مشرف أولاً.' }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '• عذراً الامر يخص ↤︎ 〖  الادمن 〗 فقط .' }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];

        const nonAdmins = participants.filter(p => !p.admin).map(p => p.id);
        if (nonAdmins.length === 0) {
            await sock.sendMessage(chatId, { text: 'لا يوجد أعضاء غير مشرفين لعمل منشن لهم.' }, { quoted: message });
            return;
        }

        let text = '⇜ وين الطيبين؟\n༺═────────────═༻\n';
        nonAdmins.forEach((jid, index) => {
            text += `${index + 1} ⁃ @${jid.split('@')[0]}\n`;
        });

        console.log('Sending tagnotadmin message to:', chatId);
        console.log('Message text:', text);
        console.log('Mentions:', nonAdmins);

        await sock.sendMessage(chatId, { text, mentions: nonAdmins }, { quoted: message });
    } catch (error) {
        console.error('Error in tagnotadmin command:', error);
        await sock.sendMessage(chatId, { text: 'فشل عمل منشن للأعضاء غير المشرفين.' }, { quoted: message });
    }
}

module.exports = tagNotAdminCommand;


