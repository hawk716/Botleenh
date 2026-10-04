const { UNDER_MAINTENANCE } = require('../lib/messages');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execFileAsync = util.promisify(execFile);

const SCRIPTS_DIR = path.join(__dirname, '..', 'scripts');
const PYTHON_SCRIPT = path.join(SCRIPTS_DIR, 'creen.py');
const TEMP_DIR = '/tmp';

async function handleCreenCommand(sock, chatId, message, rawArgs) {
    if (!rawArgs || rawArgs.trim().length === 0) {
        return sock.sendMessage(chatId, {
            text: '*↢ قم بارسال الوصف بعد الامر*\n*↢ مثال: انشاء ذكي قطة ترتدي نظارات.*',
            quoted: message,
        });
    }

    const trimmed = rawArgs.trim();
    const mode = trimmed.startsWith('فيديو') || trimmed.startsWith('فديو') ? 'video' : 'image';
    const prompt = mode === 'video'
        ? trimmed.replace(/^(فيديو|فديو)\s*/i, '').trim()
        : trimmed;

    if (!prompt) {
        return sock.sendMessage(chatId, {
            text: '*↢ قم بارسال الوصف بعد الامر*\n*↢ مثال: انشاء ذكي قطة ترتدي نظارات.*',
            quoted: message,
        });
    }

    const waitingText = mode === 'video'
        ? '*↢ جاري إنشاء الفيديو باستخدام الذكاء الاصطناعي، انتظر قليلاً...*'
        : '*↢ جاري إنشاء الصورة باستخدام الذكاء الاصطناعي، انتظر قليلاً...*';

    await sock.sendMessage(chatId, { text: waitingText, quoted: message });

    try {
        const outputDir = path.join(__dirname, '..', 'outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        await execFileAsync('python3', [PYTHON_SCRIPT, prompt, '--mode', mode], {
            timeout: 180000,
            cwd: path.join(__dirname, '..'),
        });

        await sock.sendMessage(chatId, { text: '*↢ جاري المعالجة، يرجى الانتظار...*', quoted: message });

        const files = fs.readdirSync(outputDir)
            .filter((f) => f.startsWith(`creen_${mode}_`) && f.endsWith('.png'))
            .sort()
            .reverse();

        const latest = files.length > 0 ? path.join(outputDir, files[0]) : null;
        if (!latest || !fs.existsSync(latest)) {
            return sock.sendMessage(chatId, {
                text: UNDER_MAINTENANCE,
                quoted: message,
            });
        }

        const imageBuffer = fs.readFileSync(latest);
        try { fs.unlinkSync(latest); } catch {}

        const caption = '*↢ تـم الإنشاء بنجاح، ☑️*\n*↢ بــواسـطــة↤︎ `𝐋𝐞𝐞𝐧𝐁𝐨𝐓`*';

        if (mode === 'video') {
            await sock.sendMessage(chatId, {
                video: imageBuffer,
                caption,
                mimetype: 'video/mp4',
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption,
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Creen Error:', error.message);
        await sock.sendMessage(chatId, {
            text: UNDER_MAINTENANCE,
            quoted: message,
        });
    }
}

module.exports = { handleCreenCommand };
