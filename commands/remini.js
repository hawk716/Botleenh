const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');

const SCRIPTS_DIR = path.join(__dirname, '..', 'scripts');
const PYTHON_SCRIPT = path.join(SCRIPTS_DIR, 'enhance_image.py');
const TEMP_DIR = '/tmp';

async function downloadImageFromMessage(sock, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = quoted?.imageMessage || message.message?.imageMessage;
    if (!imgMsg) return null;

    const stream = await downloadContentFromMessage(imgMsg, 'image');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function downloadFromUrl(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    return Buffer.from(response.data);
}

function runPythonScript(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const child = execFile('python3', [PYTHON_SCRIPT, inputPath, '-o', outputPath], {
            timeout: 180000
        }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr || error.message));
            } else {
                resolve(outputPath);
            }
        });
    });
}

module.exports = {
    name: 'remini',
    alias: ['enhance', 'hd', 'تحسين'],
    category: 'general',
    desc: 'Enhance image quality using AI',
    async exec(sock, message, args) {
        const chatId = message?.key?.remoteJid || '';
        if (!chatId) return;

        const sendError = async (text) => {
            try { await sock.sendMessage(chatId, { text }, { quoted: message }); } catch {}
        };

        try {
            let imageBuffer = null;

            if (args.length > 0) {
                const url = args.join(' ');
                await sock.sendMessage(chatId, { text: '⏳ جاري تحميل الصورة من الرابط...' }, { quoted: message });
                imageBuffer = await downloadFromUrl(url);
            } else {
                imageBuffer = await downloadImageFromMessage(sock, message);
                if (!imageBuffer) {
                    return sendError('*↢قـم بالرد او التعليق على صوره لتحسينها بالذكاء الاصطناعي، او ارسال تحسين + رابط الصوره.*');
                }
            }

            const inputPath = path.join(TEMP_DIR, `remini_input_${Date.now()}.png`);
            const outputPath = path.join(TEMP_DIR, `remini_output_${Date.now()}.png`);

            fs.writeFileSync(inputPath, imageBuffer);

            await sock.sendMessage(chatId, { text: '*↢ جاري تحسين الصوره بالذكاء الاصطناعي...*' }, { quoted: message });

            await runPythonScript(inputPath, outputPath);

            const resultBuffer = fs.readFileSync(outputPath);

            await sock.sendMessage(chatId, {
                image: resultBuffer,
                caption: '*↢ تـم تحسين صورتك بنجاح، ☑️*\n*↢ بــواسـطــة↤︎ `𝐋𝐞𝐞𝐧𝐁𝐨𝐓`*'
            }, { quoted: message });

            try { fs.unlinkSync(inputPath); } catch {}
            try { fs.unlinkSync(outputPath); } catch {}

        } catch (error) {
            console.error('Remini Error:', error.message);
            sendError('❌ *فشل تحسين الصورة.* تأكد من إرسال صورة صالحة وحاول مرة أخرى.');
        }
    }
};
