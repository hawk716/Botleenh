

const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

// Define the correct path matching warn.js
const databaseDir = path.join(process.cwd(), 'data');
const warningsFilePath = path.join(databaseDir, 'warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsFilePath)) {
        fs.writeFileSync(warningsFilePath, JSON.stringify({}), 'utf8');
    }
    const data = fs.readFileSync(warningsFilePath, 'utf8');
    return JSON.parse(data);
}

async function warningsCommand(sock, chatId, message, mentionedJidList, quotedParticipant, senderId, isMyWarnings = false) {
    const warnings = loadWarnings();
    
    let userToCheck = null;

    // إذا كان الأمر "انذاراتي" - نعرض للمستخدم نفسه مباشرة بدون أي فحوصات
    if (isMyWarnings) {
        userToCheck = senderId;
        
        // عرض الإنذارات مباشرة
        const warningCount = (warnings[chatId] && warnings[chatId][userToCheck]) ? warnings[chatId][userToCheck] : 0;

        await sock.sendMessage(chatId, { 
            text: `*↢ عدد انذاراتك هي: ${warningCount}*`,
            mentions: [userToCheck]
        }, { quoted: message });
        return;
    }

    // فقط عند التحقق من إنذارات الآخرين نفحص صلاحيات المشرف
    const { getUserRank, getRankLevel } = require('../lib/ranks');
    const groupMetadata = await sock.groupMetadata(chatId);
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
    const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
    const senderLevel = getRankLevel(senderRank);
    
    try {
        // Check if sender has admin+ rank in bot OR is bot owner
        if (senderLevel < 2 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '*↢ هـذا الامـر يخـص〖 الادمن 〗*'
            }, { quoted: message });
            return;
        }
    } catch (adminError) {
        console.error('Error checking admin status:', adminError);
    }

    // Check if replying to a message (quoted message)
    if (quotedParticipant) {
        userToCheck = quotedParticipant;
    }
    // Check if mentioned a user
    else if (mentionedJidList && mentionedJidList.length > 0) {
        userToCheck = mentionedJidList[0];
    }

    // If no user specified
    if (!userToCheck) {
        await sock.sendMessage(chatId, { 
            text: '*↢ يرجى عمل منشن لمستخدم أو الرد على رسالته للتحقق من إنذاراته.*' 
        }, { quoted: message });
        return;
    }

    // Get warning count from the correct nested structure
    const warningCount = (warnings[chatId] && warnings[chatId][userToCheck]) ? warnings[chatId][userToCheck] : 0;

    await sock.sendMessage(chatId, { 
        text: `*↢ عدد انذارات المستخدم هي: ${warningCount}*`,
        mentions: [userToCheck]
    }, { quoted: message });
}

module.exports = warningsCommand;

