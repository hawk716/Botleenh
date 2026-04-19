const axios = require('axios');
const yts = require('yt-search');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

// Izumi API configuration
const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

async function getIzumiVideoByUrl(youtubeUrl) {
    const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=720`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result; // { download, title, ... }
    throw new Error('Izumi video api returned no download');
}

async function getOkatsuVideoByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    // shape: { status, creator, url, result: { status, title, mp4 } }
    if (res?.data?.result?.mp4) {
        return { download: res.data.result.mp4, title: res.data.result.title };
    }
    throw new Error('Okatsu ytmp4 returned no mp4');
}

async function videoCommand(sock, chatId, message) {
    try {
        const messageId = message.key.id;
        if (processedMessages.has(messageId)) {
            return; // Already processed this message
        }
        processedMessages.add(messageId);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.replace(/^(فيديو|video)\s*/i, '').trim();

        if (!searchQuery) {
            return;
        }

        // Determine if input is a YouTube link
        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';
        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            videoUrl = searchQuery;
        } else {
            // Search YouTube for the video
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, { text: 'لم يتم العثور على فيديوهات!' }, { quoted: message });
                return;
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
        }

        // Send thumbnail immediately
        try {
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            const thumb = videoThumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : undefined);
            const captionTitle = videoTitle || searchQuery;
            if (thumb) {
                await sock.sendMessage(chatId, {
                    image: { url: thumb },
                    caption: `*${captionTitle}*\nجاري التحميل...`
                }, { quoted: message });
            }
        } catch (e) { console.error('[VIDEO] thumb error:', e?.message || e); }


        // Validate YouTube URL
        let urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!urls) {
            await sock.sendMessage(chatId, { text: 'هذا ليس رابط يوتيوب صحيح!' }, { quoted: message });
            return;
        }

        // Get video: try Izumi first, then Okatsu fallback
        let videoData;
        try {
            videoData = await getIzumiVideoByUrl(videoUrl);
        } catch (e1) {
            videoData = await getOkatsuVideoByUrl(videoUrl);
        }

        // Send video directly using the download URL - ONCE ONLY
        const videoFileName = `${videoData.title || videoTitle || 'video'}.mp4`;
        const videoCaption = `*${videoData.title || videoTitle || 'Video'}*\n\n> *_تم التحميل بواسطة Knight Bot MD_*`;
        
        await sock.sendMessage(chatId, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: videoFileName,
            caption: videoCaption
        }, { quoted: message });

    } catch (error) {
        console.error('[VIDEO] Command Error:', error?.message || error);
        await sock.sendMessage(chatId, { text: 'فشل التحميل: ' + (error?.message || 'Unknown error') }, { quoted: message });
    }
}

async function songCommand(sock, chatId, message) {
    try {
        const messageId = message.key.id;
        if (processedMessages.has(messageId)) {
            return; // Already processed this message
        }
        processedMessages.add(messageId);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.replace(/^(اغنية|song)\s*/i, '').trim();

        if (!searchQuery) {
            return;
        }

        // Determine if input is a YouTube link
        let youtubeUrl = '';
        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            youtubeUrl = searchQuery;
        } else {
            // Search YouTube for the song
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, { text: 'لم يتم العثور على أغنية!' }, { quoted: message });
                return;
            }
            youtubeUrl = videos[0].url;
        }

        // Validate YouTube URL
        let urls = youtubeUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!urls) {
            await sock.sendMessage(chatId, { text: 'هذا ليس رابط يوتيوب صحيح!' }, { quoted: message });
            return;
        }

        // Use Izumi API for song download
        const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
        const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));

        if (res?.data?.result?.download) {
            const audioUrl = res.data.result.download;
            const audioTitle = res.data.title || searchQuery;
            const audioDuration = res.data.duration || '0:00'; // Assuming duration is available, otherwise default to 0:00

            // Format the response message
            const formattedMessage = `*➦:𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱 : ${audioTitle} 🎵*\n*➦:𝘁𝗶𝗺𝗲 : ${audioDuration} ⏱*`;

            await sock.sendMessage(chatId, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: true, // Play as voice message
                fileName: `${audioTitle}.mp3`,
                caption: formattedMessage
            }, { quoted: message });
        } else {
            throw new Error('Izumi song api returned no download');
        }

    } catch (error) {
        console.error('[SONG] Command Error:', error?.message || error);
        await sock.sendMessage(chatId, { text: 'فشل التحميل: ' + (error?.message || 'Unknown error') }, { quoted: message });
    } finally {
        // Clean up processedMessages if memory becomes an issue.
    }
}


async function instagramStoryCommand(sock, chatId, message) {
    try {
        const messageId = message.key.id;
        if (processedMessages.has(messageId)) {
            return; // Already processed this message
        }
        processedMessages.add(messageId);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const commandAndUrl = text.split(' ');
        const command = commandAndUrl[0].toLowerCase();
        const url = commandAndUrl[1];

        if (!url) {
            await sock.sendMessage(chatId, { text: 'الرجاء إدخال رابط انستقرام.' }, { quoted: message });
            return;
        }

        // Check if the URL is valid Instagram URL
        if (!url.match(/https?:\/\/(www\.|instagram\.com)/)) {
            await sock.sendMessage(chatId, { text: 'هذا ليس رابط انستقرام صحيح!' }, { quoted: message });
            return;
        }

        // Use a placeholder API for demonstration. Replace with actual Instagram downloader API.
        // Example: using a hypothetical API that returns download links.
        const dummyApiUrl = `https://api.example.com/instagram/story?url=${encodeURIComponent(url)}`;

        // Replace with actual API call
        // const res = await tryRequest(() => axios.get(dummyApiUrl, AXIOS_DEFAULTS));
        // const downloadUrl = res.data.downloadUrl; // Assuming the API returns a 'downloadUrl' field

        // For now, simulate a response
        let downloadUrl = '';
        let mediaType = ''; // 'video' or 'image'

        if (url.includes('/reel/')) {
            mediaType = 'video';
            // Simulate a video download URL
            downloadUrl = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny.mp4';
        } else {
            mediaType = 'image';
            // Simulate an image download URL
            downloadUrl = 'https://picsum.photos/seed/picsum/200/300';
        }


        const responseMessage = `*➦:𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱 : ${url} 🎵*\n*➦:𝘁𝗶𝗺𝗲 : 0:00 ⏱*`; // Placeholder for time

        if (mediaType === 'video') {
            await sock.sendMessage(chatId, {
                video: { url: downloadUrl },
                caption: responseMessage,
                mimetype: 'video/mp4'
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                image: { url: downloadUrl },
                caption: responseMessage
            }, { quoted: message });
        }


    } catch (error) {
        console.error('[INSTAGRAM STORY] Command Error:', error?.message || error);
        await sock.sendMessage(chatId, { text: 'فشل التحميل: ' + (error?.message || 'Unknown error') }, { quoted: message });
    } finally {
        // Clean up processedMessages if memory becomes an issue.
    }
}


module.exports = {
    videoCommand,
    songCommand,
    instagramStoryCommand
};