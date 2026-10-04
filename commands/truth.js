const { UNDER_MAINTENANCE } = require('../lib/messages');
const fs = require('fs');
const path = require('path');

// قراءة أسئلة الصراحة من ملف JSON المحلي
function loadTruthQuestions() {
    try {
        const questionsPath = path.join(__dirname, '..', 'data', 'truth_questions.json');
        const data = fs.readFileSync(questionsPath, 'utf8');
        return JSON.parse(data).questions;
    } catch (error) {
        console.error('❌ خطأ في قراءة ملف أسئلة الصراحة:', error);
        return [];
    }
}

async function truthCommand(sock, chatId, message) {
    try {
        // تحميل الأسئلة من الملف المحلي
        const allQuestions = loadTruthQuestions();
        
        if (!allQuestions || allQuestions.length === 0) {
            throw new Error('لا توجد أسئلة متاحة في قاعدة البيانات');
        }
        
        // اختيار سؤال عشوائي
        const randomIndex = Math.floor(Math.random() * allQuestions.length);
        const truthQuestion = allQuestions[randomIndex];
        
        // إرسال السؤال بالتنسيق المطلوب
        await sock.sendMessage(chatId, { 
            text: `*↫ ${truthQuestion}*` 
        }, { quoted: message });
        
    } catch (error) {
        console.error('Error in truth command:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE 
        }, { quoted: message });
    }
}

module.exports = { truthCommand };
