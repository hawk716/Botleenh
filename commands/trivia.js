
const fs = require('fs');
const path = require('path');

let triviaGames = {};

// قراءة الأسئلة من ملف JSON المحلي
function loadQuestions() {
    try {
        const questionsPath = path.join(__dirname, '..', 'data', 'trivia_questions.json');
        const data = fs.readFileSync(questionsPath, 'utf8');
        return JSON.parse(data).questions;
    } catch (error) {
        console.error('❌ خطأ في قراءة ملف الأسئلة:', error);
        return [];
    }
}

async function startTrivia(sock, chatId) {
    console.log('✅ تم استدعاء دالة startTrivia للمحادثة:', chatId);
    
    if (triviaGames[chatId]) {
        console.log('⚠️ لعبة قيد التقدم بالفعل');
        await sock.sendMessage(chatId, { 
            text: '*⌯ لعبة أسئلة قيد التقدم بالفعل!*\n\nلإنهاء اللعبة الحالية، أجب على السؤال أو انتظر قليلاً.' 
        });
        return;
    }

    // إرسال رسالة انتظار
    await sock.sendMessage(chatId, { text: '⏳ جاري جلب سؤال عشوائي...' });
    
    console.log('📡 جلب سؤال من قاعدة البيانات المحلية...');
    try {
        // تحميل الأسئلة من الملف المحلي
        const allQuestions = loadQuestions();
        
        if (!allQuestions || allQuestions.length === 0) {
            throw new Error('لا توجد أسئلة متاحة في قاعدة البيانات');
        }
        
        // اختيار سؤال عشوائي
        const randomIndex = Math.floor(Math.random() * allQuestions.length);
        const questionData = allQuestions[randomIndex];
        
        // تخزين بيانات اللعبة
        triviaGames[chatId] = {
            question: questionData.question,
            correctAnswer: questionData.correct_answer,
            options: questionData.options,
            category: questionData.category
        };

        // تنسيق الخيارات
        const optionsList = triviaGames[chatId].options.map((opt, i) => `*${i + 1}- ${opt}*`).join('\n');

        console.log('✅ إرسال السؤال...');
        await sock.sendMessage(chatId, {
            text: `*خلينا نشوف معلوماتك بــ ❪${triviaGames[chatId].category}❫*\n` +
                  `*${triviaGames[chatId].question}*\n\n` +
                  `${optionsList}\n\n` +
                  `*↫ ارسل رقم الاجابة الصحيحة.*`
        });
        console.log('✅ تم إرسال السؤال بنجاح');
    } catch (error) {
        console.error('❌ خطأ تفصيلي في جلب السؤال:', error.message);
        console.error('❌ تفاصيل إضافية:', error);
        
        let errorMessage = '❌ خطأ في جلب السؤال.\n\n';
        errorMessage += `🔧 خطأ داخلي: ${error.message}`;
        errorMessage += '\n\n💡 حاول مرة أخرى بعد قليل.';
        
        await sock.sendMessage(chatId, { text: errorMessage });
    }
}

function answerTrivia(sock, chatId, answer) {
    if (!triviaGames[chatId]) {
        // تجاهل الأمر بصمت إذا لم تكن هناك لعبة جارية
        return false;
    }

    const game = triviaGames[chatId];
    
    // التحقق من الإجابة - سواء كانت نص الإجابة أو رقم الخيار
    let isCorrect = false;
    const trimmedAnswer = answer.toLowerCase().trim();
    
    // التحقق من الإجابة النصية
    if (trimmedAnswer === game.correctAnswer.toLowerCase().trim()) {
        isCorrect = true;
    }
    
    // التحقق من رقم الخيار (1، 2، 3)
    const answerNumber = parseInt(trimmedAnswer);
    if (!isNaN(answerNumber) && answerNumber >= 1 && answerNumber <= game.options.length) {
        const selectedOption = game.options[answerNumber - 1];
        if (selectedOption.toLowerCase().trim() === game.correctAnswer.toLowerCase().trim()) {
            isCorrect = true;
        }
    }

    if (isCorrect) {
        sock.sendMessage(chatId, { 
            text: `*↢ إجابة صحيحة 🥳*`
        });
    } else {
        sock.sendMessage(chatId, { 
            text: `*↢ للأسف الإجابة رقم \`${answerNumber}\` خاطئة.*\n\n` +
                  `*⌯ الإجابة الصحيحة: ${game.correctAnswer} ✅*`
        });
    }

    delete triviaGames[chatId];
    return true;
}

module.exports = { startTrivia, answerTrivia };
