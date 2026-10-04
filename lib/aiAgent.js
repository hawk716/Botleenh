/**
 * وكيل الذكاء الاصطناعي — فهم النية فقط، بلا تنفيذ.
 *
 * يقرأ رسالة تبدأ بـ «لين» أو «leen»، ويفهم نية المستخدم:
 * محادثة (CHAT)، سؤال (ASK)، أو تنفيذ (RUN).
 * التنفيذ الوحيد يكون عبر handleMessages الحالي — لا مسار ثانٍ.
 */

const { CANON, CATALOG } = require('./commandCatalog');
const fs = require('fs');
const path = require('path');

// أسماء الأوامر الحقيقية: تُشتق من شروط الـ switch الفعلية في main.js.
// الخريطة: الصيغة المطبّعة ← الصيغة الأصلية كما في الكود.
let ALLOWED = null;
function allowedNames() {
    if (ALLOWED) return ALLOWED;
    ALLOWED = new Map();
    try {
        const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
        const re = /cleanMessage === '([^']+)'/g;
        let m;
        while ((m = re.exec(src))) {
            const key = CANON(m[1]);
            if (key && !ALLOWED.has(key)) ALLOWED.set(key, m[1]);
        }
    } catch (e) {
        console.error('[AI] تعذر اشتقاق الأوامر:', e.message);
    }
    return ALLOWED;
}

// النموذج قابل للتغيير بالكامل من .env
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://opencode.ai/zen/v1';
const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENCODE_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'space-bunny-free';
const AI_TIMEOUT = Number(process.env.AI_TIMEOUT || 90000);

// البادئة: لين أو leen بأي حالة أحرف، في أول الرسالة فقط
const PREFIX = /^\s*(?:لين|leen)(?:[\s:،\-]+|$)/i;

