const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const YT_DLP = '/home/runner/workspace/.pythonlibs/bin/yt-dlp';
const processedMessages = new Set();
const MAX_SIZE = 100 * 1024 * 1024;

function run(args, timeout = 120000) {
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

async function songCommand(sock, chatId, message) {
    try {
        if (processedMessages.has(message.key.id)) return;
        processedMessages.add(message.key.id);
        setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const searchQuery = text.replace(/^(اغنية|أغنية|song)\s*/i, '').trim();
        if (!searchQuery) return;

        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';

        if (searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) {
            videoUrl = searchQuery;
            try {
                const out = await run(['--dump-json', '--no-download', '--no-warnings', '--socket-timeout', '10', videoUrl], 30000);
                const info = JSON.parse(out);
                videoTitle = info.title || '';
                videoThumbnail = info.thumbnail || '';
            } catch (e) {
                console.log('[SONG] Info fetch failed:', e.message?.substring(0, 80));
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
                await sock.sendMessage(chatId, { text: '*↢ لم يتم العثور على نتائج.*' }, { quoted: message });
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

        const safeTitle = (videoTitle || 'audio').replace(/[^\w\s\u0600-\u06FF]/gi, '').trim() || 'audio';

        await sock.sendMessage(chatId, {
            image: { url: videoThumbnail || 'https://via.placeholder.com/300' },
            caption: `*↢ جاري تحميل:*\n*${videoTitle || '...'}*\n⏳ الرجاء الانتظار...`
        }, { quoted: message });

        try {
            const tmpDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const ts = Date.now();
            const outPath = path.join(tmpDir, `s_${ts}.%(ext)s`);

            await run([
                '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0',
                '--output', outPath, '--no-warnings', '--no-playlist',
                '--socket-timeout', '15', '--format', 'bestaudio/best',
                videoUrl
            ]);

            const files = fs.readdirSync(tmpDir);
            const found = files.find(f => f.startsWith(`s_${ts}`) && (f.endsWith('.mp3') || f.endsWith('.m4a')));
            if (!found) throw new Error('الملف لم يتم العثور عليه');

            const fp = path.join(tmpDir, found);
            const st = fs.statSync(fp);

            if (st.size > MAX_SIZE) { fs.unlinkSync(fp); throw new Error('الملف كبير جداً'); }
            if (st.size === 0) { fs.unlinkSync(fp); throw new Error('الملف فارغ'); }

            const buf = fs.readFileSync(fp);
            fs.unlinkSync(fp);

            await sock.sendMessage(chatId, {
                audio: buf,
                mimetype: 'audio/mpeg',
                fileName: `${safeTitle}.mp3`,
                ptt: false
            }, { quoted: message });

            console.log('[SONG] ✅ تم الإرسال');

        } catch (dlErr) {
            console.error('[SONG] فشل التحميل:', dlErr.message?.substring(0, 150));
            await sock.sendMessage(chatId, {
                text: `*↢ معلومات الأغنية:*\n\n🎵 *${videoTitle || 'فيديو'}*\n\n*↢ الرابط:*\n${videoUrl}`,
            }, { quoted: message });
        }

    } catch (err) {
        console.error('[SONG] خطأ:', err.message?.substring(0, 100));
        await sock.sendMessage(chatId, { text: '*↢ عذراً حدث خطأ.*' }, { quoted: message });
    }
}

module.exports = songCommand;
