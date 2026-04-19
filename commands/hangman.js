const fs = require('fs');

const words = [
    // حيوانات
    'أسد', 'نمر', 'فيل', 'زرافة', 'قرد', 'دب', 'ذئب', 'ثعلب', 'أرنب', 'فأر',
    'حصان', 'جمل', 'بقرة', 'خروف', 'ماعز', 'حمار', 'قط', 'كلب', 'دجاجة', 'بطة',
    'حمامة', 'عصفور', 'نسر', 'صقر', 'بومة', 'ببغاء', 'طاووس',
    'تمساح', 'ثعبان', 'سلحفاة', 'سمكة', 'قرش', 'حوت', 'دولفين', 'أخطبوط',
    'فراشة', 'نحلة', 'نملة', 'عنكبوت', 'خنفساء',
    
    // فواكه وخضروات
    'تفاح', 'موز', 'برتقال', 'عنب', 'فراولة', 'مانجو', 'بطيخ', 'شمام', 'خوخ', 'مشمش',
    'كمثرى', 'رمان', 'تين', 'تمر', 'ليمون', 'أناناس', 'كيوي', 'جوافة',
    'خيار', 'طماطم', 'خس', 'جزر', 'بطاطس', 'بصل', 'ثوم', 'فلفل', 'باذنجان', 'كوسة',
    
    // مدن ودول
    'القاهرة', 'دبي', 'الرياض', 'مكة', 'بغداد', 'دمشق', 'بيروت', 'عمان', 'الكويت',
    'الدوحة', 'مسقط', 'صنعاء', 'طرابلس', 'الجزائر', 'تونس', 'الخرطوم', 'المنامة',
    'القدس', 'رام الله', 'جدة', 'الإسكندرية', 'الدار البيضاء', 'فاس', 'مراكش',
    
    // مهن ووظائف
    'طبيب', 'مهندس', 'معلم', 'محامي', 'طيار', 'سائق', 'طباخ', 'نجار', 'حداد', 'كهربائي',
    'مبرمج', 'مصمم', 'صحفي', 'كاتب', 'رسام', 'مصور', 'ممرض', 'صيدلي', 'بائع', 'حارس',
    
    // أشياء عامة
    'كتاب', 'قلم', 'دفتر', 'طاولة', 'كرسي', 'سرير', 'باب', 'نافذة', 'مرآة', 'ساعة',
    'هاتف', 'حاسوب', 'تلفاز', 'راديو', 'مكتب', 'خزانة', 'ثلاجة', 'فرن', 'غسالة',
    'سيارة', 'دراجة', 'طائرة', 'قطار', 'حافلة', 'سفينة', 'مركب',
    
    // ألوان
    'أحمر', 'أزرق', 'أخضر', 'أصفر', 'برتقالي', 'بنفسجي', 'وردي', 'بني', 'أسود', 'أبيض', 'رمادي',
    
    // رياضات
    'كرة القدم', 'سباحة', 'جري', 'ملاكمة', 'كاراتيه', 'تنس', 'سلة', 'طائرة',
    
    // أيام وأوقات
    'سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة',
    'صباح', 'ظهر', 'عصر', 'مساء', 'ليل', 'فجر',
    
    // طبيعة
    'شمس', 'قمر', 'نجم', 'سحاب', 'مطر', 'رعد', 'برق', 'ريح', 'ثلج', 'جبل', 'بحر',
    'نهر', 'بحيرة', 'شاطئ', 'صحراء', 'غابة', 'حديقة', 'شجرة', 'زهرة', 'عشب',
    
    // تكنولوجيا
    'إنترنت', 'برمجة', 'تطبيق', 'موقع', 'شبكة', 'خادم', 'بيانات', 'ذكاء',
    
    // طعام
    'خبز', 'أرز', 'لحم', 'دجاج', 'سمك', 'بيض', 'جبن', 'زبدة', 'عسل', 'سكر', 'ملح',
    'شاي', 'قهوة', 'عصير', 'ماء', 'حليب',
    
    // أفعال وصفات
    'سعيد', 'حزين', 'سريع', 'بطيء', 'كبير', 'صغير', 'طويل', 'قصير', 'قوي', 'ضعيف',
    'جميل', 'قبيح', 'نظيف', 'قذر', 'جديد', 'قديم', 'ساخن', 'بارد'
];
let hangmanGames = {};

