const { UNDER_MAINTENANCE } = require('../lib/messages');

const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

async function clearBanCommand(sock, chatId, message, senderId) {
    console.log('🔍 بدء تنفيذ أمر حذف جميع المحظورين...');
    
    // التحقق من أن الأمر في مجموعة
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: '⚠️ هذا الأمر يعمل فقط في المجموعات!'
        }, { quoted: message });
        return;
    }

    // التحقق من صلاحيات المشرف
    const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { 
            text: '❌ فقط مشرفو المجموعة يمكنهم استخدام هذا الأمر!'
        }, { quoted: message });
        return;
    }
    
    try {
        const bannedFilePath = path.join(process.cwd(), 'data', 'banned.json');
        
        // التحقق من وجود الملف
        if (!fs.existsSync(bannedFilePath)) {
            await sock.sendMessage(chatId, { 
                text: '⚠️ لا يوجد مستخدمون محظورون في هذه المجموعة!'
            }, { quoted: message });
            return;
        }
        
        // قراءة قائمة المحظورين
        let bannedData = JSON.parse(fs.readFileSync(bannedFilePath, 'utf8'));
        
        // التحقق من نوع البيانات وتحويلها إذا لزم الأمر
        if (Array.isArray(bannedData)) {
            // تحويل من Array إلى Object
            const newBannedData = {};
            bannedData.forEach(userId => {
                // افتراض أن المحظورين القدامى من مجموعة افتراضية
                newBannedData['default'] = newBannedData['default'] || [];
                newBannedData['default'].push(userId);
            });
            bannedData = newBannedData;
        }
        
        // الحصول على عدد المحظورين في هذه المجموعة
        const groupBanned = bannedData[chatId] || [];
        const totalBanned = groupBanned.length;
        
        if (totalBanned === 0) {
            await sock.sendMessage(chatId, { 
                text: '⚠️ لا يوجد مستخدمون محظورون في هذه المجموعة!'
            }, { quoted: message });
            return;
        }
        
        // حذف المحظورين من هذه المجموعة فقط
        delete bannedData[chatId];
        
        fs.writeFileSync(bannedFilePath, JSON.stringify(bannedData, null, 2), 'utf8');
        console.log('✅ تم حذف جميع المحظورين من المجموعة بنجاح');
        
        await sock.sendMessage(chatId, { 
            text: `✅ تم حذف جميع المحظورين من هذه المجموعة بنجاح!\n\n` +
                  `📊 تم حذف: ${totalBanned} مستخدم\n\n` +
                  `الآن يمكن لجميع المستخدمين استخدام البوت في هذه المجموعة مرة أخرى.`
        }, { quoted: message });
        
    } catch (error) {
        console.error('❌ خطأ في حذف المحظورين:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = clearBanCommand;
