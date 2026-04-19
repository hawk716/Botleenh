
const { isFeatureEnabled } = require('../lib/groupSettings');

const ownerCallMessages = [
    'يا عمري ينادوك.',
    'يصيحولك.',
    'في حد يبغاك.',
    'عـاجل في حد كتب المالك.'
];

async function callownerCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: '❌ هذا الأمر يعمل فقط في المجموعات!' 
            }, { quoted: message });
            return;
        }

        // Check if callowner feature is enabled
        if (!isFeatureEnabled(chatId, 'callowner_enabled')) {
            await sock.sendMessage(chatId, { 
                text: '*↢ امـر ( نداء المالك ) معطل حالياً.*'
            }, { quoted: message });
            return;
        }

        // Get group owner
        const groupMetadata = await sock.groupMetadata(chatId);
        const groupOwner = groupMetadata.owner;

        if (!groupOwner) {
            await sock.sendMessage(chatId, { 
                text: '❌ لم يتم العثور على مالك المجموعة!'
            }, { quoted: message });
            return;
        }

        // Get owner name from contacts or default
        let ownerName = 'المالك';
        try {
            const ownerContact = await sock.getName(groupOwner);
            if (ownerContact) ownerName = ownerContact;
        } catch (e) {}

        // Select random message
        const randomMessage = ownerCallMessages[Math.floor(Math.random() * ownerCallMessages.length)];
        const finalMessage = randomMessage.replace('$هنا المالك', ownerName);

        // Send hidden mention to owner
        await sock.sendMessage(chatId, { 
            text: `*${finalMessage}*`,
            mentions: [groupOwner]
        }, { quoted: message });

    } catch (error) {
        console.error('Error in callowner command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ حدث خطأ أثناء تنفيذ الأمر!'
        }, { quoted: message });
    }
}

module.exports = callownerCommand;
