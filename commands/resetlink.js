async function resetlinkCommand(sock, chatId, senderId) {
    try {
        // Check if sender is admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(senderId);

        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: '• عذراً الامر يخص ↤︎ 〖  الادمن 〗 فقط .' });
            return;
        }

        // Check if bot is admin - get bot ID correctly
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = groupMetadata.participants.find(p => p.id === botJid);
        const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '⇜ ارفعني مشرف لتفعيل الأمر' });
            return;
        }

        // Reset the group link
        const newCode = await sock.groupRevokeInvite(chatId);
        
        // Send the new link
        await sock.sendMessage(chatId, { 
            text: `✅ تم إعادة تعيين رابط المجموعة بنجاح\n\n📌 الرابط الجديد:\nhttps://chat.whatsapp.com/${newCode}`
        });

    } catch (error) {
        console.error('Error in resetlink command:', error);
        await sock.sendMessage(chatId, { text: 'فشل إعادة تعيين رابط المجموعة!' });
    }
}

module.exports = resetlinkCommand; 