const { UNDER_MAINTENANCE } = require('../lib/messages');

const { updateGroupSetting, getGroupSettings } = require('../lib/groupSettings');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function toggleSettingsCommand(sock, chatId, message, senderId, command, action) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: '❌ هذا الأمر يعمل فقط في المجموعات!' 
            }, { quoted: message });
            return;
        }

        // Check permissions - only manager and above
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        if (senderLevel < 3 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '*↢ هـذا الامـر يخـص〖 مدير 〗*'
            }, { quoted: message });
            return;
        }

        const settingMap = {
            'الحظر': 'ban_enabled',
            'التحميل': 'download_enabled',
            'الرابط': 'link_enabled',
            'اطردني': 'kickme_enabled',
            'نزلني': 'demoteme_enabled',
            'المنشن': 'mention_enabled',
            'الالعاب': 'games_enabled',
            'الاوامر': 'menus_enabled',
            'اكتموه': 'mutehim_enabled',
            'نداء المالك': 'callowner_enabled',
            'نداء مالك': 'callowner_enabled'
        };

        const settingKey = settingMap[command];
        if (!settingKey) {
            return;
        }

        const enabled = action === 'تفعيل';
        updateGroupSetting(chatId, settingKey, enabled);

        const status = enabled ? 'مفعل' : 'معطل';
        await sock.sendMessage(chatId, { 
            text: `*✅ تم ${action} ${command} بنجاح!*\n*الحالة: ${status}*`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in toggle settings command:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = toggleSettingsCommand;