const SYSTEM_PROMPT = `أنت "لين"، مساعد بوت واتساب يتكلم العربية الفصحى البسيطة.
تفهم نية المستخدم من رسالته ومن سياق المحادثة السابقة، وترد بسطر واحد فقط بأحد الأشكال:

CHAT: <رد محادثة طبيعي>
ASK: <شرح أو إجابة>
RUN: <اسم الأمر> | <اسم الأمر> ...

القاعدة الأم: صنّف كل رسالة في واحد من الأنواع التالية أولاً، ثم أخرج الشكل المناسب.

1) تعليق أو نقاش على ما سبق — لا تنفيذ ولا إعادة تنفيذ:
   • أفعال الماضي والتعجب: «حظرته» «سويته» «رفعتها» «الغيتها» «نفذتها» «حليت»
   • عبارات التفاعل: «كفو عليك» «تمام» «ممتاز» «شكراً» «يعطيك العافية» «الحمدلله»
   → CHAT برد قصير، أو ASK إن كان فيه سؤال. لا تنفّذ الأمر السابق مرة أخرى أبداً.
   أمثلة بعد تنفيذ حظر ناجح:
   «كفو عليك حظرته» → CHAT. «شكراً، الحمدلله» → CHAT. «تم الحظر؟» → ASK.
   القاعدة الحاسمة: لو الفعل بصيغة الماضي فهو تعليق، ولو بصيغة الأمر فهو طلب.

2) سؤال أو شرح أو نقاش: «ايش الأمر؟» «هل أقدر أحظر فلان؟» «ماذا يحصل لو…»
   → ASK: اشرح فقط، ولا تنفّذ شيئاً.

3) طلب تنفيذ جديد صريح: فعل الأمر وارد في نفس الرسالة
   («احظره» «اعرض القائمة» «اقفل» «ارفعه مالك») → RUN بأسماء الأوامر من القائمة فقط.

4) موافقة أو استكمال لطلب معلّق: إشارات خالصة بلا فعل أمر
   («نعم» «ايوه» «تمام» «سوها» «نفذه» «هذا» «من قصدني» «صحيح»)
   → إن كان الطلب المعلّق محدداً أخرج RUN بنفس ذلك الطلب (لا طلب جديد)،
   وإلا ASK لطلب التوضيح. الموافقة ليست تنفيذاً جديداً ولا تكراراً لأمر نُفّذ.

5) طلب غامض بلا أمر محدد مع وجود هدف: «خلاص ارفع القيود عنه» + منشن
   → CLARIFY: سؤال واحد قصير يعرض الاحتمالات فقط، بلا شرح إضافي ولا تنفيذ.
   قاعدة صارمة: كلمات «القيود» / «ارفع القيود» / «شيل القيود» / «فكّ عنه» ليست أمراً
   واحداً — قد تعني إلغاء الحظر أو إلغاء التقييد أو إلغاء الكتم.
   لا تخمّن واحداً منها: أخرج CLARIFY واسأل بالاحتمالات.

بقواعد ثابتة:
• إذا لم يرد في الرسالة أي إشارة إلى أمر من أوامر البوت إطلاقاً
  (سلام، سؤال شخصي، استفسار عن تأخر رد، مدح، شكر) → CHAT بردّ اجتماعي قصير،
  ولا تسأل فيه عن منشن ولا عن أوامر ولا تعطِ تعليمات.
• إذا وُجد منشن في الرسالة الحالية أو في أي رسالة معروضة موسومة بـ«فيه منشن»
  → الهدف موجود. لا تطلب منشناً جديداً.
• إن كان الهدف في منشن الرسالة الأصلية المحفوظة (يظهر في السياق بوسم «الطلب الأصلي»)
  أو في أي رسالة معلَّمة بـ«فيه منشن» → لا تطلب منشناً جديداً أبداً؛
  النظام ينفّذ على الرسالة الأصلية نفسها.
• إن كان الأمر يحتاج شخصاً مستهدفاً (حظر، طرد، تقييد، انذار، رفع، تنزيل...)
  ولا يوجد أي منشن في آخر الرسائل المعروضة → ASK واطلب منه أن يمنشن الشخص.
• إن لم تظهر في السياق كتلة «[طلب معلّق منك]» فلا يوجد أي طلب معلّق.
  عندها أي إشارة مرجعية أو كلام مبهم بلا فعل أمر صريح
  («هذا» «من قصدته» «ايوه» «سوها» «اللي قلته») → ASK واطلب توضيح المقصود.
  لا تستنتج أمراً من كلام سابق لم يطلب المستخدم تنفيذه.
• عدة أوامر في رسالة واحدة → افصل أسماءها بـ |
• أسماء الأوامر كما في القائمة حرفياً. لا تخترع أسماء. لا تضف أرقاماً أو معرفات أو أسماء أشخاص.
• إن كان الكلام غامضاً ولا يُفهم منه شيء → ASK واطلب التوضيح بلطف.
• إن كانت الرسالة موضوعاً جديداً مستقلاً تماماً لا علاقة له بأي طلب معلق → أخرج NEW فقط.`;

function detectPrefix(text) {
    const m = String(text || '').match(PREFIX);
    if (!m) return { triggered: false, query: '' };
    return { triggered: true, query: String(text).slice(m[0].length).trim() };
}

/**
 * نداء النموذج مع إعادة محاولة عند فشل شبكي عابر أو 5xx أو 429.
 * لا نعيد المحاولة على 4xx الآخر (مفتاح خاطئ/طلب مرفوض) — الخطأ حقيقي.
 */
async function callModelWithRetry(messages, attempts = 2) {
    let last = null;
    for (let i = 1; i <= attempts; i++) {
        last = await callModelOnce(messages);
        if (!last.error) return last;
        if (!last.retriable || i === attempts) break;
        // مهلة 90 ثانية لكل محاولة — الانتظار قصير ومتناسب
        await new Promise(r => setTimeout(r, 1200 * i));
        console.error(`[AI] محاولة ${i}/${attempts} فشلت (${String(last.error).slice(0, 80)}) — إعادة محاولة`);
    }
    return { error: last.error };
}

