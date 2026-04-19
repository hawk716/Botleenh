
async function menu1Command(sock, chatId, message) {
    const menuMessage = `*- اوامــر الادارة.*
*ٴ┈┈─┈─┈─┈─┈┈─┈─┈─┈*
*✧ اوامــر الـرفـع والتنـزيـل ✧*
*ٴ┈┈─┈─┈─┈─┈┈─┈─┈─┈*
*- رفع ↢ ادمن بكامل الصلاحيات*
*- رفع ↢ مالك*
*- رفع - تنزيل ↢ مدير*
*- رفع - تنزيل ↢ ادمن*
*- رفع - تنزيل ↢ مميز*
*- الرتبة↢ عرض رتبة العضو*
*- عدد الرتب ↢احصائيات بالعدد*
*- كشف الرتب ↢ احصائيات عام*   
*ٴ┈┈─┈─┈─┈─┈┈─┈─┈─┈*
*✧ اوامــر المســح ✧*
*ٴ┈┈─┈─┈─┈─┈┈─┈─┈─┈*
*- مسح ↢حـذف رسـالة*
*- مسح الكل ↢مسح جميع الرتب*
*- مسح المدراء*
*- مسح الادمنيه*
*- مسح المميزين*
*- مسح المحظورين*
*- مسح المقيدين*
*- مسح الانذارات للكل*
*ٴ┈┈─┈─┈─┈─┈┈─┈─┈─┈*
*✧ اوامـر الحظـر،الكتـم،التقييـد ✧*
*ٴ┈┈─┈─┈─┈─┈┈─┈─┈─┈*
*- حظر - الغاء الحظر*   
*- طرد*  
*- تقييد - الغاء التقييد*  
*- تقييد + الوقت*     
*- انذار - انذار + العدد*     
*- الانذارات*     
*- انذاراتي*      
*- مسح الانذارات*`;

    try {
        await sock.sendMessage(chatId, { 
            text: menuMessage,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD',
                    serverMessageId: -1
                }
            }
        },{ quoted: message });
    } catch (error) {
        console.error('Error in menu1 command:', error);
        await sock.sendMessage(chatId, { text: menuMessage },{ quoted: message });
    }
}

module.exports = menu1Command;
