
const fs = require('fs');
const path = require('path');

function isBanned(userId, chatId) {
    try {
        const bannedFilePath = path.join(process.cwd(), 'data', 'banned.json');
        
        if (!fs.existsSync(bannedFilePath)) {
            return false;
        }
        
        let bannedData = JSON.parse(fs.readFileSync(bannedFilePath, 'utf8'));
        
        // التحقق من نوع البيانات وتحويلها إذا لزم الأمر
        if (Array.isArray(bannedData)) {
            const newBannedData = {};
            bannedData.forEach(user => {
                newBannedData['default'] = newBannedData['default'] || [];
                newBannedData['default'].push(user);
            });
            bannedData = newBannedData;
        }
        
        // الحصول على قائمة المحظورين في المجموعة المحددة
        const groupBanned = bannedData[chatId] || [];
        
        // استخراج الرقم فقط من userId
        const userNumber = userId.split('@')[0];
        
        // البحث بالرقم فقط لضمان التوافق مع جميع الصيغ
        return groupBanned.some(banned => banned.split('@')[0] === userNumber);
    } catch (error) {
        console.error('Error checking banned status:', error);
        return false;
    }
}

module.exports = { isBanned };
