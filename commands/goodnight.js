const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'goodnight.json');

let goodnightCache = [];
try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
        goodnightCache = data.filter((item) => item && typeof item.text === 'string' && item.text.trim().length > 0);
    }
} catch (e) {
    goodnightCache = [];
}

function pickRandomGoodnight() {
    if (!goodnightCache.length) return 'لا توجد بيانات تصبح على خير متاحة حالياً.';
    return goodnightCache[Math.floor(Math.random() * goodnightCache.length)].text.trim();
}

async function goodnightCommand(sock, chatId, message) {
    const text = pickRandomGoodnight();
    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = { goodnightCommand };
