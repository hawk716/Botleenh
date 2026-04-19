
const { isFeatureEnabled } = require('../lib/groupSettings');
const isAdmin = require('../lib/isAdmin');

async function mutehimCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: '❌ هذا الأمر يعمل فقط في المجموعات!' 
            }, { quoted: message });
            return;
        }

        // Check if mutehim feature is enabled
        if (!isFeatureEnabled(chatId, 'mutehim_enabled')) {
            await sock.sendMessage(chatId, { 
                text: '*↢ امـر ( اكتموه ) معطل حالياً.*'
            }, { quoted: message });
            return;
        }

        // Check if this is a reply to a message
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        if (!quotedParticipant) {
            await sock.sendMessage(chatId, { 
                text: '❌ يرجى الرد على رسالة الشخص المراد كتمه!'
            }, { quoted: message });
            return;
        }

        // Get all admins
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        const admins = participants.filter(p => p.admin).map(p => p.id);

        if (admins.length === 0) {
            await sock.sendMessage(chatId, { 
                text: '❌ لا يوجد مشرفين في المجموعة!'
            }, { quoted: message });
            return;
        }

        // Send hidden mention to all admins
        await sock.sendMessage(chatId, { 
            text: '*↢ تم إرسال طلب الكتم للادمنيه سوف يتم التحقق من الموضوع.*',
            mentions: admins
        }, { quoted: message });

    } catch (error) {
        console.error('Error in mutehim command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ حدث خطأ أثناء تنفيذ الأمر!'
        }, { quoted: message });
    }
}

module.exports = mutehimCommand;
