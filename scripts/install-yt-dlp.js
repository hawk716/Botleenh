#!/usr/bin/env node
/**
 * تنزيل ثنائي yt-dlp المستقل (Linux/macOS) مرة واحدة عند `npm install`.
 * السبب: أوامر الفيديو/الصوت تعتمد على yt-dlp، وكان المسار الثابت
 * (/home/codespace/.python/current/bin/yt-dlp) غير موجود على الاستضافة.
 *
 * يُنزَّل إلى: node_modules/.yt-dlp/yt-dlp
 * المتغير YT_DLP_SKIP_DOWNLOAD=1 يعطّل التنزيل.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipe = promisify(pipeline);

const DIR = path.join(__dirname, '..', 'node_modules', '.yt-dlp');
const BIN = path.join(DIR, 'yt-dlp');

const SOURCES = [
    'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
    'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
];

function download(url, redirects = 0) {
    return new Promise((resolve, reject) => {
        if (redirects > 6) return reject(new Error('too many redirects'));
        const req = https.get(url, {
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                return resolve(download(res.headers.location, redirects + 1));
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode} — ${url}`));
            }
            resolve(res);
        });
        req.on('timeout', () => { req.destroy(new Error('timeout')); });
        req.on('error', reject);
    });
}

async function isWorking(bin) {
    try {
        fs.accessSync(bin, fs.constants.X_OK);
        return fs.statSync(bin).size > 1_000_000;
    } catch { return false; }
}

(async () => {
    if (process.env.YT_DLP_SKIP_DOWNLOAD === '1') {
        console.log('[yt-dlp] تم تخطي التنزيل (YT_DLP_SKIP_DOWNLOAD=1)');
        return;
    }
    if (await isWorking(BIN)) {
        console.log('[yt-dlp] موجود مسبقاً — لا حاجة للتنزيل');
        return;
    }

    fs.mkdirSync(DIR, { recursive: true });
    const tmp = `${BIN}.tmp`;
    for (const url of SOURCES) {
        try {
            console.log(`[yt-dlp] تنزيل من ${url} …`);
            const res = await download(url);
            await pipe(res, fs.createWriteStream(tmp));
            const size = fs.statSync(tmp).size;
            if (size < 1_000_000) throw new Error(`ملف صغير غير صالح (${size} بايت)`);
            fs.chmodSync(tmp, 0o755);
            fs.renameSync(tmp, BIN);
            console.log(`[yt-dlp] تم التثبيت بنجاح (${(size / 1048576).toFixed(1)} ميجابايت) → ${BIN}`);
            return;
        } catch (e) {
            try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch { }
            console.log(`[yt-dlp] فشل من هذا المصدر: ${e.message}`);
        }
    }
    // لا نُفشل التثبيت: التطبيق يُبلغ عن الرسالة عند الاستخدام
    console.log('[yt-dlp] تعذّر التنزيل — أوامر الفيديو لن تعمل حتى يُوفَّر الثنائي.');
})();