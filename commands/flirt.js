const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'ghazal.json');

let ghazalCache = [];
try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
        ghazalCache = data.filter((item) => item && typeof item.text === 'string' && item.text.trim().length > 0);
    }
} catch (e) {
    ghazalCache = [];
}

function pickRandomGhazal() {
    if (!ghazalCache.length) return 'لا توجد بيانات غزل متاحة حالياً.';
    return ghazalCache[Math.floor(Math.random() * ghazalCache.length)].text.trim();
}

function formatGhazal(text) {
    const cleanText = text.trim().replace(/^\*+|\*+$/g, '').trim();
    return `*${cleanText} 🤍🥹*`;
}

async function flirtCommand(sock, chatId, message) {
    const text = formatGhazal(pickRandomGhazal());
    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = { flirtCommand };
