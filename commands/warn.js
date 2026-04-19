const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

const databaseDir = path.join(process.cwd(), 'data');
const warningsPath = path.join(databaseDir, 'warnings.json');

function initializeWarningsFile() {
    if (!fs.existsSync(databaseDir)) {
        fs.mkdirSync(databaseDir, { recursive: true });
    }
    if (!fs.existsSync(warningsPath)) {
        fs.writeFileSync(warningsPath, JSON.stringify({}), 'utf8');
    }
}

async function warnCommand(sock, chatId, senderId, mentionedJids, message, warnCount = 1) {
    try {
        initializeWarningsFile();

        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: 'هذا الأمر يمكن استخدامه في المجموعات فقط!' });
            return;
        }

        const { getUserRank, getRankLevel } = require('../lib/ranks');
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        try {
            const { isBotAdmin } = await isAdmin(sock, chatId, senderId);

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: '❌ خطأ: يرجى جعل البوت مشرف أولاً لاستخدام هذا الأمر.' });
                return;
            }

            if (senderLevel < 2 && !message.key.fromMe) {
                await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 الادمن 〗*' });
                return;
            }
        } catch (adminError) {
            console.error('Error checking admin status:', adminError);
            await sock.sendMessage(chatId, { text: '❌ خطأ: يرجى التأكد من أن البوت مشرف في هذه المجموعة.' });
            return;
        }

        if (warnCount < 1 || warnCount > 3) {
            await sock.sendMessage(chatId, { text: '❌ يجب أن يكون عدد الانذارات من 1 إلى 3 فقط!' });
            return;
        }

        let userToWarn;

        if (mentionedJids && mentionedJids.length > 0) {
            userToWarn = mentionedJids[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWarn = message.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToWarn) {
            await sock.sendMessage(chatId, { text: '❌ خطأ: يرجى عمل منشن للمستخدم أو الرد على رسالته لإنذاره!' });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            let warnings = {};
            try {
                warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
            } catch (error) {
                warnings = {};
            }

            if (!warnings[chatId]) warnings[chatId] = {};
            if (!warnings[chatId][userToWarn]) warnings[chatId][userToWarn] = 0;

            warnings[chatId][userToWarn] += warnCount;

            if (warnings[chatId][userToWarn] > 3) {
                warnings[chatId][userToWarn] = 3;
            }

            fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));

            const currentWarnings = warnings[chatId][userToWarn];
            const remainingWarnings = 3 - currentWarnings;

            if (currentWarnings >= 3) {
                await sock.sendMessage(chatId, { 
                    text: `*↢ تم اعطائـه ${warnCount} انذار*\n*↢ وصل للحد الاقصى 3 انذارات*\n*↢ جاري طرده...*`,
                    mentions: [userToWarn]
                });

                await new Promise(resolve => setTimeout(resolve, 1000));

                await sock.sendMessage(chatId, { 
                    text: `*↢ تم طرد @${userToWarn.split('@')[0]} بعد 3 انذارات*`,
                    mentions: [userToWarn]
                });

                await new Promise(resolve => setTimeout(resolve, 500));
                await sock.groupParticipantsUpdate(chatId, [userToWarn], "remove");

                await new Promise(resolve => setTimeout(resolve, 2000));
                warnings[chatId][userToWarn] = 0;
                fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
            } else {
                await sock.sendMessage(chatId, { 
                    text: `*↢ تم اعطائـه ${warnCount} انذار*\n*↢ متبقي لطـرده ${remainingWarnings} انذار*`,
                    mentions: [userToWarn]
                }, { quoted: message });
            }
        } catch (error) {
            console.error('Error in warn command:', error);
            await sock.sendMessage(chatId, { text: '❌ فشل إنذار المستخدم!' });
        }
    } catch (error) {
        console.error('Error in warn command:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.sendMessage(chatId, { text: '❌ تم الوصول للحد الأقصى. يرجى المحاولة مرة أخرى بعد بضع ثوانٍ.' });
            } catch (retryError) {
                console.error('Error sending retry message:', retryError);
            }
        } else {
            try {
                await sock.sendMessage(chatId, { text: '❌ فشل إنذار المستخدم. تأكد من أن البوت مشرف وله الصلاحيات الكافية.' });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
}

module.exports = warnCommand;