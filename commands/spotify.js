const axios = require('axios');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

async function spotifyCommand(sock, chatId, message) {
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
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        const used = (rawText || '').split(/\s+/)[0] || '.spotify';
        const query = rawText.slice(used.length).trim();

        if (!query) {
            await sock.sendMessage(chatId, { 
                text: '*الاسـتخـدام: سبوتيفاي أغنية/فنان/كلمات*\n*↢مـثـال: سبوتيفاي بتمنى انساك*\n*مـلاحظـة: لا يلزم تطابق البحث ١٠٠٪، اكتفي بكتابة كلمة من الأغنية أو اسم المغني.*' 
            }, { quoted: message });
            return;
        }

        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/search/spotify?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000, headers: { 'user-agent': 'Mozilla/5.0' } });

        if (!data?.status || !data?.result) {
            throw new Error('No result from Spotify API');
        }

        const r = data.result;
        const audioUrl = r.audio;
        if (!audioUrl) {
            await sock.sendMessage(chatId, { text: 'لم يتم العثور على صوت قابل للتحميل لهذا البحث.' }, { quoted: message });
            return;
        }

        const caption = `*Music➦ ${r.title || r.name || 'عنوان غير معروف'}*\n*Singer➦ ${r.artist || ''}*\n*time➦ ${r.duration || ''}*\n*link➦ ${r.url || ''}*`.trim();

         // Send cover and info as a follow-up (optional)
         if (r.thumbnails) {
            await sock.sendMessage(chatId, { image: { url: r.thumbnails }, caption }, { quoted: message });
        } else if (caption) {
            await sock.sendMessage(chatId, { text: caption }, { quoted: message });
        }
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${(r.title || r.name || 'track').replace(/[\\/:*?"<>|]/g, '')}.mp3`
        }, { quoted: message });

       

    } catch (error) {
        console.error('[SPOTIFY] error:', error?.message || error);
        await sock.sendMessage(chatId, { text: 'فشل تحميل صوت سبوتيفاي. جرب بحثاً آخر لاحقاً.' }, { quoted: message });
    }
}

module.exports = spotifyCommand;
