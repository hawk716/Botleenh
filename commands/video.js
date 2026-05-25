const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execFile } = require('child_process');
const { igdl } = require('ruhend-scraper');
const { ttdl: ttdlBtch } = require('btch-downloader');

const YT_DLP = '/home/codespace/.python/current/bin/yt-dlp';
const processedMessages = new Set();
const MAX_SIZE = 500 * 1024 * 1024;

function runYtDlp(args, timeout = 180000) {
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

function detectPlatform(url) {
    if (/https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)/i.test(url)) return 'youtube'
    if (/https?:\/\/(www\.|vm\.|vt\.|m\.)?tiktok\.com/i.test(url)) return 'tiktok'
    if (/https?:\/\/(www\.)?instagram\.com/i.test(url)) return 'instagram'
    if (/https?:\/\/(www\.|m\.|fb\.)?facebook\.com/i.test(url)) return 'facebook'
    if (/https?:\/\/(www\.)?(twitter\.com|x\.com)/i.test(url)) return 'twitter'
    if (/https?:\/\/(www\.)?(soundcloud\.com|snd\.sc)/i.test(url)) return 'soundcloud'
    if (/https?:\/\/(www\.)?vimeo\.com/i.test(url)) return 'vimeo'
    if (/https?:\/\/(www\.)?(twitch\.tv|clips\.twitch\.tv)/i.test(url)) return 'twitch'
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

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
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
    } catch(e) {
        // fallback
    }
    return null
}

async function downloadViaYtDlp(url, tmpDir) {
    const ts = Date.now()
    const outPath = path.join(tmpDir, `v_${ts}.%(ext)s`)
    await runYtDlp([
        '--format', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '--output', outPath, '--no-warnings', '--no-playlist',
        '--socket-timeout', '15',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        url
    ])
    const files = fs.readdirSync(tmpDir)
    const found = files.find(f => f.startsWith(`v_${ts}`) && (f.endsWith('.mp4') || f.endsWith('.mkv')))
    if (!found) throw new Error('الملف لم يتم العثور عليه')
    const fp = path.join(tmpDir, found)
    const st = fs.statSync(fp)
    if (st.size > MAX_SIZE) { fs.unlinkSync(fp); throw new Error('الملف كبير جداً') }
    if (st.size === 0) { fs.unlinkSync(fp); throw new Error('الملف فارغ') }
    const buf = fs.readFileSync(fp)
    fs.unlinkSync(fp)
    return buf
}

async function downloadToBuffer(url) {
    const { data } = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    })
    return Buffer.from(data)
}

