const axios = require('axios');
const cheerio = require('cheerio');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function getEmojiSticker(name) {
    try {
        const userInputs = JSON.stringify({ name });
        const toolID = 'الايموجي-الذي-يمثلك';
        const url = `https://tasleyah.com/apiPages/toolsResult2?userInputs=${encodeURIComponent(userInputs)}&toolID=${encodeURIComponent(toolID)}`;

        const response = await axios.get(url, {
            headers: {
                accept: 'text/html',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const resPage2 = $('#resPage2');
        if (!resPage2.length) {
            throw new Error('لم يتم العثور على نتائج لهذا الاسم.');
        }

        let emojiImgUrl = $('#toolResImg').attr('src') || response.data.match(/id="toolResImg"[^>]*src="([^"]+)"/)?.[1];
        if (!emojiImgUrl) {
            emojiImgUrl = resPage2.attr('data-value') || resPage2.attr('data-names');
        }
        if (!emojiImgUrl) {
            throw new Error('لا توجد نتائج متوفرة حالياً.');
        }

        const imageResponse = await axios.get(emojiImgUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imageResponse.data);

        const stickersDir = path.join(__dirname, 'stickers');
        if (!fs.existsSync(stickersDir)) {
            fs.mkdirSync(stickersDir, { recursive: true });
        }
        const stickerPath = path.join(stickersDir, `${Date.now()}.webp`);

        await sharp(buffer)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ lossless: true })
            .toFile(stickerPath);

        return {
            originalUrl: emojiImgUrl,
            stickerPath,
            status: 'success'
        };
    } catch (error) {
        return {
            status: 'error',
            message: error.message
        };
    }
}

module.exports = async (sock, chatId, message, args) => {
    const text = typeof args === 'string' ? args.trim() : '';
    const name = text || '';

    if (!name) {
        await sock.sendMessage(chatId, { text: `*↢ قـم بارسال ايموجي + الاسم*\n*↢ مثـال: ايموجي محمد*` }, { quoted: message });
        return;
    }

    const result = await getEmojiSticker(name);
    if (result.status === 'success') {
        await sock.sendMessage(chatId, { image: result.stickerPath, caption: `*↢ ${name}، الإيموجي المناسب لك ↞ ${result.originalUrl}*` }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, { text: `*↢ خطأ: ${result.message}*` }, { quoted: message });
    }
};