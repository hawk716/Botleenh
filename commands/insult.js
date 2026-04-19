const insults = [
    "أنت مثل السحابة. عندما تختفي، يصبح اليوم جميلاً!",
    "أنت تجلب الفرح للجميع عندما تغادر الغرفة!",
    "سأوافقك الرأي، لكن حينها سنكون مخطئين كلانا.",
    "أنت لست غبيًا؛ فقط لديك حظ سيء في التفكير.",
    "أسرارك دائمًا آمنة معي. أنا لا أستمع إليها أبدًا.",
    "أنت دليل على أن التطور يأخذ استراحة أحيانًا.",
    "لديك شيء على ذقنك... لا، الثالث للأسفل.",
    "أنت مثل تحديث البرنامج. كلما رأيتك، أفكر 'هل أحتاج إلى هذا حقًا الآن؟'",
    "أنت تجلب السعادة للجميع... تعرف، عندما تغادر.",
    "أنت مثل العملة المعدنية - وجهان ولا قيمة كبيرة.",
    "لديك شيء في عقلك... أوه انتظر، لا بأس.",
    "أنت السبب في وضع تعليمات على زجاجات الشامبو.",
    "أنت مثل السحابة. دائمًا تطفو بلا هدف حقيقي.",
    "نكاتك مثل الحليب منتهي الصلاحية - حامضة وصعبة الهضم.",
    "أنت مثل شمعة في الريح... عديم الفائدة عندما تصبح الأمور صعبة.",
    "لديك شيء فريد - قدرتك على إزعاج الجميع بالتساوي.",
    "أنت مثل إشارة الواي فاي - دائمًا ضعيف عند الحاجة.",
    "أنت دليل على أنه ليس الجميع بحاجة لفلتر ليكونوا غير جذابين.",
    "طاقتك مثل الثقب الأسود - تمتص الحياة من الغرفة.",
    "لديك الوجه المثالي للراديو.",
    "أنت مثل الازدحام المروري - لا أحد يريدك، لكن ها أنت هنا.",
    "أنت مثل القلم المكسور - بلا هدف.",
    "أفكارك أصلية جدًا، أنا متأكد أنني سمعتها جميعًا من قبل.",
    "أنت دليل حي على أن الأخطاء يمكن أن تكون مثمرة.",
    "أنت لست كسولًا؛ أنت فقط متحفز للغاية لعدم فعل شيء.",
    "عقلك يعمل بنظام ويندوز 95 - بطيء وقديم.",
    "أنت مثل مطب السرعة - لا أحد يحبك، لكن الجميع يضطر للتعامل معك.",
    "أنت مثل سحابة من البعوض - مزعج فقط.",
    "أنت تجمع الناس معًا... للحديث عن مدى إزعاجك."
];

async function insultCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) {
            console.log('Invalid message or chatId:', { message, chatId });
            return;
        }

        let userToInsult;
        
        // Check for mentioned users
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToInsult = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToInsult = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToInsult) {
            await sock.sendMessage(chatId, { 
                text: 'من فضلك منشن شخصًا أو رد على رسالته لإهانته!'
            });
            return;
        }

        const insult = insults[Math.floor(Math.random() * insults.length)];

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.sendMessage(chatId, { 
            text: `مرحبًا @${userToInsult.split('@')[0]}، ${insult}`,
            mentions: [userToInsult]
        });
    } catch (error) {
        console.error('Error in insult command:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.sendMessage(chatId, { 
                    text: 'من فضلك حاول مرة أخرى بعد ثوانٍ قليلة.'
                });
            } catch (retryError) {
                console.error('Error sending retry message:', retryError);
            }
        } else {
            try {
                await sock.sendMessage(chatId, { 
                    text: 'حدث خطأ أثناء إرسال الإهانة.'
                });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
}

module.exports = { insultCommand };
