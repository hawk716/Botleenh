const { UNDER_MAINTENANCE } = require('../lib/messages');
const fetch = require('node-fetch');

async function shayariCommand(sock, chatId, message) {
    try {
        const response = await fetch('https://shizoapi.onrender.com/api/texts/shayari?apikey=shizo');
        const data = await response.json();
        
        if (!data || !data.result) {
            throw new Error('Invalid response from API');
        }

        const buttons = [
            { buttonId: '.shayari', buttonText: { displayText: 'شعر 🪄' }, type: 1 }
        ];

        await sock.sendMessage(chatId, { 
            text: data.result,
            buttons: buttons,
            headerType: 1
        }, { quoted: message });
    } catch (error) {
        console.error('Error in shayari command:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE,
        }, { quoted: message });
    }
}

module.exports = { shayariCommand };
