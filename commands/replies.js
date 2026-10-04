const { UNDER_MAINTENANCE } = require('../lib/messages');

const fs = require('fs');
const path = require('path');
const { getUserRank, getRankLevel } = require('../lib/ranks');
const { getToggle, TOGGLE_TYPES } = require('../lib/toggleSystem');

const repliesPath = path.join(__dirname, '../data/replies.json');

function loadReplies() {
    try {
        if (!fs.existsSync(repliesPath)) {
            fs.writeFileSync(repliesPath, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(fs.readFileSync(repliesPath, 'utf8'));
    } catch (error) {
        console.error('Error loading replies:', error);
        return {};
    }
}

function saveReplies(data) {
    try {
        fs.writeFileSync(repliesPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving replies:', error);
        return false;
    }
}

const pendingReplies = new Map();

async function addReplyCommand(sock, chatId, message, senderId, text) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط!' });
        return;
    }

    const groupMetadata = await sock.groupMetadata(chatId);
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
    const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
    const senderLevel = getRankLevel(senderRank);

    if (senderLevel < 2 && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 الادمن 〗*' }, { quoted: message });
        return;
    }

    pendingReplies.set(`${chatId}_${senderId}`, { step: 'keyword' });
    await sock.sendMessage(chatId, { 
        text: '*↢ حسناً، الان ارسل كلمة الرد*' 
    }, { quoted: message });
}

async function handleReplyProcess(sock, chatId, message, senderId, userMessage) {
    const key = `${chatId}_${senderId}`;
    const pending = pendingReplies.get(key);
    
    if (!pending) return false;

    if (pending.step === 'keyword') {
        pending.keyword = userMessage;
        pending.step = 'response';
        pendingReplies.set(key, pending);
        
        await sock.sendMessage(chatId, { 
            text: '*↢ ممتاز، قم بإرسال جواب الرد لاضافته*' 
        }, { quoted: message });
        return true;
    }

    if (pending.step === 'response') {
        const messageType = Object.keys(message.message || {})[0];
        let replyContent;

        if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
            replyContent = { type: 'text', content: userMessage };
        } else if (messageType === 'imageMessage') {
            replyContent = { 
                type: 'image', 
                caption: message.message.imageMessage.caption || '',
                messageData: message.message.imageMessage
            };
        } else if (messageType === 'videoMessage') {
            replyContent = { 
                type: 'video', 
                caption: message.message.videoMessage.caption || '',
                messageData: message.message.videoMessage
            };
        } else if (messageType === 'stickerMessage') {
            replyContent = { type: 'sticker', messageData: message.message.stickerMessage };
        } else if (messageType === 'audioMessage') {
            replyContent = { type: 'audio', messageData: message.message.audioMessage };
        } else if (messageType === 'documentMessage') {
            replyContent = { type: 'document', messageData: message.message.documentMessage };
        } else {
            replyContent = { type: 'text', content: userMessage };
        }

        const replies = loadReplies();
        if (!replies[chatId]) replies[chatId] = {};
        
        replies[chatId][pending.keyword] = replyContent;
        saveReplies(replies);

        pendingReplies.delete(key);
        
        await sock.sendMessage(chatId, { 
            text: `*↢ تـم إضافة الرد بنجاح، ☑️*\n*↢الكـلمة: ${pending.keyword}*` 
        }, { quoted: message });
        return true;
    }

    return false;
}

async function deleteReplyCommand(sock, chatId, message, senderId, userMessage) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط!' });
        return;
    }

    const groupMetadata = await sock.groupMetadata(chatId);
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
    const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
    const senderLevel = getRankLevel(senderRank);

    if (senderLevel < 2 && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 الادمن 〗*' }, { quoted: message });
        return;
    }

    const keyword = userMessage.replace(/^(مسح رد|مسح_رد)\s+/, '').trim();
    
    if (!keyword) {
        await sock.sendMessage(chatId, { text: '❌ يرجى تحديد كلمة الرد للحذف!\n\nمثال: مسح رد هلا' }, { quoted: message });
        return;
    }

    const replies = loadReplies();
    if (!replies[chatId] || !replies[chatId][keyword]) {
        await sock.sendMessage(chatId, { text: '❌ هذا الرد غير موجود!' }, { quoted: message });
        return;
    }

    delete replies[chatId][keyword];
    saveReplies(replies);

    await sock.sendMessage(chatId, { text: `*↢ تـم حذف الرد بنجاح، ☑️*\n*↢الكـلمة: ${keyword}*` }, { quoted: message });
}

async function listRepliesCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط!' });
        return;
    }

    const replies = loadReplies();
    const groupReplies = replies[chatId] || {};

    if (Object.keys(groupReplies).length === 0) {
        await sock.sendMessage(chatId, { text: '*↫ لا تــوجد ردود مضـافه*' }, { quoted: message });
        return;
    }

    const typeMap = {
        'text': 'نص',
        'image': 'صورة',
        'video': 'فيديو',
        'sticker': 'ملصق',
        'audio': 'صوت',
        'document': 'ملف'
    };

    let list = `*عدد الردود: ⦅ ${Object.keys(groupReplies).length} ⦆*\n\n`;
    Object.entries(groupReplies).forEach(([keyword, reply], index) => {
        const replyType = typeof reply === 'string' ? 'نص' : (typeMap[reply.type] || 'نص');
        list += `*${index + 1} - ⦏ ${keyword} ⦐ - ❮ ${replyType} ❯*\n`;
    });

    await sock.sendMessage(chatId, { text: list }, { quoted: message });
}

async function checkReply(sock, chatId, userMessage, senderId) {
    const replies = loadReplies();
    const groupReplies = replies[chatId] || {};

    if (groupReplies[userMessage]) {
        // Check if replies feature is enabled
        const isRepliesEnabled = await getToggle(chatId, TOGGLE_TYPES.REPLIES);
        
        if (!isRepliesEnabled) {
            // Get sender info for permission check
            const groupMetadata = await sock.groupMetadata(chatId);
            const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
            const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
            const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
            const senderLevel = getRankLevel(senderRank);
            
            // Only allow مدير/مالك/ادمن to use replies when disabled
            if (senderLevel < 2) {
                await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE });
                return true;
            }
        }
        
        const reply = groupReplies[userMessage];
        
        if (typeof reply === 'string') {
            await sock.sendMessage(chatId, { text: reply });
        } else if (reply.type === 'text') {
            await sock.sendMessage(chatId, { text: reply.content });
        } else if (reply.type === 'image') {
            await sock.sendMessage(chatId, { 
                image: { url: reply.messageData.url },
                caption: reply.caption 
            });
        } else if (reply.type === 'video') {
            await sock.sendMessage(chatId, { 
                video: { url: reply.messageData.url },
                caption: reply.caption 
            });
        } else if (reply.type === 'sticker') {
            await sock.sendMessage(chatId, { 
                sticker: { url: reply.messageData.url }
            });
        } else if (reply.type === 'audio') {
            await sock.sendMessage(chatId, { 
                audio: { url: reply.messageData.url },
                mimetype: 'audio/mp4'
            });
        } else if (reply.type === 'document') {
            await sock.sendMessage(chatId, { 
                document: { url: reply.messageData.url },
                mimetype: reply.messageData.mimetype,
                fileName: reply.messageData.fileName
            });
        }
        return true;
    }
    return false;
}

module.exports = {
    addReplyCommand,
    deleteReplyCommand,
    listRepliesCommand,
    checkReply,
    handleReplyProcess
};
