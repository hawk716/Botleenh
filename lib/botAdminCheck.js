// فحص صلاحيات البوت في المجموعة.
// ملاحظة مهمة: لا يوجد أي رقم مكتوب يدوياً — هوية البوت تُستخرج من الاتصال الفعلي (sock.user)
// لأن الـ LID يختلف بين الحسابات، وكتابة رقم ثابتة كانت تجعل البوت يفحص صلاحيات شخص آخر.

const numOf = (jid) => {
    const s = typeof jid === 'string'
        ? jid
        : (jid && (jid.id || jid.jid || jid.phoneNumber) ? (jid.id || jid.jid || jid.phoneNumber) : String(jid));
    return String(s).split('@')[0].split(':')[0];
};

// كل المعرّفات الممكنة للبوت: المعرّف، الـ LID، ورقم الهاتف
function getBotJids(sock) {
    const ids = [];
    const push = (v) => {
        if (!v) return;
        const s = typeof v === 'string' ? v : (v.id || v.jid || '');
        if (s && !ids.includes(s)) ids.push(s);
    };
    push(sock?.user?.id);
    push(sock?.user?.lid);
    if (sock?.user?.phoneNumber) push(`${sock.user.phoneNumber}@s.whatsapp.net`);
    return ids;
}

// هل هذا المشارك هو البوت نفسه؟ (مطابقة بالرقم لتفادي اختلاف صيغة LID)
function isBotParticipant(sock, participant) {
    const ids = getBotJids(sock);
    if (!ids.length || !participant) return false;
    const pid = typeof participant === 'string' ? participant : participant.id;
    if (!pid) return false;
    if (ids.includes(pid)) return true;
    return ids.map(numOf).includes(numOf(pid));
}

const hasAdminFlag = (admin) => admin === 'admin' || admin === 'superadmin' || admin === true;

// يفحص في بيانات المجموعة الممرّرة: هل البوت مشرف فيها؟
// إن لم نتمكن من معرفة هوية البوت نهائياً → نسمح (fail open) حتى لا تتعطل الأوامر
function isBotAdminIn(sock, groupMetadata) {
    if (!groupMetadata || !Array.isArray(groupMetadata.participants)) return true;
    const ids = getBotJids(sock);
    if (!ids.length) return true;

    let found = false;
    let isAdmin = false;
    for (const p of groupMetadata.participants) {
        if (isBotParticipant(sock, p)) {
            found = true;
            if (hasAdminFlag(p.admin)) isAdmin = true;
        }
    }
    // البوت موجود في المجموعة: النتيجة تعتمد على صلاحيته الحقيقية
    // البوت غير موجود أصلاً في القائمة → لا نعرف، نسمح
    return found ? isAdmin : true;
}

async function isBotAdminInGroup(sock, chatId) {
    if (!chatId.endsWith('@g.us')) return true;
    try {
        const meta = await sock.groupMetadata(chatId);
        return isBotAdminIn(sock, meta);
    } catch (e) {
        console.error('[BOT_ADMIN_CHECK] Error:', e.message);
        return true; // On error, allow (fail open)
    }
}

async function requireBotAdmin(sock, chatId, message) {
    const ok = await isBotAdminInGroup(sock, chatId);
    if (!ok) {
        await sock.sendMessage(chatId, {
            text: '*↢عذراً لا استطيع اداره المجموعه وانا لست مشرفاً، قم بتعييني كمشرف أولاً.*'
        }, { quoted: message });
    }
    return ok;
}

// للتوافق مع النداء القديم: يُعيد أول معرّف معروف للبوت
function getBotJidForChat(sock, chatId) {
    const ids = getBotJids(sock);
    return ids.length ? ids[0] : null;
}

module.exports = {
    getBotJids,
    getBotJidForChat,
    isBotParticipant,
    isBotAdminIn,
    isBotAdminInGroup,
    requireBotAdmin
};