async function videoCommand(sock, chatId, message) {
    try {
        const messageId = message.key.id;
        if (processedMessages.has(messageId)) return;
        processedMessages.add(messageId);
        setTimeout(() => processedMessages.delete(messageId), 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.replace(/^(فيديو|video)\s*/i, '').trim();
        if (!query) return;

        const platform = detectPlatform(query);
        let videoBuffer = null, videoUrl = null, videoTitle = '', videoThumbnail = '', videoDuration = 0;

        if (platform !== 'unknown') {
            await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

            if (platform === 'tiktok') {
                try {
                    const dl = await ttdlBtch(query)
                    if (dl?.status && dl?.video?.length) {
                        videoTitle = dl.title || ''
                        videoThumbnail = dl.thumbnail || ''
                        videoBuffer = await downloadToBuffer(dl.video[0])
                        // Try to get title from TikTok page if empty
                        if (!videoTitle || videoTitle.trim() === '') {
                            const tikTokTitle = await getTikTokInfo(query)
                            if (tikTokTitle) videoTitle = tikTokTitle
                        }
                        // Try to get duration from yt-dlp
                        const info = await getInfo(query).catch(() => null)
                        if (info?.duration) videoDuration = info.duration
                    } else {
                        throw new Error('btch returned no video')
                    }
                } catch (e) {
                    console.log('[VIDEO] btch-downloader TikTok failed, trying yt-dlp:', e.message?.slice(0, 80))
                    try {
                        const info = await getInfo(query)
                        if (info) { 
                            videoTitle = info.title || ''
                            videoThumbnail = info.thumbnail || ''
                            videoDuration = info.duration || 0
                        }
                        const tmpDir = path.join(__dirname, '../temp')
                        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
                        videoBuffer = await downloadViaYtDlp(query, tmpDir)
                    } catch (e2) {
                        console.log('[VIDEO] yt-dlp TikTok also failed:', e2.message?.slice(0, 80))
                        throw e
                    }
                }
            } else if (platform === 'instagram') {
                try {
                    const info = await getInfo(query)
                    if (info) { 
                        videoTitle = info.title || ''
                        videoThumbnail = info.thumbnail || ''
                        videoDuration = info.duration || 0
                    }
                    const tmpDir = path.join(__dirname, '../temp')
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
                    videoBuffer = await downloadViaYtDlp(query, tmpDir)
                } catch (e) {
                    console.log('[VIDEO] yt-dlp Instagram failed, trying ruhend-scraper:', e.message?.slice(0, 80))
                    const dl = await igdl(query)
                    if (dl?.data?.length) {
                        const v = dl.data.find(m => m.type === 'video' || /\.mp4/i.test(m.url))
                        if (v) videoUrl = v.url
                    }
                }
            } else if (platform === 'youtube') {
                const info = await getInfo(query)
                if (info) { 
                    videoTitle = info.title || ''
                    videoThumbnail = info.thumbnail || ''
                    videoDuration = info.duration || 0
                }
                try {
                    const tmpDir = path.join(__dirname, '../temp')
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
                    videoBuffer = await downloadViaYtDlp(query, tmpDir)
                } catch (e) {
                    console.log('[VIDEO] yt-dlp YouTube blocked, trying API:', e.message?.slice(0, 80))
                    const { data } = await axios.get(
                        `https://api.princetechn.com/api/download/ytdl?apikey=prince&url=${encodeURIComponent(query)}`,
                        { timeout: 30000 }
                    )
                    if (data?.status === 200 && data?.success && data?.result?.video_url) {
                        videoUrl = data.result.video_url
                        videoTitle = data.result.title || videoTitle
                    } else {
                        throw new Error('فشل تحميل فيديو يوتيوب')
                    }
                }
            } else {
                const info = await getInfo(query)
                if (info) { 
                    videoTitle = info.title || ''
                    videoThumbnail = info.thumbnail || ''
                    videoDuration = info.duration || 0
                }
                const tmpDir = path.join(__dirname, '../temp')
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
                videoBuffer = await downloadViaYtDlp(query, tmpDir)
            }

            if (videoBuffer) {
                const safeTitle = videoTitle.replace(/[^\w\s\u0600-\u06FF]/gi, '').trim() || 'فيديو'
                const duration = videoDuration ? formatDuration(videoDuration) : ''
                const caption = `*${videoTitle || 'فيديو'}*${duration ? `\n> *_${duration}_*` : ''}`
                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    fileName: `${safeTitle}.mp4`,
                    caption: caption,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363161513685998@newsletter',
                            newsletterName: 'KnightBot MD',
                            serverMessageId: -1
                        }
                    }
                }, { quoted: message })
            } else if (videoUrl) {
                const duration = videoDuration ? formatDuration(videoDuration) : ''
                const caption = `*${videoTitle || 'فيديو'}*${duration ? `\n> *_${duration}_*` : ''}`
                await sock.sendMessage(chatId, {
                    video: { url: videoUrl },
                    mimetype: 'video/mp4',
                    caption: caption,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363161513685998@newsletter',
                            newsletterName: 'KnightBot MD',
                            serverMessageId: -1
                        }
                    }
                }, { quoted: message })
            } else {
                await sock.sendMessage(chatId, {
                    text: '*↢ فشل تحميل الفيديو من هذا الرابط.*'
                }, { quoted: message })
            }
            return
        }

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        const search = await yts(query)
        if (!search?.videos?.length) {
            await sock.sendMessage(chatId, { text: '*↢ لم يتم العثور على فيديوهات!*' }, { quoted: message })
            return
        }

        const video = search.videos[0]
        videoTitle = video.title || ''
        videoThumbnail = video.thumbnail || ''

        await sock.sendMessage(chatId, {
            image: { url: videoThumbnail || 'https://via.placeholder.com/300' },
            caption: `*↢ جاري تحميل:*\n*${videoTitle || '...'}*\n⏳ الرجاء الانتظار...`
        }, { quoted: message })

        try {
            const info = await getInfo(video.url)
            if (info) { 
                videoTitle = info.title || videoTitle
                videoThumbnail = info.thumbnail || videoThumbnail
                videoDuration = info.duration || 0
            }
            const tmpDir = path.join(__dirname, '../temp')
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
            videoBuffer = await downloadViaYtDlp(video.url, tmpDir)
            const safeTitle = videoTitle.replace(/[^\w\s\u0600-\u06FF]/gi, '').trim() || 'فيديو'
            const duration = videoDuration ? formatDuration(videoDuration) : ''
            const caption = `*${videoTitle}*${duration ? `\n> *_${duration}_*` : ''}`
            await sock.sendMessage(chatId, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                fileName: `${safeTitle}.mp4`,
                caption: caption,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363161513685998@newsletter',
                        newsletterName: 'KnightBot MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message })
        } catch (e) {
            console.log('[VIDEO] yt-dlp YouTube blocked for search result, trying API:', e.message?.slice(0, 80))
            const { data } = await axios.get(
                `https://api.princetechn.com/api/download/ytdl?apikey=prince&url=${encodeURIComponent(video.url)}`,
                { timeout: 30000 }
            )
            if (data?.status === 200 && data?.success && data?.result?.video_url) {
                const duration = videoDuration ? formatDuration(videoDuration) : ''
                const caption = `*${videoTitle}*${duration ? `\n> *_${duration}_*` : ''}`
                await sock.sendMessage(chatId, {
                    video: { url: data.result.video_url },
                    mimetype: 'video/mp4',
                    caption: caption,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363161513685998@newsletter',
                            newsletterName: 'KnightBot MD',
                            serverMessageId: -1
                        }
                    }
                }, { quoted: message })
            } else {
                throw new Error('فشل تحميل فيديو يوتيوب')
            }
        }

    } catch (error) {
        console.error('[VIDEO] خطأ:', error?.message?.substring(0, 150))
        await sock.sendMessage(chatId, { text: '*↢ عذراً حدث خطأ.*' }, { quoted: message })
    }
}

module.exports = { videoCommand };
