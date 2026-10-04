const settings = require('./settings');
require('./config.js');
const path = require('path');
const { isBanned } = require('./lib/isBanned');
const { isBotCommand } = require('./lib/commandWords');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fs = require('fs');

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
const demoteOwnerCommand = require('./commands/demoteowner');
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
const habibiTTSCommand = require('./commands/habibi-tts');
const ttsFlow = require('./commands/tts-flow');
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
const { jokeCmd: jokeCommand } = require('./commands/joke');
const zodiacCommand = require('./commands/zodiac');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const poetryCommand = require('./commands/poetry');
const delightCommand = require('./commands/delight');
const travelCommand = require('./commands/travel');
const carCommand = require('./commands/car');
const emojiStickerCommand = require('./commands/emojiSticker');
const luckNumberCommand = require('./commands/luck');
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

const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
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
const memory = require('./commands/memory');
const geminiCommand = require('./commands/gemini');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const imagineCommand = require('./commands/imagine');
const createImageCommand = require('./commands/createimage');
const { handleCreenCommand } = require('./commands/creen');
const { videoCommand } = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { miscCommand, handleHeart } = require('./commands/misc');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const { zodiacCmd, handleZodiacResponse, ageCmd, handleAgeImage, handleAgeTrigger, jokeCmd, pendingZodiac, ageRequests } = require('./commands/zodiac-age');
const { chooseCommand } = require('./commands/choose');
const updateCommand = require('./commands/update');
const { loveCommand, hateCommand, faceCommand, wishCommand, starsCommand, moodCommand, stupidCommand, whoLovesCommand, whoHatesCommand } = require('./commands/fun');
const removebgCommand = require('./commands/removebg');
const reminiCommand = require('./commands/remini');
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
const { requireBotAdmin } = require('./lib/botAdminCheck');
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
global.channelLink = "https://whatsapp.com/channel/120363400425238128";
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
// lazy assign مالك أساسي للمجموعات القديمة التي أُضيف لها البوت قبل تفعيل الميزة
if (isGroup) {
            try{
                const {getPrimaryOwner,setPrimaryOwner}=require('./lib/primaryOwner');
                if(!getPrimaryOwner(chatId)){
                    const meta=await sock.groupMetadata(chatId);
                    const norm=s=>s?s.split('@')[0].split(':')[0]:'';
                    const senderIsAdmin=meta.participants.some(p=>norm(p.id)===norm(senderId) && p.admin);
                    console.log(`[PRIMARY-OWNER-CHECK] senderIsAdmin=${senderIsAdmin} sender=${senderId} participants=${meta.participants.map(p=>p.id+':'+p.admin).join(',')}`);
                    if(senderIsAdmin){
                        setPrimaryOwner(chatId, senderId);
                        console.log(`[PRIMARY-OWNER] assigned ${getPrimaryOwner(chatId)} for ${chatId}`);
                    } else {
                        console.log(`[PRIMARY-OWNER] not assigned — sender not admin`);
                    }
                }
            }catch(e){ console.log('[PRIMARY-OWNER-ERR]', e.message); }
        }
        const senderIsSudo = await isSudo(senderId);
        const configuredBotNumber = String(settings.ownerNumber || '').replace(/\D/g, '');
        const senderNumber = String(senderId || '').split('@')[0].split(':')[0].replace(/\D/g, '');
        const senderIsConfiguredBot = Boolean(configuredBotNumber && senderNumber && senderNumber === configuredBotNumber);

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

        const arabicCommands = ['الاوامر', 'م1', 'م2', 'م3', 'م4', 'م5', 'م6', '1', '2', '3', '4', '5', '6', 'حظر', 'طرد', 'كتم', 'اسئلة', 'أسئلة'];
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
            console.log(`[SUB-CHECK-RESULT] subCheck:`, subCheck);
            if (subCheck && subCheck.subscribed === false) {
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

        const KNOWN_CMD_RE = /^(الاوامر|م[1-6]|[1-6]|احصائيات|كشف|المالك|الرتبه|الايدي|رفع|تنزيل|طرد|حظر|الغاء|كتم|فك|تثبيت|منشن|انذار|مسح|فتح|قفل|ترحيب|وداع|رابط|مميز|ادمن|مدير|مالك|تفعيل|تعطيل|القوانين|الترقيه|ايدي|استعادة|تغيير|تغير|انستا|انستجرام|تيك|فيسبوك|اغنية|اغنيه|فيديو|ملصق|ترجم|خيال|لعبه|بنك|زواج|طلاق|توب|نسبه|شخصيه|ورد|حكمه|شعر|ميمز|طقس|اخبار|يوتيوب|سبوتيفاي|ذكاء|ترجمه|صوره|ستيكر|حظررابط|انتي|زخرفه|اقتباس|حظ|ابراج|نكت|حب|كره|حظي|حظه|حظة|وجهي|وجهه|وجهة|امنيتي|امنيته|نجومي|نجومه|نجومة|مزاجي|مزاجه|مزاجة|غبائي|غبائه|غباءة|من يحبني|من يكرهني|برجي|برجه|عمري|عمره|عمرة|نكته|نكتة|ايش تختار|اكس او|الرجل المشنوق|خمن|اسئلة|أسئلة|مجاملة|اهانة|الكرة السحرية|كلمات الاغنية|جرأة|صراحة|شعر|حب|كره|لعبة|ترفيه|x|o|اكس|حجر|ورقة|مقص|دلع|نكته|نكتة|يوم الورد|ميزاج|مزاج|حظ|حظك|برج|ابراج|زودياك|بينغ|بنق|تمويه|تموية|قائمة المنع|مسح قائمة المنع|صوره القروب|معلومات المجموعة|معلومات المجموعه|عرض مرة|عرض مره|قصص انستا|قصص انستقرام|انشاء صوره|انشاء صورة|لقطة شاشة|لقطه شاشه|ازالة الخلفية|ازاله الخلفيه|اخبار عربية|اخبار عربيه|تغيير اسم الملصق|تغير اسم الملصق|تغيير امر|الاوامر المضافه|الأوامر المضافة|مسح الاوامر المضافه|مسح الأوامر المضافة|المتحركة|التوجيهة|التوجيهه)/;
        // نستثني رسائل البوت نفسه (fromMe) لتجنب حلقة لا نهائية.
        // المحظور: لا تُحذف رسائله، بل نرد عليه فقط عند محاولة استخدام أي أمر.
        if (!message.key.fromMe && isBanned(senderId, chatId)) {
            console.log('[BANNED-CHECK] banned user:', senderId, 'in chat:', chatId, '| text:', cleanMessage);

            // إن لم يكن البوت مشرفاً في هذه المجموعة فلا داعي لرسالة الحظر
            // (رسالة الحظر توحي بأن البوت يعمل) — نطلب من المشرف تعيينه أولاً
            if (!(await requireBotAdmin(sock, chatId, message))) return;

            if (isBotCommand(userMessage)) {
                await sock.sendMessage(chatId, {
                    text: '*↢ عذراً لقد قام احـد المـشـرفين بــحـظـرك مـن اسـتخـدام البــوت في هذه المـجمـوعه*'
                });
            }
            return;
        }

        // ── وكيل الذكاء الاصطناعي ────────────────────────────────────────────
        // يُشغَّل ببادئة «لين» أو «leen» في بداية الرسالة.
        // وإذا وُجد طلب معلق لنفس المستخدم ونفس المجموعة، فأي رسالة لاحقة
        // (ببادئة أو بدونها) تُعامل كاستمرار له حتى يكتمل الفهم أو تنتهي المهلة.
        // ناتجه يُمرَّر إلى switch الموجود بالأسفل، فتعمل كل الفحوص كما هي.
        if (!message.key.fromMe) {
            const ai = require('./lib/aiAgent');
            const det = ai.detectPrefix(rawText);
            const pendFirst = ai.getPending(chatId, senderId);
            if (pendFirst) {
                const handled = await handleAiRequest(sock, chatId, message, senderId, det.triggered ? det.query : rawText, rawText, true);
                if (handled) return;
            } else if (det.triggered) {
                const handled = await handleAiRequest(sock, chatId, message, senderId, det.query, rawText, false);
                if (handled) return;
            }
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
        const isEmojiCommand = cleanMessage.startsWith('.emojimix') || cleanMessage.startsWith('emojimix') || cleanMessage.startsWith('دمج ايموجي') || cleanMessage.startsWith('دمج_ايموجي');

        const downloadCommands = ['اغنية', 'فيديو', 'انستقرام', 'انستا', 'فيسبوك', 'تيك توك', 'سبوتيفاي', 'قصص انستا'];
        const isDownloadCommand = downloadCommands.some(cmd => cleanMessage === cmd || cleanMessage.startsWith(cmd + ' '));
        const hasUrlInMessage = /https?:\/\//.test(cleanMessage);

        if (!isArabicCommand && !isDownloadCommand && !isEmojiCommand && !/^(ميتا|جبتي|مسح المحادثة|لقطه شalth|لقطه_شalth|لقطة شalth|لقطة_شalth)/.test(cleanMessage)) {
            await handleAutotypingForMessage(sock, chatId, userMessage);

            if (isGroup) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
                await Antilink(message, sock);

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
        console.log(`[DEBUG] isGroup=${isGroup}, senderId=${senderId}, isSudo=${senderIsSudo}`);
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
                await jokeCommand(sock, chatId, message);
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

        const adminCommands = ['قفل', 'فتح', 'حظر', 'الغاء_الحظر', 'الغاء الحظر', 'طرد', 'منشن_الكل', 'منشن الكل', 'منشن_الاعضاء', 'منشن الاعضاء', 'منشن_مخفي', 'منشن مخفي', 'منع_الروابط', 'منع الروابط', 'منع_التاك', 'منع التاك', 'تغيير_الوصف', 'تغيير الوصف', 'تغيير_الاسم', 'تغيير الاسم', 'تغيير_الصورة', 'تغيير الصورة'];
        const ownerCommands = ['الوضع', 'حالة_تلقائية', 'حالة تلقائية', 'مسح_المؤقت', 'مسح المؤقت', 'تغيير_صورة_البوت', 'تغيير صورة البوت', 'مسح_الجلسة', 'مسح الجلسة', 'تفاعل_تلقائي', 'تفاعل تلقائي', 'كتابة_تلقائية', 'كتابة تلقائية', 'قراءة_تلقائية', 'قراءة تلقائية', 'حظر_الخاص', 'حظر الخاص'];

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

        // Check if user is in TTS flow (language/dialect/voice selection)
        if (ttsFlow.isWaiting(senderId)) {
            const handled = await ttsFlow.handleTtsInput(sock, chatId, message, senderId, userMessage);
            if (handled) return;
        }

        // حماية شاملة تُفحص داخل الـ switch (أول case) حتى لا تعترض الرسائل العادية مثل "الوو"

        // فحص واحد شامل قبل كل أوامر الـ switch
        if (isGroup) {
            // نحدد هل الرسالة فعلاً أمر بوت (وليس كلام عادي مثل "الوو")
            // نعتبرها أمر إذا طابقت أي case في الـ switch — نبنيها كمجموعة prefixes للأوامر الحقيقية
            const knownCmd = KNOWN_CMD_RE.test(cleanMessage);
            if (knownCmd) {
                if (!(await requireBotAdmin(sock, chatId, message))) return;
            }
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
            case cleanMessage === 'رتبتي' || normalizedCleanMessage === 'رتبتي':
                await checkRankCommand(sock, chatId, message, true);
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
            case cleanMessage === 'حظي' || cleanMessage === 'حظه' || cleanMessage === 'حظة' || normalizedCleanMessage === 'حظي' || normalizedCleanMessage === 'حظه' || normalizedCleanMessage === 'حظة':
                await luckCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'وجهي' || cleanMessage === 'وجهه' || cleanMessage === 'وجهة' || normalizedCleanMessage === 'وجهي' || normalizedCleanMessage === 'وجهه' || normalizedCleanMessage === 'وجهة':
                await faceCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'امنيتي' || cleanMessage === 'امنيته' || normalizedCleanMessage === 'امنيتي' || normalizedCleanMessage === 'امنيته':
                await wishCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'نجومي' || cleanMessage === 'نجومه' || cleanMessage === 'نجومة' || normalizedCleanMessage === 'نجومي' || normalizedCleanMessage === 'نجومه' || normalizedCleanMessage === 'نجومة':
                await starsCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'مزاجي' || cleanMessage === 'مزاجه' || cleanMessage === 'مزاجة' || normalizedCleanMessage === 'مزاجي' || normalizedCleanMessage === 'مزاجه' || normalizedCleanMessage === 'مزاجة':
                await moodCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'غبائي' || cleanMessage === 'غبائه' || cleanMessage === 'غباءة' || normalizedCleanMessage === 'غبائي' || normalizedCleanMessage === 'غبائه' || normalizedCleanMessage === 'غباءة':
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
            case cleanMessage === 'عمري' || cleanMessage === 'عمره' || cleanMessage === 'عمرة': {
                let gLink = '';
                if (isGroup) {
                    try { gLink = await sock.groupInviteCode(chatId).then(c => 'https://chat.whatsapp.com/' + c); } catch(e) {}
                }
                await ageCmd(sock, chatId, message, senderId, gLink);
                commandExecuted = true;
                break;
            }
            case cleanMessage === 'نكته' || cleanMessage === 'نكتة':
                await jokeCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'ايش تختار' || cleanMessage === 'إيش تختار' || normalizedCleanMessage === 'ايش_تختار' || normalizedCleanMessage === 'إيش_تختار':
                await chooseCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'م6' || cleanMessage === '6':
                await menu6Command(sock, chatId, message);
                commandExecuted = true;
                break;

            case cleanMessage === 'صورة' || normalizedCleanMessage === 'صورة' || cleanMessage === 'صوره' || normalizedCleanMessage === 'صوره': {
                await simageCommand(sock, message, chatId);
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
            case cleanMessage === 'نص صوتي' || cleanMessage.startsWith('نص صوتي ') || normalizedCleanMessage === 'نص_صوتي' || normalizedCleanMessage.startsWith('نص_صوتي_'):
                const habibiText = cleanMessage.replace(/نص صوتي|نص_صوتي/g, '').trim();
                if (!habibiText) {
                    await sock.sendMessage(chatId, { text: '*↢ يرجى كتابة النص بعد الأمر.*\nمثال: *نص صوتي مرحبا*' }, { quoted: message });
                } else {
                    await ttsFlow.startFlow(sock, chatId, senderId, habibiText, message);
                }
                commandExecuted = true;
                break;
            case cleanMessage === 'نطق النص' || cleanMessage.startsWith('نطق النص ') || normalizedCleanMessage === 'نطق_النص' || normalizedCleanMessage.startsWith('نطق_النص_'):
                const ntaqText = cleanMessage.replace(/نطق النص|نطق_النص/g, '').trim();
                if (!ntaqText) {
                    await sock.sendMessage(chatId, { text: '*↢ يرجى كتابة النص بعد الأمر.*\nمثال: *نطق النص مرحبا*' }, { quoted: message });
                } else {
                    await ttsFlow.startFlow(sock, chatId, senderId, ntaqText, message);
                }
                commandExecuted = true;
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
            case cleanMessage === 'المالك' || normalizedCleanMessage === 'المالك' || cleanMessage === 'مالك' || normalizedCleanMessage === 'مالك' || cleanMessage === 'المطور' || normalizedCleanMessage === 'المطور':
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

            case cleanMessage === 'قفل الحذف' || normalizedCleanMessage === 'قفل_الحذف' || cleanMessage === 'فتح الحذف' || normalizedCleanMessage === 'فتح_الحذف':
                {
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
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'المالك/المشرف فقط يمكنه استخدام قفل/فتح الحذف.' }, { quoted: message });
                        commandExecuted = true;
                        break;
                    }
                    const isLockDel = cleanMessage === 'قفل الحذف' || normalizedCleanMessage === 'قفل_الحذف';
                    await handleAntideleteCommand(sock, chatId, message, isLockDel ? 'تفعيل' : 'تعطيل');
                    commandExecuted = true;
                }
                break;

            case cleanMessage === 'قفل السب' || normalizedCleanMessage === 'قفل_السب' || cleanMessage === 'فتح السب' || normalizedCleanMessage === 'فتح_السب':
                {
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
                    const rankBad = await getUserRank(chatId, senderId, isSenderAdmin);
                    if (getRankLevel(rankBad) < 2 && !message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 الادمن 〗*' }, { quoted: message });
                        commandExecuted = true;
                        break;
                    }
                    const isLockBad = cleanMessage === 'قفل السب' || normalizedCleanMessage === 'قفل_السب';
                    await handleAntiBadwordCommand(sock, chatId, message, isLockBad ? 'on' : 'off');
                    commandExecuted = true;
                }
                break;

            case cleanMessage.startsWith('قفل ') && !cleanMessage.startsWith('قفل امر') && cleanMessage !== 'قفل الروابط' && cleanMessage !== 'قفل التاك' && cleanMessage !== 'قفل القروب' && cleanMessage !== 'قفل التثبيت' && cleanMessage !== 'قفل الحذف' && cleanMessage !== 'قفل السب':
            case normalizedCleanMessage.startsWith('قفل_') && !normalizedCleanMessage.startsWith('قفل_امر') && normalizedCleanMessage !== 'قفل_الروابط' && normalizedCleanMessage !== 'قفل_التاك' && normalizedCleanMessage !== 'قفل_القروب' && normalizedCleanMessage !== 'قفل_التثبيت' && normalizedCleanMessage !== 'قفل_الحذف' && normalizedCleanMessage !== 'قفل_السب':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ هذا الأمر للمجموعات فقط.' }, { quoted: message });
                    return;
                }
                await handleLockCommand(sock, chatId, rawText, senderId, isSenderAdmin, message);
                commandExecuted = true;
                break;

            case cleanMessage.startsWith('فتح ') && !cleanMessage.startsWith('فتح امر') && cleanMessage !== 'فتح الروابط' && cleanMessage !== 'فتح التاك' && cleanMessage !== 'فتح القروب' && cleanMessage !== 'فتح التثبيت' && cleanMessage !== 'فتح الحذف' && cleanMessage !== 'فتح السب':
            case normalizedCleanMessage.startsWith('فتح_') && !normalizedCleanMessage.startsWith('فتح_امر') && normalizedCleanMessage !== 'فتح_الروابط' && normalizedCleanMessage !== 'فتح_التاك' && normalizedCleanMessage !== 'فتح_القروب' && normalizedCleanMessage !== 'فتح_التثبيت' && normalizedCleanMessage !== 'فتح_الحذف' && normalizedCleanMessage !== 'فتح_السب':
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
            case cleanMessage === 'حقيقة' || cleanMessage === 'حقيقه' || normalizedCleanMessage === 'حقيقة' || normalizedCleanMessage === 'حقيقه':
                await factCommand(sock, chatId, message, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'شعر' || normalizedCleanMessage === 'شعر':
                await poetryCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'دلع' || normalizedCleanMessage === 'دلع' || cleanMessage === 'اسم الدلع' || normalizedCleanMessage === 'اسم_الدلع' || cleanMessage.startsWith('دلع ') || cleanMessage.startsWith('اسم الدلع ') || normalizedCleanMessage.startsWith('دلع_') || normalizedCleanMessage.startsWith('اسم_الدلع_'): {
                const delightArgs = cleanMessage.replace(/^(.?دلع|اسم الدلع|اسم_الدلع)[\s_]*/i, '').trim();
                await delightCommand(sock, chatId, message, delightArgs);
                commandExecuted = true;
                break;
            }
            case cleanMessage === "اين ستسافر" || cleanMessage === "أين ستسافر" || normalizedCleanMessage === "اين_ستسافر" || normalizedCleanMessage === "أين_ستسافر" || cleanMessage.startsWith("اين ستسافر ") || cleanMessage.startsWith("أين ستسافر ") || normalizedCleanMessage.startsWith("اين_ستسافر_") || normalizedCleanMessage.startsWith("أين_ستسافر_"): {
                const travelArgs = cleanMessage.replace(/^(.?اين[\s_]ستسافر[\s_]*)/i, "").trim();
                await travelCommand(sock, chatId, message, travelArgs);
                commandExecuted = true;
                break;
            }
            case cleanMessage === "سيارتي" || normalizedCleanMessage === "سيارتي" || cleanMessage.startsWith("سيارتي ") || normalizedCleanMessage.startsWith("سيارتي_"): {
                const carArgs = cleanMessage.replace(/^(.?سيارتي[\s_]*)/i, "").trim();
                await carCommand(sock, chatId, message, carArgs);
                commandExecuted = true;
                break;
            }
            case cleanMessage === "ايموجي" || normalizedCleanMessage === "ايموجي" || cleanMessage.startsWith("ايموجي ") || normalizedCleanMessage.startsWith("ايموجي_"): {
                const emojiArgs = cleanMessage.replace(/^(.?ايموجي[\s_]*)/i, "").trim();
                await emojiStickerCommand(sock, chatId, message, emojiArgs);
                commandExecuted = true;
                break;
            }
            case cleanMessage === "ايموجي المناسب" || normalizedCleanMessage === "ايموجي_المناسب" || cleanMessage.startsWith("ايموجي المناسب ") || normalizedCleanMessage.startsWith("ايموجي_المناسب_"): {
                const emojiArgs = cleanMessage.replace(/^(.?ايموجي[\s_]+المناسب[\s_]*)/i, "").trim();
                await emojiStickerCommand(sock, chatId, message, emojiArgs);
                commandExecuted = true;
                break;
            }
            case cleanMessage === "رقم حظي" || normalizedCleanMessage === "رقم_حظي" || cleanMessage.startsWith("رقم حظي ") || normalizedCleanMessage.startsWith("رقم_حظي_"): {
                const luckArgs = cleanMessage.replace(/^(.?رقم[\s_]حظي[\s_]*)/i, "").trim();
                await luckNumberCommand(sock, chatId, message, luckArgs);
                commandExecuted = true;
                break;
            }
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
            case cleanMessage === 'اخبار عربية' || cleanMessage === 'اخبار عربيه' || normalizedCleanMessage === 'اخبار_عربية' || normalizedCleanMessage === 'اخبار_عربيه':
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
            case cleanMessage === 'الكرة السحرية' || cleanMessage === 'الكره السحريه' || cleanMessage.startsWith('الكرة السحرية ') || cleanMessage.startsWith('الكره السحريه ') || normalizedCleanMessage === 'الكرة_السحرية' || normalizedCleanMessage === 'الكره_السحريه' || normalizedCleanMessage.startsWith('الكرة_السحرية_') || normalizedCleanMessage.startsWith('الكره_السحريه_'):
                {
                    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    let questionAr = '';

                    if (quotedMessage) {
                        questionAr = quotedMessage.conversation?.trim() ||
                                    quotedMessage.extendedTextMessage?.text?.trim() ||
                                    '';
                    } else {
                        const magicBallKeys = ['الكرة السحرية', 'الكره السحريه', 'الكرة_السحرية', 'الكره_السحريه'];
                        const matchedBallKey = magicBallKeys.find((k) => rawText.includes(k));
                        if (matchedBallKey) {
                            questionAr = rawText.split(matchedBallKey)[1] || '';
                        }
                        questionAr = questionAr.trim();
                    }

                    await eightBallCommand(sock, chatId, questionAr);
                    commandExecuted = true;
                }
                break;
            case cleanMessage === 'كلمات الاغنية' || cleanMessage === 'كلمات الاغنيه' || cleanMessage.startsWith('كلمات الاغنية ') || cleanMessage.startsWith('كلمات الاغنيه ') || normalizedCleanMessage === 'كلمات_الاغنية' || normalizedCleanMessage === 'كلمات_الاغنيه' || normalizedCleanMessage.startsWith('كلمات_الاغنية_') || normalizedCleanMessage.startsWith('كلمات_الاغنيه_'):
                const songTitleAr = rawText.replace(/\.?(كلمات الاغنية|كلمات الاغنيه|كلمات_الاغنية|كلمات_الاغنيه)/, '').trim();
                await lyricsCommand(sock, chatId, songTitleAr, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'جرأة' || cleanMessage === 'جرأه' || normalizedCleanMessage === 'جرأة' || normalizedCleanMessage === 'جرأه':
                await dareCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'صراحة' || cleanMessage === 'صراحه' || normalizedCleanMessage === 'صراحة' || normalizedCleanMessage === 'صراحه':
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
            case cleanMessage === 'رفع مالك' || cleanMessage.startsWith('رفع مالك ') || normalizedCleanMessage === 'رفع_مالك' || normalizedCleanMessage.startsWith('رفع_مالك_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.PROMOTE)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: '*↢ امـر الرفع معطل من قبل المالك*' }, { quoted: message, contextInfo: {} });
                    commandExecuted = true; break;
                }
                await setOwnerCommand(sock, chatId, message, senderId); commandExecuted = true; break;
            case cleanMessage === 'رفع مدير' || cleanMessage.startsWith('رفع مدير ') || normalizedCleanMessage === 'رفع_مدير' || normalizedCleanMessage.startsWith('رفع_مدير_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.PROMOTE)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: '*↢ امـر الرفع معطل من قبل المالك*' }, { quoted: message, contextInfo: {} });
                    commandExecuted = true; break;
                }
                await setManagerCommand(sock, chatId, message, senderId); commandExecuted = true; break;
            case cleanMessage === 'رفع ادمن' || cleanMessage.startsWith('رفع ادمن ') || normalizedCleanMessage === 'رفع_ادمن' || normalizedCleanMessage.startsWith('رفع_ادمن_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.PROMOTE)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: '*↢ امـر الرفع معطل من قبل المالك*' }, { quoted: message, contextInfo: {} });
                    commandExecuted = true; break;
                }
                await setAdminCommand(sock, chatId, message, senderId); commandExecuted = true; break;
            case cleanMessage === 'رفع مميز' || cleanMessage.startsWith('رفع مميز ') || normalizedCleanMessage === 'رفع_مميز' || normalizedCleanMessage.startsWith('رفع_مميز_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.PROMOTE)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: '*↢ امـر الرفع معطل من قبل المالك*' }, { quoted: message, contextInfo: {} });
                    commandExecuted = true; break;
                }
                await setVipCommand(sock, chatId, message, senderId); commandExecuted = true; break;
            case cleanMessage === 'تنزيل مدير' || cleanMessage.startsWith('تنزيل مدير ') || normalizedCleanMessage === 'تنزيل_مدير' || normalizedCleanMessage.startsWith('تنزيل_مدير_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.PROMOTE)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: '*↢ امـر التنزيل معطل من قبل المالك*' }, { quoted: message, contextInfo: {} });
                    commandExecuted = true; break;
                }
                await demoteManagerCommand(sock, chatId, message, senderId); commandExecuted = true; break;
            case cleanMessage === 'تنزيل ادمن' || cleanMessage.startsWith('تنزيل ادمن ') || normalizedCleanMessage === 'تنزيل_ادمن' || normalizedCleanMessage.startsWith('تنزيل_ادمن_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.PROMOTE)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: '*↢ امـر التنزيل معطل من قبل المالك*' }, { quoted: message, contextInfo: {} });
                    commandExecuted = true; break;
                }
                await demoteAdminCommand(sock, chatId, message, senderId); commandExecuted = true; break;
            case cleanMessage === 'تنزيل مميز' || cleanMessage.startsWith('تنزيل مميز ') || normalizedCleanMessage === 'تنزيل_مميز' || normalizedCleanMessage.startsWith('تنزيل_مميز_'):
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.PROMOTE)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: '*↢ امـر التنزيل معطل من قبل المالك*' }, { quoted: message, contextInfo: {} });
                    commandExecuted = true; break;
                }
                await demoteVipCommand(sock, chatId, message, senderId); commandExecuted = true; break;
            case cleanMessage === 'تنزيل مالك' || cleanMessage.startsWith('تنزيل مالك ') || normalizedCleanMessage === 'تنزيل_مالك' || normalizedCleanMessage.startsWith('تنزيل_مالك_'):
                // prevent demoting primary owner via this command — handle inside demoteOwnerCommand
                if (isGroup && !(await getToggle(chatId, TOGGLE_TYPES.PROMOTE)) && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: '*↢ امـر التنزيل معطل من قبل المالك*' }, { quoted: message, contextInfo: {} });
                    commandExecuted = true; break;
                }
                await demoteOwnerCommand(sock, chatId, message, senderId); commandExecuted = true; break;
            case cleanMessage === 'تنزيل مالك اساسي' || cleanMessage.startsWith('تنزيل مالك اساسي ') || normalizedCleanMessage === 'تنزيل_مالك_اساسي' || normalizedCleanMessage.startsWith('تنزيل_مالك_اساسي_'):
                await sock.sendMessage(chatId, { text: '*↢ لا يمكن تنزيل المالك الأساسي.*' }, { quoted: message });
                commandExecuted = true; break;
            case cleanMessage === 'رفع' || normalizedCleanMessage === 'رفع' || cleanMessage === 'تنزيل' || normalizedCleanMessage === 'تنزيل':
                // bare رفع/تنزيل — silent ignore, no response
                commandExecuted = true;
                break;
            case cleanMessage === 'بينغ' || cleanMessage === 'بنق' || normalizedCleanMessage === 'بينغ' || normalizedCleanMessage === 'بنق':
                await pingCommand(sock, chatId, message);
                break;
            case cleanMessage === 'نشط' || normalizedCleanMessage === 'نشط':
                await aliveCommand(sock, chatId, message);
                break;
            case cleanMessage === 'اعدادات المنشن' || cleanMessage.startsWith('اعدادات المنشن ') || normalizedCleanMessage === 'اعدادات_المنشن' || normalizedCleanMessage.startsWith('اعدادات_المنشن_'):
                {
                    const argsAr = rawText.replace(/\.?(اعدادات المنشن|اعدادات_المنشن)/, '').trim();
                    const isOwner = message.key.fromMe || senderIsConfiguredBot || senderIsSudo;
                    if (argsAr) {
                        await mentionToggleCommand(sock, chatId, message, argsAr, isOwner);
                    } else {
                        await setMentionCommand(sock, chatId, message, isOwner);
                    }
                    commandExecuted = true;
                }
                break;
            case cleanMessage === 'تمويه' || cleanMessage === 'تموية' || cleanMessage.startsWith('تمويه ') || cleanMessage.startsWith('تموية ') || normalizedCleanMessage === 'تمويه' || normalizedCleanMessage === 'تموية' || normalizedCleanMessage.startsWith('تمويه_') || normalizedCleanMessage.startsWith('تموية_'):
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

            case cleanMessage === 'قائمه المنع' || cleanMessage === 'قائمة المنع' || normalizedCleanMessage === 'قائمه_المنع' || normalizedCleanMessage === 'قائمة_المنع':
                await wordban.showBanList(sock, chatId, message);
                return;

            case cleanMessage === 'مسح قائمه المنع' || cleanMessage === 'مسح قائمة المنع' || normalizedCleanMessage === 'مسح_قائمه_المنع' || normalizedCleanMessage === 'مسح_قائمة_المنع':
                await wordban.clearBanList(sock, chatId, message);
                return;

            case cleanMessage === 'اسم القروب' || cleanMessage.startsWith('اسم القروب '):
                await setGroupName(sock, chatId, senderId, cleanMessage.replace('اسم القروب', '').trim(), message);
                return;

            case cleanMessage === 'صوره القروب' || cleanMessage === 'صورة القروب' || normalizedCleanMessage === 'صوره_القروب' || normalizedCleanMessage === 'صورة_القروب':
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

            case cleanMessage === 'تغيير اسم الملصق' || cleanMessage === 'تغير اسم الملصق' || cleanMessage.startsWith('تغيير اسم الملصق ') || cleanMessage.startsWith('تغير اسم الملصق ') || normalizedCleanMessage === 'تغيير_اسم_الملصق' || normalizedCleanMessage === 'تغير_اسم_الملصق' || normalizedCleanMessage.startsWith('تغيير_اسم_الملصق_') || normalizedCleanMessage.startsWith('تغير_اسم_الملصق_'):
                const takeArgsAr = rawText.replace(/\.?(تغيير اسم الملصق|تغير اسم الملصق|تغيير_اسم_الملصق|تغير_اسم_الملصق)/, '').trim().split(' ');
                await takeCommand(sock, chatId, message, takeArgsAr);
                commandExecuted = true;
                break;
            case cleanMessage === 'غزل' || normalizedCleanMessage === 'غزل':
                await flirtCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'تحليل الشخصية' || cleanMessage === 'تحليل الشخصيه' || cleanMessage.startsWith('تحليل الشخصية ') || cleanMessage.startsWith('تحليل الشخصيه ') || normalizedCleanMessage === 'تحليل_الشخصية' || normalizedCleanMessage === 'تحليل_الشخصيه' || normalizedCleanMessage.startsWith('تحليل_الشخصية_') || normalizedCleanMessage.startsWith('تحليل_الشخصيه_'):
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
            case cleanMessage === 'معلومات المجموعة' || cleanMessage === 'معلومات المجموعه' || normalizedCleanMessage === 'معلومات_المجموعة' || normalizedCleanMessage === 'معلومات_المجموعه':
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

            case cleanMessage === 'عرض مرة' || cleanMessage === 'عرض مره' || normalizedCleanMessage === 'عرض_مرة' || normalizedCleanMessage === 'عرض_مره':
                await viewOnceCommand(sock, chatId, message);
                break;
            case cleanMessage === 'مسح الجلسة' || normalizedCleanMessage === 'مسح_الجلسة':
                await clearSessionCommand(sock, chatId, message);
                break;
            case cleanMessage === 'حالة تلقائية' || cleanMessage.startsWith('حالة تلقائية ') || normalizedCleanMessage === 'حالة_تلقائية' || normalizedCleanMessage.startsWith('حالة_تلقائية_'):
                const autoStatusArgs = cleanMessage.replace(/حالة تلقائية|حالة_تلقائية/g, '').trim().split(' ');
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
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
            case cleanMessage === 'انستقرام' || cleanMessage === 'انستا' || cleanMessage === 'انستجرام' || cleanMessage.startsWith('انستقرام ') || cleanMessage.startsWith('انستا ') || cleanMessage.startsWith('انستجرام ') || normalizedCleanMessage === 'انستقرام' || normalizedCleanMessage === 'انستا' || normalizedCleanMessage === 'انستجرام' || normalizedCleanMessage.startsWith('انستقرام_') || normalizedCleanMessage.startsWith('انستا_') || normalizedCleanMessage.startsWith('انستجرام_'):
                await instagramCommand(sock, chatId, message);
                break;
            case cleanMessage === 'قصص انستا مع تعليق' || cleanMessage.startsWith('قصص انستا مع تعليق ') || normalizedCleanMessage === 'قصص_انستا_مع_تعليق' || normalizedCleanMessage.startsWith('قصص_انستا_مع_تعليق_'):
                await igsCommand(sock, chatId, message, true);
                break;
            case cleanMessage === 'قصص انستا' || cleanMessage === 'قصص انستقرام' || cleanMessage.startsWith('قصص انستا ') || cleanMessage.startsWith('قصص انستقرام ') || normalizedCleanMessage === 'قصص_انستا' || normalizedCleanMessage === 'قصص_انستقرام' || normalizedCleanMessage.startsWith('قصص_انستا_') || normalizedCleanMessage.startsWith('قصص_انستقرام_'):
                await igsCommand(sock, chatId, message, false);
                break;
            case cleanMessage === 'فيسبوك' || cleanMessage.startsWith('فيسبوك ') || normalizedCleanMessage === 'فيسبوك' || normalizedCleanMessage.startsWith('فيسبوك_'):
                await facebookCommand(sock, chatId, message);
                break;
            case cleanMessage === 'سبوتيفاي' || cleanMessage.startsWith('سبوتيفاي ') || normalizedCleanMessage === 'سبوتيفاي' || normalizedCleanMessage.startsWith('سبوتيفاي_'):
                await spotifyCommand(sock, chatId, message);
                break;
            case cleanMessage === 'اغنية' || cleanMessage === 'أغنية' || cleanMessage === 'اغنيه' || cleanMessage.startsWith('اغنية ') || cleanMessage.startsWith('أغنية ') || cleanMessage.startsWith('اغنيه ') || normalizedCleanMessage === 'اغنية' || normalizedCleanMessage === 'أغنية' || normalizedCleanMessage === 'اغنيه' || normalizedCleanMessage.startsWith('اغنية_') || normalizedCleanMessage.startsWith('أغنية_') || normalizedCleanMessage.startsWith('اغنيه_'):
                await songCommand(sock, chatId, message);
                break;
            case cleanMessage === 'فيديو' || cleanMessage.startsWith('فيديو ') || normalizedCleanMessage === 'فيديو' || normalizedCleanMessage.startsWith('فيديو_'):
                await videoCommand(sock, chatId, message);
                break;
            case cleanMessage === 'تيك توك' || cleanMessage.startsWith('تيك توك ') || normalizedCleanMessage === 'تيك_توك' || normalizedCleanMessage.startsWith('تيك_توك_'):
                await tiktokCommand(sock, chatId, message);
                break;
            case cleanMessage === 'ميتا' || cleanMessage.startsWith('ميتا') || normalizedCleanMessage === 'ميتا' || normalizedCleanMessage.startsWith('ميتا'):
                await gptCommand(sock, chatId, message);
                break;
            case cleanMessage === 'جبتي' || cleanMessage.startsWith('جبتي') || normalizedCleanMessage === 'جبتي' || normalizedCleanMessage.startsWith('جبتي'):
                await gptCommand(sock, chatId, message);
                break;
            case cleanMessage === 'مسح المحادثة' || cleanMessage.startsWith('مسح المحادثة') || normalizedCleanMessage === 'مسح_المحادثة' || normalizedCleanMessage.startsWith('مسح_المحادثة'):
                const userIdForClear = message.key.participant || message.key.remoteJid;
                memory.clearMemory(userIdForClear);
                await sock.sendMessage(chatId, {
                    text: "*↢ تـم إعادة تعين الذاكره للذكاء الاصطناعي.*"
                }, { quoted: message });
                break;
            case cleanMessage === 'جيمني' || cleanMessage.startsWith('جيمني ') || normalizedCleanMessage === 'جيمني' || normalizedCleanMessage.startsWith('جيمني_'):
                await geminiCommand(sock, chatId, message);
                break;
            // أوامر توليد الصور
            case cleanMessage === 'توليد صوره' || cleanMessage.startsWith('توليد صوره ') || normalizedCleanMessage === 'توليد_صوره' || normalizedCleanMessage.startsWith('توليد_صوره_'):
            case cleanMessage === 'توليد صورة' || cleanMessage.startsWith('توليد صورة ') || normalizedCleanMessage === 'توليد_صورة' || normalizedCleanMessage.startsWith('توليد_صورة_'):
                await imagineCommand(sock, chatId, message);
                break;
            case cleanMessage === 'انشاء ذكي' || cleanMessage.startsWith('انشاء ذكي ') || normalizedCleanMessage === 'انشاء_ذكي' || cleanMessage.startsWith('انشاء_ذكي_'):
            case cleanMessage === 'انشاء فيديو ذكي' || cleanMessage.startsWith('انشاء فيديو ذكي ') || normalizedCleanMessage === 'انشاء_فيديو_ذكي' || cleanMessage.startsWith('انشاء_فيديو_ذكي_'):
                await handleCreenCommand(sock, chatId, message, rawText.replace(/^(\.?(انشاء\s*(?:فيديو|فديو)?\s*ذكي|انشاء_(?:فيديو|فديو)?_ذكي))/i, '').trim());
                commandExecuted = true;
                break;
            case cleanMessage === 'انشاء صوره' || cleanMessage.startsWith('انشاء صوره ') || normalizedCleanMessage === 'انشاء_صوره' || normalizedCleanMessage.startsWith('انشاء_صوره_'):
            case cleanMessage === 'انشاء صورة' || cleanMessage.startsWith('انشاء صورة ') || normalizedCleanMessage === 'انشاء_صورة' || normalizedCleanMessage.startsWith('انشاء_صورة_'):
                if (cleanMessage.startsWith('انشاء ذكي') || cleanMessage.startsWith('انشاء_ذكي')) {
                    const args = rawText.replace(/^(\.?انشاء\s*ذكي|انشاء_ذكي)/i, '').trim();
                    await handleCreenCommand(sock, chatId, message, args);
                } else {
                    await createImageCommand(sock, chatId, message);
                }
                commandExecuted = true;
                break;
             case cleanMessage === 'انشاء صوره' || cleanMessage.startsWith('انشاء صوره ') || normalizedCleanMessage === 'انشاء_صوره' || normalizedCleanMessage.startsWith('انشاء_صوره_'):
             case cleanMessage === 'انشاء صورة' || cleanMessage.startsWith('انشاء صورة ') || normalizedCleanMessage === 'انشاء_صورة' || normalizedCleanMessage.startsWith('انشاء_صورة_'):
                 if (cleanMessage.startsWith('انشاء ذكي') || cleanMessage.startsWith('انشاء_ذكي')) {
                     const args = rawText.replace(/^(\.?انشاء\s*ذكي|انشاء_ذكي)/i, '').trim();
                     await handleCreenCommand(sock, chatId, message, args);
                 } else {
                     await createImageCommand(sock, chatId, message);
                 }
                 commandExecuted = true;
                 break;
            case cleanMessage === 'ترجم' || cleanMessage.startsWith('ترجم ') || normalizedCleanMessage === 'ترجم' || normalizedCleanMessage.startsWith('ترجم_'):
                const translateText = rawText.replace(/\.?(ترجم)/, '').trim();
                await handleTranslateCommand(sock, chatId, message, translateText);
                return;
            case cleanMessage === 'لقطة شاشة' || cleanMessage.startsWith('لقطة شاشة ') || normalizedCleanMessage === 'لقطة_شاشة' || normalizedCleanMessage.startsWith('لقطة_شاشة_'):
                const ssUrl = rawText.replace(/\.?(لقطة شاشة|لقطة_شاشة)/, '').trim();
                await handleSsCommand(sock, chatId, message, ssUrl);
                break;
            case cleanMessage === 'لقطه شاشه' || cleanMessage.startsWith('لقطه شاشه ') || normalizedCleanMessage === 'لقطه_شاشه' || normalizedCleanMessage.startsWith('لقطه_شاشه_'):
                const ssUrl2 = rawText.replace(/\.?(لقطه شاشه|لقطه_شاشه)/, '').trim();
                await handleSsCommand(sock, chatId, message, ssUrl2);
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
                if (cleanMessage.includes('ذكي') || cleanMessage.includes('فيديو ذكي')) {
                    const args = rawText.replace(/^(\.?انشاء\s*(?:فيديو|فديو|فديو)?\s*ذكي|انشاء_(?:فيديو|فديو)?_ذكي)/i, '').trim();
                    await handleCreenCommand(sock, chatId, message, args);
                } else {
                    await createImageCommand(sock, chatId, message);
                }
                commandExecuted = true;
                break;
            case cleanMessage === 'كتابة تلقائية' || cleanMessage.startsWith('كتابة تلقائية ') || normalizedCleanMessage === 'كتابة_تلقائية' || normalizedCleanMessage.startsWith('كتابة_تلقائية_'):
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'قراءة تلقائية' || cleanMessage.startsWith('قراءة تلقائية ') || normalizedCleanMessage === 'قراءة_تلقائية' || normalizedCleanMessage.startsWith('قراءة_تلقائية_'):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'قص ملصق' || normalizedCleanMessage === 'قص_ملصق':
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
            case cleanMessage === 'ازالة الخلفية' || cleanMessage.startsWith('ازالة الخلفية ') || normalizedCleanMessage === 'ازالة_الخلفية' || normalizedCleanMessage.startsWith('ازالة_الخلفية_') ||
                  cleanMessage === 'ازاله الخلفيه' || cleanMessage.startsWith('ازاله الخلفيه ') || normalizedCleanMessage === 'ازاله_الخلفيه' || normalizedCleanMessage.startsWith('ازاله_الخلفيه_'):
                await removebgCommand.exec(sock, message, cleanMessage.split(' ').slice(2));
                break;
            case cleanMessage === 'تحسين' || cleanMessage.startsWith('تحسين ') || normalizedCleanMessage === 'تحسين' || normalizedCleanMessage.startsWith('تحسين_'):
                await reminiCommand.exec(sock, message, cleanMessage.split(' ').slice(1));
                break;
            case cleanMessage === 'فيديو ذكي' || cleanMessage.startsWith('فيديو ذكي ') || normalizedCleanMessage === 'فيديو_ذكي' || normalizedCleanMessage.startsWith('فيديو_ذكي_'):
                await soraCommand(sock, chatId, message);
                break;
            case cleanMessage === 'توليد فيديو' || cleanMessage.startsWith('توليد فيديو ') || normalizedCleanMessage === 'توليد_فيديو' || normalizedCleanMessage.startsWith('توليد_فيديو_'):
            case cleanMessage === 'انشاء فيديو' || cleanMessage.startsWith('انشاء فيديو ') || normalizedCleanMessage === 'انشاء_فيديو' || normalizedCleanMessage.startsWith('انشاء_فيديو_'):
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
            case cleanMessage === 'اكتموه' || cleanMessage === 'اكتموة' || normalizedCleanMessage === 'اكتموه' || normalizedCleanMessage === 'اكتموة':
                await mutehimCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cleanMessage === 'نداء المالك' || normalizedCleanMessage === 'نداء_المالك' || cleanMessage === 'نداء مالك' || normalizedCleanMessage === 'نداء_مالك':
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
            if (isGroup) { if (!(await requireBotAdmin(sock, chatId, message))) return; }

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
                case cleanMessage === 'حظي' || cleanMessage === 'حظه' || cleanMessage === 'حظة' || normalizedCleanMessageAfterTransform === 'حظي' || normalizedCleanMessageAfterTransform === 'حظه' || normalizedCleanMessageAfterTransform === 'حظة':
                    await luckCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'وجهي' || cleanMessage === 'وجهه' || cleanMessage === 'وجهة' || normalizedCleanMessageAfterTransform === 'وجهي' || normalizedCleanMessageAfterTransform === 'وجهه' || normalizedCleanMessageAfterTransform === 'وجهة':
                    await faceCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'امنيتي' || cleanMessage === 'امنيته' || normalizedCleanMessageAfterTransform === 'امنيتي' || normalizedCleanMessageAfterTransform === 'امنيته':
                    await wishCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'نجومي' || cleanMessage === 'نجومه' || cleanMessage === 'نجومة' || normalizedCleanMessageAfterTransform === 'نجومي' || normalizedCleanMessageAfterTransform === 'نجومه' || normalizedCleanMessageAfterTransform === 'نجومة':
                    await starsCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'مزاجي' || cleanMessage === 'مزاجه' || cleanMessage === 'مزاجة' || normalizedCleanMessageAfterTransform === 'مزاجي' || normalizedCleanMessageAfterTransform === 'مزاجه' || normalizedCleanMessageAfterTransform === 'مزاجة':
                    await moodCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'غبائي' || cleanMessage === 'غبائه' || cleanMessage === 'غباءة' || normalizedCleanMessageAfterTransform === 'غبائي' || normalizedCleanMessageAfterTransform === 'غبائه' || normalizedCleanMessageAfterTransform === 'غباءة':
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
                case cleanMessage === 'عمري' || cleanMessage === 'عمره' || cleanMessage === 'عمرة':
                    let gLink = '';
                    if (isGroup) {
                        try { gLink = await sock.groupInviteCode(chatId).then(c => 'https://chat.whatsapp.com/' + c); } catch(e) {}
                    }
                    await ageCmd(sock, chatId, message, senderId, gLink);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'نكته' || cleanMessage === 'نكتة':
                    await jokeCommand(sock, chatId, message);
                    commandExecuted = true;
                    break;
                case cleanMessage === 'ايش تختار' || cleanMessage === 'إيش تختار' || normalizedCleanMessageAfterTransform === 'ايش_تختار' || normalizedCleanMessageAfterTransform === 'إيش_تختار':
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
            const norm = (a) => { const s = typeof a === "string" ? a : (a && (a.id || a.jid || a.phoneNumber) ? (a.id || a.jid || a.phoneNumber) : String(a)); return s.split('@')[0].split(':')[0]; };
            const botIdNum = sock.user.id.split(':')[0].split('@')[0];
            const botPromoted = participants.some(p => {
                if (typeof p === 'string') return p.split('@')[0].split(':')[0] === botIdNum;
                const idNorm = (p.id || p.jid || '').split('@')[0].split(':')[0];
                const phoneNorm = (p.phoneNumber || '').split('@')[0].split(':')[0];
                return idNorm === botIdNum || phoneNorm === botIdNum;
            });
            if (botPromoted && author) {
                let meta = null;
                try { meta = await sock.groupMetadata(id); } catch {}
                const authorIsAdmin = meta ? meta.participants.some(p => norm(p.id) === norm(author) && p.admin) : false;
                if (authorIsAdmin) {
                    const { setPrimaryOwner, getPrimaryOwner } = require('./lib/primaryOwner');
                    if (!getPrimaryOwner(id)) setPrimaryOwner(id, author);
                    const contactName = sock.contacts?.get?.(author)?.name || author.split('@')[0];
                    const groupName = meta?.subject || 'المجموعة';
                    await sock.sendMessage(id, {
                        text: '*↢ تــم تــفــعــيـل المـجــمــوعــه "' + groupName + '" تــلقــائيــاً*\n\n*↢ المــســتــخـدم ( @' + contactName + ' ) ↢ مــالك اســاسي*\n\n*↢ المــشــرفــيــن رتـبـتـهم ↢ ( مالك )*\n\n*↢ ارســل "الاوامــر"  لعــرض اوامـر البــوت*',
                        mentions: [author].filter(Boolean)
                    }).catch(() => {});
                }
            }

            const participantsStr = participants.map(norm);
            const actionKey = `${id}_${participantsStr.join('_')}`;
            if (sock.recentManualActions && sock.recentManualActions.has(actionKey)) {
                return;
            }
            if (!isPublic) return;
            if (!botPromoted) return; // يتعامل بس مع ترقية البوت
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        // حماية المالك الأساسي: إذا تم تنزيله أو إزالته من المجموعة، يغادر البوت
        if (action === 'demote' || action === 'remove') {
            try {
                const { getPrimaryOwner, isPrimaryOwner, clearPrimaryOwner } = require('./lib/primaryOwner');
                const primaryOwner = getPrimaryOwner(id);
                if (primaryOwner) {
                    const norm = (a) => { const s = typeof a === "string" ? a : (a && (a.id || a.jid || a.phoneNumber) ? (a.id || a.jid || a.phoneNumber) : String(a)); return s.split('@')[0].split(':')[0]; };
                    const primaryNorm = primaryOwner.split('@')[0].split(':')[0];
                    const affected = participants.map(norm);
                    const primaryAffected = affected.includes(primaryNorm) || participants.some(p => isPrimaryOwner(id, typeof p === 'string' ? p : (p && (p.id || p.jid || p.phoneNumber) ? (p.id || p.jid || p.phoneNumber) : String(p))));

                    if (primaryAffected) {
                        await sock.sendMessage(id, {
                            text: '*↢المـالك الاسـاسـي (الذي ضـافني) لـم يعد مشرف سـاغـادر الان، يمـكن لاي مشـرف آخـر رفـعي مـن جـديد ليصـبح المـالك الاسـاسـي*'
                        }).catch(() => {});
                        clearPrimaryOwner(id);
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        await sock.groupLeave(id).catch(() => {});
                        return;
                    }
                }
            } catch (e) {
                console.error('Error in primary owner protection:', e);
            }
        }

        if (action === 'demote') {
            const norm = (a) => { const s = typeof a === "string" ? a : (a && (a.id || a.jid || a.phoneNumber) ? (a.id || a.jid || a.phoneNumber) : String(a)); return s.split('@')[0].split(':')[0]; };
            const botIdNum = sock.user.id.split(':')[0].split('@')[0];
            const botDemoted = participants.some(p => {
                if (typeof p === 'string') return p.split('@')[0].split(':')[0] === botIdNum;
                const idNorm = (p.id || p.jid || '').split('@')[0].split(':')[0];
                const phoneNorm = (p.phoneNumber || '').split('@')[0].split(':')[0];
                return idNorm === botIdNum || phoneNorm === botIdNum;
            });
            if (!isPublic) return;
            if (!botDemoted) return; // يتعامل بس مع تنزيل البوت
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

/**
 * وكيل الذكاء الاصطناعي — يتعامل مع رسالة تبدأ ببادئة لين/leen.
 *
 * النموذج يشرح أو يختار أداة معتمدة فقط، ولا ينفّذ شيئاً بنفسه.
 * الأداة تتحقق منها عندنا، ثم نحوّلها إلى نص تنفيذي بالحرف، ونمرّرها إلى
 * handleMessages بنفس مفتاح الرسالة الحقيقي، فتعمل فحوص المشرف والرتبة والتبديل كالمعتاد.
 *
 * الأوامر الخطرة لا تُنفَّذ إلا بتأكيد من رسالة جديدة لنفس المستخدم لنفس العملية.
 * رسالة التأكيد يكتبها النموذج نفسه.
 */
/**
 * وكيل الذكاء الاصطناعي — فهم وتحويل نص فقط.
 *
 * النموذج يرد باسم أمر واحد موجود في النظام. نكتب هذا الاسم في حقل
 * النص من كائن الرسالة الأصلية نفسه (دون المساس بـ key أو المنشن
 * أو أي بيانات أخرى)، ثم نمرر نفس الرسالة إلى handleMessages
 * فيتعامل معها النظام كأن المستخدم أرسل الأمر مباشرة.
 * لا تأكيد، لا صلاحيات جديدة: النظام الحالي يتولى كل شيء.
 */
/**
 * وكيل الذكاء الاصطناعي — فهم النية فقط.
 *
 * النموذج يقرر: محادثة (CHAT) أو سؤال (ASK) فيُرسل رده مباشرة،
 * أو تنفيذ (RUN) فنكتب أسماء الأوامر في نص الرسالة الأصلية نفسها
 * (دون المساس بـ key أو المنشن أو أي بيانات أخرى) ونمررها إلى
 * handleMessages الذي يتولى التنفيذ والصلاحيات كالمعتاد.
 * لا تأكيد، لا صلاحيات جديدة: النظام الحالي يحكم.
 */
/**
 * وكيل الذكاء الاصطناعي — فهم النية فقط.
 *
 * يُستدعى ببادئة «لين»/«leen»، أو عند رد لاحق (ولو بلا بادئة) على سؤال
 * توضيحي معلّق لنفس المستخدم ونفس المجموعة.
 * النموذج يقرر: محادثة (CHAT) أو سؤال (ASK) فيُرد مباشرة،
 * أو توضيح (CLARIFY) فيُحفظ الطلب الأصلي بكائنه،
 * أو تنفيذ (RUN) فنكتب الأسماء في نص رسالة حقيقية (الأصلية المحفوظة
 * عند الحاجة) ونمررها إلى handleMessages الذي يتولى كل شيء كالمعتاد.
 * لا تأكيد، لا صلاحيات جديدة: النظام الحالي يحكم.
 */
async function handleAiRequest(sock, chatId, message, senderId, query, rawText, isContinuation) {
    const ai = require('./lib/aiAgent');
    const { UNDER_MAINTENANCE } = require('./lib/messages');

    const reply = (text) => sock.sendMessage(chatId, { text }, { quoted: message });

    // نحفظ كل رسالة بسياقها الحقيقي قبل أي تعديل.
    ai.rememberMessage(chatId, senderId, message);

    // طلب جديد ببادئة يلغي أي تعليق سابق — موضوع جديد يعني بداية جديدة.
    if (!isContinuation) ai.clearPending(chatId, senderId);

    // رد لاحق بلا طلب معلّق (انتهت مهلته مثلاً): يعود للمسار الطبيعي.
    let pend = null;
    if (isContinuation) {
        pend = ai.getPending(chatId, senderId);
        if (!pend) return false;
    }

    if (!query) {
        await reply('*↢ أنا لين، مساعد البوت.*\n*↢ اذكر اسمي أولاً ثم كلمني.*\n*↢ مثال: لين كيف أرفع مالك؟*');
        return true;
    }

    if (!ai.hasApiKey()) {
        console.error('[AI] AI_API_KEY غير موجود');
        await reply(UNDER_MAINTENANCE);
        return true;
    }

    await sock.sendMessage(chatId, { react: { text: '\u{1F9E0}', key: message.key } }).catch(() => {});

    const userContent = ai.buildContext(chatId, senderId, pend, query, message);
    const out = await ai.callModel([
        { role: 'system', content: ai.SYSTEM_PROMPT + '\n\n' + ai.reference() },
        { role: 'user', content: userContent }
    ]);

    if (out.error) {
        console.error('[AI] خطأ النموذج:', String(out.error).slice(0, 140));
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
        await reply(UNDER_MAINTENANCE);
        return true;
    }

    const raw = out.data?.choices?.[0]?.message?.content || '';
    const intent = ai.parseIntent(raw);

    // مخرج خارج البروتوكول: نرسله كما هو إن كان نصاً، وإلا نطلب التوضيح.
    if (!intent) {
        const fallback = String(raw || '').trim().split('\n')[0].trim().slice(0, 500);
        ai.pushReply(chatId, senderId, fallback || 'طلب توضيح');
        await sock.sendMessage(chatId, { react: { text: '\u{1F916}', key: message.key } }).catch(() => {});
        await reply(fallback || '*↢ ما فهمت، ممكن توضح أكثر؟*');
        return true;
    }

    // موضوع جديد مستقل: يُلغى المعلق ويُعالَج الطلب من جديد.
    // (يُحترم فقط في سياق متابعة؛ في طلب جديد يُعامل كعدم فهم.)
    if (intent.type === 'NEW') {
        if (isContinuation) {
            ai.clearPending(chatId, senderId);
            return await handleAiRequest(sock, chatId, message, senderId, query, rawText, false);
        }
        await reply('*↢ ما فهمت، ممكن توضح أكثر؟*');
        return true;
    }

    // محادثة أو سؤال: رد النموذج مباشرة، بلا handleMessages. التعليق يبقى لمتابعة الحوار.
    if (intent.type === 'CHAT' || intent.type === 'ASK') {
        ai.pushReply(chatId, senderId, intent.text);
        await sock.sendMessage(chatId, { react: { text: '\u{1F916}', key: message.key } }).catch(() => {});
        await reply(intent.text.slice(0, 3500));
        return true;
    }

    // سؤال توضيحي: نحفظ الرسالة الأصلية بكائنها ونرد بالسؤال. لا تنفيذ.
    if (intent.type === 'CLARIFY') {
        ai.setPending(chatId, senderId, {
            message, originalQuery: (isContinuation && pend) ? pend.originalQuery : query,
            candidates: [], question: intent.text
        });
        ai.pushReply(chatId, senderId, intent.text);
        await sock.sendMessage(chatId, { react: { text: '\u{1F916}', key: message.key } }).catch(() => {});
        await reply(intent.text.slice(0, 1000));
        return true;
    }

    // تنفيذ: مطابقة صارمة لكل اسم، ثم تسلسل برسائل حقيقية.
    // الهدف يُلتقط مرة واحدة قبل التسلسل: منشن الرسالة الأصلية المحفوظة.
    const runTarget = isContinuation ? ai.getPendingTarget(chatId, senderId) : { hasMention: false, message: null };
    const done = [];
    for (let i = 0; i < intent.commands.length; i++) {
        const name = ai.resolveName(intent.commands[i]);
        if (!name) {
            // توقف واسأل مع حفظ الطلب الأصلي: الرد اللاحق يكمله.
            const follow = await ai.callModel([
                { role: 'system', content: 'أنت "لين" مساعد واتساب. اكتب سؤالاً قصيراً بالعربية للمستخدم: ما الذي تم فهمه وتنفيذه حتى الآن، وما الأمر غير المفهوم، واسأله عنه. سطران فقط، بلا مقدمات وبلا جداول.' },
                { role: 'user', content: ai.buildContext(chatId, senderId, pend, `نُفذ حتى الآن: ${done.length ? done.join('، ') : 'لا شيء'}. الأمر غير المفهوم: «${intent.commands[i]}».${i + 1 < intent.commands.length ? ` وبعده: ${intent.commands.slice(i + 1).join('، ')}.` : ''}`, message) }
            ]);
            const txt = String(follow.data?.choices?.[0]?.message?.content || '').trim().split('\n').slice(0, 3).join('\n').slice(0, 600)
                || '*↢ ما فهمت جزءاً من الطلب، ممكن توضحه؟*';
            ai.setPending(chatId, senderId, {
                message, originalQuery: query,
                candidates: intent.commands.slice(i), question: txt
            });
            ai.pushReply(chatId, senderId, txt);
            await reply(txt);
            return true;
        }
        // التعديل الوحيد المسموح: حقل النص في رسالة حقيقية.
        // الهدف يأتي من منشن الرسالة الأصلية المحفوظة مع الطلب المعلّق،
        // وإلا من منشن الرسالة الحالية. لا بحث عشوائي في رسائل قديمة.
        // كل بيانات WhatsApp أصلية كما وصلت، دون اختلاق أي معرف.
        const text = name.name.replace(/_/g, ' ');
        let target = message;
        if (ai.needsTarget(name.name) && !ai.messageHasMention(message)) {
            if (runTarget.hasMention && runTarget.message && runTarget.message !== message) {
                console.log('[AI] التنفيذ على الرسالة الأصلية المحفوظة:', runTarget.keyId);
                target = runTarget.message;
            } else {
                await reply('*↢ يرجى عمل منشن للمستخدم الذي تريد تنفيذ الأمر عليه.*');
                return true;
            }
        }
        const m = target.message;
        if (m?.extendedTextMessage && typeof m.extendedTextMessage.text === 'string') {
            m.extendedTextMessage.text = text;
        } else if (m && typeof m.conversation === 'string') {
            m.conversation = text;
        } else if (m?.imageMessage && typeof m.imageMessage.caption === 'string') {
            m.imageMessage.caption = text;
        } else if (m?.videoMessage && typeof m.videoMessage.caption === 'string') {
            m.videoMessage.caption = text;
        } else {
            await reply('*↢ الأمر غير موجود*');
            return true;
        }
        // نستهلك التعليق قبل إعادة الدخول حتى لا تلتقط الرسالة المُعاد إدخالها.
        ai.clearPending(chatId, senderId);
        // نفس الرسالة (أو رسالة السياق ذات الصلة)، نفس المفتاح، نفس المسار الحالي.
        await handleMessages(sock, { messages: [target], type: 'notify' }, true);
        done.push(text);
    }

    ai.pushReply(chatId, senderId, 'طلب تنفيذ: ' + done.join('، '));
    return true;
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};
