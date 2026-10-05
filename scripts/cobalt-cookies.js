/**
 * تحويل cookies.txt (Netscape) إلى صيغة cobalt cookies.json
 * صيغة cobalt: { "<service>": ["k=v; k2=v2; ..."] }
 * شغّل: node scripts/cobalt-cookies.js
 * المتغيّر: SOURCE_COOKIES (افتراضي ./cookies.txt) | COBALT_COOKIES_OUT (افتراضي ./cookies.json)
 */
const fs = require('fs');
const path = require('path');

const src = process.env.SOURCE_COOKIES || path.join(__dirname, '..', 'cookies.txt');
const out = process.env.COBALT_COOKIES_OUT || path.join(__dirname, '..', 'cookies.json');

if (!fs.existsSync(src)) {
    console.log('[cobalt-cookies] لا يوجد ملف المصدر:', src);
    process.exit(0);
}

const text = fs.readFileSync(src, 'utf8');
const rows = text.split(/\r?\n/)
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => l.split('\t'))
    .filter(c => c.length >= 7 && c[4] !== '0');

// يوتيوب فقط (المجال .youtube.com) — cobalt يقبل youtube/instagram/reddit/twitter/vimeo_bearer
const yt = rows.filter(c => /(^|\.)youtube\.com$/.test(c[0]));
if (yt.length === 0) {
    console.log('[cobalt-cookies] لا كوكيز ليوتيوب في', src);
    process.exit(0);
}

// احذف المفتاح/القيمة إذا كان انتهت صلاحيته
const now = Math.floor(Date.now() / 1000);
const alive = yt.filter(c => Number(c[4]) > now);
const pairs = alive.map(c => `${c[5]}=${c[6]}`);
if (pairs.length === 0) {
    console.log('[cobalt-cookies] كل كوكيز يوتيوب منتهية الصلاحية');
    process.exit(1);
}

const payload = { youtube: [pairs.join('; ')] };

let existing = {};
try { if (fs.existsSync(out)) existing = JSON.parse(fs.readFileSync(out, 'utf8')); } catch (e) { }
// لا تمسّ خدمات أخرى إن وجدت
existing.youtube = payload.youtube;
fs.writeFileSync(out, JSON.stringify(existing, null, 4));

console.log(`[cobalt-cookies] كُتب ${pairs.length} كوكيز يوتيوب → ${out}`);
console.log(`[cobalt-cookies] (كانت ${yt.length} في المصدر، ${yt.length - alive.length} منتهية)`);
