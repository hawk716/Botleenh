
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

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

async function getIzumiDownloadByUrl(youtubeUrl) {
        const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
        const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
        if (res?.data?.result?.download) return res.data.result;
        throw new Error('Izumi youtube?url returned no download');
}

async function getIzumiDownloadByQuery(query) {
        const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube-play?query=${encodeURIComponent(query)}`;
        const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
        if (res?.data?.result?.download) return res.data.result;
        throw new Error('Izumi youtube-play returned no download');
}

async function getOkatsuDownloadByUrl(youtubeUrl) {
        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
        const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
        if (res?.data?.dl) {
                return {
                        download: res.data.dl,
                        title: res.data.title,
                        thumbnail: res.data.thumb
                };
        }
        throw new Error('Okatsu ytmp3 returned no download');
}

async function songCommand(sock, chatId, message) {
    try {
        // Check if message has already been processed
        if (processedMessages.has(message.key.id)) {
            return;
        }
        
        // Add message ID to processed set
        processedMessages.add(message.key.id);
        
        // Clean up old message IDs after 5 minutes
        setTimeout(() => {
            processedMessages.delete(message.key.id);
        }, 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const searchQuery = text.replace(/^(اغنية|أغنية|song)\s*/i, '').trim();
        
        if (!searchQuery) {
            return;
        }

        let video;
        if (searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) {
            video = { url: searchQuery };
        } else {
            const search = await yts(searchQuery);
            if (!search || !search.videos.length) {
                await sock.sendMessage(chatId, { text: 'لم يتم العثور على نتائج.' }, { quoted: message });
                return;
            }
            video = search.videos[0];
        }

        // Send download info with thumbnail
        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `*➦:𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱 : ${video.title} 🎵*\n*➦:𝘁𝗶𝗺𝗲 : ${video.timestamp} ⏱*`
        }, { quoted: message });

        // Try Izumi primary by URL, then by query, then Okatsu fallback
        let audioData;
        try {
            // 1) Primary: Izumi by youtube url
            audioData = await getIzumiDownloadByUrl(video.url);
        } catch (e1) {
            try {
                // 2) Secondary: Izumi search by query/title
                const query = video.title || text;
                audioData = await getIzumiDownloadByQuery(query);
            } catch (e2) {
                // 3) Fallback: Okatsu by youtube url
                audioData = await getOkatsuDownloadByUrl(video.url);
            }
        }

        // Send audio only ONCE
        const audioUrl = audioData.download || audioData.dl || audioData.url;
        const fileName = `${(audioData.title || video.title || 'song')}.mp3`;
        
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: fileName,
            ptt: false
        }, { quoted: message });

    } catch (err) {
        console.error('Song command error:', err);
        await sock.sendMessage(chatId, { text: '❌ فشل تحميل الأغنية.' }, { quoted: message });
    }
}

module.exports = songCommand;
