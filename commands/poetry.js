const { UNDER_MAINTENANCE } = require('../lib/messages');
const fs = require('fs');
const path = require('path');

const poetryDatabasePath = path.join(__dirname, '..', 'data', 'poetry.json');
const poetryData = JSON.parse(fs.readFileSync(poetryDatabasePath, 'utf8'));

module.exports = async function (sock, chatId, message) {
    try {
        const randomIndex = Math.floor(Math.random() * poetryData.poems.length);
        const poem = poetryData.poems[randomIndex];
        
        const msg = `*${poem.verse.replace(/\*\*\*/g, '--')}🌹❤*`;
        await sock.sendMessage(chatId, { text: msg }, { quoted: message });
        
    } catch (error) {
        console.error('Error in poetry command:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE 
        }, { quoted: message });
    }
};