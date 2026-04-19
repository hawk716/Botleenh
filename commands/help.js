
const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `‌‌‏*أهلاً بك عزيزي في قائمة الاوامر:* 
━━━━━━━━━━━━
◂ م➊ : *اوامر الادمنيه*
◂ م➋ : *اوامر الاعدادات*
◂ م➌ : *اوامر القفل والفتح*
◂ م➍ : *الاوامر الخدميه*
◂ م➎ : *اوامر المطور*
━━━━━━━━━━━━
اكتب رقم القائمة للحصول على الأوامر،
 مثال: \`م1\` او \`1\``;

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
                        newsletterJid: '120363161513685998@newsletter',
                        newsletterName: 'KnightBot MD',
                        serverMessageId: -1
                    }
                }
            },{ quoted: message });
        } else {
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363161513685998@newsletter',
                        newsletterName: 'KnightBot MD',
                        serverMessageId: -1
                    } 
                }
            },{ quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage },{ quoted: message });
    }
}

module.exports = helpCommand;
