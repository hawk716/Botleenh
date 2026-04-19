
const { addWelcome, delWelcome, isWelcomeOn, addGoodbye, delGoodBye, isGoodByeOn } = require('../lib/index');
const { delay } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const welcomeStates = new Map();

async function handleWelcome(sock, chatId, message, match) {
    const senderId = message.key.remoteJid === chatId ? message.key.participant : message.key.remoteJid;

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*إعداد رسائل الترحيب*\n\n*تفعيل الترحيب* — تفعيل رسائل الترحيب\n*ضع ترحيب* — تخصيص رسالة الترحيب\n*الترحيب* — عرض الترحيب الحالي\n*مسح الترحيب* — إعادة للافتراضي\n*تعطيل الترحيب* — تعطيل رسائل الترحيب\n\n*المتغيرات المتاحة:*\n{الاسم}, {الوقت}, {الرقم}, {الايدي}, {القوانين}`,
            quoted: message
        });
    }

    const lower = match.toLowerCase();
    
    if (lower === 'تفعيل') {
        if (await isWelcomeOn(chatId)) {
            return sock.sendMessage(chatId, { text: '*رسائل الترحيب مفعلة بالفعل.*' }, { quoted: message });
        }
        const defaultMsg = '*اجعل الرد أدباً لا حرباً.*\n*༺═─────────────═༻*\n*ᯓ 𝑵𝒂𝒎𝒆 {الاسم}*\n*ᯓ 𝑫𝒂𝒕𝒆 {الوقت}*\n*ᯓ 𝑰𝑫 {الايدي}*';
        await addWelcome(chatId, true, defaultMsg);
        return sock.sendMessage(chatId, { text: '*↢ تـم تفعيل الترحيب بنجاح... ☑️*' }, { quoted: message });
    }

    if (lower === 'تعطيل') {
        if (!(await isWelcomeOn(chatId))) {
            return sock.sendMessage(chatId, { text: '*رسائل الترحيب معطلة بالفعل.*' }, { quoted: message });
        }
        await delWelcome(chatId);
        return sock.sendMessage(chatId, { text: '*↢ تـم تعطيل الترحيب بنجاح... ☑️*' }, { quoted: message });
    }

    if (lower === 'ضع') {
        welcomeStates.set(chatId, { senderId, waiting: true });
        return sock.sendMessage(chatId, {
            text: '*↢ ارسـل الترحيب الجديد لاضافته يمكنك استخدام المتغيرات 👇🏻*\n*{القوانين}, {الاسم}, {الايدي}, {الرقم}, {الوقت}*'
        }, { quoted: message });
    }

    if (lower === 'الترحيب') {
        const data = await isWelcomeOn(chatId);
        if (!data) {
            const defaultMsg = '*اجعل الرد أدباً لا حرباً.*\n*༺═─────────────═༻*\n*ᯓ 𝑵𝒂𝒎𝒆 {الاسم}*\n*ᯓ 𝑫𝒂𝒕𝒆 {الوقت}*\n*ᯓ 𝑰𝑫 {الايدي}*';
            return sock.sendMessage(chatId, { text: `*الترحيب الافتراضي:*\n\n${defaultMsg}` }, { quoted: message });
        }
        return sock.sendMessage(chatId, { text: `*الترحيب الحالي:*\n\n${data.message}` }, { quoted: message });
    }

    if (lower === 'مسح') {
        const defaultMsg = '*اجعل الرد أدباً لا حرباً.*\n*༺═─────────────═༻*\n*ᯓ 𝑵𝒂𝒎𝒆 {الاسم}*\n*ᯓ 𝑫𝒂𝒕𝒆 {الوقت}*\n*ᯓ 𝑰𝑫 {الايدي}*';
        await addWelcome(chatId, true, defaultMsg);
        return sock.sendMessage(chatId, { text: '*↢ تـم إعادة تعين الترحيب الى الافتراضي بنجاح ... ☑️*' }, { quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: '*أمر غير صالح. استخدم: تفعيل الترحيب، ضع ترحيب، الترحيب، مسح الترحيب، تعطيل الترحيب*',
        quoted: message
    });
}

async function handleWelcomeText(sock, chatId, senderId, text) {
    const state = welcomeStates.get(chatId);
    if (!state || !state.waiting || state.senderId !== senderId) return false;

    await addWelcome(chatId, true, text);
    welcomeStates.delete(chatId);
    await sock.sendMessage(chatId, { text: '*↢ تـم حفظ الترحيب الجديد بنجاح... ☑️*' });
    return true;
}

function replaceVars(text, name, time, number, id, rules) {
    return text
        .replace(/{الاسم}/g, name)
        .replace(/{الوقت}/g, time)
        .replace(/{الرقم}/g, number)
        .replace(/{الايدي}/g, id)
        .replace(/{القوانين}/g, rules || 'لم يتم تعيين قوانين');
}

async function sendWelcome(sock, chatId, userId) {
    try {
        const data = await isWelcomeOn(chatId);
        if (!data) {
            console.log('Welcome not enabled for', chatId);
            return;
        }

        const name = `@${userId.split('@')[0]}`;
        const time = new Date().toLocaleDateString('ar-EG');
        const number = userId.split('@')[0];
        const id = userId;
        
        const rulesPath = path.join(__dirname, '../data/grouprules.json');
        let rules = 'لم يتم تعيين قوانين';
        if (fs.existsSync(rulesPath)) {
            const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
            rules = rulesData[chatId] || 'لم يتم تعيين قوانين';
        }

        const welcomeMessage = data.message || '*اجعل الرد أدباً لا حرباً.*\n*༺═─────────────═༻*\n*ᯓ 𝑵𝒂𝒎𝒆 {الاسم}*\n*ᯓ 𝑫𝒂𝒕𝒆 {الوقت}*\n*ᯓ 𝑰𝑫 {الايدي}*';
        const msg = replaceVars(welcomeMessage, name, time, number, id, rules);
        
        console.log('Sending welcome message to', userId);
        await sock.sendMessage(chatId, { text: msg, mentions: [userId] });
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
}

async function handleGoodbye(sock, chatId, message, match) {
    const lower = match?.toLowerCase();

    if (!match) {
        return sock.sendMessage(chatId, {
            text: '*إعداد رسائل الوداع*\n\n*تفعيل الوداع* — تفعيل رسائل الوداع\n*تخصيص الوداع رسالتك* — تخصيص رسالة الوداع\n*تعطيل الوداع* — تعطيل رسائل الوداع\n\n*المتغيرات المتاحة:*\n{الاسم}, {الرقم}',
            quoted: message
        });
    }

    if (lower === 'on' || lower === 'off') {
        return;
    }

    if (lower === 'تفعيل') {
        if (await isGoodByeOn(chatId)) {
            return sock.sendMessage(chatId, { text: '*رسائل الوداع مفعلة بالفعل.*' }, { quoted: message });
        }
        await addGoodbye(chatId, true, 'وداعاً {الاسم} 👋');
        return sock.sendMessage(chatId, { text: '*تم تفعيل رسائل الوداع.*' }, { quoted: message });
    }

    if (lower === 'تعطيل') {
        if (!(await isGoodByeOn(chatId))) {
            return sock.sendMessage(chatId, { text: '*رسائل الوداع معطلة بالفعل.*' }, { quoted: message });
        }
        await delGoodBye(chatId);
        return sock.sendMessage(chatId, { text: '*تم تعطيل رسائل الوداع.*' }, { quoted: message });
    }

    if (lower.startsWith('تخصيص')) {
        const customMessage = match.substring(match.indexOf(' ') + 1);
        if (!customMessage || customMessage === 'تخصيص') {
            return sock.sendMessage(chatId, { text: '*الرجاء تقديم رسالة وداع مخصصة.*' }, { quoted: message });
        }
        await addGoodbye(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: '*تم تعيين رسالة الوداع المخصصة.*' }, { quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: '*أمر غير صالح. استخدم: تفعيل الوداع، تخصيص الوداع، تعطيل الوداع*',
        quoted: message
    });
}

module.exports = { handleWelcome, handleWelcomeText, sendWelcome, handleGoodbye };
