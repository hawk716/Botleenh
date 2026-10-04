const { UNDER_MAINTENANCE } = require('../lib/messages');
const fs = require('fs');
const path = require('path');
const os = require('os');
const settings = require('../settings');

const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid || '120363400425238128@newsletter',
            newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
            serverMessageId: -1
        }
    }
};

async function clearSessionCommand(sock, chatId, msg) {
    try {
        // Check if sender is owner
        if (!msg.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '• عذراً الامر يخص ↤︎ 〖  الادمن 〗 فقط .',
                ...channelInfo
            });
            return;
        }

        // Define session directory
        const sessionDir = path.join(__dirname, '../session');

        if (!fs.existsSync(sessionDir)) {
            await sock.sendMessage(chatId, { 
                text: '❌ مجلد الجلسة غير موجود!',
                ...channelInfo
            });
            return;
        }

        let filesCleared = 0;
        let errors = 0;
        let errorDetails = [];

        // Send initial status
        await sock.sendMessage(chatId, { 
            text: `🔍 جاري تحسين ملفات الجلسة لأداء أفضل...`,
            ...channelInfo
        });

        const files = fs.readdirSync(sessionDir);

        // Count files by type for optimization
        let appStateSyncCount = 0;
        let preKeyCount = 0;

        for (const file of files) {
            if (file.startsWith('app-state-sync-')) appStateSyncCount++;
            if (file.startsWith('pre-key-')) preKeyCount++;
        }

        // Delete files
        for (const file of files) {
            if (file === 'creds.json') {
                // Skip creds.json file
                continue;
            }
            try {
                const filePath = path.join(sessionDir, file);
                fs.unlinkSync(filePath);
                filesCleared++;
            } catch (error) {
                errors++;
                errorDetails.push(`Failed to delete ${file}: ${error.message}`);
            }
        }

        // Send completion message
        const message = `✅ تم مسح ملفات الجلسة بنجاح!\n\n` +
                       `📊 الإحصائيات:\n` +
                       `• إجمالي الملفات الممسوحة: ${filesCleared}\n` +
                       `• ملفات حالة التطبيق: ${appStateSyncCount}\n` +
                       `• ملفات المفاتيح: ${preKeyCount}\n` +
                       (errors > 0 ? `\n⚠️ أخطاء تم مواجهتها: ${errors}\n${errorDetails.join('\n')}` : '');

        await sock.sendMessage(chatId, { 
            text: message,
            ...channelInfo
        });

    } catch (error) {
        console.error('Error in clearsession command:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE,
            ...channelInfo
        });
    }
}

module.exports = clearSessionCommand;