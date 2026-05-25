const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fs = require('fs');
// const path = require('path'); // Already declared above

// دالة لتسجيل السجلات في ملف
function logToFile(message) {
    const logFile = path.join(__dirname, 'data', 'debug.log');
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(logFile, logLine);
    } catch(e) {}
}
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { isSudo, setPinlock } = require('./lib/index');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread');
const { getUserRank, getRankLevel, setUserRank } = require('./lib/ranks');
const { isRestricted } = require('./lib/restrictions');
const rankStatsCommand = require('./commands/rankstats');
const showRanksCommand = require('./commands/showranks');
const showOwnersCommand = require('./commands/showowners');
const checkRankCommand = require('./commands/checkrank');
const setOwnerCommand = require('./commands/setowner');
const setManagerCommand = require('./commands/setmanager');
const setAdminCommand = require('./commands/setadmin');
const restrictCommand = require('./commands/restrict');
const unrestrictCommand = require('./commands/unrestrict');

const demoteManagerCommand = require('./commands/demotemanager');
const demoteAdminCommand = require('./commands/demoteadmin');
const setVipCommand = require('./commands/setvip');
const demoteVipCommand = require('./commands/demotevip');
const clearAllRanksCommand = require('./commands/clearallranks');
const clearManagersCommand = require('./commands/clearmanagers');
const clearAdminsCommand = require('./commands/clearadmins');
const clearVipsCommand = require('./commands/clearvips');
const clearBannedCommand = require('./commands/clearbanned');
const clearRestrictedCommand = require('./commands/clearrestricted');

// Command imports for replies
const { addReplyCommand, deleteReplyCommand, listRepliesCommand, checkReply, handleReplyProcess } = require('./commands/replies');

// Command imports
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const menu1Command = require('./commands/menu1');
const menu2Command = require('./commands/menu2');
const menu3Command = require('./commands/menu3');
const menu4Command = require('./commands/menu4');
const menu5Command = require('./commands/menu5');
const menu6Command = require('./commands/menu6');
const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { tictactoeCommand, handleTicTacToeMove, joinTicTacToeGame } = require('./commands/tictactoe');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const { handleLockCommand, handleLockDetection } = require('./commands/lock');
const { handleToggleCommand } = require('./commands/toggle');
const { handleCmdLockCommand } = require('./commands/cmdlock');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const zodiacCommand = require('./commands/zodiac');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const weatherDetailedCommand = require('./commands/weatherdetailed');
const newsCommand = require('./commands/news');
const arabicNewsCommand = require('./commands/arabic_news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');
const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./commands/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/goodbye');
const githubCommand = require('./commands/github');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const groupInfoCommand = require('./commands/groupinfo');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { simpCommand } = require('./commands/simp');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const { setGroupDescription, clearGroupDescription, setGroupName, setGroupPhoto } = require('./commands/groupmanage');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const aiCommand = require('./commands/ai');
const gptCommand = require('./commands/gpt');
const geminiCommand = require('./commands/gemini');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const createImageCommand = require('./commands/createimage');
const { videoCommand } = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { miscCommand, handleHeart } = require('./commands/misc');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const { zodiacCmd, handleZodiacResponse, ageCmd, handleAgeImage, handleAgeTrigger, jokeCmd, pendingZodiac, ageRequests } = require('./commands/zodiac-age');
const { chooseCommand } = require('./commands/choose');
const updateCommand = require('./commands/update');
const { loveCommand, hateCommand, luckCommand, faceCommand, wishCommand, starsCommand, moodCommand, stupidCommand, whoLovesCommand, whoHatesCommand } = require('./commands/fun');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/anticall');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const soraCommand = require('./commands/sora');
const grouplinkCommand = require('./commands/grouplink');
const kickmeCommand = require('./commands/kickme');
const demotemeCommand = require('./commands/demoteme');
const mutehimCommand = require('./commands/mutehim');
const callownerCommand = require('./commands/callowner');
const toggleSettingsCommand = require('./commands/togglesettings');
const { isFeatureEnabled } = require('./lib/groupSettings');
const { handleCustomCommandManagement, getOriginalCommand } = require('./commands/customcommands');
const { handleSubscriptionManagement, checkUserSubscription, requestSubscription } = require('./commands/subscription');
const { handleWelcome, handleWelcomeText, sendWelcome, handleGoodbye } = require('./lib/welcome');
const wordban = require('./commands/wordban');
const { getToggle, TOGGLE_TYPES } = require('./lib/toggleSystem');
const idCommand = require('./commands/id');
const { setRules, getRules, clearRules, handleRulesText, setNickname, getNickname, pinMessage, unpinMessage, unpinAll } = require('./commands/groupmanage');

// Command imports for Arabic commands
const antilinkArabic = require('./commands/antilink');
const antitagArabic = require('./commands/antitag');
const welcomeArabic = require('./commands/welcome');
const goodbyeArabic = require('./commands/goodbye');
const chatbotArabic = require('./commands/chatbot');
const antideleteArabic = require('./commands/antidelete');

// Global settings
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = "https://whatsapp.com/channel/0029Va90zAnIHphOuO8Msp3A";
global.ytch = "Mr Unique Hacker";

// Channel info removed - see vop.js for future use

async function handleMessages(sock, messageUpdate, printLog) {
    let chatId;
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        chatId = message.key.remoteJid;

        await handleAutoread(sock, message);

        if (message.message) {
            storeMessage(sock, message);
        }

        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const senderId = message.key.participant || message.key.remoteJid;
        console.log(`[Message Handler] senderId: ${senderId}, isGroup: ${chatId.endsWith('@g.us')}`);
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            ''
        ).toLowerCase().trim();

        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        const normalizedMessage = userMessage.replace(/\s+/g, '_');

        const arabicCommands = ['الاوامر', 'م1', 'م2', 'م3', 'م4', 'م5', 'م6', '1', '2', '3', '4', '5', '6', 'رفع', 'تنزيل', 'حظر', 'طرد', 'كتم', 'اسئلة', 'أسئلة'];
        if (arabicCommands.some(cmd => userMessage.includes(cmd))) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }

        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (!data.isPublic && !message.key.fromMe && !senderIsSudo) {
                return;
            }
        } catch (error) {
            console.error('Error checking access mode:', error);
        }

        const messageWithoutDot = userMessage.startsWith('.') ? userMessage.slice(1) : userMessage;
        const cleanMessage = messageWithoutDot;

        // Check if this is a subscription-related command - allow these even if not subscribed
        const isSubscriptionCommand = cleanMessage.includes('اضف اشتراك') || 
                                      cleanMessage.includes('اضف_اشتراك') ||
                                      cleanMessage.includes('تفعيل الاشتراك') ||
                                      cleanMessage.includes('تفعيل_الاشتراك') ||
                                      cleanMessage.includes('حذف اشتراك') ||
                                      cleanMessage.includes('حذف_اشتراك') ||
                                      cleanMessage.includes('عرض الاشتراك') ||
                                      cleanMessage.includes('عرض_الاشتراك') ||
                                      userMessage.includes('chat.whatsapp.com');

        if (isGroup && !message.key.fromMe && !senderIsSudo && !isSubscriptionCommand) {
            const subCheck = await checkUserSubscription(sock, chatId, senderId);
            if (subCheck && subCheck.remaining && subCheck.remaining <= 0) {
                try {
                    await sock.sendMessage(chatId, { delete: message.key });
                } catch (e) {}
                await sock.sendMessage(chatId, {
                    text: `*↫ @${senderId.split('@')[0]} عليك الاشتـراك في قنـاة البـوت اولاً لارسـال الـرسائل.*\n*- 𝑳𝒊𝒏𝒌: ${subCheck.inviteLink || subCheck.groupId}*`,
                    mentions: [senderId],
                });
                return;
            }
        }

        const isUnbanCommand = cleanMessage?.startsWith('الغاء حظر') ||
                              cleanMessage?.startsWith('الغاء_حظر') ||
                              cleanMessage?.startsWith('الغاء الحظر') ||
                              cleanMessage?.startsWith('الغاء_الحظر');

        if (isBanned(senderId) && !isUnbanCommand) {
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ أنت محظور من استخدام البوت. اتصل بمسؤول لإلغاء الحظر.'
                });
            }
            return;
        }

        if (isGroup && await isRestricted(chatId, senderId)) {
            try {
                await sock.sendMessage(chatId, { delete: message.key });
            } catch (e) {
                console.error('Error deleting restricted user message:', e);
            }
            return;
        }

        if (isGroup) {
            if (await handleTagDetection(sock, chatId, message, senderId)) return;
        }

        if (isGroup && userMessage) {
            const handledWelcome = await handleWelcomeText(sock, chatId, senderId, rawText);
            if (handledWelcome) return;
        }

        if (userMessage) {
            const handledRules = await handleRulesText(sock, chatId, senderId, rawText);
            if (handledRules) return;
        }

        if (/^[1-3]$/.test(userMessage)) {
            const { answerTrivia } = require('./commands/trivia');
            const answered = answerTrivia(sock, chatId, userMessage);
            if (answered) {
                return;
            }
        }

        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender' || userMessage === 'استسلام' || userMessage === 'مستسلم') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

        if (await handleZodiacResponse(sock, chatId, message, senderId, userMessage)) return;

        if (!isGroup && message.message?.imageMessage) {
            if (await handleAgeImage(sock, chatId, message, senderId)) return;
        }

        if (!isGroup && await handleAgeTrigger(sock, chatId, message, senderId, rawText)) return;

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        if (userMessage.startsWith('.')) {
            return;
        }

        const isArabicCommand = /^[\u0621-\u064Aa-zA-Z0-9\s\-_]+$/.test(messageWithoutDot) && messageWithoutDot.length <= 200 && messageWithoutDot.length > 0;

        const downloadCommands = ['اغنية', 'فيديو', 'انستقرام', 'انستا', 'فيسبوك', 'تيك توك', 'سبوتيفاي', 'قصص انستا'];
        const isDownloadCommand = downloadCommands.some(cmd => cleanMessage === cmd || cleanMessage.startsWith(cmd + ' '));
        const hasUrlInMessage = /https?:\/\//.test(cleanMessage);

        if (!isArabicCommand && !isDownloadCommand) {
            await handleAutotypingForMessage(sock, chatId, userMessage);

            if (isGroup) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
                await Antilink(message, sock);
                await handleChatbotResponse(sock, chatId, message, userMessage, senderId);

                await handleMentionDetection(sock, chatId, message);
                await handleLockDetection(sock, chatId, message, senderId);
            }
            return;
        }

        const normalizedCleanMessage = cleanMessage.replace(/\s+/g, '_');

        let commandExecuted = false;
        let wasCustomCommandTransformed = false;

        const originalCommand = getOriginalCommand(cleanMessage, chatId);
        console.log(`[DEBUG] cleanMessage="${cleanMessage}", originalCommand="${originalCommand}"`);
        logToFile(`[DEBUG] cleanMessage="${cleanMessage}", originalCommand="${originalCommand}"`);
        console.log(`[DEBUG customCommands] checking: "${cleanMessage}"`);
        logToFile(`[DEBUG customCommands] checking: "${cleanMessage}"`);
        
