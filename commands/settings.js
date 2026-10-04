const { UNDER_MAINTENANCE } = require('../lib/messages');
const fs = require('fs');
const settings = require('../settings');
const { isSudo } = require('../lib/index');

function isConfiguredBotId(jid) {
    const configuredNumber = String(settings.ownerNumber || '').replace(/\D/g, '');
    const senderNumber = String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
    return Boolean(configuredNumber && senderNumber && configuredNumber === senderNumber);
}

function readJsonSafe(path, fallback) {
    try {
        const txt = fs.readFileSync(path, 'utf8');
        return JSON.parse(txt);
    } catch (_) {
        return fallback;
    }
}

async function settingsCommand(sock, chatId, message) {
    try {
        // Accept messages sent by the bot account, the configured bot ID, or a Sudo user.
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwnerOrSudo = message.key.fromMe || isConfiguredBotId(senderId) || await isSudo(senderId);

        if (!isOwnerOrSudo) {
            await sock.sendMessage(chatId, { text: '• عذراً الامر يخص ↤︎ 〖  الادمن 〗 فقط .' }, { quoted: message });
            return;
        }

        const isGroup = chatId.endsWith('@g.us');
        const dataDir = './data';

        const mode = readJsonSafe(`${dataDir}/messageCount.json`, { isPublic: true });
        const autoStatus = readJsonSafe(`${dataDir}/autoStatus.json`, { enabled: false });
        const autoread = readJsonSafe(`${dataDir}/autoread.json`, { enabled: false });
        const autotyping = readJsonSafe(`${dataDir}/autotyping.json`, { enabled: false });
        const pmblocker = readJsonSafe(`${dataDir}/pmblocker.json`, { enabled: false });
        const anticall = readJsonSafe(`${dataDir}/anticall.json`, { enabled: false });
        const userGroupData = readJsonSafe(`${dataDir}/userGroupData.json`, {
            antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}
        });
        const autoReaction = Boolean(userGroupData.autoReaction);

        // Per-group features
        const groupId = isGroup ? chatId : null;
        const antilinkOn = groupId ? Boolean(userGroupData.antilink && userGroupData.antilink[groupId]) : false;
        const antibadwordOn = groupId ? Boolean(userGroupData.antibadword && userGroupData.antibadword[groupId]) : false;
        const welcomeOn = groupId ? Boolean(userGroupData.welcome && userGroupData.welcome[groupId]) : false;
        const goodbyeOn = groupId ? Boolean(userGroupData.goodbye && userGroupData.goodbye[groupId]) : false;
        const chatbotOn = groupId ? Boolean(userGroupData.chatbot && userGroupData.chatbot[groupId]) : false;
        const antitagCfg = groupId ? (userGroupData.antitag && userGroupData.antitag[groupId]) : null;

        const lines = [];
        lines.push('*إعدادات البوت*');
        lines.push('');
        lines.push(`• الوضع: ${mode.isPublic ? 'عام' : 'خاص'}`);
        lines.push(`• الحالة التلقائية: ${autoStatus.enabled ? 'مفعل' : 'معطل'}`);
        lines.push(`• القراءة التلقائية: ${autoread.enabled ? 'مفعل' : 'معطل'}`);
        lines.push(`• الكتابة التلقائية: ${autotyping.enabled ? 'مفعل' : 'معطل'}`);
        lines.push(`• حظر الرسائل الخاصة: ${pmblocker.enabled ? 'مفعل' : 'معطل'}`);
        lines.push(`• مكافحة المكالمات: ${anticall.enabled ? 'مفعل' : 'معطل'}`);
        lines.push(`• التفاعل التلقائي: ${autoReaction ? 'مفعل' : 'معطل'}`);
        if (groupId) {
            lines.push('');
            lines.push(`المجموعة: ${groupId}`);
            if (antilinkOn) {
                const al = userGroupData.antilink[groupId];
                lines.push(`• مكافحة الروابط: مفعل (إجراء: ${al.action || 'delete'})`);
            } else {
                lines.push('• مكافحة الروابط: معطل');
            }
            if (antibadwordOn) {
                const ab = userGroupData.antibadword[groupId];
                lines.push(`• مكافحة الكلمات السيئة: مفعل (إجراء: ${ab.action || 'delete'})`);
            } else {
                lines.push('• مكافحة الكلمات السيئة: معطل');
            }
            lines.push(`• الترحيب: ${welcomeOn ? 'مفعل' : 'معطل'}`);
            lines.push(`• الوداع: ${goodbyeOn ? 'مفعل' : 'معطل'}`);
            lines.push(`• الشات بوت: ${chatbotOn ? 'مفعل' : 'معطل'}`);
            if (antitagCfg && antitagCfg.enabled) {
                lines.push(`• مكافحة المنشن: مفعل (إجراء: ${antitagCfg.action || 'delete'})`);
            } else {
                lines.push('• مكافحة المنشن: معطل');
            }
        } else {
            lines.push('');
            lines.push('ملاحظة: ستظهر إعدادات المجموعة عند الاستخدام داخل مجموعة.');
        }

        await sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
    } catch (error) {
        console.error('Error in settings command:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

module.exports = settingsCommand;
