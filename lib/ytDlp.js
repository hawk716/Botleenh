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

module.exports = { resolveYtDlp, ytDlpAvailable };