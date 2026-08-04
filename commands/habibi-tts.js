const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

async function habibiTTSCommand(sock, chatId, message, text) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        let actualText = text.trim();
        if (!actualText) {
            const sendOpts = message?.key ? { quoted: message } : {};
            await sock.sendMessage(chatId, {
                text: `*↢ يرجى كتابة النص بعد اللهجة.*\n  ┃  *↢* مثال: *نص صوتي مصري مرحبا*\n  ┃ `
            }, sendOpts);
            return;
        }

        // Detect dialect from first word(s) - map to habibi-tts dialect codes
        const dialectPatterns = [
            { pattern: /^(مصري|مصرية|مصر)\b/i, code: 'EGY' },
            { pattern: /^(خليجي|خليجية|خلي)\b/i, code: 'SAU' },
            { pattern: /^(مغربي|مغربية|مغرب)\b/i, code: 'ALG' },
            { pattern: /^(شمالي|شمال)\b/i, code: 'LEV' },
            { pattern: /^(فصحى|فصحي)\b/i, code: 'MSA' }
        ];

        let dialect = 'MSA'; // default
        for (const { pattern, code } of dialectPatterns) {
            if (pattern.test(actualText)) {
                dialect = code;
                actualText = actualText.replace(pattern, '').trim();
                break;
            }
        }

        if (!actualText) {
            const sendOpts = message?.key ? { quoted: message } : {};
            await sock.sendMessage(chatId, {
                text: `يرجى تقديم النص بعد اللهجة.\nمثال: *نص صوتي مصري مرحبا*`
            }, sendOpts);
            return;
        }

        // Try habibi-tts CLI first (requires CUDA). Fall back to gTTS if unavailable.
        const { exec } = require('child_process');
        const fileName = `habibi-${Date.now()}.wav`;
        const filePath = path.join(__dirname, '..', 'assets', fileName);

        const cliCmd = `python3 -m habibi_tts.infer.infer_cli -d ${dialect} -t "${actualText.replace(/"/g, '\\"')}" -o "${path.join(__dirname, '..', 'assets')}" -w "${fileName}"`;

        exec(cliCmd, { env: { ...process.env, CUDA_VISIBLE_DEVICES: '' } }, async (err, stdout, stderr) => {
            if (err || stderr.includes('error') || stdout.includes('ERROR')) {
                // habibi-tts failed (likely no CUDA), fall back to gTTS
                console.log('Habibi-TTS not available, falling back to gTTS');
                const ttsText = actualText;
                const gTTSLang = dialect === 'EGY' ? 'ar' : 'ar';
                const gtts = new gTTS(ttsText, 'ar');
                gtts.save(filePath.replace('.wav', '.mp3'), async function (saveErr) {
                    if (saveErr) {
                        console.error('gTTS fallback error:', saveErr);
                        const sendOpts = message?.key ? { quoted: message } : {};
                        await sock.sendMessage(chatId, {
                            text: '❌ تعذر إنشاء الصوت. يتطلب Habibi-TTS بيئة CUDA.\nاستخدم *نص الى صوت* كبديل.'
                        }, sendOpts);
                        return;
                    }
                    const mp3Path = filePath.replace('.wav', '.mp3');
                    const sendOpts = message?.key ? { quoted: message } : {};
                    await sock.sendMessage(chatId, {
                        audio: { url: mp3Path },
                        mimetype: 'audio/mpeg',
                        ptt: false
                    }, sendOpts);
                    setTimeout(() => {
                        try { if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path); } catch (e) {}
                    }, 10000);
                });
                return;
            }

            // habibi-tts succeeded
            const sendOpts = message?.key ? { quoted: message } : {};
            await sock.sendMessage(chatId, {
                audio: { url: filePath },
                mimetype: 'audio/wav',
                ptt: false
            }, sendOpts);
            setTimeout(() => {
                try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
            }, 10000);
        });

    } catch (error) {
        console.error('❌ Error in Habibi TTS command:', error);
        const sendOpts = message?.key ? { quoted: message } : {};
        await sock.sendMessage(chatId, {
            text: '❌ حدث خطأ أثناء إنشاء الصوت.'
        }, sendOpts);
    }
}

module.exports = habibiTTSCommand;
