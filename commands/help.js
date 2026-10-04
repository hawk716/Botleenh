const settings = require('../settings');
const axios = require('axios');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `*أهــلاً بــك عــزيــزي فــي قــائمــة الاوامــر، 👋😌*
━━━━━━━━━━━━━━━━━
*◂ م➊ : اوامـر الادمـنيه*
*◂ م➋ : اوامـر الاعدادات*
*◂ م➌ : اوامـر القفل - الفتح*
*◂ م➍ : اوامـر التسـليه - الالعاب*
*◂ م➎ : اوامـر الخـدمـيه*
*◂ م❻ : اوامـر المـطـور*
━━━━━━━━━━━━━━━━━
*أكــتب رقم القائمـه لعرض اوامـرها.*
*مـثال: \`م1\`*`;

    try {
        const imageUrl = 'https://f2link-c26fb2b9dfa6.herokuapp.com/f/0eb8521283b97ca59f24/Thunder%20File%20To%20Link_20260928154738.jpg';
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        const imageBuffer = Buffer.from(imageResponse.data);

        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: helpMessage,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: settings.newsletterJid || settings.newsletterJid || '120363400425238128@newsletter',
                    newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
    }
}

module.exports = helpCommand;
