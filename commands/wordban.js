
const wordban = require('../lib/wordban');
const { getRank } = require('../lib/ranks');

async function banWord(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
        return sock.sendMessage(chatId, { 
            text: '*↢ قـم بالرد على الرسالة التي تحتوي على الكلمة المراد منعها.*'
        }, { quoted: message });
    }

    const text = quoted.conversation || quoted.extendedTextMessage?.text || '';
    if (!text.trim()) {
        return sock.sendMessage(chatId, { 
            text: '*↢ الرسالة المحددة لا تحتوي على نص.*'
        }, { quoted: message });
    }

    const word = text.trim();
    wordban.add(chatId, word);
    await sock.sendMessage(chatId, { 
        text: `*↢ تـم إضافة الكلمة للمنع بنجاح... ☑️*\n*الكلمة:* ${word}`
    }, { quoted: message });
}

async function unbanWord(sock, chatId, message, text) {
    const word = text?.trim();
    if (!word) {
        return sock.sendMessage(chatId, { 
            text: '*↢ قـم بكتابة الامر ثم الكلمة.*\n*مثال: الغاء منع قحبه*'
        }, { quoted: message });
    }

    const removed = wordban.remove(chatId, word);
    if (!removed) {
        return sock.sendMessage(chatId, { 
            text: '*↢ الكـلمة غير مضافة بقائمة المنع.*'
        }, { quoted: message });
    }

    await sock.sendMessage(chatId, { 
        text: '*↢ تـم الغاء الكلمة من قائمة المنع.*'
    }, { quoted: message });
}

async function clearBanList(sock, chatId, message) {
    wordban.clear(chatId);
    await sock.sendMessage(chatId, { 
        text: '*↢ تـم مسح قائمة المنع بنجاح... ☑️*'
    }, { quoted: message });
}

async function showBanList(sock, chatId, message) {
    const words = wordban.list(chatId);
    if (words.length === 0) {
        return sock.sendMessage(chatId, { 
            text: '*↢ قائمة المنع فارغة.*'
        }, { quoted: message });
    }

    const list = words.map((w, i) => `${i + 1}. ${w}`).join('\n');
    await sock.sendMessage(chatId, { 
        text: `*قائمة الكلمات الممنوعة:*\n${list}`
    }, { quoted: message });
}

async function checkMessage(sock, chatId, senderId, message, text) {
    const rank = await getRank(chatId, senderId);
    if (['owner', 'manager', 'admin'].includes(rank)) return false;

    const banned = wordban.check(chatId, text);
    if (banned) {
        await sock.sendMessage(chatId, { delete: message.key });
        
        if (wordban.shouldWarn(chatId, senderId)) {
            await sock.sendMessage(chatId, { 
                text: '*↢ لـقد استخدمت كلمة محظورة وتم حذف رسالتك.*'
            });
        }
        return true;
    }
    return false;
}

module.exports = { banWord, unbanWord, clearBanList, showBanList, checkMessage };
