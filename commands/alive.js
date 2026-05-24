const settings = require("../settings");
async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = `*↢ بوت نايت يعمل!*\n\n` +
                        `*↢ الإصدار:* ${settings.version}\n` +
                        `*↢ الحالة:* متصل\n` +
                        `*↢ الوضع:* عام\n\n` +
                        `*↢ المميزات:*\n` +
                        `• إدارة المجموعات\n` +
                        `• الحماية من الروابط\n` +
                        `• أوامر ترفيهية\n` +
                        `• والمزيد!\n\n` +
                        `*↢ اكتب .menu لعرض قائمة الأوامر الكاملة*`;

        await sock.sendMessage(chatId, {
            text: message1,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: '*↢ البوت يعمل بنجاح!' }, { quoted: message });
    }
}

module.exports = aliveCommand;