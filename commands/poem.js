const fs = require('fs');
const path = require('path');

function loadPoems() {
    try {
        const poemsPath = path.join(__dirname, '..', 'data', 'poetry.json');
        const data = fs.readFileSync(poemsPath, 'utf8');
        return JSON.parse(data).poems;
    } catch (error) {
        console.error('❌ خطأ في قراءة قاعدة القصائد:', error);
        return [];
    }
}

module.exports = async function (sock, chatId, message) {
    try {
        const allPoems = loadPoems();
        
        if (!allPoems || allPoems.length === 0) {
            throw new Error('لا توجد أشعار متاحة في قاعدة البيانات');
        }
        
        const randomIndex = Math.floor(Math.random() * allPoems.length);
        const poem = allPoems[randomIndex];
        
        const msg = `*↢ الشعر ↞${poem.id}*🚀✨\n\n*↢ القصيدة ↞ ${poem.verse}.*🌱 `;
        await sock.sendMessage(chatId, { text: msg }, { quoted: message });
        
    } catch (error) {
        console.error('Error in poem command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ فشل في الحصول على القصيدة. حاول مرة أخرى لاحقاً!' 
        }, { quoted: message });
    }
};