const { UNDER_MAINTENANCE } = require('../lib/messages');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function extractViewOnceMedia(quoted) {
    if (!quoted) return null;
    // Direct image or video
    const direct = quoted.imageMessage || quoted.videoMessage;
    if (direct) return direct;

    // Nested in viewOnceMessage or viewOnceMessageV2
    const v1 = quoted.viewOnceMessage || quoted.viewOnceMessageV2;
    if (v1) {
        const inner = v1.message || v1;
        return inner.imageMessage || inner.videoMessage || null;
    }

    return null;
}

async function viewonceCommand(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const media = extractViewOnceMedia(quoted);

    if (!media) {
        return sock.sendMessage(chatId, { text: '*↢ قــم بالرد على صوره/فيديو تعرض لمره واحده لجعلها تعرض دائماً.*' }, { quoted: message });
    }

    const mtype = media.mimetype || '';
    const isImage = mtype.startsWith('image/');
    const isVideo = mtype.startsWith('video/');
    const type = isImage ? 'image' : 'video';

    try {
        const stream = await downloadContentFromMessage(media, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(chatId, { [type]: buffer, caption: media.caption || '' }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

module.exports = viewonceCommand;
