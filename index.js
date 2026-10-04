/**
 * Knight Bot - A WhatsApp Bot
 * Copyright (c) 2024 Professor
 * 
 * This program is free software: you can redistribute and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Import lightweight store
const store = require('./lib/lightweight_store')

// Reconnection tracking with exponential backoff
let reconnectAttempts = 0
let lastReconnectTime = 0
const MAX_RECONNECT_ATTEMPTS = 10
const BASE_RECONNECT_DELAY = 3000 // 3 seconds
const MAX_RECONNECT_DELAY = 60000 // 60 seconds

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 Garbage collection completed')
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('⚠️ RAM too high (>400MB), restarting bot...')
        process.exit(1) // Panel will auto-restart
    }
}, 30_000) // check every 30 seconds

let phoneNumber = ""
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = settings.botName
global.themeemoji = "•"
global.phoneNumber = settings.ownerNumber
const pairingCode = process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, use ownerNumber from settings
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}


async function startXeonBotInc() {
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()

    const XeonBotInc = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    })
    global.sock = XeonBotInc;

    XeonBotInc.recentManualActions = new Map()

    store.bind(XeonBotInc.ev)

    // Global duplicate message tracking set
    const processedMessageIds = new Set();
    // Periodically clear the set to prevent memory growth (every minute)
    setInterval(() => {
        processedMessageIds.clear();
    }, 60000);

    // Message handling
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            for (const mek of chatUpdate.messages) {
                try {
                    if (!mek.message) continue;
                    mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
                    if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                        await handleStatus(XeonBotInc, chatUpdate);
                        continue;
                    }
                    if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') continue
                    if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) continue

                    // Deduplication: skip if we already processed this message ID + remoteJid
                    const msgKey = mek.key.id + '@' + mek.key.remoteJid;
                    if (processedMessageIds.has(msgKey)) {
                        continue;
                    }
                    processedMessageIds.add(msgKey);

                    await handleMessages(XeonBotInc, { messages: [mek], type: chatUpdate.type }, true)
                } catch (err) {
                    console.error("Error in handleMessages:", err)
                    if (mek.key && mek.key.remoteJid) {
                        await XeonBotInc.sendMessage(mek.key.remoteJid, {
                            text: '❌ حدث خطأ أثناء معالجة رسالتك.'
                        }).catch(console.error);
                    }
                }
            }

            // Clear message retry cache to prevent memory bloat
            if (XeonBotInc?.msgRetryCounterCache) {
                XeonBotInc.msgRetryCounterCache.clear()
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    XeonBotInc.ev.on('messages.update', async (updates) => {
        try {
            const { incrementEdits } = require('./lib/members');
            for (const update of updates) {
                if (update.key && update.key.remoteJid && update.key.remoteJid.endsWith('@g.us')) {
                    const chatId = update.key.remoteJid;
                    const senderId = update.key.participant || update.key.remoteJid;
                    if (!update.key.fromMe) {
                        incrementEdits(chatId, senderId);
                    }
                }
            }
        } catch (err) {
            console.error("Error in messages.update:", err)
        }
    })

    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`الرجاء إدخال رقم واتساب الخاص بك 😍\nالصيغة: 6281376552730 (بدون + أو مسافات) : `)))
        }

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        const fullNumber = '+' + phoneNumber;
        const parsed = pn(fullNumber);
        console.log(`[DEBUG] Phone number: ${fullNumber}, parsed valid: ${parsed.isValid()}`);
        if (!parsed.isValid()) {
            console.log(chalk.red('رقم غير صالح. سيتم استخدام الرقم من الاعدادات...'));
        }

        setTimeout(async () => {
            try {
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`رمز الاقتران الخاص بك : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nالرجاء إدخال هذا الرمز في تطبيق واتساب:\n1. افتح واتساب\n2. اذهب إلى الإعدادات > الأجهزة المرتبطة\n3. اضغط على "ربط جهاز"\n4. أدخل الرمز الموضح أعلاه`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('فشل في الحصول على رمز الاقتران. الرجاء التحقق من رقمك والمحاولة مرة أخرى.'))
            }
        }, 3000)
    }

    // Connection handling
    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            // Reset reconnect counter on successful connection
            reconnectAttempts = 0
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2)))

            const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
            await XeonBotInc.sendMessage(botNumber, {
                text: `🤖 تم الاتصال بنجاح!\n\n⏰ الوقت: ${new Date().toLocaleString()}\n✅ الحالة: متصل وجاهز!`,
                contextInfo: {}
            });

            // إضافة رقم المطور تلقائياً عند الاقتران
            try {
                const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
                if (!XeonBotInc.contacts) {
                    XeonBotInc.contacts = {};
                }
                XeonBotInc.contacts[ownerJid] = {
                    id: ownerJid,
                    name: 'المطور',
                    notify: 'المطور'
                };
                console.log(chalk.green(`✅ تم إضافة رقم المطور تلقائياً: ${settings.ownerNumber}`));
                // Add owner to sudo list automatically
                const { addSudo, getSudoList } = require('./lib/index');
                const ownerFullJid = settings.ownerNumber + '@s.whatsapp.net';
                const sudoList = await getSudoList();
                if (!sudoList.includes(ownerFullJid)) {
                    await addSudo(ownerFullJid);
                }
            } catch (err) {
                console.log(chalk.red(`⚠️ خطأ في إضافة رقم المطور: ${err.message}`));
            }

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'KNIGHT BOT' } ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: MR UNIQUE HACKER`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: mrunqiuehacker`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: MR UNIQUE HACKER`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`))
            console.log(chalk.blue(`Bot Version: ${settings.version}`))
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const errorMessage = lastDisconnect?.error?.message || 'Unknown error'
            
            console.log(chalk.yellow(`📊 Disconnect Info: statusCode=${statusCode}, error=${errorMessage}`))
            
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync('./session', { recursive: true, force: true })
                } catch { }
                console.log(chalk.red('تم تسجيل الخروج من الجلسة. الرجاء إعادة المصادقة.'))
                reconnectAttempts = 0
                startXeonBotInc()
            } else {
                // Exponential backoff for reconnection
                reconnectAttempts++
                const now = Date.now()
                const timeSinceLastReconnect = now - lastReconnectTime
                
                if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
                    console.log(chalk.red(`❌ تم تجاوز الحد الأقصى لمحاولات إعادة الاتصال (${MAX_RECONNECT_ATTEMPTS}). يرجى إعادة تشغيل البوت يدويًا.`))
                    process.exit(1)
                }
                
                // Calculate exponential backoff with jitter
                const exponentialDelay = Math.min(
                    BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1),
                    MAX_RECONNECT_DELAY
                )
                const jitter = Math.random() * 1000 // Add up to 1 second of randomness
                const totalDelay = exponentialDelay + jitter
                
                console.log(chalk.yellow(`⚠️ انقطع الاتصال. محاولة الاتصال رقم ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} بعد ${(totalDelay / 1000).toFixed(1)} ثانية...`))
                
                setTimeout(() => {
                    lastReconnectTime = Date.now()
                    startXeonBotInc()
                }, totalDelay)
            }
        }
    })

    // Group invite handler: automatically accept group invitations
    XeonBotInc.ev.on('groups.upsert', async (groupList) => {
        try {
            for (const group of groupList) {
                console.log(`[GROUP] New/updated group: ${group.id} - ${group.subject}`);
                const participants = group.participants || [];
                const norm = (a) => (typeof a === "string" ? a.split('@')[0].split(':')[0] : '');
                const botId = XeonBotInc.user?.id || '';
                const botNorm = norm(botId);
                const botP = participants.find(p => norm(p.id) === botNorm);
                const botIsAdmin = botP?.admin === 'admin' || botP?.admin === 'superadmin';
                const author = group.author;
                const authorNorm = norm(author);
                const authorP = participants.find(p => norm(p.id) === authorNorm);
                const authorIsAdmin = authorP?.admin === 'admin' || authorP?.admin === 'superadmin';

                if (botIsAdmin) {
                    const { setPrimaryOwner, getPrimaryOwner } = require('./lib/primaryOwner');
                    if (!getPrimaryOwner(group.id)) setPrimaryOwner(group.id, author);
                    console.log(`[GROUP-ADD] Bot is admin in ${group.id}, welcome + setPrimaryOwner`);
                    await XeonBotInc.sendMessage(group.id, {
                        text: '*↢ تم تفعيل المجموعة، نقاش تلقائيًا*\n*↢ تم ترقية من اضافني ↢ ( مالك اساسي )*\n*↢ المشرفين ↢ ( مالك )*\n*↢ ارسل الاوامر لعرض اوامر البوت*',
                        mentions: [author]
                    }).catch(() => {});
                } else if (!authorIsAdmin) {
                    console.log(`[GROUP-ADD] Inviter is NOT admin in ${group.id}, leaving`);
                    await XeonBotInc.sendMessage(group.id, { text: '*↢ يجب ان يكون المستخدم الذي يضيفني للمجموعه مشرفاً، والا لن استطيع العمل هنا. 😞*' }).catch(() => {});
                    await new Promise(r => setTimeout(r, 1500));
                    await XeonBotInc.groupLeave(group.id).catch(() => {});
                }
            }
        } catch (error) {
            console.error('[GROUP] Error in groups.upsert:', error);
        }
    });

    // Handle direct group invitations - automatically accept when bot is added to group
    XeonBotInc.ev.on('call.offer', async (offer) => {
        try {
            console.log('[GROUP-INVITE] Received offer:', offer);
        } catch (error) {
            console.error('[GROUP-INVITE] Error:', error);
        }
    });

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    XeonBotInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // First: attempt to reject the call if supported
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                            await XeonBotInc.rejectCall(call.id, callerJid);
                        } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                            await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                        }
                    } catch {}

                    // Notify the caller only once within a short window
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await XeonBotInc.sendMessage(callerJid, { text: '📵 خاصية منع المكالمات مفعلة. تم رفض مكالمتك وسيتم حظرك.' });
                    }
                } catch {}
                // Then: block after a short delay to ensure rejection and message are processed
                setTimeout(async () => {
                    try { await XeonBotInc.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {
            // ignore
        }
    });

    XeonBotInc.ev.on('creds.update', saveCreds)

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
        
        const { id, participants, action } = update;
        
        if (action === 'promote' && participants.includes(XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net')) {
            try {
                const { getUserRank, setUserRank } = require('./lib/ranks');
                const groupMetadata = await XeonBotInc.groupMetadata(id);
                const groupParticipants = groupMetadata.participants;
                
                for (const p of groupParticipants) {
                    const currentRank = await getUserRank(id, p.id);
                    if (currentRank === 'عضو') {
                        if (p.id === groupMetadata.owner) {
                            await setUserRank(id, p.id, 'مالك');
                        } else if (p.admin) {
                            await setUserRank(id, p.id, 'ادمن');
                        }
                    }
                }
            } catch (e) {
                console.error('Error auto-assigning ranks:', e);
            }
        }
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
}


// Start the bot with error handling
startXeonBotInc().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})