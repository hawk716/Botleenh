const { setAntiBadword, getAntiBadword, removeAntiBadword, incrementWarningCount, resetWarningCount } = require('../lib/index');
const { isBotAdminInGroup } = require('../lib/botAdminCheck');
const fs = require('fs');
const path = require('path');

// Load antibadword config
function loadAntibadwordConfig(groupId) {
    try {
        const configPath = path.join(__dirname, '../data/userGroupData.json');
        if (!fs.existsSync(configPath)) {
            return {};
        }
        const data = JSON.parse(fs.readFileSync(configPath));
        return data.antibadword?.[groupId] || {};
    } catch (error) {
        console.error('❌ Error loading antibadword config:', error.message);
        return {};
    }
}

async function handleAntiBadwordCommand(sock, chatId, message, match) {
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*إعدادات مكافحة الكلمات السيئة*\n\n*.antibadword on*\nتفعيل مكافحة الكلمات السيئة\n\n*.antibadword set <action>*\nتعيين الإجراء: delete/kick/warn\n\n*.antibadword off*\nتعطيل مكافحة الكلمات السيئة في هذه المجموعة`
        }, { quoted: message });
    }

    if (match === 'on') {
        const existingConfig = await getAntiBadword(chatId, 'on');
        if (existingConfig?.enabled) {
            return sock.sendMessage(chatId, { text: '*مكافحة الكلمات السيئة مفعلة بالفعل لهذه المجموعة*' });
        }
        await setAntiBadword(chatId, 'on', 'delete');
        return sock.sendMessage(chatId, { text: '*تم تفعيل مكافحة الكلمات السيئة. استخدم .antibadword set <action> لتخصيص الإجراء*' }, { quoted: message });
    }

    if (match === 'off') {
        const config = await getAntiBadword(chatId, 'on');
        if (!config?.enabled) {
            return sock.sendMessage(chatId, { text: '*مكافحة الكلمات السيئة معطلة بالفعل لهذه المجموعة*' }, { quoted: message } );
        }
        await removeAntiBadword(chatId);
        return sock.sendMessage(chatId, { text: '*تم تعطيل مكافحة الكلمات السيئة لهذه المجموعة*' }, { quoted: message } );
    }

    if (match.startsWith('set')) {
        const action = match.split(' ')[1];
        if (!action || !['delete', 'kick', 'warn'].includes(action)) {
            return sock.sendMessage(chatId, { text: '*إجراء غير صالح. اختر: delete أو kick أو warn*' }, { quoted: message } );
        }
        await setAntiBadword(chatId, 'on', action);
        return sock.sendMessage(chatId, { text: `*تم تعيين إجراء مكافحة الكلمات السيئة إلى: ${action}*` }, { quoted: message } );
    }

    return sock.sendMessage(chatId, { text: '*أمر غير صالح. استخدم .antibadword لعرض الاستخدام*' }, { quoted: message } );
}

// profanity-i18n: مكتبة فحص سب evaporated (إنجليزي + عربي، 1046 كلمة) — بدون قوائم من عندنا
const profanity = require('profanity-i18n');
const { dictionary } = require('profanity-i18n/src/dictionary/dictionary');

// كلمات عربية ناقصة في قاموس المكتبة — تُضاف عبر API المكتبة الرسمي add()
profanity.add(['مخنوث', 'انجن', 'كسك', 'زاني', 'قحبا', 'قحبت']);

// تطبيع النص قبل الفحص: حذف التشكيل والتطويل + توحيد الهمزات والتاء المربوطة والألف المقصورة
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي');
}

// قاموس المكتبة بعد التطبيع، بطول 4 فأكثر لتفادي المطابقات القصيرة
// (المكتبة تحوي مدخلات مثل "ال" و"احا" لا يصلح فحصها كسلسلة داخلية)
const DICT_SUBSTRING = [...new Set(dictionary.map(normalizeText).filter(w => w.length >= 4))];

function checkSwear(text) {
    if (typeof text !== 'string' || !text.trim()) return false;

    const normalized = normalizeText(text);

    // مطابقة المكتبة الرسمية (تغطي الصيغ المفصولة)
    if (profanity.contains(normalized)) return true;

    // صيغ ملتصقة مثل "ياقحبه" / "قحبت" / تطبيع الهمزات
    return DICT_SUBSTRING.some(word => normalized.includes(word));
}

async function handleBadwordDetection(sock, chatId, message, userMessage, senderId) {
    const config = loadAntibadwordConfig(chatId);
    if (!config.enabled) return;

    // Skip if not group
    if (!chatId.endsWith('@g.us')) return;

    // Skip if message is from bot
    if (message.key.fromMe) return;

    // Get antibadword config first
    const antiBadwordConfig = await getAntiBadword(chatId, 'on');
    if (!antiBadwordConfig?.enabled) {
        console.log('Antibadword not enabled for this group');
        return;
    }

    // Check message via profanity-i18n
    if (!userMessage || !userMessage.trim()) return;

    if (!checkSwear(userMessage)) {
        console.log('✅ النص سليم وآمن ونظيف.');
        return;
    }
    console.log('⚠️ تم حظر النص: يحتوي على سب أو شتم!');

    // Check if bot is admin before taking action (نفس بوابة main.js: requireBotAdmin من lib/botAdminCheck)
    if (!await isBotAdminInGroup(sock, chatId)) {
        console.log('[ANTIBADWORD] البوت ليس مشرفاً — لا يمكن الحذف');
        return;
    }

    const groupMetadata = await sock.groupMetadata(chatId);

    // Check if sender is admin (يطابق @lid و@s.whatsapp.net والرقم بدون لاحقة)
    const jidNumber = (jid) => (typeof jid === 'string' ? jid.split('@')[0].split(':')[0] : '');
    const senderNumber = jidNumber(senderId);
    const participant = groupMetadata.participants.find(p =>
        (typeof p.id === 'string' && (p.id === senderId || (senderNumber && jidNumber(p.id) === senderNumber))) ||
        (typeof p.jid === 'string' && p.jid === senderId) ||
        (typeof p.phoneNumber === 'string' && senderNumber && p.phoneNumber === senderNumber)
    );
    if (participant?.admin) {
        //console.log('Sender is admin, skipping action');
        return;
    }

    // Delete message immediately
    try {
        await sock.sendMessage(chatId, { 
            delete: message.key
        });
        //console.log('Message deleted successfully');
    } catch (err) {
        console.error('Error deleting message:', err);
        return;
    }

    // Take action based on config
    switch (antiBadwordConfig.action) {
        case 'delete':
            await sock.sendMessage(chatId, {
                text: `*↢ المستخدم〖 @${senderId.split('@')[0]} 〗*\n*↢ قام بارسال كلمه محظوره .*`,
                mentions: [senderId]
            });
            break;

        case 'kick':
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, {
                    text: `*@${senderId.split('@')[0]} تم طرده لاستخدام كلمات سيئة*`,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('Error kicking user:', error);
            }
            break;

        case 'warn':
            const warningCount = await incrementWarningCount(chatId, senderId);
            if (warningCount >= 3) {
                try {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await resetWarningCount(chatId, senderId);
                    await sock.sendMessage(chatId, {
                        text: `*@${senderId.split('@')[0]} تم طرده بعد 3 تحذيرات*`,
                        mentions: [senderId]
                    });
                } catch (error) {
                    console.error('Error kicking user after warnings:', error);
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: `*@${senderId.split('@')[0]} تحذير ${warningCount}/3 لاستخدام كلمات سيئة*`,
                    mentions: [senderId]
                });
            }
            break;
    }
}

module.exports = {
    handleAntiBadwordCommand,
    handleBadwordDetection
}; 