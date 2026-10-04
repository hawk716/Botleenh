    async function isAdmin(sock, chatId, senderId) {
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const { isBotAdminIn } = require('./botAdminCheck');
            
            const participant = groupMetadata.participants.find(p => 
                p.id === senderId || 
                p.id === senderId.replace('@s.whatsapp.net', '@lid') ||
                p.id === senderId.replace('@lid', '@s.whatsapp.net')
            );
            
            const isBotAdmin = isBotAdminIn(sock, groupMetadata);
            const isSenderAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');

            return { isSenderAdmin, isBotAdmin };
        } catch (error) {
            console.error('Error in isAdmin:', error);
            return { isSenderAdmin: false, isBotAdmin: false };
        }
    }

    module.exports = isAdmin;
