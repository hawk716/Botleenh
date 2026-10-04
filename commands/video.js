const { UNDER_MAINTENANCE } = require('../lib/messages');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execFile } = require('child_process');
const { igdl } = require('ruhend-scraper');
const { ttdl: ttdlBtch } = require('btch-downloader');
const { resolveYtDlp } = require('../lib/ytDlp');
const settings = require('../settings');

const YT_DLP = resolveYtDlp() || 'yt-dlp';
const processedMessages = new Set();
const MAX_SIZE = 500 * 1024 * 1024;
const MAX_AUDIO_SIZE = 100 * 1024 * 1024;

// مهلة انتظار اختيار المستخدم (1 = فيديو / 2 = صوت) وحدّ أقصى للحالات المحفوظة
const CHOICE_TTL_MS = 3 * 60 * 1000;
const MAX_PENDING = 300;
const pending = new Map();

function runYtDlp(args, timeout = 180000) {
    return new Promise((resolve, reject) => {
        if (!resolveYtDlp()) {
            return reject(new Error('yt-dlp غير مثبت — نفّذ: npm run install:yt-dlp'));
        }
        const child = execFile(YT_DLP, args, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
                const msg = stderr?.split('\n').find(l => l.startsWith('ERROR:')) || err.message;
                const e = new Error(msg?.substring(0, 200));
                // يوتيوب يحجب التحميل من خوادم البيانات بدون كوكيز
                if (/Sign in to confirm|not a bot|confirm you.{0,3}re not a bot/i.test(msg || '')) {
                    e.code = 'YT_BLOCKED';
                }
                reject(e);
            } else {
                resolve(stdout);
            }
        });
    });
}

function detectPlatform(url) {
    if (/https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)/i.test(url)) return 'youtube'
    if (/https?:\/\/(www\.|vm\.|vt\.|m\.)?tiktok\.com/i.test(url)) return 'tiktok'
    if (/https?:\/\/(www\.)?instagram\.com/i.test(url)) return 'instagram'
    if (/https?:\/\/(www\.|m\.|fb\.)?facebook\.com/i.test(url)) return 'facebook'
    if (/https?:\/\/(www\.)?(twitter\.com|x\.com)/i.test(url)) return 'twitter'
    if (/https?:\/\/(www\.)?(soundcloud\.com|snd\.sc)/i.test(url)) return 'soundcloud'
    if (/https?:\/\/(www\.)?vimeo\.com/i.test(url)) return 'vimeo'
    if (/https?:\/\/(www\.)?twitch\.tv|clips\.twitch\.tv/i.test(url)) return 'twitch'
    if (/https?:\/\/(www\.)?dailymotion\.com/i.test(url)) return 'dailymotion'
    return 'unknown'
}

async function getInfo(url) {
    try {
        const out = await runYtDlp(['--dump-json', '--no-download', '--no-warnings', '--socket-timeout', '15', url], 30000)
        return JSON.parse(out)
    } catch {
        return null
    }
}

