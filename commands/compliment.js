const { UNDER_MAINTENANCE } = require('../lib/messages');
const compliments = [
    "أنت رائع كما أنت!",
    "لديك حس فكاهي رائع!",
    "أنت مُراعٍ ولطيف بشكل لا يصدق.",
    "أنت أقوى مما تعتقد.",
    "أنت تضيء المكان!",
    "أنت صديق حقيقي.",
    "أنت تلهمني!",
    "إبداعك لا حدود له!",
    "لديك قلب من ذهب.",
    "أنت تُحدث فرقًا في العالم.",
    "إيجابيتك معدية!",
    "لديك أخلاقيات عمل رائعة.",
    "أنت تُظهر الأفضل في الناس.",
    "ابتسامتك تُنير يوم الجميع.",
    "أنت موهوب جدًا في كل ما تفعله.",
    "لطفك يجعل العالم مكانًا أفضل.",
    "لديك منظور فريد ورائع.",
    "حماسك ملهم حقًا!",
    "أنت قادر على تحقيق أشياء عظيمة.",
    "أنت دائمًا تعرف كيف تجعل شخصًا يشعر بأنه مميز.",
    "ثقتك بنفسك مثيرة للإعجاب.",
    "لديك روح جميلة.",
    "كرمك لا يعرف حدودًا.",
    "لديك عين رائعة للتفاصيل.",
    "شغفك مُحفز حقًا!",
    "أنت مستمع رائع.",
    "ضحكتك معدية.",
    "لديك موهبة طبيعية لجعل الآخرين يشعرون بالتقدير.",
    "أنت تجعل العالم مكانًا أفضل بمجرد وجودك فيه."
];

async function complimentCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) {
            console.log('Invalid message or chatId:', { message, chatId });
            return;
        }

        let userToCompliment;
        
        // Check for mentioned users
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToCompliment) {
            await sock.sendMessage(chatId, { 
                text: 'من فضلك منشن شخصًا أو رد على رسالته للثناء عليه!'
            });
            return;
        }

        const compliment = compliments[Math.floor(Math.random() * compliments.length)];

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.sendMessage(chatId, { 
            text: `مرحبًا @${userToCompliment.split('@')[0]}، ${compliment}`,
            mentions: [userToCompliment]
        });
    } catch (error) {
        console.error('Error in compliment command:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.sendMessage(chatId, { 
                    text: UNDER_MAINTENANCE
                });
            } catch (retryError) {
                console.error('Error sending retry message:', retryError);
            }
        } else {
            try {
                await sock.sendMessage(chatId, { 
                    text: UNDER_MAINTENANCE
                });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
}

module.exports = { complimentCommand };
