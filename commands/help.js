const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `*أهــلاً بــك عــزيــزي فــي قــائمــة الاوامــر، 👋😌*
━━━━━━━━━━━━━
*◂ م➊ : اوامـر الادمـنيه*
*◂ م➋ : اوامـر الاعدادات*
*◂ م➌ : اوامـر القفل - الفتح*
*◂ م➍ : اوامـر التسـليه - الالعاب*
*◂ م❻ : اوامـر الخـدمـيه*
*◂ م➎ : اوامـر المـطـور*
━━━━━━━━━━━━━
*أكــتب رقم القائمـه لعرض اوامـرها.*
*مـثال: \`م1\`*`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: settings.newsletterJid || '120363161513685998@newsletter',
                        newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: settings.newsletterJid || '120363161513685998@newsletter',
                        newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
    }
}

module.exports = helpCommand;
