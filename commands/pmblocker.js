const fs = require('fs');

const PMBLOCKER_PATH = './data/pmblocker.json';

function readState() {
    try {
        if (!fs.existsSync(PMBLOCKER_PATH)) return { enabled: false, message: '⚠️ الرسائل الخاصة محظورة!\nلا يمكنك مراسلة هذا البوت. يرجى التواصل مع المالك في المجموعات فقط.' };
        const raw = fs.readFileSync(PMBLOCKER_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return {
            enabled: !!data.enabled,
            message: typeof data.message === 'string' && data.message.trim() ? data.message : '⚠️ الرسائل الخاصة محظورة!\nلا يمكنك مراسلة هذا البوت. يرجى التواصل مع المالك في المجموعات فقط.'
        };
    } catch {
        return { enabled: false, message: '⚠️ الرسائل الخاصة محظورة!\nلا يمكنك مراسلة هذا البوت. يرجى التواصل مع المالك في المجموعات فقط.' };
    }
}

function writeState(enabled, message) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        const current = readState();
        const payload = {
            enabled: !!enabled,
            message: typeof message === 'string' && message.trim() ? message : current.message
        };
        fs.writeFileSync(PMBLOCKER_PATH, JSON.stringify(payload, null, 2));
    } catch {}
}

async function pmblockerCommand(sock, chatId, message, args) {
    const argStr = (args || '').trim();
    const [sub, ...rest] = argStr.split(' ');
    const state = readState();

    if (!sub || !['on', 'off', 'status', 'setmsg'].includes(sub.toLowerCase())) {
        await sock.sendMessage(chatId, { text: '*حظر الرسائل الخاصة (للمالك فقط)*\n\n.pmblocker on - تفعيل الحظر التلقائي للرسائل الخاصة\n.pmblocker off - إيقاف حظر الرسائل الخاصة\n.pmblocker status - عرض الحالة الحالية\n.pmblocker setmsg <text> - تعيين رسالة التحذير' }, { quoted: message });
        return;
    }

    if (sub.toLowerCase() === 'status') {
        await sock.sendMessage(chatId, { text: `حظر الرسائل الخاصة حالياً *${state.enabled ? 'مفعّل' : 'متوقف'}*\nالرسالة: ${state.message}` }, { quoted: message });
        return;
    }

    if (sub.toLowerCase() === 'setmsg') {
        const newMsg = rest.join(' ').trim();
        if (!newMsg) {
            await sock.sendMessage(chatId, { text: 'الاستخدام: .pmblocker setmsg <رسالة>' }, { quoted: message });
            return;
        }
        writeState(state.enabled, newMsg);
        await sock.sendMessage(chatId, { text: 'تم تحديث رسالة حظر الرسائل الخاصة.' }, { quoted: message });
        return;
    }

    const enable = sub.toLowerCase() === 'on';
    writeState(enable);
    await sock.sendMessage(chatId, { text: `حظر الرسائل الخاصة الآن *${enable ? 'مفعّل' : 'متوقف'}*.` }, { quoted: message });
}

module.exports = { pmblockerCommand, readState };