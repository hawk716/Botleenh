const fs = require('fs');
const path = require('path');

function loadScientificFacts() {
    try {
        const factsPath = path.join(__dirname, '..', 'data', 'scientific_facts.json');
        const data = fs.readFileSync(factsPath, 'utf8');
        return JSON.parse(data).facts;
    } catch (error) {
        console.error('❌ خطأ في قراءة قاعدة الحقائق:', error);
        return [];
    }
}

module.exports = async function (sock, chatId, message) {
    try {
        const allFacts = loadScientificFacts();
        
        if (!allFacts || allFacts.length === 0) {
            throw new Error('لا توجد حقائق متاحة في قاعدة البيانات');
        }
        
        const randomIndex = Math.floor(Math.random() * allFacts.length);
        const fact = allFacts[randomIndex];
        
        const msg = `*↢ حقيقة ↞${fact.id}*🚀✨\n\n*↢ الحقيقة ↞ ${fact.fact}.*🌱 `;
        await sock.sendMessage(chatId, { text: msg }, { quoted: message });
        
    } catch (error) {
        console.error('Error in fact command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ فشل في الحصول على الحقيقة. حاول مرة أخرى لاحقاً!' 
        }, { quoted: message });
    }
};