function startHangman(sock, chatId) {
    const word = words[Math.floor(Math.random() * words.length)];
    const maskedWord = '_ '.repeat(word.length).trim();
    
    // حساب عدد التخمينات الخاطئة المسموحة بناءً على طول الكلمة
    let maxWrongGuesses;
    if (word.length <= 4) {
        maxWrongGuesses = 2;  // كلمات قصيرة: تخمينان فقط
    } else if (word.length <= 6) {
        maxWrongGuesses = 2;  // كلمات متوسطة: تخمينان
    } else if (word.length <= 9) {
        maxWrongGuesses = 3;  // كلمات طويلة: ثلاث تخمينات
    } else {
        maxWrongGuesses = 4;  // كلمات طويلة جداً: أربع تخمينات
    }

    hangmanGames[chatId] = {
        word,
        maskedWord: maskedWord.split(' '),
        guessedLetters: [],
        wrongGuesses: 0,
        maxWrongGuesses: maxWrongGuesses,
    };

    sock.sendMessage(chatId, { text: `بدأت اللعبة! الكلمة هي: ${maskedWord}\n💡 لديك ${maxWrongGuesses} محاولات خاطئة فقط!` });
}

function guessLetter(sock, chatId, letter) {
    if (!hangmanGames[chatId]) {
        // تجاهل الأمر بصمت إذا لم تكن هناك لعبة جارية
        return;
    }

    const game = hangmanGames[chatId];
    const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;

    if (guessedLetters.includes(letter)) {
        sock.sendMessage(chatId, { text: `لقد خمنت بالفعل "${letter}". جرب حرفاً آخر.` });
        return;
    }

    guessedLetters.push(letter);

    if (word.includes(letter)) {
        for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) {
                maskedWord[i] = letter;
            }
        }
        sock.sendMessage(chatId, { text: `*↢ تخمين جيد:* ${maskedWord.join(' ')}` });

        if (!maskedWord.includes('_')) {
            sock.sendMessage(chatId, { text: `*↢ تهانينا 🥳، الكلمة هي : ${word}*` });
            delete hangmanGames[chatId];
        }
    } else {
        game.wrongGuesses += 1;
        
        // كشف حرف عشوائي عند التخمين الخاطئ
        const hiddenIndices = [];
        for (let i = 0; i < word.length; i++) {
            if (maskedWord[i] === '_') {
                hiddenIndices.push(i);
            }
        }
        
        // إذا كان هناك حروف مخفية، اكشف واحد منها
        if (hiddenIndices.length > 0) {
            const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
            maskedWord[randomIndex] = word[randomIndex];
        }
        
        sock.sendMessage(chatId, { 
            text: `*↢ تخمين خاطئ، لديك ${maxWrongGuesses - game.wrongGuesses} محاولات متبقية.*\n*⌯ الكلمة هي:* ${maskedWord.join(' ')}` 
        });

        // التحقق من الفوز بعد كشف الحرف
        if (!maskedWord.includes('_')) {
            sock.sendMessage(chatId, { text: `*↢ تهانينا 🥳، الكلمة هي : ${word}*` });
            delete hangmanGames[chatId];
        } else if (game.wrongGuesses >= maxWrongGuesses) {
            sock.sendMessage(chatId, { text: `انتهت اللعبة! الكلمة كانت: ${word}` });
            delete hangmanGames[chatId];
        }
    }
}

module.exports = { startHangman, guessLetter };
