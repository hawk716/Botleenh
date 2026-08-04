const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPTS_DIR = path.join(__dirname, '..', 'scripts');
const PYTHON_SCRIPT = path.join(SCRIPTS_DIR, 'screenshot.py');
const TEMP_DIR = '/tmp';

async function handleSsCommand(sock, chatId, message, match) {
    if (!match) {
        await sock.sendMessage(chatId, {
            text: '*↢ قــم بارسال لقطه شاشه + رابط لالتقاط صوره لموقع الويب.*',
            quoted: message,
        });
        return;
    }

    try {
        const url = match.trim();
        if (!/^https?:\/\//.test(url)) {
            return sock.sendMessage(chatId, {
                text: '❌ يرجى تقديم رابط صحيح يبدأ بـ http:// أو https://',
                quoted: message,
            });
        }

        await sock.sendMessage(chatId, {
            text: '*↢ جاري التقاط لقطه شاشه لموقع الويب...*',
            quoted: message,
        });

        const outputPath = path.join(TEMP_DIR, `ss_${Date.now()}.png`);

        await new Promise((resolve, reject) => {
            execFile('python3', [PYTHON_SCRIPT, url, outputPath], { timeout: 60000 },
                (error, stdout, stderr) => {
                    if (error) reject(new Error(stderr || error.message));
                    else resolve();
                }
            );
        });

        const imageBuffer = fs.readFileSync(outputPath);
        await sock.sendMessage(chatId, { image: imageBuffer }, { quoted: message });

        try { fs.unlinkSync(outputPath); } catch {}

    } catch (error) {
        console.error('SS Error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ فشل التقاط لقطة الشاشة. تأكد من صحة الرابط وجرب مرة أخرى.',
            quoted: message,
        });
    }
}

module.exports = { handleSsCommand };
