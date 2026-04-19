const axios = require('axios');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, { 
            text: '🔍 يرجى إدخال اسم الأغنية للحصول على الكلمات!\n\n*الاستخدام:* كلمات الاغنية <اسم الفنان - اسم الأغنية>\n\n*مثال:* كلمات الاغنية Ed Sheeran - Shape of You'
        }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { 
            text: '🔍 جاري البحث عن كلمات الأغنية...' 
        }, { quoted: message });

        console.log('Searching for lyrics:', songTitle);

        // Parse artist and song from input
        let artist = '';
        let song = songTitle.trim();

        // Check if formatted as "Artist - Song"
        if (songTitle.includes(' - ')) {
            const parts = songTitle.split(' - ');
            artist = parts[0].trim();
            song = parts[1].trim();
        } else {
            // If no artist provided, show helpful message
            await sock.sendMessage(chatId, { 
                text: `⚠️ للحصول على أفضل النتائج، استخدم التنسيق:\n*اسم الفنان - اسم الأغنية*\n\nمثال: Ed Sheeran - Shape of You\n\nأحاول البحث بدون اسم الفنان...`
            }, { quoted: message });
        }

        let lyrics = null;
        let responseTitle = song;
        let responseArtist = artist || 'غير معروف';

        // Try with artist and song if both provided
        if (artist && song) {
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
                        text: `❌ لم يتم العثور على كلمات لـ "${artist} - ${song}"\n\n💡 تأكد من:\n• كتابة اسم الفنان والأغنية بالإنجليزية\n• صحة الإملاء\n• استخدام الأسماء الكاملة والصحيحة\n\n*مثال صحيح:*\nكلمات الاغنية Ed Sheeran - Shape of You`
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, { 
                        text: `⏱️ حدث خطأ في الاتصال بالخدمة. الرجاء المحاولة مرة أخرى.\n\n*الخطأ:* ${error.message}`
                    }, { quoted: message });
                }
                return;
            }
        } else {
            // No artist provided - show error message
            await sock.sendMessage(chatId, { 
                text: `❌ يرجى إدخال اسم الفنان واسم الأغنية بالتنسيق التالي:\n\n*اسم الفنان - اسم الأغنية*\n\n*أمثلة صحيحة:*\n• كلمات الاغنية Ed Sheeran - Shape of You\n• كلمات الاغنية Adele - Hello\n• كلمات الاغنية The Weeknd - Blinding Lights`
            }, { quoted: message });
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