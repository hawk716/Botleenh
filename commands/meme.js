const { UNDER_MAINTENANCE } = require('../lib/messages');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const MEME_VIDEOS_PATH = path.join(__dirname, '..', 'data', 'meme_videos.json');

function loadMemeVideos() {
    try {
        const data = fs.readFileSync(MEME_VIDEOS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading meme videos:', error);
        return [];
    }
}

async function memeCommand(sock, chatId, message) {
    try {
        const videos = loadMemeVideos();

        if (!videos || videos.length === 0) {
            await sock.sendMessage(chatId, {
                text: '❌ لا توجد مقاطع ميم متاحة حالياً. تواصل مع المالك لإضافة المزيد.'
            }, { quoted: message });
            return;
        }

        // Pick a random video URL (without removing from the list)
        const idx = Math.floor(Math.random() * videos.length);
        const videoUrl = videos[idx];

        // Download video buffer
        const videoRes = await fetch(videoUrl);
        if (!videoRes.ok) {
            throw new Error(`فشل تحميل الفيديو: ${videoRes.status} ${videoRes.statusText}`);
        }
        const videoBuffer = await videoRes.buffer();

        // Send as video
        await sock.sendMessage(chatId, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: '*↢ بــواسـطـة: بوت لين - 𝐋𝐞𝐞𝐧𝐁𝐨𝐭*'
        }, { quoted: message });

    } catch (error) {
        console.error('Error in meme command:', error);
        await sock.sendMessage(chatId, {
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = memeCommand;