if (originalCommand) {
            const newCmd = originalCommand;
            console.log(`[Custom Command] EXECUTING directly: "${newCmd}" for alias "${cleanMessage}"`);
            logToFile(`[Custom Command] EXECUTING directly: "${newCmd}" for alias "${cleanMessage}"`);
            
            // تنفيذ مباشرة بدون switch
            if (newCmd === 'م1' || newCmd === '1') {
                await menu1Command(sock, chatId, message);
                await showTypingAfterCommand(sock, chatId);
                return;
            } else if (newCmd === 'م2' || newCmd === '2') {
                await menu2Command(sock, chatId, message);
                await showTypingAfterCommand(sock, chatId);
                return;
            } else if (newCmd === 'م3' || newCmd === '3') {
                await menu3Command(sock, chatId, message);
                await showTypingAfterCommand(sock, chatId);
                return;
            } else if (newCmd === 'م4' || newCmd === '4') {
                await menu4Command(sock, chatId, message);
                await showTypingAfterCommand(sock, chatId);
                return;
            } else if (newCmd === 'م5' || newCmd === '5') {
                await menu5Command(sock, chatId, message);
                await showTypingAfterCommand(sock, chatId);
                return;
            } else if (newCmd === 'م6' || newCmd === '6') {
                await menu6Command(sock, chatId, message);
                await showTypingAfterCommand(sock, chatId);
                return;
            } else if (newCmd === 'حب') {
                await loveCommand(sock, chatId, message, senderId);
                await showTypingAfterCommand(sock, chatId);
                return;
            } else if (newCmd === 'كره') {
                await hateCommand(sock, chatId, message, senderId);
                await showTypingAfterCommand(sock, chatId);
                return;
            } else if (newCmd === 'نكتة' || newCmd === 'نكته') {
                await jokeCmd(sock, chatId, message);
                await showTypingAfterCommand(sock, chatId);
                return;
            } else {
                console.log(`[Custom Command] No handler for: "${newCmd}"`);
                logToFile(`[Custom Command] No handler for: "${newCmd}"`);
            }
            return;
        }

        const customCmdHandled = await handleCustomCommandManagement(sock, chatId, message, senderId, cleanMessage);
        console.log(`[Main Debug] customCmdHandled: ${customCmdHandled}, cleanMessage: "${cleanMessage}"`);
        if (customCmdHandled) {
            commandExecuted = true;
            await showTypingAfterCommand(sock, chatId);
            return;
        }

        let isSenderAdmin = false;
        let isBotAdmin = false;
        if (isGroup) {
            const adminStatus = await isAdmin(sock, chatId, senderId, message);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;
        }

        const subHandled = await handleSubscriptionManagement(sock, chatId, message, senderId, cleanMessage, isSenderAdmin);
        if (subHandled) {
            commandExecuted = true;
            await showTypingAfterCommand(sock, chatId);
            return;
        }

        if (isGroup && userMessage) {
            await handleBadwordDetection(sock, chatId, message, userMessage, senderId);

            await Antilink(message, sock);
        }

        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    await sock.sendMessage(chatId, { text: pmState.message || 'الرسائل الخاصة محظورة. الرجاء التواصل مع المالك في المجموعات فقط.' });
                    await new Promise(r => setTimeout(r, 1500));
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (e) { }
                    return;
                }
            } catch (e) { }
        }

        const adminCommands = ['قفل', 'فتح', 'حظر', 'الغاء_الحظر', 'الغاء الحظر', 'رفع', 'تنزيل', 'طرد', 'منشن_الكل', 'منشن الكل', 'منشن_الاعضاء', 'منشن الاعضاء', 'منشن_مخفي', 'منشن مخفي', 'منع_الروابط', 'منع الروابط', 'منع_التاك', 'منع التاك', 'تغيير_الوصف', 'تغيير الوصف', 'تغيير_الاسم', 'تغيير الاسم', 'تغيير_الصورة', 'تغيير الصورة'];
        const ownerCommands = ['الوضع', 'حالة_تلقائية', 'حالة تلقائية', 'منع_الحذف', 'منع الحذف', 'مسح_المؤقت', 'مسح المؤقت', 'تغيير_صورة_البوت', 'تغيير صورة البوت', 'مسح_الجلسة', 'مسح الجلسة', 'تفاعل_تلقائي', 'تفاعل تلقائي', 'كتابة_تلقائية', 'كتابة تلقائية', 'قراءة_تلقائية', 'قراءة تلقائية', 'حظر_الخاص', 'حظر الخاص'];

        const isOwnerCommand = ownerCommands.some(cmd => cleanMessage === cmd || normalizedCleanMessage === cmd || cleanMessage.startsWith(cmd + ' ') || normalizedCleanMessage.startsWith(cmd.replace(/\s/g, '_') + '_'));

        if (isOwnerCommand && !message.key.fromMe && !senderIsSudo) {
            await sock.sendMessage(chatId, { text: '❌ هذا الأمر متاح فقط للمالك!' }, { quoted: message });
            return;
        }



        const menuCommands = ['الاوامر', 'م1', 'م2', 'م3', 'م4', 'م5', 'م6', '1', '2', '3', '4', '5', '6'];
        // تحقق إذا كان الأمر مخصص قبل فحص الأوامر المعطلة
        const isCustomCommand = wasCustomCommandTransformed;
        if (isGroup && menuCommands.includes(cleanMessage) && !isFeatureEnabled(chatId, 'menus_enabled') && !message.key.fromMe && !senderIsSudo && !isCustomCommand) {
            await sock.sendMessage(chatId, {
                text: '*↢ امـ ( الاوامر ) معطل حالياً.*'
            }, { quoted: message });
            return;
        }

        const gameCommands = ['اكس او', 'الرجل المشنوق', 'خمن', 'اسئلة', 'أسئلة', 'صراحة', 'جرأة'];
        if (isGroup && gameCommands.some(cmd => cleanMessage === cmd || cleanMessage.startsWith(cmd + ' ')) && !isFeatureEnabled(chatId, 'games_enabled')) {
            await sock.sendMessage(chatId, {
                text: '*↢ امـر ( الالعاب ) معطل حالياً.*'
            }, { quoted: message });
            return;
        }

        const isDownloadEnabled = isFeatureEnabled(chatId, 'download_enabled');
        console.log(`[DOWNLOAD] Command: ${cleanMessage}, isDownloadCommand: ${isDownloadCommand}, isDownloadEnabled: ${isDownloadEnabled}, isGroup: ${isGroup}, senderIsSudo: ${senderIsSudo}, fromMe: ${message.key.fromMe}`);

        if (isGroup && isDownloadCommand && !isDownloadEnabled && !message.key.fromMe && !senderIsSudo) {
            await sock.sendMessage(chatId, {
                text: '*↢ امـر ( التحميل ) معطل حالياً ⚠️*\n*↢ لا يعمـل سوى مع " المالك " فقـط*'
            }, { quoted: message, contextInfo: {} });
            return;
        }

        const mentionCommands = ['منشن الكل', 'منشن الاعضاء', 'منشن مخفي'];
        if (isGroup && mentionCommands.some(cmd => cleanMessage === cmd || cleanMessage.startsWith(cmd + ' ')) && !isFeatureEnabled(chatId, 'mention_enabled') && !message.key.fromMe && !senderIsSudo) {
            await sock.sendMessage(chatId, {
                text: '*↢ امـر ( المنشن ) معطل حالياً.*'
            }, { quoted: message });
            return;
        }

        if (cleanMessage === 'نعم' || cleanMessage === 'لا') {
            await demotemeCommand(sock, chatId, message, senderId, cleanMessage);
            return;
        }

        if (zodiacCommand.isWaitingForBirthdate && zodiacCommand.isWaitingForBirthdate(senderId)) {
            await zodiacCommand.handleBirthdateInput(sock, chatId, message, senderId, rawText);
            return;
        }

        switch (true) {
            case cleanMessage === 'الاوامر':
                await helpCommand(sock, chatId, message, global.channelLink);
                commandExecuted = true;
                break;

            case cleanMessage === 'احصائيات الرتب' || normalizedCleanMessage === 'احصائيات_الرتب':
                await rankStatsCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'كشف الرتب' || normalizedCleanMessage === 'كشف_الرتب':
                await showRanksCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'المالكين' || normalizedCleanMessage === 'المالكين':
                await showOwnersCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'الرتبه' || normalizedCleanMessage === 'الرتبه':
                await checkRankCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'الايدي' || cleanMessage.startsWith('الايدي ') || normalizedCleanMessage === 'الايدي' || normalizedCleanMessage.startsWith('الايدي_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.ID)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, {
                        text: '*↢ امـر الايدي معطل من قبل المالك*'
                    }, { quoted: message, contextInfo: {} });
                    commandExecuted = true;
                    break;
                }
                await idCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'تقيد' || cleanMessage.startsWith('تقيد ') || normalizedCleanMessage === 'تقيد' || normalizedCleanMessage.startsWith('تقيد_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.BAN)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, {
                        text: '*↢ امـر التقييد معطل من قبل المالك*'
                    }, { quoted: message, contextInfo: {} });
                    commandExecuted = true;
                    break;
                }
                await restrictCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'الغاء التقيد' || cleanMessage.startsWith('الغاء التقيد ') || cleanMessage === 'الغاء التقييد' || cleanMessage.startsWith('الغاء التقييد ') || normalizedCleanMessage === 'الغاء_التقيد' || normalizedCleanMessage.startsWith('الغاء_التقيد_') || normalizedCleanMessage === 'الغاء_التقييد' || normalizedCleanMessage.startsWith('الغاء_التقييد_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.BAN)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, {
                        text: '*↢ امـر التقييد معطل من قبل المالك*'
                    }, { quoted: message, contextInfo: {} });
                    commandExecuted = true;
                    break;
                }
                await unrestrictCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;

            case cleanMessage === 'مسح الكل' || normalizedCleanMessage === 'مسح_الكل':
                await clearAllRanksCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'مسح المدراء' || normalizedCleanMessage === 'مسح_مدراء':
                await clearManagersCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'مسح الادمنيه' || normalizedCleanMessage === 'مسح_الادمنيه':
                await clearAdminsCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'مسح المميزين' || normalizedCleanMessage === 'مسح_المميزين':
                await clearVipsCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'مسح المحظورين' || normalizedCleanMessage === 'مسح_المحظورين':
                await clearBannedCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'مسح المقيدين' || normalizedCleanMessage === 'مسح_المقيدين':
                await clearRestrictedCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'م1' || cleanMessage === '1':
                await menu1Command(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'م2' || cleanMessage === '2':
                await menu2Command(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'م3' || cleanMessage === '3':
                await menu3Command(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'م4' || cleanMessage === '4':
                await menu4Command(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'م5' || cleanMessage === '5':
                await menu5Command(sock, chatId, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'حب' || normalizedCleanMessage === 'حب':
                await loveCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'كره' || normalizedCleanMessage === 'كره':
                await hateCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'حظي' || cleanMessage === 'حظه' || normalizedCleanMessage === 'حظي' || normalizedCleanMessage === 'حظه':
                await luckCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'وجهي' || cleanMessage === 'وجهه' || normalizedCleanMessage === 'وجهي' || normalizedCleanMessage === 'وجهه':
                await faceCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'امنيتي' || cleanMessage === 'امنيته' || normalizedCleanMessage === 'امنيتي' || normalizedCleanMessage === 'امنيته':
                await wishCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'نجومي' || cleanMessage === 'نجومه' || normalizedCleanMessage === 'نجومي' || normalizedCleanMessage === 'نجومه':
                await starsCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'مزاجي' || cleanMessage === 'مزاجه' || normalizedCleanMessage === 'مزاجي' || normalizedCleanMessage === 'مزاجه':
                await moodCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'غبائي' || cleanMessage === 'غبائه' || normalizedCleanMessage === 'غبائي' || normalizedCleanMessage === 'غبائه':
                await stupidCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'من يحبني' || cleanMessage === 'من يحبه' || normalizedCleanMessage === 'من_يحبني' || normalizedCleanMessage === 'من_يحبه':
                await whoLovesCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'من يكرهني' || cleanMessage === 'من يكرهه' || normalizedCleanMessage === 'من_يكرهني' || normalizedCleanMessage === 'من_يكرهه':
                await whoHatesCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'برجي' || cleanMessage === 'برجه':
                await zodiacCmd(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'عمري' || cleanMessage === 'عمره': {
                let gLink = '';
                if (isGroup) {
                    try { gLink = await sock.groupInviteCode(chatId).then(c => 'https://chat.whatsapp.com/' + c); } catch(e) {}
                }
                await ageCmd(sock, chatId, message, senderId, gLink);
                commandExecuted = true;
                break;
            }
            case cleanMessage === 'نكته' || cleanMessage === 'نكتة':
                await jokeCmd(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'ايش تختار' || normalizedCleanMessage === 'ايش_تختار':
                await chooseCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'م6' || cleanMessage === '6':
                await menu6Command(sock, chatId, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'صورة' || normalizedCleanMessage === 'صورة': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: '❌ الرجاء الرد على ملصق بأمر "صورة" لتحويله.' }, { quoted: message });
                }
                commandExecuted = true;
                break;
            }
            case cleanMessage === 'طرد' || cleanMessage.startsWith('طرد ') || normalizedCleanMessage === 'طرد' || normalizedCleanMessage.startsWith('طرد_'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
            case cleanMessage === 'قفل' || cleanMessage === 'قفل القروب' || cleanMessage.match(/^قفل\s+\d+$/) || normalizedCleanMessage === 'قفل' || normalizedCleanMessage === 'قفل_القروب' || normalizedCleanMessage.match(/^قفل_\d+$/):
                {
                    const args = rawText.split(' ');
                    const durationMatch = args.find(arg => arg.match(/^\d+$/));
                    const durationInMinutes = durationMatch ? parseInt(durationMatch) : undefined;
                    await muteCommand(sock, chatId, senderId, message, durationInMinutes);
                    commandExecuted = true;
                }
                break;
            case cleanMessage === 'فتح' || cleanMessage === 'فتح القروب' || normalizedCleanMessage === 'فتح' || normalizedCleanMessage === 'فتح_القروب':
                await unmuteCommand(sock, chatId, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'حظر' || cleanMessage.startsWith('حظر ') || normalizedCleanMessage === 'حظر' || normalizedCleanMessage.startsWith('حظر_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.BAN)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, {
                        text: '*↢ امـر الحظر معطل من قبل المالك*'
                    }, { quoted: message, contextInfo: {} });
                    commandExecuted = true;
                    break;
                }
                await banCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'الغاء الحظر' || cleanMessage === 'الغاء_الحظر' || cleanMessage.startsWith('الغاء الحظر ') || normalizedCleanMessage === 'الغاء_الحظر' || normalizedCleanMessage.startsWith('الغاء_الحظر_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.BAN)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, {
                        text: '*↢ امـر الحظر معطل من قبل المالك*'
                    }, { quoted: message, contextInfo: {} });
                    commandExecuted = true;
                    break;
                }
                console.log('🔓 تم اكتشاف أمر إلغاء الحظر');
                await unbanCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'ملصق' || normalizedCleanMessage === 'ملصق':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'انذاراتي' || normalizedCleanMessage === 'انذاراتي':
                await warningsCommand(sock, chatId, message, [], null, senderId, true);
                commandExecuted = true;
                break;
            case cleanMessage === 'الانذارات' || cleanMessage.startsWith('الانذارات ') || normalizedCleanMessage === 'الانذارات' || normalizedCleanMessage.startsWith('الانذارات_'):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const quotedParticipantWarnings = message.message.extendedTextMessage?.contextInfo?.participant || null;
                await warningsCommand(sock, chatId, message, mentionedJidListWarnings, quotedParticipantWarnings, senderId, false);
                commandExecuted = true;
                break;
            case cleanMessage === 'انذار' || cleanMessage.startsWith('انذار ') || normalizedCleanMessage === 'انذار' || normalizedCleanMessage.startsWith('انذار_'):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                let warnCount = 1;
                const warnMatch = cleanMessage.match(/انذار\s+(\d+)/);
                if (warnMatch) {
                    warnCount = parseInt(warnMatch[1]);
                    if (warnCount < 1 || warnCount > 3) warnCount = 1;
                }
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message, warnCount);
                commandExecuted = true;
                break;

            case cleanMessage === 'مسح الانذارات للكل':
                if (!chatId.endsWith('@g.us')) {
                    await sock.sendMessage(chatId, { text: 'هذا الأمر يمكن استخدامه في المجموعات فقط!' });
                    break;
                }
                const { getUserRank: getUserRankClear, getRankLevel: getRankLevelClear } = require('./lib/ranks');
                const metaClear = await sock.groupMetadata(chatId); const participantClear = metaClear.participants.find(p => p.id === senderId); const senderRankClear = await getUserRankClear(chatId, senderId, participantClear && participantClear.admin);
                const senderLevelClear = getRankLevelClear(senderRankClear);

                const adminCheckAll = await isAdmin(sock, chatId, senderId);
                if (!adminCheckAll.isSenderAdmin && senderLevelClear < 3 && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 المدير 〗*' });
                    break;
                }
                try {
                    const wPath = path.join(process.cwd(), 'data', 'warnings.json');
                    let warns = fs.existsSync(wPath) ? JSON.parse(fs.readFileSync(wPath, 'utf8')) : {};
                    const count = warns[chatId] ? Object.keys(warns[chatId]).length : 0;
                    if (count > 0) {
                        delete warns[chatId];
                        fs.writeFileSync(wPath, JSON.stringify(warns, null, 2));
                        await sock.sendMessage(chatId, { text: `*↢ تم مسح الانذارات لـ ${count} عضو.*` });
                    } else {
                        await sock.sendMessage(chatId, { text: '*◁لايوجد أي مستخدمين تم إعطائهم انذارات*' });
                    }
                } catch (e) {
                    await sock.sendMessage(chatId, { text: '❌ حدث خطأ أثناء مسح الإنذارات!' });
                }
                commandExecuted = true;
                break;

            case cleanMessage === 'مسح الانذارات':
                if (!chatId.endsWith('@g.us')) {
                    await sock.sendMessage(chatId, { text: 'هذا الأمر يمكن استخدامه في المجموعات فقط!' });
                    break;
                }
                const { getUserRank: getUserRankSingle, getRankLevel: getRankLevelSingle } = require('./lib/ranks');
                const metaSingle = await sock.groupMetadata(chatId); const participantSingle = metaSingle.participants.find(p => p.id === senderId); const senderRankSingle = await getUserRankSingle(chatId, senderId, participantSingle && participantSingle.admin);
                const senderLevelSingle = getRankLevelSingle(senderRankSingle);

                const adminCheckUser = await isAdmin(sock, chatId, senderId);
                if (!adminCheckUser.isSenderAdmin && senderLevelSingle < 2 && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 الادمن 〗*' });
                    break;
                }
                const mentions = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const quoted = message.message.extendedTextMessage?.contextInfo?.participant;
                const target = mentions[0] || quoted;
                if (!target) {
                    await sock.sendMessage(chatId, { text: '❌ يرجى الرد على رسالة المستخدم أو عمل منشن له!' });
                    break;
                }
                try {
                    const wPath = path.join(process.cwd(), 'data', 'warnings.json');
                    let warns = fs.existsSync(wPath) ? JSON.parse(fs.readFileSync(wPath, 'utf8')) : {};

                    if (!warns[chatId]) warns[chatId] = {};
                    warns[chatId][target] = 0;
                    fs.writeFileSync(wPath, JSON.stringify(warns, null, 2));

                    await sock.sendMessage(chatId, { text: `*تم إعادة تعين الإنذارات الى* ⇜0`, mentions: [target] });
                } catch (e) {
                    await sock.sendMessage(chatId, { text: '❌ حدث خطأ أثناء مسح الإنذارات!' });
                }
                commandExecuted = true;
                break;
            case cleanMessage === 'نص الى صوت' || cleanMessage.startsWith('نص الى صوت ') || normalizedCleanMessage === 'نص_الى_صوت' || normalizedCleanMessage.startsWith('نص_الى_صوت_'):
                const text = cleanMessage.replace(/نص الى صوت|نص_الى_صوت/, '').trim();
                await ttsCommand(sock, chatId, text, message);
                break;
            case cleanMessage === 'حذف' || cleanMessage.startsWith('حذف ') || normalizedCleanMessage === 'حذف' || normalizedCleanMessage.startsWith('حذف_'):
                await deleteCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'نص لملصق' || cleanMessage.startsWith('نص لملصق ') || normalizedCleanMessage === 'نص_لملصق' || normalizedCleanMessage.startsWith('نص_لملصق_'):
                await attpCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'الاعدادات' || normalizedCleanMessage === 'الاعدادات':
                await settingsCommand(sock, chatId, message);
                break;
            case cleanMessage === 'الوضع' || normalizedCleanMessage === 'الوضع' || cleanMessage.startsWith('الوضع ') || normalizedCleanMessage.startsWith('الوضع_'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'هذا الأمر للمالك فقط!' }, { quoted: message });
                    return;
                }
                let modeData;
                try {
                    modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    await sock.sendMessage(chatId, { text: 'فشل في قراءة حالة وضع البوت' });
                    return;
                }

                const modeAction = cleanMessage.replace(/الوضع|الوضع_/g, '').trim().toLowerCase();
                if (!modeAction) {
                    const currentMode = modeData.isPublic ? 'عام' : 'خاص';
                    await sock.sendMessage(chatId, {
                        text: `وضع البوت الحالي: *${currentMode}*\n\nالاستخدام: الوضع عام/خاص\n\nمثال:\nالوضع عام - السماح للجميع باستخدام البوت\nالوضع خاص - تقييد الاستخدام للمالك فقط`
                    }, { quoted: message });
                    return;
                }

                if (modeAction !== 'عام' && modeAction !== 'خاص' && modeAction !== 'public' && modeAction !== 'private') {
                    await sock.sendMessage(chatId, {
                        text: 'الاستخدام: الوضع عام/خاص\n\nمثال:\nالوضع عام - السماح للجميع باستخدام البوت\nالوضع خاص - تقييد الاستخدام للمالك فقط'
                    }, { quoted: message });
                    return;
                }

                try {
                    modeData.isPublic = (modeAction === 'عام' || modeAction === 'public');
                    fs.writeFileSync('./data/messageCount.json', JSON.stringify(modeData, null, 2));
                    const modeText = modeData.isPublic ? 'عام' : 'خاص';
                    await sock.sendMessage(chatId, { text: `البوت الآن في وضع *${modeText}*` });
                } catch (error) {
                    console.error('Error updating access mode:', error);
                    await sock.sendMessage(chatId, { text: 'فشل في تحديث وضع الوصول للبوت' });
                }
                break;
            case cleanMessage === 'منع المكالمات' || normalizedCleanMessage === 'منع_المكالمات' || cleanMessage.startsWith('منع المكالمات ') || normalizedCleanMessage.startsWith('منع_المكالمات_'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'المالك/المشرف فقط يمكنه استخدام منع المكالمات.' }, { quoted: message });
                    break;
                }
                {
                    const anticallArgs = cleanMessage.replace(/منع المكالمات|منع_المكالمات/g, '').trim();
                    await anticallCommand(sock, chatId, message, anticallArgs);
                }
                break;
            case cleanMessage === 'حظر الخاص' || normalizedCleanMessage === 'حظر_الخاص' || cleanMessage.startsWith('حظر الخاص ') || normalizedCleanMessage.startsWith('حظر_الخاص_'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'المالك/المشرف فقط يمكنه استخدام حظر الخاص.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                {
                    const pmblockerArgs = cleanMessage.replace(/حظر الخاص|حظر_الخاص/g, '').trim();
                    await pmblockerCommand(sock, chatId, message, pmblockerArgs);
                }
                commandExecuted = true;
                break;
            case cleanMessage === 'المالك' || normalizedCleanMessage === 'المالك':
                await ownerCommand(sock, chatId);
                break;
            case cleanMessage === 'منشن الكل' || normalizedCleanMessage === 'منشن_الكل':
                {
                    const groupMeta = await sock.groupMetadata(chatId);
                    const participantMeta = groupMeta.participants.find(p => p.id === senderId);
                    const senderRank = await getUserRank(chatId, senderId, participantMeta && participantMeta.admin);
                    const senderLevel = getRankLevel(senderRank);
                    if (!isSenderAdmin && !message.key.fromMe && senderLevel < 2) {
                        await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 ادمن 〗*' }, { quoted: message });
                    } else {
                        await tagAllCommand(sock, chatId, senderId, message);
                    }
                }
                break;
            case cleanMessage === 'منشن الاعضاء' || normalizedCleanMessage === 'منشن_الاعضاء':
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;
            case cleanMessage.startsWith('منشن مخفي') || normalizedCleanMessage.startsWith('منشن_مخفي'):
                {
                    const messageText = rawText.replace(/\.?(منشن مخفي|منشن_مخفي)/, '').trim();
                    const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                    await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                }
                break;
            case cleanMessage.startsWith('منشن ') && !cleanMessage.startsWith('منشن الكل') && !cleanMessage.startsWith('منشن الاعضاء') && !cleanMessage.startsWith('منشن مخفي'):
                const messageText = rawText.replace(/\.?منشن/, '').trim();
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;

            case cleanMessage === 'قفل الروابط' || normalizedCleanMessage === 'قفل_الروابط':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '❌ يجب أن يكون البوت مشرفاً أولاً.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                await handleAntilinkCommand(sock, chatId, 'قفل الروابط', senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'فتح الروابط' || normalizedCleanMessage === 'فتح_الروابط':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '❌ يجب أن يكون البوت مشرفاً أولاً.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                await handleAntilinkCommand(sock, chatId, 'فتح الروابط', senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'إعدادات الروابط' || cleanMessage.startsWith('إعدادات الروابط ') || normalizedCleanMessage === 'إعدادات_الروابط' || normalizedCleanMessage.startsWith('إعدادات_الروابط_'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                const antilinkAction = rawText.split(' ')[2] || '';
                await handleAntilinkCommand(sock, chatId, `إعدادات الروابط ${antilinkAction}`, senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'فتح التاك' || normalizedCleanMessage === 'فتح_التاك':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                await handleAntitagCommand(sock, chatId, 'فتح التاك', senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'قفل التاك' || normalizedCleanMessage === 'قفل_التاك':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                await handleAntitagCommand(sock, chatId, 'قفل التاك', senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'إعدادات التاك' || cleanMessage.startsWith('إعدادات التاك ') || normalizedCleanMessage === 'إعدادات_التاك' || normalizedCleanMessage.startsWith('إعدادات_التاك_'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                const antitagAction = rawText.split(' ')[2] || '';
                await handleAntitagCommand(sock, chatId, `إعدادات التاك ${antitagAction}`, senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'قفل التثبيت' || normalizedCleanMessage === 'قفل_التثبيت':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                const senderRankPin = await getUserRank(chatId, senderId, isSenderAdmin);
                const senderLevelPin = getRankLevel(senderRankPin);
                if (senderLevelPin < 3 && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                await setPinlock(chatId, true);
                await sock.sendMessage(chatId, { 
                    text: `*↢ تم قفل التثبيت✓*`,
                }, { quoted: message });
                commandExecuted = true;
                break;

            case cleanMessage === 'فتح التثبيت' || normalizedCleanMessage === 'فتح_التثبيت':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                {
                    const srp2 = await getUserRank(chatId, senderId, isSenderAdmin);
                    const slp2 = getRankLevel(srp2);
                    if (slp2 < 3 && !message.key.fromMe) {
                        await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' }, { quoted: message });
                        commandExecuted = true;
                        break;
                    }
                }
                await setPinlock(chatId, false);
                await sock.sendMessage(chatId, { 
                    text: `*↢ تم فتح التثبيت✓*`,
                }, { quoted: message });
                commandExecuted = true;
                break;

            case cleanMessage.startsWith('قفل ') && !cleanMessage.startsWith('قفل امر') && cleanMessage !== 'قفل الروابط' && cleanMessage !== 'قفل التاك' && cleanMessage !== 'قفل القروب' && cleanMessage !== 'قفل التثبيت':
            case normalizedCleanMessage.startsWith('قفل_') && !normalizedCleanMessage.startsWith('قفل_امر') && normalizedCleanMessage !== 'قفل_الروابط' && normalizedCleanMessage !== 'قفل_التاك' && normalizedCleanMessage !== 'قفل_القروب' && normalizedCleanMessage !== 'قفل_التثبيت':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    return;
                }
                await handleLockCommand(sock, chatId, rawText, senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage.startsWith('فتح ') && !cleanMessage.startsWith('فتح امر') && cleanMessage !== 'فتح الروابط' && cleanMessage !== 'فتح التاك' && cleanMessage !== 'فتح القروب' && cleanMessage !== 'فتح التثبيت':
            case normalizedCleanMessage.startsWith('فتح_') && !normalizedCleanMessage.startsWith('فتح_امر') && normalizedCleanMessage !== 'فتح_الروابط' && normalizedCleanMessage !== 'فتح_التاك' && normalizedCleanMessage !== 'فتح_القروب' && normalizedCleanMessage !== 'فتح_التثبيت':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    return;
                }
                await handleLockCommand(sock, chatId, rawText, senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage.startsWith('تفعيل ') || normalizedCleanMessage.startsWith('تفعيل_'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    return;
                }
                await handleToggleCommand(sock, chatId, rawText, senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage.startsWith('تعطيل ') || normalizedCleanMessage.startsWith('تعطيل_'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    return;
                }
                await handleToggleCommand(sock, chatId, rawText, senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage.startsWith('قفل امر') || normalizedCleanMessage.startsWith('قفل_امر'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    return;
                }
                await handleCmdLockCommand(sock, chatId, rawText, senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage.startsWith('فتح امر') || normalizedCleanMessage.startsWith('فتح_امر'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    return;
                }
                await handleCmdLockCommand(sock, chatId, rawText, senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'ميم' || normalizedCleanMessage === 'ميم':
                await memeCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'نكتة' || normalizedCleanMessage === 'نكتة':
                await jokeCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'برجي' || cleanMessage === 'برجه' || normalizedCleanMessage === 'برجي' || normalizedCleanMessage === 'برجه':
                await zodiacCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'اقتباس' || normalizedCleanMessage === 'اقتباس':
                await quoteCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'حقيقة' || normalizedCleanMessage === 'حقيقة':
                await factCommand(sock, chatId, message, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'الطقس' || cleanMessage.startsWith('الطقس ') || cleanMessage === 'طقس' || cleanMessage.startsWith('طقس ') || normalizedCleanMessage === 'الطقس' || normalizedCleanMessage.startsWith('الطقس_') || normalizedCleanMessage === 'طقس' || normalizedCleanMessage.startsWith('طقس_'):
                const cityAr = rawText.replace(/\.?(الطقس|طقس)/, '').trim();
                if (cityAr) {
                    await weatherCommand(sock, chatId, message, cityAr, false);
                } else {
                    await sock.sendMessage(chatId, { text: '❌ الرجاء تحديد المدينة، مثال: طقس الرياض' }, { quoted: message });
                }
                commandExecuted = true;
                break;
            case cleanMessage === 'جو' || cleanMessage.startsWith('جو ') || normalizedCleanMessage === 'جو' || normalizedCleanMessage.startsWith('جو_'):
                const cityDetailed = rawText.replace(/\.?(جو)/, '').trim();
                if (cityDetailed) {
                    await weatherCommand(sock, chatId, message, cityDetailed, true);
                } else {
                    await sock.sendMessage(chatId, { text: '❌ الرجاء تحديد المدينة، مثال: جو صنعاء' }, { quoted: message });
                }
                commandExecuted = true;
                break;
            case cleanMessage === 'اخبار' || normalizedCleanMessage === 'اخبار':
                await newsCommand(sock, chatId);
                commandExecuted = true;
                break;
            case cleanMessage === 'اخبار عربية' || normalizedCleanMessage === 'اخبار_عربية':
                await arabicNewsCommand(sock, chatId);
                commandExecuted = true;
                break;
            case cleanMessage === 'اكس او' || cleanMessage.startsWith('اكس او ') || normalizedCleanMessage === 'اكس_او' || normalizedCleanMessage.startsWith('اكس_او_'):
                await tictactoeCommand(sock, chatId, senderId, '');
                commandExecuted = true;
                break;
            case cleanMessage === 'انضم' || cleanMessage.startsWith('انضم ') || normalizedCleanMessage === 'انضم' || normalizedCleanMessage.startsWith('انضم_'):
                {
                    const text = rawText.replace(/\.?انضم/g, '').trim();
                    const gameNumber = parseInt(text);

                    if (!isNaN(gameNumber) && gameNumber > 0) {
                        await joinTicTacToeGame(sock, chatId, senderId, gameNumber);
                        commandExecuted = true;
                    } else {
                        await sock.sendMessage(chatId, {
                            text: '❌ الرجاء تحديد رقم اللعبة بشكل صحيح.\nمثال: انضم 1'
                        }, { quoted: message });
                        commandExecuted = true;
                    }
                }
                break;
            case cleanMessage === 'اعلى الاعضاء' || normalizedCleanMessage === 'اعلى_الاعضاء':
                topMembers(sock, chatId, isGroup);
                commandExecuted = true;
                break;
            case cleanMessage === 'الرجل المشنوق' || cleanMessage.startsWith('الرجل المشنوق ') || normalizedCleanMessage === 'الرجل_المشنوق' || normalizedCleanMessage.startsWith('الرجل_المشنوق_'):
                startHangman(sock, chatId);
                commandExecuted = true;
                break;
            case cleanMessage === 'خمن' || cleanMessage.startsWith('خمن ') || normalizedCleanMessage === 'خمن' || normalizedCleanMessage.startsWith('خمن_'):
                if (!sock.hangmanGame || !sock.hangmanGame[chatId]) {
                    return;
                }
                const guessedLetterAr = rawText.replace(/\.?(خمن)/, '').trim().split(' ')[0];
                if (guessedLetterAr) {
                    guessLetter(sock, chatId, guessedLetterAr);
                } else {
                    sock.sendMessage(chatId, { text: '❌ الرجاء تخمين حرف: خمن <حرف>' }, { quoted: message });
                }
                commandExecuted = true;
                break;
            case cleanMessage === 'اسئلة' || cleanMessage === 'أسئلة' || normalizedCleanMessage === 'اسئلة' || normalizedCleanMessage === 'أسئلة':
                console.log('🎯 تم اكتشاف أمر الأسئلة');
                try {
                    await startTrivia(sock, chatId);
                    commandExecuted = true;
                } catch (error) {
                    console.error('❌ خطأ في تشغيل لعبة الأسئلة:', error);
                    await sock.sendMessage(chatId, { text: '❌ حدث خطأ في بدء اللعبة. حاول مرة أخرى.' });
                }
                break;
            case cleanMessage === 'مجاملة' || cleanMessage.startsWith('مجاملة ') || normalizedCleanMessage === 'مجاملة' || normalizedCleanMessage.startsWith('مجاملة_'):
                await complimentCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'اهانة' || cleanMessage.startsWith('اهانة ') || normalizedCleanMessage === 'اهانة' || normalizedCleanMessage.startsWith('اهانة_'):
                await insultCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'الكرة السحرية' || cleanMessage.startsWith('الكرة السحرية ') || cleanMessage === 'الكرة السحرية' || normalizedCleanMessage === 'الكرة_السحرية' || normalizedCleanMessage.startsWith('الكرة_السحرية_'):
                {
                    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    let questionAr = '';

                    if (quotedMessage) {
                        questionAr = quotedMessage.conversation?.trim() ||
                                    quotedMessage.extendedTextMessage?.text?.trim() ||
                                    '';
                    } else {
                        if (rawText.includes('الكرة السحرية')) {
                            questionAr = rawText.split('الكرة السحرية')[1] || '';
                        } else if (rawText.includes('الكرة_السحرية')) {
                            questionAr = rawText.split('الكرة_السحرية')[1] || '';
                        }
                        questionAr = questionAr.trim();
                    }

                    await eightBallCommand(sock, chatId, questionAr);
                    commandExecuted = true;
                }
                break;
            case cleanMessage === 'كلمات الاغنية' || cleanMessage.startsWith('كلمات الاغنية ') || normalizedCleanMessage === 'كلمات_الاغنية' || normalizedCleanMessage.startsWith('كلمات_الاغنية_'):
                const songTitleAr = rawText.replace(/\.?(كلمات الاغنية|كلمات_الاغنية)/, '').trim();
                await lyricsCommand(sock, chatId, songTitleAr, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'جرأة' || normalizedCleanMessage === 'جرأة':
                await dareCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'صراحة' || normalizedCleanMessage === 'صراحة':
                await truthCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'تصبح على خير' || normalizedCleanMessage === 'تصبح_على_خير':
                await goodnightCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'شعر' || normalizedCleanMessage === 'شعر':
                await shayariCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'يوم الورد' || normalizedCleanMessage === 'يوم_الورد':
                await rosedayCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'محطم' || cleanMessage.startsWith('محطم ') || normalizedCleanMessage === 'محطم' || normalizedCleanMessage.startsWith('محطم_'):
                await wastedCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'معجب' || cleanMessage.startsWith('معجب ') || normalizedCleanMessage === 'معجب' || normalizedCleanMessage.startsWith('معجب_'):
                await simpCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'غبي' || cleanMessage.startsWith('غبي ') || normalizedCleanMessage === 'غبي' || normalizedCleanMessage.startsWith('غبي_'):
                await stupidCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'مسح' || normalizedCleanMessage === 'مسح':
                if (isGroup) await clearCommand(sock, chatId);
                break;
            case cleanMessage === 'رفع' || cleanMessage.startsWith('رفع ') || normalizedCleanMessage === 'رفع' || normalizedCleanMessage.startsWith('رفع_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.PROMOTE)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, {
                        text: '*↢ امـر الرفع معطل من قبل المالك*'
                    }, { quoted: message, contextInfo: {} });
                    commandExecuted = true;
                    break;
                }
                if (cleanMessage === 'رفع مالك' || cleanMessage.startsWith('رفع مالك ') ||
                    normalizedCleanMessage === 'رفع_مالك' || normalizedCleanMessage.startsWith('رفع_مالك_')) {
                    await setOwnerCommand(sock, chatId, message, senderId);
                    commandExecuted = true;
                } else if (cleanMessage === 'رفع مدير' || cleanMessage.startsWith('رفع مدير ') ||
                    normalizedCleanMessage === 'رفع_مدير' || normalizedCleanMessage.startsWith('رفع_مدير_')) {
                    await setManagerCommand(sock, chatId, message, senderId);
                    commandExecuted = true;
                } else if (cleanMessage === 'رفع ادمن' || cleanMessage.startsWith('رفع ادمن ') ||
                    normalizedCleanMessage === 'رفع_ادمن' || normalizedCleanMessage.startsWith('رفع_ادمن_')) {
                    await setAdminCommand(sock, chatId, message, senderId);
                    commandExecuted = true;
                } else if (cleanMessage === 'رفع مميز' || cleanMessage.startsWith('رفع مميز ') ||
                    normalizedCleanMessage === 'رفع_مميز' || normalizedCleanMessage.startsWith('رفع_مميز_')) {
                    await setVipCommand(sock, chatId, message, senderId);
                    commandExecuted = true;
                } else {
                    const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                    await promoteCommand(sock, chatId, mentionedJidListPromote, message, senderId);
                    commandExecuted = true;
                }
                break;
            case cleanMessage === 'تنزيل' || cleanMessage.startsWith('تنزيل ') || normalizedCleanMessage === 'تنزيل' || normalizedCleanMessage.startsWith('تنزيل_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.PROMOTE)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, {
                        text: '*↢ امـر التنزيل معطل من قبل المالك*'
                    }, { quoted: message, contextInfo: {} });
                    commandExecuted = true;
                    break;
                }
                if (cleanMessage === 'تنزيل مدير' || cleanMessage.startsWith('تنزيل مدير ') ||
                    normalizedCleanMessage === 'تنزيل_مدير' || normalizedCleanMessage.startsWith('تنزيل_مدير_')) {
                    await demoteManagerCommand(sock, chatId, message, senderId);
                    commandExecuted = true;
                } else if (cleanMessage === 'تنزيل ادمن' || cleanMessage.startsWith('تنزيل ادمن ') ||
                    normalizedCleanMessage === 'تنزيل_ادمن' || normalizedCleanMessage.startsWith('تنزيل_ادمن_')) {
                    await demoteAdminCommand(sock, chatId, message, senderId);
                    commandExecuted = true;
                } else if (cleanMessage === 'تنزيل مميز' || cleanMessage.startsWith('تنزيل مميز ') ||
                    normalizedCleanMessage === 'تنزيل_مميز' || normalizedCleanMessage.startsWith('تنزيل_مميز_')) {
                    await demoteVipCommand(sock, chatId, message, senderId);
                    commandExecuted = true;
                } else {
                    const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                    const demoteArgs = cleanMessage.split(' ');
                    const specifiedRank = demoteArgs.length > 1 ? demoteArgs.slice(1).join(' ') : null;
                    await demoteCommand(sock, chatId, mentionedJidListDemote, message, specifiedRank);
                    commandExecuted = true;
                }
                break;
            case cleanMessage === 'بينغ' || normalizedCleanMessage === 'بينغ':
                await pingCommand(sock, chatId, message);
                break;
            case cleanMessage === 'نشط' || normalizedCleanMessage === 'نشط':
                await aliveCommand(sock, chatId, message);
                break;
            case cleanMessage === 'اعدادات المنشن' || cleanMessage.startsWith('اعدادات المنشن ') || normalizedCleanMessage === 'اعدادات_المنشن' || normalizedCleanMessage.startsWith('اعدادات_المنشن_'):
                {
                    const argsAr = rawText.replace(/\.?(اعدادات المنشن|اعدادات_المنشن)/, '').trim();
                    const isOwner = message.key.fromMe || senderIsSudo;
                    if (argsAr) {
                        await mentionToggleCommand(sock, chatId, message, argsAr, isOwner);
                    } else {
                        await setMentionCommand(sock, chatId, message, isOwner);
                    }
                    commandExecuted = true;
                }
                break;
            case cleanMessage === 'تمويه' || cleanMessage.startsWith('تمويه ') || normalizedCleanMessage === 'تمويه' || normalizedCleanMessage.startsWith('تمويه_'):
                const quotedMessageBlur = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessageBlur);
                commandExecuted = true;
                break;

            case cleanMessage === 'تفعيل الترحيب' || normalizedCleanMessage === 'تفعيل_الترحيب':
            case cleanMessage === 'تعطيل الترحيب' || normalizedCleanMessage === 'تعطيل_الترحيب':
            case cleanMessage === 'الترحيب' || normalizedCleanMessage === 'الترحيب':
            case cleanMessage === 'ضع ترحيب' || normalizedCleanMessage === 'ضع_ترحيب':
            case cleanMessage === 'مسح الترحيب' || normalizedCleanMessage === 'مسح_الترحيب':
            case cleanMessage === 'ترحيب' || cleanMessage.startsWith('ترحيب ') || normalizedCleanMessage === 'ترحيب' || normalizedCleanMessage.startsWith('ترحيب_'):
                if (isGroup) {
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }
                    const groupMetaWelcome = await sock.groupMetadata(chatId);
                    const participantWelcome = groupMetaWelcome.participants.find(p => p.id === senderId);
                    const senderRank = await getUserRank(chatId, senderId, participantWelcome && participantWelcome.admin);
                    const senderLevel = getRankLevel(senderRank);
                    if (isSenderAdmin || message.key.fromMe || senderLevel >= 2) {
                        let match = '';
                        if (cleanMessage === 'تفعيل الترحيب' || normalizedCleanMessage === 'تفعيل_الترحيب') match = 'تفعيل';
                        else if (cleanMessage === 'تعطيل الترحيب' || normalizedCleanMessage === 'تعطيل_الترحيب') match = 'تعطيل';
                        else if (cleanMessage === 'الترحيب' || normalizedCleanMessage === 'الترحيب') match = 'الترحيب';
                        else if (cleanMessage === 'ضع ترحيب' || normalizedCleanMessage === 'ضع_ترحيب') match = 'ضع';
                        else if (cleanMessage === 'مسح الترحيب' || normalizedCleanMessage === 'مسح_الترحيب') match = 'مسح';
                        else if (cleanMessage.startsWith('ترحيب ') || normalizedCleanMessage.startsWith('ترحيب_')) {
                            match = cleanMessage.replace('ترحيب ', '').trim();
                        }
                        await handleWelcome(sock, chatId, message, match);
                    } else {
                        await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 ادمن 〗*' }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط.' }, { quoted: message });
                }
                break;

            case cleanMessage === 'ضع وداع' || cleanMessage.startsWith('ضع وداع ') || cleanMessage === 'تخصيص الوداع' || cleanMessage.startsWith('تخصيص الوداع ') || cleanMessage === 'تفعيل الوداع' || cleanMessage.startsWith('تفعيل الوداع ') || cleanMessage === 'تعطيل الوداع' || cleanMessage.startsWith('تعطيل الوداع '):
                await handleGoodbye(sock, chatId, message, cleanMessage.replace(/^(ضع وداع|تخصيص الوداع|تفعيل الوداع|تعطيل الوداع)\s*/i, '').trim() || cleanMessage.split(' ')[1]);
                return;

            case cleanMessage === 'منع':
                await wordban.banWord(sock, chatId, message);
                return;

            case cleanMessage === 'الغاء منع' || cleanMessage.startsWith('الغاء منع '):
                await wordban.unbanWord(sock, chatId, message, cleanMessage.replace('الغاء منع', '').trim());
                return;

            case cleanMessage === 'قائمه المنع':
                await wordban.showBanList(sock, chatId, message);
                return;

            case cleanMessage === 'مسح قائمه المنع':
                await wordban.clearBanList(sock, chatId, message);
                return;

            case cleanMessage === 'اسم القروب' || cleanMessage.startsWith('اسم القروب '):
                await setGroupName(sock, chatId, senderId, cleanMessage.replace('اسم القروب', '').trim(), message);
                return;

            case cleanMessage === 'صوره القروب':
                await setGroupPhoto(sock, chatId, senderId, message);
                return;

            case cleanMessage === 'وصف القروب' || cleanMessage.startsWith('وصف القروب '):
                await setGroupDescription(sock, chatId, senderId, cleanMessage.replace('وصف القروب', '').trim(), message);
                return;

            case cleanMessage === 'مسح الوصف':
                await clearGroupDescription(sock, chatId, senderId, message);
                return;

            case cleanMessage === 'ضع قوانين' || cleanMessage.startsWith('ضع قوانين '):
                await setRules(sock, chatId, senderId, cleanMessage.replace('ضع قوانين', '').trim(), message);
                return;

            case cleanMessage === 'القوانين' || cleanMessage === 'قوانين':
                await getRules(sock, chatId, message);
                return;

            case cleanMessage === 'مسح القوانين':
                await clearRules(sock, chatId, senderId, message);
                return;

            case cleanMessage === 'ضع لقب' || cleanMessage.startsWith('ضع لقب '):
                await setNickname(sock, chatId, senderId, cleanMessage.replace('ضع لقب', '').trim(), message);
                return;

            case cleanMessage === 'لقبي':
            case cleanMessage === 'لقبه':
                await getNickname(sock, chatId, senderId, message);
                return;

            case cleanMessage === 'تثبيت':
                await pinMessage(sock, chatId, message);
                return;

            case cleanMessage === 'الغاء تثبيت':
                await unpinMessage(sock, chatId, message);
                return;

            case cleanMessage === 'الغاء المثبت':
                await unpinAll(sock, chatId, message);
                return;

            case cleanMessage === 'كود المصدر' || normalizedCleanMessage === 'كود_المصدر' || cleanMessage === 'جيت هاب' || normalizedCleanMessage === 'جيت_هاب':
                await githubCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'منع الكلمات السيئة' || cleanMessage.startsWith('منع الكلمات السيئة ') || normalizedCleanMessage === 'منع_الكلمات_السيئة' || normalizedCleanMessage.startsWith('منع_الكلمات_السيئة_'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط.' }, { quoted: message });
                    return;
                }

                const adminStatusBadword = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatusBadword.isSenderAdmin;
                isBotAdmin = adminStatusBadword.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '❌ يجب أن يكون البوت مشرفاً لاستخدام هذه الميزة' }, { quoted: message });
                    return;
                }

                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                commandExecuted = true;
                break;

            case cleanMessage === 'تفعيل ai' || normalizedCleanMessage === 'تفعيل_ai':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط.' }, { quoted: message });
                    return;
                }

                const chatbotAdminStatusOn = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatusOn.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '❌ فقط المشرفون أو مالك البوت يمكنهم استخدام هذا الأمر' }, { quoted: message });
                    return;
                }

                await handleChatbotCommand(sock, chatId, message, 'on');
                commandExecuted = true;
                break;
            case cleanMessage === 'تعطيل ai' || normalizedCleanMessage === 'تعطيل_ai':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط.' }, { quoted: message });
                    return;
                }

                const chatbotAdminStatusOff = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatusOff.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '❌ فقط المشرفون أو مالك البوت يمكنهم استخدام هذا الأمر' }, { quoted: message });
                    return;
                }

                await handleChatbotCommand(sock, chatId, message, 'off');
                commandExecuted = true;
                break;
            case cleanMessage === 'شات بوت' || cleanMessage.startsWith('شات بوت ') || normalizedCleanMessage === 'شات_بوت' || normalizedCleanMessage.startsWith('شات_بوت_'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط.' }, { quoted: message });
                    return;
                }

                const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '❌ فقط المشرفون أو مالك البوت يمكنهم استخدام هذا الأمر' }, { quoted: message });
                    return;
                }

                const matchAr = rawText.replace(/\.?(شات بوت|شات_بوت)/, '').trim();
                await handleChatbotCommand(sock, chatId, message, matchAr);
                commandExecuted = true;
                break;
            case cleanMessage === 'تغيير اسم الملصق' || cleanMessage.startsWith('تغيير اسم الملصق ') || normalizedCleanMessage === 'تغيير_اسم_الملصق' || normalizedCleanMessage.startsWith('تغيير_اسم_الملصق_'):
                const takeArgsAr = rawText.replace(/\.?(تغيير اسم الملصق|تغيير_اسم_الملصق)/, '').trim().split(' ');
                await takeCommand(sock, chatId, message, takeArgsAr);
                commandExecuted = true;
                break;
            case cleanMessage === 'غزل' || normalizedCleanMessage === 'غزل':
                await flirtCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'تحليل الشخصية' || cleanMessage.startsWith('تحليل الشخصية ') || normalizedCleanMessage === 'تحليل_الشخصية' || normalizedCleanMessage.startsWith('تحليل_الشخصية_'):
                await characterCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'توافق' || normalizedCleanMessage === 'توافق':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!' }, { quoted: message });
                    return;
                }
                await shipCommand(sock, chatId, message);
                break;
            case cleanMessage === 'معلومات المجموعة' || normalizedCleanMessage === 'معلومات_المجموعة':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'هذا الأمر يمكن استخدامه في المجموعات فقط!' }, { quoted: message });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
            case cleanMessage === 'تغيير الرابط' || normalizedCleanMessage === 'تغيير_الرابط':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'هذا الأمر يمكن استخدامه في المجموعات فقط!' }, { quoted: message });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId);
                break;
            case cleanMessage === 'الاداريين' || normalizedCleanMessage === 'الاداريين':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'هذا الأمر يمكن استخدامه في المجموعات فقط!' }, { quoted: message });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
            case cleanMessage === 'رابط قصير' || cleanMessage.startsWith('رابط قصير ') || normalizedCleanMessage === 'رابط_قصير' || normalizedCleanMessage.startsWith('رابط_قصير_'):
                await urlCommand(sock, chatId, message);
                break;
            case cleanMessage === 'دمج ايموجي' || cleanMessage.startsWith('دمج ايموجي ') || normalizedCleanMessage === 'دمج_ايموجي' || normalizedCleanMessage.startsWith('دمج_ايموجي_'):
                await emojimixCommand(sock, chatId, message);
                break;
            case cleanMessage === 'ملصقات تيليجرام' || cleanMessage.startsWith('ملصقات تيليجرام ') || normalizedCleanMessage === 'ملصقات_تيليجرام' || normalizedCleanMessage.startsWith('ملصقات_تيليجرام_'):
                await stickerTelegramCommand(sock, chatId, message);
                break;

            case cleanMessage === 'عرض مرة' || normalizedCleanMessage === 'عرض_مرة':
                await viewOnceCommand(sock, chatId, message);
                break;
            case cleanMessage === 'مسح الجلسة' || normalizedCleanMessage === 'مسح_الجلسة':
                await clearSessionCommand(sock, chatId, message);
                break;
            case cleanMessage === 'حالة تلقائية' || cleanMessage.startsWith('حالة تلقائية ') || normalizedCleanMessage === 'حالة_تلقائية' || normalizedCleanMessage.startsWith('حالة_تلقائية_'):
                const autoStatusArgs = cleanMessage.replace(/حالة تلقائية|حالة_تلقائية/g, '').trim().split(' ');
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;
            case cleanMessage === 'معدني' || cleanMessage.startsWith('معدني ') || normalizedCleanMessage === 'معدني' || normalizedCleanMessage.startsWith('معدني_'):
                await textmakerCommand(sock, chatId, message, rawText, 'metallic');
                break;
            case cleanMessage === 'ثلج' || cleanMessage.startsWith('ثلج ') || normalizedCleanMessage === 'ثلج' || normalizedCleanMessage.startsWith('ثلج_'):
                await textmakerCommand(sock, chatId, message, rawText, 'ice');
                break;
            case cleanMessage === 'مصفوفة' || cleanMessage.startsWith('مصفوفة ') || normalizedCleanMessage === 'مصفوفة' || normalizedCleanMessage.startsWith('مصفوفة_'):
                await textmakerCommand(sock, chatId, message, rawText, 'matrix');
                break;
            case cleanMessage === 'ضوء' || cleanMessage.startsWith('ضوء ') || normalizedCleanMessage === 'ضوء' || normalizedCleanMessage.startsWith('ضوء_'):
                await textmakerCommand(sock, chatId, message, rawText, 'light');
                break;
            case cleanMessage === 'نيون' || cleanMessage.startsWith('نيون ') || normalizedCleanMessage === 'نيون' || normalizedCleanMessage.startsWith('نيون_'):
                await textmakerCommand(sock, chatId, message, rawText, 'neon');
                break;
            case cleanMessage === 'شيطاني' || cleanMessage.startsWith('شيطاني ') || normalizedCleanMessage === 'شيطاني' || normalizedCleanMessage.startsWith('شيطاني_'):
                await textmakerCommand(sock, chatId, message, rawText, 'devil');
                break;
            case cleanMessage === 'بنفسجي' || cleanMessage.startsWith('بنفسجي ') || normalizedCleanMessage === 'بنفسجي' || normalizedCleanMessage.startsWith('بنفسجي_'):
                await textmakerCommand(sock, chatId, message, rawText, 'purple');
                break;
            case cleanMessage === 'رعد' || cleanMessage.startsWith('رعد ') || normalizedCleanMessage === 'رعد' || normalizedCleanMessage.startsWith('رعد_'):
                await textmakerCommand(sock, chatId, message, rawText, 'thunder');
                break;
            case cleanMessage === 'نار' || cleanMessage.startsWith('نار ') || normalizedCleanMessage === 'نار' || normalizedCleanMessage.startsWith('نار_'):
                await textmakerCommand(sock, chatId, message, rawText, 'fire');
                break;

            case cleanMessage === 'تفعيل الحذف' || cleanMessage.startsWith('تفعيل الحذف ') || normalizedCleanMessage === 'تفعيل_الحذف' || normalizedCleanMessage.startsWith('تفعيل_الحذف_'):
                if (isGroup) {
                    const adminStatus = await isAdmin(sock, chatId, senderId);
                    if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
                        await sock.sendMessage(chatId, { text: '• عذراً الامر يخص ↤︎ 〖  الادمن 〗 فقط .' }, { quoted: message });
                        break;
                    }
                    await handleAntideleteCommand(sock, chatId, message, 'on');
                } else {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط.' }, { quoted: message });
                }
                break;
            case cleanMessage === 'تعطيل الحذف' || cleanMessage.startsWith('تعطيل الحذف ') || normalizedCleanMessage === 'تعطيل_الحذف' || normalizedCleanMessage.startsWith('تعطيل_الحذف_'):
                if (isGroup) {
                    const adminStatus = await isAdmin(sock, chatId, senderId);
                    if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
                        await sock.sendMessage(chatId, { text: '• عذراً الامر يخص ↤︎ 〖  الادمن 〗 فقط .' }, { quoted: message });
                        break;
                    }
                    await handleAntideleteCommand(sock, chatId, message, 'off');
                } else {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط.' }, { quoted: message });
                }
                break;
            case cleanMessage === 'منع الحذف' || cleanMessage.startsWith('منع الحذف ') || normalizedCleanMessage === 'منع_الحذف' || normalizedCleanMessage.startsWith('منع_الحذف_'):
                const antideleteMatch = cleanMessage.replace(/منع الحذف|منع_الحذف/g, '').trim();
                await handleAntideleteCommand(sock, chatId, message, antideleteMatch);
                break;
            case cleanMessage === 'استسلام' || normalizedCleanMessage === 'استسلام' || cleanMessage === 'مستسلم' || normalizedCleanMessage === 'مستسلم':
                await handleTicTacToeMove(sock, chatId, senderId, 'مستسلم');
                commandExecuted = true;
                break;
            case cleanMessage === 'مسح المؤقت' || normalizedCleanMessage === 'مسح_المؤقت':
                await clearTmpCommand(sock, chatId, message);
                break;
            case cleanMessage === 'تغيير صورة البوت' || normalizedCleanMessage === 'تغيير_صورة_البوت':
                await setProfilePicture(sock, chatId, message);
                break;
            case cleanMessage === 'تغيير الوصف' || cleanMessage.startsWith('تغيير الوصف ') || normalizedCleanMessage === 'تغيير_الوصف' || normalizedCleanMessage.startsWith('تغيير_الوصف_'):
                {
                    const text = rawText.replace(/\.?(تغيير الوصف|تغيير_الوصف)/, '').trim();
                    await setGroupDescription(sock, chatId, senderId, text, message);
                }
                break;
            case cleanMessage === 'تغيير الاسم' || cleanMessage.startsWith('تغيير الاسم ') || normalizedCleanMessage === 'تغيير_الاسم' || normalizedCleanMessage.startsWith('تغيير_الاسم_'):
                {
                    const text = rawText.replace(/\.?(تغيير الاسم|تغيير_الاسم)/, '').trim();
                    await setGroupName(sock, chatId, senderId, text, message);
                }
                break;
            case cleanMessage === 'تغيير الصورة' || cleanMessage.startsWith('تغيير الصورة ') || normalizedCleanMessage === 'تغيير_الصورة' || normalizedCleanMessage.startsWith('تغيير_الصورة_'):
                await setGroupPhoto(sock, chatId, senderId, message);
                break;
            case cleanMessage === 'انستقرام' || cleanMessage.startsWith('انستقرام ') || normalizedCleanMessage === 'انستقرام' || normalizedCleanMessage.startsWith('انستقرام_'):
                await instagramCommand(sock, chatId, message);
                break;
            case cleanMessage === 'قصص انستا مع تعليق' || cleanMessage.startsWith('قصص انستا مع تعليق ') || normalizedCleanMessage === 'قصص_انستا_مع_تعليق' || normalizedCleanMessage.startsWith('قصص_انستا_مع_تعليق_'):
                await igsCommand(sock, chatId, message, true);
                break;
            case cleanMessage === 'قصص انستا' || cleanMessage.startsWith('قصص انستا ') || normalizedCleanMessage === 'قصص_انستا' || normalizedCleanMessage.startsWith('قصص_انستا_'):
                await igsCommand(sock, chatId, message, false);
                break;
            case cleanMessage === 'فيسبوك' || cleanMessage.startsWith('فيسبوك ') || normalizedCleanMessage === 'فيسبوك' || normalizedCleanMessage.startsWith('فيسبوك_'):
                await facebookCommand(sock, chatId, message);
                break;
            case cleanMessage === 'سبوتيفاي' || cleanMessage.startsWith('سبوتيفاي ') || normalizedCleanMessage === 'سبوتيفاي' || normalizedCleanMessage.startsWith('سبوتيفاي_'):
                await spotifyCommand(sock, chatId, message);
                break;
            case cleanMessage === 'اغنية' || cleanMessage.startsWith('اغنية ') || normalizedCleanMessage === 'اغنية' || normalizedCleanMessage.startsWith('اغنية_'):
                await songCommand(sock, chatId, message);
                break;
            case cleanMessage === 'فيديو' || cleanMessage.startsWith('فيديو ') || normalizedCleanMessage === 'فيديو' || normalizedCleanMessage.startsWith('فيديو_'):
                await videoCommand(sock, chatId, message);
                break;
            case cleanMessage === 'تيك توك' || cleanMessage.startsWith('تيك توك ') || normalizedCleanMessage === 'تيك_توك' || normalizedCleanMessage.startsWith('تيك_توك_'):
                await tiktokCommand(sock, chatId, message);
                break;
            case cleanMessage === 'ميتا' || cleanMessage.startsWith('ميتا ') || normalizedCleanMessage === 'ميتا' || normalizedCleanMessage.startsWith('ميتا_'):
                await gptCommand(sock, chatId, message);
                break;
            case cleanMessage === 'جيمني' || cleanMessage.startsWith('جيمني ') || normalizedCleanMessage === 'جيمني' || normalizedCleanMessage.startsWith('جيمني_'):
                await geminiCommand(sock, chatId, message);
                break;
            case cleanMessage === 'ذكاء' || cleanMessage.startsWith('ذكاء ') || normalizedCleanMessage === 'ذكاء' || normalizedCleanMessage.startsWith('ذكاء_'):
                await aiCommand(sock, chatId, message);
                break;
            case cleanMessage === 'ترجم' || cleanMessage.startsWith('ترجم ') || normalizedCleanMessage === 'ترجم' || normalizedCleanMessage.startsWith('ترجم_'):
                const translateText = rawText.replace(/\.?(ترجم)/, '').trim();
                await handleTranslateCommand(sock, chatId, message, translateText);
                return;
            case cleanMessage === 'لقطة شاشة' || cleanMessage.startsWith('لقطة شاشة ') || normalizedCleanMessage === 'لقطة_شاشة' || normalizedCleanMessage.startsWith('لقطة_شاشة_'):
                const ssUrl = rawText.replace(/\.?(لقطة شاشة|لقطة_شاشة)/, '').trim();
                await handleSsCommand(sock, chatId, message, ssUrl);
                break;
            case cleanMessage === 'تفاعل تلقائي' || cleanMessage.startsWith('تفاعل تلقائي ') || normalizedCleanMessage === 'تفاعل_تلقائي' || normalizedCleanMessage.startsWith('تفاعل_تلقائي_'):
                const isOwnerOrSudo = message.key.fromMe || senderIsSudo;
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudo);
                break;
            case cleanMessage === 'المشرفين' || cleanMessage.startsWith('المشرفين ') || normalizedCleanMessage === 'المشرفين' || normalizedCleanMessage.startsWith('المشرفين_'):
                await sudoCommand(sock, chatId, message);
                break;
            case cleanMessage === 'تخيل' || cleanMessage.startsWith('تخيل ') || normalizedCleanMessage === 'تخيل' || normalizedCleanMessage.startsWith('تخيل_'):
                await imagineCommand(sock, chatId, message);
                break;
            case cleanMessage === 'انشاء' || cleanMessage.startsWith('انشاء ') || normalizedCleanMessage === 'انشاء' || normalizedCleanMessage.startsWith('انشاء_'):
                await createImageCommand(sock, chatId, message);
                break;
            case cleanMessage === 'كتابة تلقائية' || cleanMessage.startsWith('كتابة تلقائية ') || normalizedCleanMessage === 'كتابة_تلقائية' || normalizedCleanMessage.startsWith('كتابة_تلقائية_'):
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'قراءة تلقائية' || cleanMessage.startsWith('قراءة تلقائية ') || normalizedCleanMessage === 'قراءة_تلقائية' || normalizedCleanMessage.startsWith('قراءة_تلقائية_'):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'قص الملصق' || normalizedCleanMessage === 'قص_الملصق':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'تحديث' || cleanMessage.startsWith('تحديث ') || normalizedCleanMessage === 'تحديث' || normalizedCleanMessage.startsWith('تحديث_'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                    await updateCommand(sock, chatId, message, senderIsSudo, zipArg);
                }
                commandExecuted = true;
                break;
            case cleanMessage === 'ازالة الخلفية' || cleanMessage.startsWith('ازالة الخلفية ') || normalizedCleanMessage === 'ازالة_الخلفية' || normalizedCleanMessage.startsWith('ازالة_الخلفية_'):
                await removebgCommand.exec(sock, message, cleanMessage.split(' ').slice(2));
                break;
            case cleanMessage === 'تحسين' || cleanMessage.startsWith('تحسين ') || normalizedCleanMessage === 'تحسين' || normalizedCleanMessage.startsWith('تحسين_'):
                await reminiCommand(sock, chatId, message, cleanMessage.split(' ').slice(1));
                break;
            case cleanMessage === 'فيديو ذكي' || cleanMessage.startsWith('فيديو ذكي ') || normalizedCleanMessage === 'فيديو_ذكي' || normalizedCleanMessage.startsWith('فيديو_ذكي_'):
                await soraCommand(sock, chatId, message);
                break;

            case cleanMessage === 'الرابط' || normalizedCleanMessage === 'الرابط':
                await grouplinkCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'اطردني' || normalizedCleanMessage === 'اطردني':
                await kickmeCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case cleanMessage === 'نزلني' || normalizedCleanMessage === 'نزلني':
                await demotemeCommand(sock, chatId, message, senderId, cleanMessage);
                commandExecuted = true;
                break;
            case cleanMessage === 'اكتموه' || normalizedCleanMessage === 'اكتموه':
                await mutehimCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'نداء المالك' || normalizedCleanMessage === 'نداء_المالك':
                await callownerCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            case cleanMessage.startsWith('تفعيل ') || cleanMessage.startsWith('تعطيل '):
                {
                    const parts = cleanMessage.split(' ');
                    const action = parts[0];
                    const feature = parts.slice(1).join(' ');

                    const validFeatures = ['الحظر', 'التحميل', 'الرابط', 'اطردني', 'نزلني', 'المنشن', 'الالعاب', 'الاوامر', 'اكتموه', 'نداء المالك'];
                    if (validFeatures.includes(feature)) {
                        await toggleSettingsCommand(sock, chatId, message, senderId, feature, action);
                        commandExecuted = true;
                    }
                }
                break;

            case cleanMessage === 'اضف رد' || normalizedCleanMessage === 'اضف_رد':
                await addReplyCommand(sock, chatId, message, senderId, '');
                commandExecuted = true;
                return;
            case cleanMessage.startsWith('مسح رد ') || normalizedCleanMessage.startsWith('مسح_رد_'):
                await deleteReplyCommand(sock, chatId, message, senderId, rawText);
                commandExecuted = true;
                return;
            case cleanMessage === 'الردود' || normalizedCleanMessage === 'الردود':
                await listRepliesCommand(sock, chatId, message);
                commandExecuted = true;
                return;

            default:
                // لا تفعل شيء للرسائل العادية - فقط راقب القوانين
                if (isGroup) {
                    // معالجة عملية إضافة الردود
                    const replyProcessed = await handleReplyProcess(sock, chatId, message, senderId, userMessage);
                    if (replyProcessed) return;

                    // فحص الردود المخصصة
                    const replyHandled = await checkReply(sock, chatId, userMessage);
                    if (replyHandled) return;

                    await handleMentionDetection(sock, chatId, message);
                    await handleLockDetection(sock, chatId, message, senderId);
                }
                commandExecuted = false;
                break;
        }

        // إذا لم يتم تنفيذ الأمر وكان هناك تحويل من أمر مخصص، حاول مرة أخرى بعد تحديث normalizedCleanMessage
        if (!commandExecuted && wasCustomCommandTransformed) {
            const normalizedCleanMessageAfterTransform = cleanMessage.replace(/\s+/g, '_');
            
            switch (true) {
                case cleanMessage === 'م1' || cleanMessage === '1':
                    await menu1Command(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'م2' || cleanMessage === '2':
                    await menu2Command(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'م3' || cleanMessage === '3':
                    await menu3Command(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'م4' || cleanMessage === '4':
                    await menu4Command(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'م5' || cleanMessage === '5':
                    await menu5Command(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'م6' || cleanMessage === '6':
                    await menu6Command(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'حب' || normalizedCleanMessageAfterTransform === 'حب':
                    await loveCommand(sock, chatId, message, senderId);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'كره' || normalizedCleanMessageAfterTransform === 'كره':
                    await hateCommand(sock, chatId, message, senderId);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'حظي' || cleanMessage === 'حظه' || normalizedCleanMessageAfterTransform === 'حظي' || normalizedCleanMessageAfterTransform === 'حظه':
                    await luckCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'وجهي' || cleanMessage === 'وجهه' || normalizedCleanMessageAfterTransform === 'وجهي' || normalizedCleanMessageAfterTransform === 'وجهه':
                    await faceCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'امنيتي' || cleanMessage === 'امنيته' || normalizedCleanMessageAfterTransform === 'امنيتي' || normalizedCleanMessageAfterTransform === 'امنيته':
                    await wishCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'نجومي' || cleanMessage === 'نجومه' || normalizedCleanMessageAfterTransform === 'نجومي' || normalizedCleanMessageAfterTransform === 'نجومه':
                    await starsCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'مزاجي' || cleanMessage === 'مزاجه' || normalizedCleanMessageAfterTransform === 'مزاجي' || normalizedCleanMessageAfterTransform === 'مزاجه':
                    await moodCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'غبائي' || cleanMessage === 'غبائه' || normalizedCleanMessageAfterTransform === 'غبائي' || normalizedCleanMessageAfterTransform === 'غبائه':
                    await stupidCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'من يحبني' || cleanMessage === 'من يحبه' || normalizedCleanMessageAfterTransform === 'من_يحبني' || normalizedCleanMessageAfterTransform === 'من_يحبه':
                    await whoLovesCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'من يكرهني' || cleanMessage === 'من يكرهه' || normalizedCleanMessageAfterTransform === 'من_يكرهني' || normalizedCleanMessageAfterTransform === 'من_يكرهه':
                    await whoHatesCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'برجي' || cleanMessage === 'برجه':
                    await zodiacCmd(sock, chatId, message, senderId);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'عمري' || cleanMessage === 'عمره':
                    let gLink = '';
                    if (isGroup) {
                        try { gLink = await sock.groupInviteCode(chatId).then(c => 'https://chat.whatsapp.com/' + c); } catch(e) {}
                    }
                    await ageCmd(sock, chatId, message, senderId, gLink);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'نكته' || cleanMessage === 'نكتة':
                    await jokeCmd(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'ايش تختار' || normalizedCleanMessageAfterTransform === 'ايش_تختار':
                    await chooseCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
            }
        }

        if (!commandExecuted && isGroup && userMessage) {
            const wordBanned = await wordban.checkMessage(sock, chatId, senderId, message, userMessage);
            if (wordBanned) return;
        }

        if (commandExecuted !== false) {
            await showTypingAfterCommand(sock, chatId);
        }

        async function groupJidCommand(sock, chatId, message) {
            const groupJid = message.key.remoteJid;

            if (!groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, {
                    text: "❌ This command can only be used in a group."
                });
            }

            await sock.sendMessage(chatId, {
                text: `✅ Group JID: ${groupJid}`
            }, {
                quoted: message
            });
        }

        if (userMessage.startsWith('.')) {
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;

        if (!id.endsWith('@g.us')) return;

        let isPublic = true;
        try {
            const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch (e) {
        }

        if (action === 'promote') {
            const actionKey = `${id}_${participants.join('_')}`;
            if (sock.recentManualActions && sock.recentManualActions.has(actionKey)) {
                return;
            }
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        if (action === 'demote') {
            const actionKey = `${id}_${participants.join('_')}`;
            if (sock.recentManualActions && sock.recentManualActions.has(actionKey)) {
                return;
            }
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }

        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
        }

        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};