// بيانات يوتيوب البديلة: يوتيوب يحجب yt-dlp بال описаوف، فنستعمل
// prince API (المدة) + oEmbed (الاسم) — كلاهما يعمل بلا مصادقة.
async function getYouTubeMeta(url) {
    const meta = { title: '', uploader: '', duration: 0, thumbnail: '' };
    try {
        const { data } = await axios.get(
            `https://api.princetechn.com/api/download/ytdl?apikey=prince&url=${encodeURIComponent(url)}`,
            { timeout: 20000 }
        );
        if (data?.status === 200 && data?.success && data?.result) {
            meta.title = data.result.title || '';
            meta.duration = Number(data.result.duration) || 0;
            meta.thumbnail = (data.result.thumbnail || '').replace('vi_webp', 'vi').replace('maxresdefault.webp', 'maxresdefault.jpg');
        }
    } catch (e) { }
    try {
        const { data } = await axios.get(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
            { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        meta.title = meta.title || data?.title || '';
        meta.uploader = data?.author_name || '';
        meta.thumbnail = meta.thumbnail || data?.thumbnail_url || '';
    } catch (e) { }
    return meta;
}

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

// مدة بالعربية: ساعات ودقائق/ثواني (كما يطلب المستخدم)
function formatDurationAr(seconds) {
    const total = Number(seconds);
    if (!total || !isFinite(total) || total <= 0) return '';
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    if (hrs > 0) return mins > 0 ? `${hrs} ساعه و ${mins} دقيقه` : `${hrs} ساعه`;
    if (mins > 0) return `${mins} دقيقه`;
    return `${Math.floor(total)} ثانيه`;
}

// تحويل مدة yt-search (نص مثل "3:32" أو رقم) إلى ثوانٍ
function parseDuration(value) {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && typeof value.seconds === 'number') return value.seconds;
    if (typeof value !== 'string') return 0;
    const raw = value.trim();
    if (!raw) return 0;
    if (/^\d+$/.test(raw)) return Number(raw);
    const parts = raw.split(':').map(p => Number(p));
    if (parts.some(p => isNaN(p))) return 0;
    return parts.reduce((acc, n) => acc * 60 + n, 0);
}

// العنوان: الاسم | صاحب الفيديو | المدة
function buildHeader(target = {}) {
    const parts = [];
    const title = String(target.title || '').trim();
    const uploader = String(target.uploader || '').trim();
    const duration = formatDurationAr(target.duration);
    if (title) parts.push(title);
    if (uploader) parts.push(uploader);
    if (duration) parts.push(duration);
    return parts.length ? parts.join(' | ') : 'فيديو';
}

function buildCaption(target) {
    return `*${buildHeader(target)}*\n*↢ للتحـمـيل كفيديو ارسـل ↢ 1*\n*↢ للتحـمـيل كصـوت ارسـل ↢ 2*`;
}

function fwdContext() {
    return {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid || '120363400425238128@newsletter',
            newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
            serverMessageId: -1
        }
    };
}

function tmpDir() {
    const dir = path.join(__dirname, '../temp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

async function getTikTokInfo(url) {
    try {
        const { data } = await axios.get(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        })
        let titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (titleMatch && titleMatch[1] && titleMatch[1] !== 'TikTok') {
            return titleMatch[1].replace(' - TikTok', '').trim()
        }
        titleMatch = data.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
        if (titleMatch) {
            return titleMatch[1].trim()
        }
    } catch (e) { }
    return null
}

function readAndRemove(dir, prefix, exts, maxSize) {
    const files = fs.readdirSync(dir)
    const found = files.find(f => f.startsWith(prefix) && exts.some(e => f.endsWith(e)))
    if (!found) throw new Error('الملف لم يتم العثور عليه')
    const fp = path.join(dir, found)
    const st = fs.statSync(fp)
    if (st.size > maxSize) { fs.unlinkSync(fp); throw new Error('الملف كبير جداً') }
    if (st.size === 0) { fs.unlinkSync(fp); throw new Error('الملف فارغ') }
    const buf = fs.readFileSync(fp)
    fs.unlinkSync(fp)
    return buf
}

async function downloadViaYtDlp(url, dir) {
    const ts = Date.now()
    const outPath = path.join(dir, `v_${ts}.%(ext)s`)
    await runYtDlp([
        '--format', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '--output', outPath, '--no-warnings', '--no-playlist',
        '--socket-timeout', '15',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        url
    ])
    return readAndRemove(dir, `v_${ts}`, ['.mp4', '.mkv', '.webm'], MAX_SIZE)
}

async function downloadAudioViaYtDlp(url, dir) {
    const ts = Date.now()
    const outPath = path.join(dir, `a_${ts}.%(ext)s`)
    await runYtDlp([
        '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0',
        '--format', 'bestaudio/best',
        '--output', outPath, '--no-warnings', '--no-playlist',
        '--socket-timeout', '15',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        url
    ])
    return readAndRemove(dir, `a_${ts}`, ['.mp3', '.m4a'], MAX_AUDIO_SIZE)
}

async function downloadToBuffer(url) {
    const { data } = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    })
    return Buffer.from(data)
}

