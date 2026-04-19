const settings = require('../settings');
const { addSudo, removeSudo, getSudoList } = require('../lib/index');

function extractMentionedJid(message) {
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length > 0) return mentioned[0];
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const match = text.match(/\b(\d{7,15})\b/);
    if (match) return match[1] + '@s.whatsapp.net';
    return null;
}

async function sudoCommand(sock, chatId, message) {
    const senderJid = message.key.participant || message.key.remoteJid;
    const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
    const isOwner = message.key.fromMe || senderJid === ownerJid;

    const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const args = rawText.trim().split(' ').slice(1);
    const sub = (args[0] || '').toLowerCase();

    if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
        await sock.sendMessage(chatId, { text: 'الاستخدام:\n.sudo add <@مستخدم|رقم>\n.sudo del <@مستخدم|رقم>\n.sudo list' },{quoted :message});
        return;
    }

    if (sub === 'list') {
        const list = await getSudoList();
        if (list.length === 0) {
            await sock.sendMessage(chatId, { text: 'لا يوجد مستخدمين sudo.' },{quoted :message});
            return;
        }
        const text = list.map((j, i) => `${i + 1}. ${j}`).join('\n');
        await sock.sendMessage(chatId, { text: `مستخدمو sudo:\n${text}` },{quoted :message});
        return;
    }

    if (!isOwner) {
        await sock.sendMessage(chatId, { text: '❌ فقط المالك يمكنه إضافة/إزالة مستخدمي sudo. استخدم .sudo list للعرض.' },{quoted :message});
        return;
    }

    const targetJid = extractMentionedJid(message);
    if (!targetJid) {
        await sock.sendMessage(chatId, { text: 'يرجى منشن مستخدم أو تقديم رقم.' },{quoted :message});
        return;
    }

    if (sub === 'add') {
        const ok = await addSudo(targetJid);
        await sock.sendMessage(chatId, { text: ok ? `✅ تمت إضافة sudo: ${targetJid}` : '❌ فشل إضافة sudo' },{quoted :message});
        return;
    }

    if (sub === 'del' || sub === 'remove') {
        const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
        if (targetJid === ownerJid) {
            await sock.sendMessage(chatId, { text: 'لا يمكن إزالة المالك.' },{quoted :message});
            return;
        }
        const ok = await removeSudo(targetJid);
        await sock.sendMessage(chatId, { text: ok ? `✅ تمت إزالة sudo: ${targetJid}` : '❌ فشل إزالة sudo' },{quoted :message});
        return;
    }
}

module.exports = sudoCommand;


