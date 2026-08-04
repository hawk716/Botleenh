const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
    const aliveMessage = `*↢ بوت ${settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭'} يعمل، ☑️*
*─────────────────────*
*↢ الإصدار:* *0.0.1*
*↢ الحالة:* *متصل*
*↢ الوضع:* *عام*
*↢ المميزات:*
*• إدارة المجموعات*
*• الحماية من الروابط*
*• أوامر ترفيهية*
*• والمزيد*
*• اكتب "الاوامر" لعرض قائمة الاوامر.*`;

    try {
        await sock.sendMessage(chatId, {
            text: aliveMessage,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: settings.newsletterJid || '120363161513685998@newsletter',
                    newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: `*↢ ${settings.packname || 'البوت'} يعمل بنجاح! ☑️*` }, { quoted: message });
    }
}

module.exports = aliveCommand;
