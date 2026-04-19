
/**
 * إرسال رسالة نظيفة بدون أي معلومات تحويل
 */
async function sendCleanMessage(sock, chatId, content, options = {}) {
    const cleanContent = {
        ...content,
        contextInfo: {
            ...content.contextInfo,
            forwardingScore: 0,
            isForwarded: false
        }
    };

    // إزالة أي إشارات للتحويل
    delete cleanContent.verifiedBizName;
    
    const cleanOptions = {
        ...options
    };
    
    // إزالة verifiedBizName من الخيارات أيضاً
    delete cleanOptions.verifiedBizName;

    return await sock.sendMessage(chatId, cleanContent, cleanOptions);
}

module.exports = { sendCleanMessage };
