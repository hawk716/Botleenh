const { UNDER_MAINTENANCE } = require('../lib/messages');
const axios = require('axios');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, {
            text: 'قم بارسال اسم الاغنيه، او اسم الفنان - اسم الأغنيه\n\n*↢ لارسال لارسـال كلمـاتها*'
        }, { quoted: message });
        return;
    }

    try {
        console.log('Searching for lyrics:', songTitle);

        let artist = '';
        let song = songTitle.trim();

        if (songTitle.includes(' - ')) {
            const parts = songTitle.split(' - ');
            artist = parts[0].trim();
            song = parts[1].trim();
        }

        if (!artist) {
            await sock.sendMessage(chatId, {
            text: '*↢قم بارسال اسم الفنان - اسم الأغنيه*\n*↢ لارسال كلمـاتها*'
            }, { quoted: message });
            return;
        }

        let lyrics = null;
        let responseTitle = song;
        let responseArtist = artist;

        try {
            console.log(`Trying lyrics.ovh with artist: "${artist}" and song: "${song}"`);

            const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
            console.log('API URL:', url);

            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            console.log('API Response status:', response.status);

            if (response.data && response.data.lyrics) {
                lyrics = response.data.lyrics;
                responseTitle = song;
                responseArtist = artist;
                console.log('Lyrics found successfully!');
            }
        } catch (error) {
            console.log('lyrics.ovh error:', error.response?.status || error.message);

            if (error.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: '*↢ لم يتم العثور على كلمات الأغنيه تأكد من اسم الاغنيه واسم الفنان*'
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: UNDER_MAINTENANCE
                }, { quoted: message });
            }
            return;
        }

        if (!lyrics) {
            await sock.sendMessage(chatId, {
                text: `❌ لم يتم العثور على كلمات.\n\nتأكد من استخدام التنسيق الصحيح:\n*اسم الفنان - اسم الأغنية*`
            }, { quoted: message });
            return;
        }

        // Clean and format lyrics
        lyrics = lyrics.trim();

        // Limit length to WhatsApp message limit
        const maxChars = 4000;
        let output = lyrics;

        if (lyrics.length > maxChars) {
            output = lyrics.slice(0, maxChars - 100) + '\n\n... _(تم اختصار الكلمات بسبب الطول الزائد)_';
        }

        // Send the result
        await sock.sendMessage(chatId, { 
            text: `🎵 *${responseTitle}*\n👤 الفنان: *${responseArtist}*\n\n━━━━━━━━━━━━━━━━━━\n\n${output}\n\n━━━━━━━━━━━━━━━━━━\n_تم جلب الكلمات بواسطة Knight Bot 🤖_`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in lyrics command:', error.message);

        let errorMessage = '❌ عذراً، حدث خطأ غير متوقع. حاول مرة أخرى.';

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage = '⏱️ انتهت مهلة الاتصال. الرجاء المحاولة مرة أخرى بعد قليل.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = '🌐 لا يوجد اتصال بالإنترنت. تحقق من الاتصال وحاول مرة أخرى.';
        }

        await sock.sendMessage(chatId, { 
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = { lyricsCommand };