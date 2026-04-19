async function deleteCommand(sock, chatId, message, senderId) {
    try {
        const ctxInfo = message.message?.extendedTextMessage?.contextInfo || {};
        const repliedMsgId = ctxInfo.stanzaId || null;

        // Delete the replied message
        if (repliedMsgId && ctxInfo.participant) {
            try {
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: repliedMsgId,
                        participant: ctxInfo.participant
                    }
                });
            } catch (e) {
                // Silent fail
            }
        }

        // Delete the command message itself
        try {
            await sock.sendMessage(chatId, {
                delete: message.key
            });
        } catch (e) {
            // Silent fail
        }

    } catch (err) {
        // Silent fail
    }
}

module.exports = deleteCommand;