async function callModelOnce(messages) {
    if (!AI_API_KEY) return { error: 'مفتاح النموذج غير موجود (AI_API_KEY)' };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT);
    try {
        const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: AI_MODEL, messages }),
            signal: ctrl.signal
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) {
            // 4xx = خطأ حقيقي (مفتاح/طلب) لا يُعاد. 5xx/429 = عابر يُعاد.
            const retriable = res.status >= 500 || res.status === 429 || !data;
            return { error: data?.error?.message || `HTTP ${res.status}`, retriable };
        }
        return { data };
    } catch (e) {
        return { error: e.name === 'AbortError' ? 'انتهت مهلة النموذج' : e.message, retriable: true };
    } finally {
        clearTimeout(timer);
    }
}

const callModel = callModelWithRetry;

/**
 * تحليل مخرج النموذج: { type: 'CHAT'|'ASK'|'RUN'|'CLARIFY', text, commands[] }
 * أي صيغة خارج البروتوكول تُرفض. لا تخمين.
 */
function parseIntent(raw) {
    const line = String(raw || '').trim().split('\n')[0].trim();
    const m = line.match(/^(CHAT|ASK|RUN|CLARIFY|NEW)\s*:?\s*(.*)$/i);
    if (!m) return null;
    const type = m[1].toUpperCase();
    const body = (m[2] || '').trim();
    if (type === 'NEW') return { type, text: '', commands: [] };
    if (type === 'RUN') {
        const commands = body.split('|').map((s) => s.trim()).filter(Boolean);
        if (!commands.length || commands.some((c) => c.length > 60)) return null;
        return { type, text: '', commands };
    }
    if (!body || body.length > 3500) return null;
    return { type, text: body, commands: [] };
}

/**
 * مطابقة صارمة مع أوامر الـ switch الفعلية فقط.
 * تُرجع الصيغة الأصلية كما في الكود (مثل «الرتبه» لا «رتبه»).
 */
function resolveName(raw) {
    const t = String(raw || '').trim();
    if (!t || t.length > 60) return null;
    const key = CANON(t).replace(/^_+|_+$/g, '');
    if (!key || key.length < 2) return null;
    const literal = allowedNames().get(key);
    if (!literal) return null;
    return { name: literal };
}

// أوامر تحتاج شخصاً مستهدفاً (تُقرأ من منشن حقيقي في الرسالة).
// تُصفّى تلقائياً ضد أوامر الـ switch الفعلية حتى لا تنحرف مع الزمن.
const NEEDS_TARGET = [
    'حظر', 'الغاء الحظر', 'طرد', 'تقيد', 'الغاء التقيد', 'انذار',
    'رفع مالك', 'تنزيل مالك', 'رفع مدير', 'تنزيل مدير',
    'رفع ادمن', 'تنزيل ادمن', 'رفع مميز', 'تنزيل مميز'
].filter((n) => allowedNames().has(CANON(n).replace(/^_+|_+$/g, '')));

function needsTarget(name) {
    return NEEDS_TARGET.includes(name);
}

// ── طلبات معلّقة بانتظار توضيح: الرسالة الأصلية بكائنها الحقيقي ──
// عند سؤال توضيحي (CLARIFY)، نحتفظ بالرسالة الأصلية كما وصلت من WhatsApp
// (بنصها ومنشنها ومفتاحها). عند رد المستخدم اللاحق — حتى بدون بادئة —
// نكمل من نفس الطلب، وعند الوضوح ننفذ على الرسالة الأصلية المحفوظة.
// مربوط بالمستخدم + المجموعة، وينتهي بعد 3 دقائق.
const pendingClarify = new Map();
const PENDING_TTL_MS = 3600000;

function pendingKey(chatId, senderId) {
    return `${chatId}|${senderId}`;
}

function setPending(chatId, senderId, record) {
    sweepPending();
    if (pendingClarify.size >= 500) {
        pendingClarify.delete(pendingClarify.keys().next().value);
    }
    pendingClarify.set(pendingKey(chatId, senderId), {
        message: record.message,
        originalQuery: record.originalQuery || '',
        candidates: Array.isArray(record.candidates) ? record.candidates.slice(0, 5) : [],
        question: record.question || '',
        expiresAt: Date.now() + PENDING_TTL_MS
    });
}

