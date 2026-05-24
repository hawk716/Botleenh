const { getUserRank, getRankLevel } = require('../lib/ranks');
const { setToggle, getToggle, removeToggle, TOGGLE_TYPES } = require('../lib/toggleSystem');

async function handleToggleCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        const args = userMessage.trim().split(' ');
        const command = args[0];
        const feature = args[1];

        if (!feature) {
            if (senderLevel < 3 && !message.key.fromMe) {
                await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' }, { quoted: message });
                return;
            }
            const usage = `*↢ قائمة الميزات المتاحة للتفعيل/التعطيل:*

*الميزات الأساسية:*
• الترحيب
• الردود
• الرفع
• الايدي
• الحظر
• التحميل

*الميزات التفاعلية:*
• الرابط
• اطردني
• نزلني
• المنشن
• الالعاب

*الميزات الإدارية:*
• انذار
• الاوامر
• اكتموه
• نداء المالك

*مثال:*
تفعيل الترحيب
تعطيل الالعاب`;
            
            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        const username = `@${senderId.split('@')[0]}`;
        const isEnable = command === 'تفعيل';

        const featureMap = {
            'الترحيب': TOGGLE_TYPES.WELCOME,
            'الردود': TOGGLE_TYPES.REPLIES,
            'الرفع': TOGGLE_TYPES.PROMOTE,
            'الايدي': TOGGLE_TYPES.ID,
            'الحظر': TOGGLE_TYPES.BAN,
            'التحميل': TOGGLE_TYPES.DOWNLOAD,
            'الرابط': TOGGLE_TYPES.LINK,
            'اطردني': TOGGLE_TYPES.KICKME,
            'نزلني': TOGGLE_TYPES.DEMOTEME,
            'المنشن': TOGGLE_TYPES.MENTION,
            'الالعاب': TOGGLE_TYPES.GAMES,
            'انذار': TOGGLE_TYPES.WARN,
            'الاوامر': TOGGLE_TYPES.COMMANDS,
            'اكتموه': TOGGLE_TYPES.MUTEHIM,
            'نداء المالك': 'owner_call'
        };

        const mappedFeature = featureMap[feature];

        if (!mappedFeature) {
            if (senderLevel < 3 && !message.key.fromMe) {
                await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' }, { quoted: message });
                return;
            }
            await sock.sendMessage(chatId, { 
                text: '*↢ ميزة غير صحيحة!*\n*↢ استخدم: تفعيل أو تعطيل*' 
            }, { quoted: message });
            return;
        }

        // owner-only features (الحظر, الرفع)
        const ownerOnlyFeatures = [TOGGLE_TYPES.BAN, TOGGLE_TYPES.PROMOTE];

        if (ownerOnlyFeatures.includes(mappedFeature)) {
            if (senderLevel < 4 && !message.key.fromMe) {
                await sock.sendMessage(chatId, { 
                    text: '*↢ عذراً الامر يخص〖 المالك〗فقط.*' 
                }, { quoted: message });
                return;
            }
        } else {
            if (senderLevel < 3 && !message.key.fromMe) {
                await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' }, { quoted: message });
                return;
            }
        }

        if (isEnable) {
            await setToggle(chatId, mappedFeature);

            if (mappedFeature === TOGGLE_TYPES.BAN) {
                await setToggle(chatId, TOGGLE_TYPES.RESTRICT);
            }

            await sock.sendMessage(chatId, {
                text: `*↢ ${senderRank} 「 ${username} 」*\n*↢ تم تفعيل ${feature}*`,
                mentions: [senderId]
            }, { quoted: message });
        } else {
            await removeToggle(chatId, mappedFeature);

            if (mappedFeature === TOGGLE_TYPES.BAN) {
                await removeToggle(chatId, TOGGLE_TYPES.RESTRICT);
                await sock.sendMessage(chatId, {
                    text: `*↢ المالك「 ${username} 」*\n*↢ تم تعطيل الحظر،التقييد*`,
                    mentions: [senderId]
                }, { quoted: message });
                return;
            }

            if (mappedFeature === TOGGLE_TYPES.PROMOTE) {
                await sock.sendMessage(chatId, {
                    text: `*↢ المالك「 ${username} 」*\n*↢ تم تعطيل الرفع*`,
                    mentions: [senderId]
                }, { quoted: message });
                return;
            }

            await sock.sendMessage(chatId, {
                text: `*↢ ${senderRank} 「 ${username} 」*\n*↢ تم تعطيل ${feature}*`,
                mentions: [senderId]
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in toggle command:', error);
        await sock.sendMessage(chatId, { text: '*_خطأ في معالجة أمر التفعيل/التعطيل_*' });
    }
}

module.exports = {
    handleToggleCommand
};
