
const fs = require('fs');
const path = require('path');
const { getUserRank } = require('../lib/ranks');

const openingPhrases = [
    '*أحبّ قربك ودفء قلبك 🥺*',
    '*وجودك يكفي ليكون العالم أجمل 🤍*',
    '*الابتسامة حلوة، بس ابتسامتك أحلى 😊❤*',
    '*تفاءل دائمًا، فالخير قادم💗🥺*',
    '*انتِ مو صديق، انتِ كنز نادر والله ❣️🫶🏻*',
    '*مو أي إنسان يستحق كلمة صديق… بس إنت تستحقها 💞*',
    '*لا يجب أن تندم على شيء جعلك تبتسم 🫶🏻❣️*',
    '*لولا الخطأ ما أشرق نور الصّواب 💝*',
    '*الصمت لغة العظماء👌🏻*',
    '*بذكر الله تطمئن القلوب، وتمحى الذنوب ❤️‍🩹*',
    '*التواضع رفعة، والكبر مذلة ❣️*',
    '*إنمـا الأرواح على صَفَاء نواياها تتلاقى ..🤍🫶*'
];

function getRandomPhrase(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getActivityMessage(messageCount) {
    if (messageCount < 100) {
        const lowActivity = [
            '*حرك تفاعلك شوي 🥺*',
            '*تفاعلك ضعيف 😢*',
            '*تحتاج دفعة 💔*'
        ];
        return getRandomPhrase(lowActivity);
    } else if (messageCount >= 100 && messageCount < 1500) {
        const lowActivity = [
            '*حرك تفاعلك شوي 🥺*',
            '*تفاعلك ضعيف 😢*',
            '*تحتاج دفعة 💔*'
        ];
        return getRandomPhrase(lowActivity);
    } else if (messageCount >= 1500 && messageCount < 5000) {
        const mediumActivity = [
            '*تفاعلك حلو ❤*',
            '*ماشي الحال 😁*',
            '*تفاعلك متوسط 😊*'
        ];
        return getRandomPhrase(mediumActivity);
    } else if (messageCount >= 5000 && messageCount < 10000) {
        const highActivity = [
            '*تفاعلك نار 🔥*',
            '*تفاعلك قوي 💪*',
            '*ماحد يكدر لك 🥇*',
            '*مضيع نص عمرك بالكروب 🙂*'
        ];
        return getRandomPhrase(highActivity);
    } else {
        return '*ملك التفاعل 👑*';
    }
}

async function idCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط!' });
            return;
        }

        let targetUser = senderId;
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;

        if (quotedParticipant) {
            targetUser = quotedParticipant;
        } else if (mentionedJid && mentionedJid.length > 0) {
            targetUser = mentionedJid[0];
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participant = groupMetadata.participants.find(p => p.id === targetUser);
        
        let userName = targetUser.split('@')[0];
        try {
            const contactInfo = await sock.onWhatsApp(targetUser);
            if (contactInfo && contactInfo[0] && contactInfo[0].notify) {
                userName = contactInfo[0].notify;
            }
        } catch (e) {}

        const phoneNumber = targetUser.split('@')[0];
        const userId = phoneNumber.slice(-8);
        
        const userRank = await getUserRank(chatId, targetUser);
        
        const isGroupOwner = targetUser === groupMetadata.owner;
        let finalRank = userRank;
        if (isGroupOwner && userRank === 'عضو') {
            finalRank = 'المالـك الاسـاسي 👑';
        } else if (userRank === 'مالك') {
            finalRank = 'المالـك 👑';
        } else if (userRank === 'مدير') {
            finalRank = 'المدير 🌟';
        } else if (userRank === 'ادمن') {
            finalRank = 'الادمـن ⚡';
        } else if (userRank === 'مميز') {
            finalRank = 'المميـز ✨';
        } else {
            finalRank = 'العضـو 👤';
        }

        const messageCountPath = path.join(__dirname, '../data/messageCount.json');
        let messageCount = 0;
        try {
            const data = JSON.parse(fs.readFileSync(messageCountPath, 'utf8'));
            if (data[chatId] && data[chatId][targetUser]) {
                messageCount = data[chatId][targetUser];
            }
        } catch (e) {}

        const openingPhrase = getRandomPhrase(openingPhrases);
        const activityMessage = getActivityMessage(messageCount);

        const idMessage = `${openingPhrase}\n` +
                         `*٭ إسـمك ↢ ${userName}*\n` +
                         `*٭ رقـمك ↢ +${phoneNumber}*\n` +
                         `*٭ إيـديك ↢ ${userId}*\n` +
                         `*٭ رتـبـتك ↢ ${finalRank}*\n` +
                         `*٭ رسـائلك ↢ ${messageCount} - ${activityMessage}*\n` +
                         `*wa.me/+${phoneNumber} -*`;

        await sock.sendMessage(chatId, { 
            text: idMessage,
            mentions: [targetUser]
        }, { quoted: message });

    } catch (error) {
        console.error('Error in idCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ حدث خطأ في عرض المعلومات!' });
    }
}

module.exports = idCommand;
