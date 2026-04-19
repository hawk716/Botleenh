const { getUserRank, hasPermission } = require('../lib/ranks');
const { setCmdLock, getCmdLock, removeCmdLock } = require('../lib/cmdLockSystem');

async function handleCmdLockCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        const hasPerms = await hasPermission(chatId, senderId, 'مدير');
        
        if (!hasPerms) {
            await sock.sendMessage(chatId, { text: '```للمدراء فقط!```' }, { quoted: message });
            return;
        }

        const args = userMessage.trim().split(' ');
        const command = args[0];
        const subCommand = args[1];
        const cmdName = args[2];
        const rank = args[3];

        if (!subCommand || !cmdName) {
            const usage = `*↢ نظام قفل الأوامر على الرتب*

*الاستخدام:*
قفل امر [اسم_الامر] [الرتبة]
فتح امر [اسم_الامر]

*مثال:*
قفل امر حظر مدير
قفل امر طرد ادمن
فتح امر حظر

*الرتب المتاحة:*
• مالك
• مدير
• ادمن
• مميز`;
            
            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const username = `@${senderId.split('@')[0]}`;
        const isLock = command === 'قفل';

        if (isLock) {
            if (!rank) {
                await sock.sendMessage(chatId, { 
                    text: '*↢ يرجى تحديد الرتبة المطلوبة*\n*↢ مثال: قفل امر حظر مدير*' 
                }, { quoted: message });
                return;
            }

            const validRanks = ['مالك', 'مدير', 'ادمن', 'مميز'];
            if (!validRanks.includes(rank)) {
                await sock.sendMessage(chatId, { 
                    text: '*↢ رتبة غير صحيحة!*\n*↢ الرتب المتاحة: مالك، مدير، ادمن، مميز*' 
                }, { quoted: message });
                return;
            }

            await setCmdLock(chatId, cmdName, rank);
            await sock.sendMessage(chatId, {
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم قفل امر ${cmdName} على رتبة ${rank}*`,
                mentions: [senderId]
            }, { quoted: message });
        } else {
            await removeCmdLock(chatId, cmdName);
            await sock.sendMessage(chatId, {
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم فتح امر ${cmdName}*`,
                mentions: [senderId]
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in cmdlock command:', error);
        await sock.sendMessage(chatId, { text: '*_خطأ في معالجة أمر قفل الأوامر_*' });
    }
}

module.exports = {
    handleCmdLockCommand
};