function getPending(chatId, senderId) {
    sweepPending();
    const rec = pendingClarify.get(pendingKey(chatId, senderId));
    if (!rec) return null;
    if (Date.now() >= rec.expiresAt) {
        pendingClarify.delete(pendingKey(chatId, senderId));
        return null;
    }
    return rec;
}

function clearPending(chatId, senderId) {
    return pendingClarify.delete(pendingKey(chatId, senderId));
}

function sweepPending() {
    const now = Date.now();
    for (const [k, rec] of pendingClarify) {
        if (!rec || now >= rec.expiresAt) pendingClarify.delete(k);
    }
}

// ── مخزن الرسائل الأخيرة: كائنات WhatsApp الحقيقية بسياقها ──
// يُستخدم عند توضيح طلب سابق: نعيد تنفيذ الرسالة ذات الصلة التي تحمل
// المنشن الحقيقي، بدل اختلاق mentionedJid. مربوط بالمستخدم + المجموعة.
const msgbuf = new Map();
const MSGBUF_MAX_KEYS = 500;
const MSGBUF_MAX_PER_KEY = 10;
const MSGBUF_TTL_MS = 3600000;

function messageHasMention(msg) {
    const ci = msg?.message?.extendedTextMessage?.contextInfo;
    if (ci?.mentionedJid && ci.mentionedJid.length) return true;
    if (ci?.participant) return true;
    return false;
}

function rememberMessage(chatId, senderId, message) {
    const k = historyKey(chatId, senderId);
    const arr = msgbuf.get(k) || [];
    arr.push({ ts: Date.now(), message });
    while (arr.length > MSGBUF_MAX_PER_KEY) arr.shift();
    if (!msgbuf.has(k) && msgbuf.size >= MSGBUF_MAX_KEYS) {
        msgbuf.delete(msgbuf.keys().next().value);
    }
    msgbuf.set(k, arr);
}

function sweepMentionBuffer() {
    const now = Date.now();
    for (const [k, arr] of msgbuf) {
        const kept = (arr || []).filter((r) => r && r.message && now - r.ts <= MSGBUF_TTL_MS);
        if (kept.length) msgbuf.set(k, kept);
        else msgbuf.delete(k);
    }
}
// المفتاح chatId|senderId حتى لا ينتقل سياق مجموعة إلى أخرى.
// نعرض للنموذج آخر 10 رسائل حقيقية كما وصلت، لا نصوصاً مُعاد صياغتها.
const memory = new Map();
const MEMORY_MAX_KEYS = 500;
const REPLY_MAX_PER_KEY = 10;
const MEMORY_TTL_MS = 3600000;

function historyKey(chatId, senderId) {
    return `${chatId}|${senderId}`;
}

// ردود البوت فقط، لعرضها داخل السياق. لا تحل محل رسائل المستخدم.
function pushReply(chatId, senderId, text) {
    const k = historyKey(chatId, senderId);
    const arr = memory.get(k) || [];
    arr.push({ ts: Date.now(), text: String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300) });
    while (arr.length > REPLY_MAX_PER_KEY) arr.shift();
    if (!memory.has(k) && memory.size >= MEMORY_MAX_KEYS) {
        memory.delete(memory.keys().next().value);
    }
    memory.set(k, arr);
}

function sweepReplies() {
    const now = Date.now();
    for (const [k, arr] of memory) {
        const kept = (arr || []).filter((r) => r && now - r.ts <= MEMORY_TTL_MS);
        if (kept.length) memory.set(k, kept);
        else memory.delete(k);
    }
}

function messageText(msg) {
    const m = msg && msg.message;
    if (!m) return '';
    const t = m.extendedTextMessage?.text ?? m.conversation ?? m.imageMessage?.caption ?? m.videoMessage?.caption;
    if (typeof t === 'string' && t) return t;
    if (m.imageMessage) return '[صورة]';
    if (m.videoMessage) return '[فيديو]';
    return '';
}

/**
 * الهدف المحفوظ مع الطلب المعلق: يُقرأ من منشن الرسالة الأصلية نفسها.
 * لا يُختلق أي معرف — القراءة فقط.
 */
