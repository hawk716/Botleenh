const { getUserRank, getRankLevel } = require('../lib/ranks');
const { 
    setLock, 
    getLock, 
    removeLock,
    LOCK_TYPES 
} = require('../lib/lockSystem');

async function handleLockCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        // مدير or higher (level >= 3) can use this
        if (senderLevel < 3 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' }, { quoted: message });
            return;
        }

        const args = userMessage.trim().split(' ');
        const command = args[0];
        const lockType = args[1];

        if (!lockType) {
            const usage = `*↢ قائمة أنواع القفل المتاحة:*

*الوسائط:*
• الصور
• الفيديو
• المتحركه
• الملصقات
• الملفات
• الصوت
• الفويس
• الوسائط (جميع الوسائط)

*المحتوى:*
• التثبيت
• التوجيه
• التعديل
• الجهات

*خاص:*
• الكل (قفل كل شيء)

*ملاحظة:* بعض الأنواع تحتاج تطبيق إضافي`;
            
            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }
        const username = `@${senderId.split('@')[0]}`;
        const isLock = command === 'قفل';

        const lockTypeMap = {
            'الصور': LOCK_TYPES.IMAGES,
            'الفيديو': LOCK_TYPES.VIDEOS,
            'المتحركه': LOCK_TYPES.GIFS,
            'الملصقات': LOCK_TYPES.STICKERS,
            'الملفات': LOCK_TYPES.FILES,
            'الصوت': LOCK_TYPES.AUDIO,
            'الفويس': LOCK_TYPES.VOICE,
            'التثبيت': LOCK_TYPES.PINS,
            'الجهات': LOCK_TYPES.CONTACTS,
            'التوجيه': LOCK_TYPES.FORWARDS,
            'التعديل': LOCK_TYPES.EDITS,
            'الوسائط': LOCK_TYPES.MEDIA,
            'الكل': LOCK_TYPES.ALL
        };

        const mappedType = lockTypeMap[lockType];
        
        if (!mappedType) {
            return;
        }

        if (isLock) {
            await setLock(chatId, mappedType);
            await sock.sendMessage(chatId, {
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم قفل ${lockType}*`,
                mentions: [senderId]
            }, { quoted: message });
        } else {
            await removeLock(chatId, mappedType);
            await sock.sendMessage(chatId, {
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم فتح ${lockType}*`,
                mentions: [senderId]
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in lock command:', error);
        await sock.sendMessage(chatId, { text: '*_خطأ في معالجة أمر القفل_*' });
    }
}

async function handleLockDetection(sock, chatId, message, senderId) {
    try {
        // التحقق من رتبة المستخدم
        const { getUserRank, getRankLevel } = require('../lib/ranks');
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        // استثناء الأدمن والمدير والمالك (level >= 2)
        if (senderLevel >= 2 || message.key.fromMe) {
            return;
        }

        const isAllLocked = await getLock(chatId, LOCK_TYPES.ALL);
        const messageType = Object.keys(message.message || {})[0];
        const quotedMessageId = message.key.id;
        const quotedParticipant = message.key.participant || senderId;
        const messageContent = message.message[messageType];

        const deleteMessage = async () => {
            try {
                await sock.sendMessage(chatId, {
                    delete: { 
                        remoteJid: chatId, 
                        fromMe: false, 
                        id: quotedMessageId, 
                        participant: quotedParticipant 
                    },
                });
            } catch (error) {
                console.error('Failed to delete message:', error);
            }
        };

        const typeMapping = {
            'imageMessage': LOCK_TYPES.IMAGES,
            'videoMessage': LOCK_TYPES.VIDEOS,
            'stickerMessage': LOCK_TYPES.STICKERS,
            'documentMessage': LOCK_TYPES.FILES,
            'audioMessage': LOCK_TYPES.AUDIO,
            'contactMessage': LOCK_TYPES.CONTACTS,
            'contactsArrayMessage': LOCK_TYPES.CONTACTS
        };

        let mappedType = typeMapping[messageType];
        
        if (messageType === 'videoMessage' && messageContent?.gifPlayback) {
            mappedType = LOCK_TYPES.GIFS;
        }
        
        if (messageType === 'audioMessage' && messageContent?.ptt === true) {
            mappedType = LOCK_TYPES.VOICE;
        }
        
        if (mappedType) {
            const isMediaLocked = await getLock(chatId, LOCK_TYPES.MEDIA);
            const isTypeLocked = await getLock(chatId, mappedType);

            if (isAllLocked || isMediaLocked || isTypeLocked) {
                await deleteMessage();
                return;
            }
        }

        const contextInfo = messageContent?.contextInfo || 
                          message.message?.extendedTextMessage?.contextInfo;

        if (contextInfo?.isForwarded) {
            const isForwardLocked = await getLock(chatId, LOCK_TYPES.FORWARDS);
            
            if (isForwardLocked || isAllLocked) {
                await deleteMessage();
                return;
            }
        }

        // معالجة التعديل - حذف الرسائل المعدلة
        const isEditLocked = await getLock(chatId, LOCK_TYPES.EDITS);
        if ((isEditLocked || isAllLocked) && message.message?.protocolMessage?.type === 1) {
            try {
                const editedKey = message.message.protocolMessage.key;
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: editedKey.id,
                        participant: editedKey.participant
                    }
                });
            } catch (e) {
                console.error('Failed to delete edited message:', e);
            }
            return;
        }

        // معالجة التثبيت - إلغاء التثبيت عند القفل
        const isPinLocked = await getLock(chatId, LOCK_TYPES.PINS);
        if ((isPinLocked || isAllLocked) && message.message?.protocolMessage?.type === 14) {
            try {
                const pinnedMsgKey = message.message.protocolMessage.key;
                // إلغاء التثبيت
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: pinnedMsgKey.id,
                        participant: pinnedMsgKey.participant
                    }
                });
            } catch (e) {
                console.error('Failed to unpin:', e);
            }
            return;
        }

    } catch (error) {
        console.error('Error in lock detection:', error);
    }
}

module.exports = {
    handleLockCommand,
    handleLockDetection
};
