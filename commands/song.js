const { UNDER_MAINTENANCE } = require('../lib/messages');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execFile } = require('child_process');
const { igdl } = require('ruhend-scraper');
const { ttdl: ttdlBtch } = require('btch-downloader');
const settings = require('../settings');

const YT_DLP = '/home/codespace/.python/current/bin/yt-dlp';
const processedMessages = new Set();
const MAX_SIZE = 100 * 1024 * 1024;

function runYtDlp(args, timeout = 120000) {
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
    return 'unknown'
}

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

async function downloadAudioViaYtDlp(url, tmpDir) {
    const ts = Date.now()
    const outPath = path.join(tmpDir, `s_${ts}.%(ext)s`)
    await runYtDlp([
        '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0',
        '--output', outPath, '--no-warnings', '--no-playlist',
        '--socket-timeout', '15', '--format', 'bestaudio/best',
        url
    ])
    const files = fs.readdirSync(tmpDir)
    const found = files.find(f => f.startsWith(`s_${ts}`) && (f.endsWith('.mp3') || f.endsWith('.m4a')))
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
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebIK/537.36' }
    })
    return Buffer.from(data)
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
    } catch(e) {}
    return null
}

async function songCommand(sock, chatId, message) {
    try {
        if (processedMessages.has(message.key.id)) return;
        processedMessages.add(message.key.id);
        setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.replace(/^(اغنية|أغنية|song)\s*/i, '').trim();
        if (!query) return;

        const platform = detectPlatform(query);
        let audioBuffer = null, audioUrl = null, audioTitle = '', audioArtist = '', audioThumbnail = '', audioDuration = 0;

        if (platform !== 'unknown') {
            await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

            if (platform === 'tiktok') {
                try {
                    const dl = await ttdlBtch(query)
                    if (dl?.status) {
                        if (dl.audio?.length) {
                            audioBuffer = await downloadToBuffer(dl.audio[0])
                            audioTitle = dl.title_audio || dl.title || ''
                        } else if (dl.video?.length) {
                            audioBuffer = await downloadToBuffer(dl.video[0])
                            audioTitle = dl.title || ''
                        } else {
                            throw new Error('btch returned no media')
                        }
                        audioThumbnail = dl.thumbnail || ''
                        // Try to get title from TikTok page if empty
                        if (!audioTitle || audioTitle.trim() === '') {
                            const tikTokTitle = await getTikTokInfo(query)
                            if (tikTokTitle) audioTitle = tikTokTitle
                        }
                        // Try to get duration from yt-dlp
                        const info = await new Promise((res) => {
                            execFile(YT_DLP, ['--dump-json', '--no-download', '--no-warnings', '--socket-timeout', '15', query], { timeout: 30000 }, (err, stdout) => {
                                if (err) res(null); else res(JSON.parse(stdout))
                            })
                        })
                        if (info?.duration) {
                            audioDuration = info.duration
                        }
                    } else {
                        throw new Error('btch failed')
                    }
                } catch (e) {
                    console.log('[SONG] btch TikTok failed, trying yt-dlp:', e.message?.slice(0, 80))
                    try {
                        const info = await new Promise((res, rej) => {
                            execFile(YT_DLP, ['--dump-json', '--no-download', '--no-warnings', '--socket-timeout', '15', query], { timeout: 30000 }, (err, stdout) => {
                                if (err) rej(err); else res(JSON.parse(stdout))
                            })
                        })
                        audioTitle = info.title || ''
                        audioArtist = info.author || info.artist || info.uploader || ''
                        audioThumbnail = info.thumbnail || ''
                        audioDuration = info.duration || 0
                        const tmpDir = path.join(__dirname, '../temp')
                        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
                        audioBuffer = await downloadAudioViaYtDlp(query, tmpDir)
                    } catch (e2) {
                        console.log('[SONG] yt-dlp TikTok also failed:', e2.message?.slice(0, 80))
                        throw e
                    }
                }
            } else if (platform === 'instagram') {
                try {
                    const info = await new Promise((res, rej) => {
                        execFile(YT_DLP, ['--dump-json', '--no-download', '--no-warnings', '--socket-timeout', '15', query], { timeout: 30000 }, (err, stdout) => {
                            if (err) rej(err); else res(JSON.parse(stdout))
                        })
                    })
                    audioTitle = info.title || ''
                    audioArtist = info.author || info.artist || info.uploader || ''
                    audioThumbnail = info.thumbnail || ''
                    audioDuration = info.duration || 0
                    const tmpDir = path.join(__dirname, '../temp')
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
                    audioBuffer = await downloadAudioViaYtDlp(query, tmpDir)
                } catch (e) {
                    console.log('[SONG] yt-dlp Instagram failed, trying ruhend-scraper:', e.message?.slice(0, 80))
                    const dl = await igdl(query)
                    if (dl?.data?.length) {
                        const v = dl.data.find(m => /\.mp4/i.test(m.url))
                        if (v) audioUrl = v.url
                    }
                }
            } else if (platform === 'youtube') {
                try {
                    const info = await new Promise((res, rej) => {
                        execFile(YT_DLP, ['--dump-json', '--no-download', '--no-warnings', '--socket-timeout', '15', query], { timeout: 30000 }, (err, stdout) => {
                            if (err) rej(err); else res(JSON.parse(stdout))
                        })
                    })
                    audioTitle = info.title || ''
                    audioArtist = info.author || info.artist || info.uploader || ''
                    audioThumbnail = info.thumbnail || ''
                    audioDuration = info.duration || 0
                    const tmpDir = path.join(__dirname, '../temp')
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
                    audioBuffer = await downloadAudioViaYtDlp(query, tmpDir)
                } catch (e) {
                    console.log('[SONG] yt-dlp YouTube failed, trying API:', e.message?.slice(0, 80))
                    const { data } = await axios.get(
                        `https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=${encodeURIComponent(query)}`,
                        { timeout: 30000 }
                    )
                    if (data?.status === 200 && data?.success && data?.result?.download_url) {
                        audioUrl = data.result.download_url
                        audioTitle = data.result.title || audioTitle
                    } else {
                        throw new Error('فشل تحميل الصوت')
                    }
                }
            } else {
                try {
                    const info = await new Promise((res, rej) => {
                        execFile(YT_DLP, ['--dump-json', '--no-download', '--no-warnings', '--socket-timeout', '15', query], { timeout: 30000 }, (err, stdout) => {
                            if (err) rej(err); else res(JSON.parse(stdout))
                        })
                    })
                    audioTitle = info.title || ''
                    audioArtist = info.author || info.artist || info.uploader || ''
                    audioThumbnail = info.thumbnail || ''
                    audioDuration = info.duration || 0
                    const tmpDir = path.join(__dirname, '../temp')
                    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
                    audioBuffer = await downloadAudioViaYtDlp(query, tmpDir)
                } catch (e) {
                    console.log('[SONG] yt-dlp failed:', e.message?.slice(0, 80))
                    throw e
                }
            }

            if (audioThumbnail) {
                await sock.sendMessage(chatId, {
                    image: { url: audioThumbnail },
                    caption: `*↢ جاري تحميل:*\n${audioTitle ? `*${audioTitle}*\n` : ''}⏳ الرجاء الانتظار...`
                }, { quoted: message })
            }

            if (audioBuffer) {
                const safeTitle = (audioTitle || 'صوت').replace(/[^\w\s\u0600-\u06FF]/gi, '').trim() || 'صوت'
                const duration = audioDuration ? formatDuration(audioDuration) : ''
                const artist = audioArtist || ''
                const caption = `*الاغنيه: ${audioTitle || 'صوت'} 🎵*\n*الفنان: ${artist || 'غير معروف'} 🎤*\n━━━━━━━━━━━━━━━━━━\n${duration ? `> *_${duration}_*\n` : ''}━━━━━━━━━━━━━━━━━━\n*بواسطة: 𝐋𝐞𝐞𝐧𝐁𝐨𝐭*`
                await sock.sendMessage(chatId, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    fileName: `${safeTitle}.mp3`,
                    ptt: false,
                    caption: caption,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: settings.newsletterJid || '120363400425238128@newsletter',
                            newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
                            serverMessageId: -1
                        }
                    }
                }, { quoted: message })
            } else if (audioUrl) {
                const duration = audioDuration ? formatDuration(audioDuration) : ''
                const artist = audioArtist || ''
                const caption = `*الاغنيه: ${audioTitle || 'صوت'} 🎵*\n*الفنان: ${artist || 'غير معروف'} 🎤*\n━━━━━━━━━━━━━━━━━━\n${duration ? `> *_${duration}_*\n` : ''}━━━━━━━━━━━━━━━━━━\n*بواسطة: 𝐋𝐞𝐞𝐧𝐁𝐨𝐭*`
                await sock.sendMessage(chatId, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    caption: caption,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: settings.newsletterJid || '120363400425238128@newsletter',
                            newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
                            serverMessageId: -1
                        }
                    }
                }, { quoted: message })
            } else {
                await sock.sendMessage(chatId, {
                    text: '*↢ لا يمكن استخراج الصوت من هذا الرابط.*'
                }, { quoted: message })
            }
            return
        }

        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        const search = await yts(query)
        if (!search?.videos?.length) {
            await sock.sendMessage(chatId, { text: '*↢ لم يتم العثور على نتائج.*' }, { quoted: message })
            return
        }

        const video = search.videos[0]
        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail || 'https://via.placeholder.com/300' },
            caption: `*↢ جاري تحميل:*\n*${video.title || '...'}*\n⏳ الرجاء الانتظار...`
        }, { quoted: message })

        try {
            const info = await new Promise((res, rej) => {
                execFile(YT_DLP, ['--dump-json', '--no-download', '--no-warnings', '--socket-timeout', '15', video.url], { timeout: 30000 }, (err, stdout) => {
                    if (err) rej(err); else res(JSON.parse(stdout))
                })
            })
            const audioTitle = info.title || video.title || ''
            const audioThumbnail = info.thumbnail || video.thumbnail || ''
            const audioDuration = info.duration || 0
            const tmpDir = path.join(__dirname, '../temp')
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
            audioBuffer = await downloadAudioViaYtDlp(video.url, tmpDir)
            const safeTitle = (audioTitle || 'صوت').replace(/[^\w\s\u0600-\u06FF]/gi, '').trim() || 'صوت'
            const duration = audioDuration ? formatDuration(audioDuration) : ''
            const caption = audioTitle ? `*${audioTitle}*${duration ? `\n> *_${duration}_*` : ''}` : ''
            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${safeTitle}.mp3`,
                ptt: false,
                caption: caption,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: settings.newsletterJid || '120363400425238128@newsletter',
                        newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message })
        } catch (e) {
            console.log('[SONG] yt-dlp YouTube blocked, trying API:', e.message?.slice(0, 80))
            const { data } = await axios.get(
                `https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=${encodeURIComponent(video.url)}`,
                { timeout: 30000 }
            )
            if (data?.status === 200 && data?.success && data?.result?.download_url) {
                const duration = 0
                let caption = data.result.title || video.title || 'صوت'
                if (duration) caption += `\n> *_${formatDuration(duration)}_*`
                await sock.sendMessage(chatId, {
                    audio: { url: data.result.download_url },
                    mimetype: 'audio/mpeg',
                    fileName: `${(caption || 'صوت').replace(/[\\/:*?"<>|]/g, '')}.mp3`,
                    ptt: false,
                    caption: caption,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: settings.newsletterJid || '120363400425238128@newsletter',
                            newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
                            serverMessageId: -1
                        }
                    }
                }, { quoted: message })
            } else {
                throw new Error('فشل تحميل الصوت')
            }
        }

    } catch (err) {
        console.error('[SONG] خطأ:', err.message?.substring(0, 100))
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message })
    }
}

module.exports = songCommand;
