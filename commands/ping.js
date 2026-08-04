const os = require('os');
const settings = require('../settings');

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();
        await sock.sendMessage(chatId, { text: 'بونج!' }, { quoted: message });
        const end = Date.now();
        const ping = Math.round((end - start) / 2);

        const uptimeInSeconds = process.uptime();
        const uptimeFormatted = formatTime(uptimeInSeconds);

        const botInfo = `*┏━━〔 🤖 ${settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭'} 〕━━┓*
*┃ 🚀 السرعة :* ${ping} ms
*┃ ⏱️ وقت التشغيل :* ${uptimeFormatted}
*┃ 🔖 الإصدار :* v${settings.version || '0.0.1'}
*┗━━━━━━━━━━━━━━━┛*`;

        await sock.sendMessage(chatId, { text: botInfo }, { quoted: message });

    } catch (error) {
        console.error('Error in ping command:', error);
        await sock.sendMessage(chatId, { text: '❌ فشل في الحصول على حالة البوت.' });
    }
}

module.exports = pingCommand;