//-choice 1: فيديو. يعيد { buffer } أو { url }
async function fetchVideo(target) {
    const { url, platform } = target;
    const dir = tmpDir();

    if (platform === 'tiktok') {
        try {
            const dl = await ttdlBtch(url);
            if (dl?.status && dl?.video?.length) return { buffer: await downloadToBuffer(dl.video[0]) };
        } catch (e) {
            console.log('[VIDEO] btch TikTok failed:', e.message?.slice(0, 80));
        }
        return { buffer: await downloadViaYtDlp(url, dir) };
    }

    if (platform === 'youtube') {
        try {
            return { buffer: await downloadViaYtDlp(url, dir) };
        } catch (e) {
            console.log('[VIDEO] yt-dlp YouTube blocked, trying API:', e.message?.slice(0, 80));
            let data = null;
            try {
                ({ data } = await axios.get(
                    `https://api.princetechn.com/api/download/ytdl?apikey=prince&url=${encodeURIComponent(url)}`,
                    { timeout: 30000 }
                ));
            } catch (apiErr) { }
            if (data?.status === 200 && data?.success && data?.result?.video_url) {
                return { url: data.result.video_url };
            }
            // لا رابط بديل — نُبقي سبب الحجب ليُعرض للمستخدم بدقة
            if (e.code === 'YT_BLOCKED') throw e;
            const err = new Error('فشل تحميل فيديو يوتيوب');
            err.code = 'YT_BLOCKED';
            throw err;
        }
    }

    if (platform === 'instagram') {
        try {
            return { buffer: await downloadViaYtDlp(url, dir) };
        } catch (e) {
            console.log('[VIDEO] yt-dlp Instagram failed, trying ruhend-scraper:', e.message?.slice(0, 80));
            const dl = await igdl(url);
            if (dl?.data?.length) {
                const v = dl.data.find(m => m.type === 'video' || /\.mp4/i.test(m.url));
                if (v) return { url: v.url };
            }
            throw new Error('فشل تحميل فيديو انستقرام');
        }
    }

    return { buffer: await downloadViaYtDlp(url, dir) };
}

//-choice 2: صوت. يعيد { buffer }
async function fetchAudio(target) {
    const { url, platform } = target;
    const dir = tmpDir();
    try {
        return { buffer: await downloadAudioViaYtDlp(url, dir) };
    } catch (e) {
        console.log('[VIDEO] yt-dlp audio failed:', e.message?.slice(0, 80));
        if (e.code === 'YT_BLOCKED') throw e;
        if (platform === 'tiktok') {
            const dl = await ttdlBtch(url).catch(() => null);
            const music = dl?.music?.playUrl || dl?.musicPlayUrl;
            if (music) return { buffer: await downloadToBuffer(music) };
        }
        throw new Error('فشل تحميل الصوت');
    }
}

// ===== حالة اختيار المستخدم =====

function senderKey(message) {
    return message?.key?.participant || message?.key?.remoteJid;
}

function clearPending(senderId) {
    const state = pending.get(senderId);
    if (state && state.timeout) clearTimeout(state.timeout);
    pending.delete(senderId);
}

function setPending(senderId, target) {
    if (!senderId || !target?.url) return;
    if (pending.has(senderId)) clearPending(senderId);
    // حدّ أقصى للمCases المحفوظة (حماية الذاكرة)
    if (pending.size >= MAX_PENDING) {
        const oldest = pending.keys().next().value;
        clearPending(oldest);
    }
    const timeout = setTimeout(() => pending.delete(senderId), CHOICE_TTL_MS);
    pending.set(senderId, { ...target, timeout });
}

function isWaiting(senderId) {
    return pending.has(senderId);
}

