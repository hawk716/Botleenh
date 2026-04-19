const zodiacs = {
    'الحمل': { start: [3, 21], end: [4, 19] },
    'الثور': { start: [4, 20], end: [5, 20] },
    'الجوزاء': { start: [5, 21], end: [6, 20] },
    'السرطان': { start: [6, 21], end: [7, 22] },
    'الأسد': { start: [7, 23], end: [8, 22] },
    'العذراء': { start: [8, 23], end: [9, 22] },
    'الميزان': { start: [9, 23], end: [10, 22] },
    'العقرب': { start: [10, 23], end: [11, 21] },
    'القوس': { start: [11, 22], end: [12, 21] },
    'الجدي': { start: [12, 22], end: [1, 19] },
    'الدلو': { start: [1, 20], end: [2, 18] },
    'الحوت': { start: [2, 19], end: [3, 20] }
};

const userStates = new Map();

function getZodiacSign(day, month) {
    for (const [sign, dates] of Object.entries(zodiacs)) {
        const [startMonth, startDay] = dates.start;
        const [endMonth, endDay] = dates.end;
        
        if (month === startMonth && day >= startDay) {
            return sign;
        }
        if (month === endMonth && day <= endDay) {
            return sign;
        }
    }
    return 'الجدي';
}

function isValidDate(day, month) {
    if (month < 1 || month > 12) return false;
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day >= 1 && day <= daysInMonth[month - 1];
}

module.exports = async function(sock, chatId, message, senderId) {
    const userState = userStates.get(senderId);
    
    if (!userState || !userState.waitingForBirthdate) {
        userStates.set(senderId, { waitingForBirthdate: true });
        
        await sock.sendMessage(chatId, {
            text: '*↢ قـم بإرسال تاريخ ميلادك (اليوم والشهر).*\n\nمثال: 15 6\n(اليوم 15 من الشهر 6)'
        }, { quoted: message });
        
        return;
    }
    
    return { needsBirthdateInput: true };
};

module.exports.handleBirthdateInput = async function(sock, chatId, message, senderId, text) {
    const parts = text.trim().split(/\s+/);
    
    if (parts.length !== 2) {
        await sock.sendMessage(chatId, {
            text: '*↢ صيغة خاطئة!*\n\nأرسل تاريخ ميلادك بالشكل الصحيح:\nمثال: 15 6'
        }, { quoted: message });
        return;
    }
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    
    if (isNaN(day) || isNaN(month) || !isValidDate(day, month)) {
        await sock.sendMessage(chatId, {
            text: '*↢ تاريخ غير صحيح*\n\n*↢ قـم بإرسال تاريخ ميلادك (اليوم والشهر).*'
        }, { quoted: message });
        return;
    }
    
    const zodiacSign = getZodiacSign(day, month);
    userStates.delete(senderId);
    
    await sock.sendMessage(chatId, {
        text: `*↢ بـرجك هـو ↫ ${zodiacSign}*`
    }, { quoted: message });
};

module.exports.isWaitingForBirthdate = function(senderId) {
    const state = userStates.get(senderId);
    return state && state.waitingForBirthdate;
};

module.exports.clearState = function(senderId) {
    userStates.delete(senderId);
};