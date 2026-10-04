/**
 * حلّ مسار ثنائي yt-dlp مرة واحدة عند الإقلاع.
 * الترتيب: متغير البيئة → node_modules/.yt-dlp → مسارات النظام → PATH.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

let cached;

function candidates() {
    const list = [];
    if (process.env.YT_DLP_PATH) list.push(process.env.YT_DLP_PATH);
    list.push(path.join(__dirname, '..', 'node_modules', '.yt-dlp', 'yt-dlp'));
    list.push('/usr/local/bin/yt-dlp');
    list.push('/usr/bin/yt-dlp');
    list.push(path.join(process.env.HOME || '', '.local', 'bin', 'yt-dlp'));
    list.push('/home/codespace/.python/current/bin/yt-dlp');
    return list.filter(Boolean);
}

function fromPath() {
    try {
        return execFileSync('sh', ['-c', 'command -v yt-dlp 2>/dev/null'], {
            encoding: 'utf8', timeout: 4000
        }).trim() || null;
    } catch {
        return null;
    }
}

function resolveYtDlp() {
    if (cached !== undefined) return cached;
    for (const c of candidates()) {
        try {
            fs.accessSync(c, fs.constants.X_OK);
            if (fs.statSync(c).size > 1_000_000) { cached = c; return cached; }
        } catch { }
    }
    const p = fromPath();
    if (p) {
        try {
            if (fs.statSync(p).size > 1_000_000) { cached = p; return cached; }
        } catch { }
    }
    cached = null;
    return cached;
}

function ytDlpAvailable() {
    return resolveYtDlp() !== null;
}

/**
 * وسائط الكوكيز لـ yt-dlp.
 * الملف: YT_DLP_COOKIES (مسار نسبي للمشروع أو مطلق)
 * يُتحقق من صيغة Netscape: كل سطر = 7 حقول مفصولة بـ tab.
 *
 * مهم: yt-dlp يُحدّث ملف الكوكيز افتراضياً (يكتب فيه الكوكيز التي يستلمها)،
 * أي أنه يحقن كوكيز مجهولة ويمحو بياناتك. لا يوجد خيار لإيقاف الكتابة،
 * لذلك نستعمل نسخة مؤقتة (node_modules/.yt-dlp/cookies-ro.txt) تُبنى من
 * ملفك عند الإقلاع؛ فأي كتابة تصيب النسخة لا ملفك الأصلي.
 * يرجع ['--cookies', <النسخة المؤقتة>] أو [].
 */
let cookieCache;

function buildCookieFile(src) {
    try {
        const text = fs.readFileSync(src, 'utf8');
        const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
        const valid = lines.filter(l => l.split('\t').length >= 7);
        if (lines.length !== valid.length) {
            console.log(`[ytDlp] cookies: ${lines.length - valid.length} سطر بصيغة غير صالحة — سيُتجاهل`);
        }
        if (valid.length === 0) return null;
        // نسخة للقراءة فقط: كل استدعاء لاحق لا يلمس ملف المستخدم
        const roDir = path.join(__dirname, '..', 'node_modules', '.yt-dlp');
        if (!fs.existsSync(roDir)) fs.mkdirSync(roDir, { recursive: true });
        const ro = path.join(roDir, 'cookies-ro.txt');
        fs.writeFileSync(ro, `# Netscape HTTP Cookie File\n${valid.join('\n')}\n`);
        return ro;
    } catch (e) {
        console.log(`[ytDlp] تعذّر قراءة ملف الكوكيز: ${e.message}`);
        return null;
    }
}

function cookieArgs() {
    if (cookieCache !== undefined) return cookieCache;
    const raw = (process.env.YT_DLP_COOKIES || '').trim();
    if (!raw) { cookieCache = []; return cookieCache; }
    const file = path.isAbsolute(raw) ? raw : path.join(__dirname, '..', raw);
    const ro = buildCookieFile(file);
    cookieCache = ro ? ['--cookies', ro] : [];
    return cookieCache;
}

function cookiesAvailable() {
    return cookieArgs().length > 0;
}

module.exports = { resolveYtDlp, ytDlpAvailable, cookieArgs, cookiesAvailable };