const fetch = require('node-fetch');

async function handleSsCommand(sock, chatId, message, match) {
    if (!match) {
        await sock.sendMessage(chatId, {
            text: `*أداة لقطة الشاشة*\n\n*.ss <رابط>*\n*.ssweb <رابط>*\n*.screenshot <رابط>*\n\nالتقط لقطة شاشة لأي موقع\n\nمثال:\n.ss https://google.com\n.ssweb https://google.com\n.screenshot https://google.com`,
            quoted: message
        });
        return;
    }

    try {
        // Show typing indicator
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        // Extract URL from command
        const url = match.trim();
        
        // Validate URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return sock.sendMessage(chatId, {
                text: '❌ يرجى تقديم رابط صحيح يبدأ بـ http:// أو https://',
                quoted: message
            });
        }

        // Call the API
        const apiUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&theme=light&device=desktop`;
        const response = await fetch(apiUrl, { headers: { 'accept': '*/*' } });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        // Get the image buffer
        const imageBuffer = await response.buffer();

        // Send the screenshot
        await sock.sendMessage(chatId, {
            image: imageBuffer,
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('❌ Error in ss command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ فشل التقاط لقطة الشاشة. حاول مرة أخرى بعد دقائق.\n\nالأسباب المحتملة:\n• رابط غير صحيح\n• الموقع يمنع التقاط الشاشة\n• الموقع معطل\n• الخدمة غير متاحة مؤقتاً',
            quoted: message
        });
    }
}

module.exports = {
    handleSsCommand
}; 