function getPendingTarget(chatId, senderId) {
    const pend = getPending(chatId, senderId);
    const ci = pend?.message?.message?.extendedTextMessage?.contextInfo;
    return {
        hasMention: messageHasMention(pend?.message),
        jids: Array.isArray(ci?.mentionedJid) ? ci.mentionedJid : [],
        keyId: pend?.message?.key?.id || null,
        message: pend?.message || null
    };
}

/**
 * سياق المحادثة كما يُعرض للنموذج: آخر 10 رسائل حقيقية كما وصلت من
 * WhatsApp (لا نصوص مُعاد صياغتها)، مع توضيح أي رسالة هي الطلب الأصلي
 * وأين يوجد الهدف (المنشن). عند وجود طلب معلّق يُضاف سياقه صراحةً.
 */
function buildContext(chatId, senderId, pend, query, currentMessage) {
    sweepMentionBuffer();
    sweepReplies();
    const now = Date.now();
    const currentKeyId = currentMessage?.key?.id || null;
    const arr = (msgbuf.get(historyKey(chatId, senderId)) || [])
        .filter((r) => r && r.message && now - r.ts <= MSGBUF_TTL_MS)
        .slice(-MSGBUF_MAX_PER_KEY);

    const origId = pend?.message?.key?.id || null;
    const tagsFor = (msg) => {
        const tags = [];
        if (messageHasMention(msg)) tags.push('فيه منشن');
        if (origId && msg?.key?.id === origId) tags.push('الطلب الأصلي');
        return tags.length ? `  [${tags.join(' + ')}]` : '';
    };
    const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, 200) || '(بلا نص)';

    const shown = arr.filter((r) => !currentKeyId || r.message?.key?.id !== currentKeyId);
    const lines = shown.map((r, i) => `${i + 1}. «${clean(messageText(r.message))}»${tagsFor(r.message)}`);

    const parts = [];
    if (lines.length) parts.push(`[آخر ${lines.length} رسائل حقيقية من هذه المحادثة]\n${lines.join('\n')}`);

    const since = arr.length ? arr[0].ts : 0;
    const reps = (memory.get(historyKey(chatId, senderId)) || [])
        .filter((r) => r && r.ts >= since && now - r.ts <= MEMORY_TTL_MS);
    if (reps.length) {
        parts.push('[ردودك السابقة]\n' + reps.map((r) => `«${r.text}»`).join('\n'));
    }

    if (pend) {
        const tgt = getPendingTarget(chatId, senderId);
        parts.push([
            '[طلب معلّق منك]',
            `طلب المستخدم الأصلي: «${pend.originalQuery}»`,
            `سألت المستخدم: «${pend.question}»`,
            `الهدف: ${tgt.hasMention
                ? 'موجود في منشن الرسالة الأصلية المحفوظة — استخدمه ولا تطلب منشناً جديداً'
                : 'لا يوجد منشن في الرسالة الأصلية — إن احتاج الطلب هدفاً فاطلب منشناً'}`
        ].join('\n'));
    }

    const cur = `«${clean(query)}»${tagsFor(currentMessage)}`;
    parts.push(`[رسالة المستخدم الحالية]\n${cur}`);
    return parts.join('\n\n');
}

module.exports = {
    PREFIX, detectPrefix, callModel, parseIntent, resolveName, SYSTEM_PROMPT,
    pushReply, buildContext, getPendingTarget, messageText,
    needsTarget, messageHasMention, rememberMessage,
    setPending, getPending, clearPending, sweepPending,
    AI_MODEL, AI_BASE_URL,
    hasApiKey: () => !!AI_API_KEY,
    // المرجع المعروض للنموذج: الأوامر الحقيقية فقط
    reference: () => {
        const allowed = allowedNames();
        const byCat = {};
        for (const c of CATALOG) {
            if (!allowed.has(CANON(c.name))) continue;
            (byCat[c.category] = byCat[c.category] || []).push(c);
        }
        const parts = [];
        for (const cat of Object.keys(byCat)) {
            parts.push(`\n[${cat}]\n` + byCat[cat].map((c) => `${c.name} — ${c.description}`).join('\n'));
        }
        return parts.join('\n');
    }
};
