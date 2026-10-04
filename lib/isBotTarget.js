// كاشف هوية البوت — يُستخدم لمنع تطبيق أوامر الإدارة (طرد/حظر/تقييد/انذار) على البوت نفسه.
// يعتمد على المطابقة بالرقمnormalized من الاتصال الفعلي، مع الالتحقق من قائمة المشاركين
// كمصدر حقيقة (لأن صيغة الـ LID تختلف بين الحسابات).

const numOf = (jid) => {
    const s = typeof jid === 'string'
        ? jid
        : (jid && (jid.id || jid.jid || jid.phoneNumber) ? (jid.id || jid.jid || jid.phoneNumber) : String(jid));
    return String(s).split('@')[0].split(':')[0];
};

// كل أرقام البوت المعروفة من الاتصال
function botNumbers(sock) {
    const nums = [];
    const add = (v) => {
        const n = numOf(v);
        if (n && !nums.includes(n)) nums.push(n);
    };
    add(sock?.user?.id);
    add(sock?.user?.lid);
    if (sock?.user?.phoneNumber) add(sock.user.phoneNumber);
    return nums;
}

// هل هذا المعرّف يخص البوت؟
function isBotJid(sock, jid) {
    if (!jid) return false;
    return botNumbers(sock).includes(numOf(jid));
}

// هل هذا الهدف هو البوت؟ (مع فحص إضافي على قائمة المشاركين)
function isTargetBot(sock, groupMetadata, jid) {
    if (!jid) return false;
    if (isBotJid(sock, jid)) return true;

    const targetNum = numOf(jid);
    const participants = groupMetadata?.participants;
    if (Array.isArray(participants)) {
        for (const p of participants) {
            if (!p) continue;
            const pid = typeof p === 'string' ? p : p.id;
            if (!pid) continue;
            if (numOf(pid) === targetNum && isBotJid(sock, pid)) return true;
            if (p.phoneNumber && isBotJid(sock, p.phoneNumber) && numOf(p.phoneNumber) === targetNum) return true;
        }
    }
    return false;
}

// يُرسل رسالة الرفض الموحّدة — مع 🤡 افتراضياً، أو بدونه عند الطلب
async function rejectBotTarget(sock, chatId, message, { react = true } = {}) {
    if (react) {
        await sock.sendMessage(chatId, { react: { text: '🤡', key: message.key } }).catch(() => {});
    }
    await sock.sendMessage(chatId, {
        text: '*↢ عذراً لاتسـتطـيـع اسـتخدام الامـر على البوت.*'
    }, { quoted: message });
}

module.exports = { isBotJid, isTargetBot, botNumbers, rejectBotTarget };
