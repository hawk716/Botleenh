const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const YT_DLP = '/home/runner/workspace/.pythonlibs/bin/yt-dlp';
const processedMessages = new Set();
const MAX_SIZE = 500 * 1024 * 1024;

function run(args, timeout = 180000) {
    return new Promise((resolve, reject) => {
        const child = execFile(YT_DLP, args, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
                const msg = stderr?.split('\n').find(l => l.startsWith('ERROR:')) || err.message;
                reject(new Error(msg?.substring(0, 200)));
            } else {
                resolve(stdout);
            }
        });
    });
}

async function videoCommand(sock, chatId, message) {
    try {
        const messageId = message.key.id;
        if (processedMessages.has(messageId)) return;
        processedMessages.add(messageId);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.replace(/^(فيديو|video)\s*/i, '').trim();
        if (!searchQuery) return;

        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';

        if (searchQuery.includes('instagram.com')) {
            videoUrl = searchQuery;
            try {
                const out = await run(['--dump-json', '--no-download', '--no-warnings', '--socket-timeout', '10', videoUrl], 30000);
                const info = JSON.parse(out);
                videoTitle = info.title || '';
                videoThumbnail = info.thumbnail || '';
            } catch (e) {
                console.log('[VIDEO] Instagram info failed:', e.message?.substring(0, 80));
                videoTitle = 'انستقرام';
            }
        } else if (searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) {
            videoUrl = searchQuery;
            try {
                const out = await run(['--dump-json', '--no-download', '--no-warnings', '--socket-timeout', '10', videoUrl], 30000);
                const info = JSON.parse(out);
                videoTitle = info.title || '';
                videoThumbnail = info.thumbnail || '';
            } catch (e) {
                console.log('[VIDEO] Info failed:', e.message?.substring(0, 80));
                try {
                    const m = searchQuery.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                    if (m) {
                        const s = await yts({ videoId: m[1] });
                        if (s?.videos?.[0]) {
                            videoTitle = s.videos[0].title || '';
                            videoThumbnail = s.videos[0].thumbnail || '';
                        }
                    }
                } catch (_) {}
            }
        } else {
            const search = await yts(searchQuery);
            if (!search?.videos?.length) {
                await sock.sendMessage(chatId, { text: '*↢ لم يتم العثور على فيديوهات!*' }, { quoted: message });
                return;
            }
            videoUrl = search.videos[0].url;
            videoTitle = search.videos[0].title || '';
            videoThumbnail = search.videos[0].thumbnail || '';
        }

        if (!videoUrl) {
            await sock.sendMessage(chatId, { text: '*↢ الفيديو غير متاح.*' }, { quoted: message });
            return;
        }

        const safeTitle = (videoTitle || 'video').replace(/[^\w\s\u0600-\u06FF]/gi, '').trim() || 'video';

        await sock.sendMessage(chatId, {
            image: { url: videoThumbnail || 'https://via.placeholder.com/300' },
            caption: `*↢ جاري تحميل:*\n*${videoTitle || '...'}*\n⏳ الرجاء الانتظار...`
        }, { quoted: message });

        try {
            const tmpDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const ts = Date.now();
            const outPath = path.join(tmpDir, `v_${ts}.%(ext)s`);

            await run([
                '--format', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best',
                '--merge-output-format', 'mp4',
                '--output', outPath, '--no-warnings', '--no-playlist',
                '--socket-timeout', '15',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                videoUrl
            ]);

            const files = fs.readdirSync(tmpDir);
            const found = files.find(f => f.startsWith(`v_${ts}`) && (f.endsWith('.mp4') || f.endsWith('.mkv')));
            if (!found) throw new Error('الملف لم يتم العثور عليه');

            const fp = path.join(tmpDir, found);
            const st = fs.statSync(fp);

            if (st.size > MAX_SIZE) { fs.unlinkSync(fp); throw new Error('الملف كبير جداً'); }
            if (st.size === 0) { fs.unlinkSync(fp); throw new Error('الملف فارغ'); }

            const buf = fs.readFileSync(fp);
            fs.unlinkSync(fp);

            await sock.sendMessage(chatId, {
                video: buf,
                mimetype: 'video/mp4',
                fileName: `${safeTitle}.mp4`,
                caption: `*↢ ${videoTitle || 'فيديو'}*\n\n> *_Leen Bot 🎬_*`
            }, { quoted: message });

            console.log('[VIDEO] ✅ تم الإرسال');

        } catch (dlErr) {
            console.error('[VIDEO] فشل التحميل:', dlErr.message?.substring(0, 150));
            await sock.sendMessage(chatId, {
                text: `*↢ معلومات الفيديو:*\n\n🎬 *${videoTitle || 'فيديو'}*\n\n*↢ الرابط:*\n${videoUrl}`,
            }, { quoted: message });
        }

    } catch (error) {
        console.error('[VIDEO] خطأ:', error?.message?.substring(0, 100));
        await sock.sendMessage(chatId, { text: '*↢ عذراً حدث خطأ.*' }, { quoted: message });
    }
}

module.exports = { videoCommand };