// استقبال «1» أو «2» بعد بطاقة المعاينة
async function handleChoice(sock, chatId, message, senderId, text) {
    if (!pending.has(senderId)) return false;
    const raw = String(text || '').trim();
    let choice = null;
    if (/^(1|فيديو|فيديوه|video)$/i.test(raw)) choice = 1;
    else if (/^(2|صوت|صوتي|صـوت|اغنية|اغنيه|اغنية صوت|audio|mp3)$/i.test(raw)) choice = 2;
    if (!choice) return false;

    const target = pending.get(senderId);
    clearPending(senderId);

    try { await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } }); } catch (e) { }

    const safeTitle = String(target.title || 'فيديو').replace(/[^\w\s\u0600-\u06FF]/gi, '').trim() || 'فيديو';
    const caption = `*${buildHeader(target)}*`;

    try {
        if (choice === 1) {
            const res = await fetchVideo(target);
            if (res.buffer) {
                await sock.sendMessage(chatId, {
                    video: res.buffer,
                    mimetype: 'video/mp4',
                    fileName: `${safeTitle}.mp4`,
                    caption,
                    contextInfo: fwdContext()
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    video: { url: res.url },
                    mimetype: 'video/mp4',
                    caption,
                    contextInfo: fwdContext()
                }, { quoted: message });
            }
        } else {
            const { buffer } = await fetchAudio(target);
            await sock.sendMessage(chatId, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName: `${safeTitle}.mp3`,
                caption,
                contextInfo: fwdContext()
            }, { quoted: message });
        }
    } catch (error) {
        console.error('[VIDEO] فشل التحميل:', error?.message?.substring(0, 150));
        if (error?.code === 'YT_BLOCKED') {
            await sock.sendMessage(chatId, {
                text: '*↢ فشل التحميل — يوتيوب يحجب التحميل من هذا الخادم حالياً ⚠️*\n*↢ البيانات أعلاه صحيحة، جرّب مرة أخرى لاحقاً.*'
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
        }
    }
    return true;
}

// بطاقة المعاينة: صورة + العنوان + خيارَي التحميل
async function sendPreview(sock, chatId, message, target) {
    const caption = buildCaption(target);
    if (target.thumbnail) {
        await sock.sendMessage(chatId, {
            image: { url: target.thumbnail },
            caption
        }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, { text: caption }, { quoted: message });
    }
}

async function resolveTarget(query, platform) {
    if (platform !== 'unknown') {
        const info = await getInfo(query);
        let target = {
            url: query,
            platform,
            title: info?.title || '',
            uploader: info?.uploader || info?.channel || info?.artist || '',
            duration: parseDuration(info?.duration),
            thumbnail: info?.thumbnail || ''
        };
        // يوتيوب: نستعمل البيانات البديلة إن لم يعطِ yt-dlp شيئاً
        if (platform === 'youtube' && (!target.title || !target.duration)) {
            const meta = await getYouTubeMeta(query);
            target = {
                url: target.url,
                platform,
                title: target.title || meta.title,
                uploader: target.uploader || meta.uploader,
                duration: target.duration || meta.duration,
                thumbnail: target.thumbnail || meta.thumbnail
            };
        }
        if (platform === 'tiktok' && (!target.title || !target.duration || !target.thumbnail)) {
            try {
                const dl = await ttdlBtch(query);
                if (dl?.status) {
                    target.title = target.title || dl.title || '';
                    target.thumbnail = target.thumbnail || dl.thumbnail || '';
                }
            } catch (e) { }
            if (!target.title) {
                const t = await getTikTokInfo(query);
                if (t) target.title = t;
            }
        }
        return target;
    }

    // بحث بالاسم
    const search = await yts(query);
    if (!search?.videos?.length) return null;
    const v = search.videos[0];
    const target = {
        url: v.url,
        platform: 'youtube',
        title: v.title || '',
        uploader: v.channel?.name || v.uploader || '',
        duration: parseDuration(v.duration),
        thumbnail: v.thumbnail || ''
    };
    const info = await getInfo(v.url).catch(() => null);
    if (info) {
        target.title = info.title || target.title;
        target.uploader = info.uploader || info.channel || target.uploader;
        target.duration = parseDuration(info.duration) || target.duration;
        target.thumbnail = info.thumbnail || target.thumbnail;
    }
    if (!target.duration || !target.uploader) {
        const meta = await getYouTubeMeta(v.url).catch(() => null);
        if (meta) {
            target.title = target.title || meta.title;
            target.uploader = target.uploader || meta.uploader;
            target.duration = target.duration || meta.duration;
            target.thumbnail = target.thumbnail || meta.thumbnail;
        }
    }
    return target;
}

async function videoCommand(sock, chatId, message) {
    try {
        const messageId = message.key.id;
        if (processedMessages.has(messageId)) return;
        processedMessages.add(messageId);
        setTimeout(() => processedMessages.delete(messageId), 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.replace(/^(فيديو|فيديوه|video)\s*/i, '').trim();
        if (!query) return;

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        const target = await resolveTarget(query, detectPlatform(query));
        if (!target || !target.url) {
            await sock.sendMessage(chatId, { text: '*↢ لم يتم العثور على فيديوهات!*' }, { quoted: message });
            return;
        }

        setPending(senderKey(message), target);
        await sendPreview(sock, chatId, message, target);

    } catch (error) {
        console.error('[VIDEO] خطأ:', error?.message?.substring(0, 150));
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

module.exports = { videoCommand, isWaiting, handleChoice };