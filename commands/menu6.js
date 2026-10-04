const { isSudo } = require('../lib/index');

async function menu6Command(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isPrivateChat = !chatId.endsWith('@g.us');
    const senderIsSudo = await isSudo(senderId);
    const isOwner = message.key.fromMe || senderIsSudo;

    // قائمة مالك فقط
    if (isOwner) {
        const menuMessage = `*↢ أهلاً بك عزيزي في*─────────────────────
*↢ قائمة اوامر مالك*─────────────────────
*↢ مسح الجلسة*
*↢ مسح المؤقت*
*↢ تغيير صورة البوت*
*↢ المشرفين*
*↢ تحديث*
*↢ قفل الحذف*
*↢ فتح الحذف*
*↢ تفاعل تلقائي تشغيل*
*↢ تفاعل تلقائي ايقاف*
*↢ حالة تلقائية تشغيل*
*↢ حالة تلقائية ايقاف*
*↢ حالة تلقائية تفاعل تشغيل*
*↢ حالة تلقائية تفاعل ايقاف*
*↢ كتابة تلقائية تشغيل*
*↢ كتابة تلقائية ايقاف*
*↢ قراءة تلقائية تشغيل*
*↢ قراءة تلقائية ايقاف*
*↢ منع المكالمات تشغيل*
*↢ منع المكالمات ايقاف*
*↢ منع المكالمات حالة*
*↢ حظر الخاص تشغيل*
*↢ حظر الخاص ايقاف*
*↢ حظر الخاص تعيين*
*↢ الوضع*
─────────────────────
*↢ الوضع عام*
*↢ الوضع خاص*
─────────────────────
*↢ الاعدادات*
*↢ اعدادات المنشن*
*↢ كود المصدر`;

        try {
            await sock.sendMessage(chatId, { text: menuMessage }, { quoted: message });
        } catch (error) {
            console.error('Error in menu6 command:', error);
            await sock.sendMessage(chatId, { text: menuMessage }, { quoted: message });
        }
    } else {
        await sock.sendMessage(chatId, { text: '*↢ حــــــالــــيـــاً هـذه القائمة خـاصة بالمالـك فـقط، 👑*' }, { quoted: message });
    }
}

module.exports = menu6Command;
