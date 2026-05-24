const fs = require('fs');
const path = require('path');
const { isJidGroup } = require('@whiskeysockets/baileys');
const { getAntilink, setAntilink, removeAntilink } = require('./index');
const { getUserRank, getRankLevel } = require('./ranks');
const { addRestriction } = require('./restrictions');

const violationsPath = path.join(__dirname, '../data/antilinkViolations.json');
const tagViolationsPath = path.join(__dirname, '../data/tagViolations.json');

const configCache = new Map();
const violationCache = new Map();
const tagViolationCache = new Map();
const groupQueues = new Map();
let saveTimer = null;
let configDirty = false;

function loadConfig(groupId) {
    if (configCache.has(groupId)) return configCache.get(groupId);
    const antilinkConfig = getAntilink(groupId, 'on');
    configCache.set(groupId, antilinkConfig);
    return antilinkConfig;
}

function clearConfigCache(groupId) {
    configCache.delete(groupId);
}

function flushConfigCache() {
    configCache.clear();
}

function loadViolations() {
    try {
        if (!fs.existsSync(violationsPath)) {
            fs.writeFileSync(violationsPath, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(violationsPath, 'utf8'));
    } catch (e) {
        return {};
    }
}

function loadTagViolations() {
    try {
        if (!fs.existsSync(tagViolationsPath)) {
            fs.writeFileSync(tagViolationsPath, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(tagViolationsPath, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveTagViolationsNow() {
    const data = {};
    for (const [groupId, users] of tagViolationCache) {
        data[groupId] = {};
        for (const [userId, entry] of users) {
            data[groupId][userId] = entry;
        }
    }
    try {
        fs.writeFileSync(tagViolationsPath, JSON.stringify(data, null, 2));
    } catch (e) {}
}

function saveViolationsNow() {
    const data = {};
    for (const [groupId, users] of violationCache) {
        data[groupId] = {};
        for (const [userId, entry] of users) {
            data[groupId][userId] = entry;
        }
    }
    try {
        fs.writeFileSync(violationsPath, JSON.stringify(data, null, 2));
    } catch (e) {}
}

function scheduleSave() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
        saveViolationsNow();
        saveTagViolationsNow();
        saveTimer = null;
    }, 30000);
}

function addViolation(groupId, userId) {
    if (!violationCache.has(groupId)) {
        violationCache.set(groupId, new Map());
    }
    const groupMap = violationCache.get(groupId);
    const today = new Date().toDateString();
    if (!groupMap.has(userId) || groupMap.get(userId).date !== today) {
        groupMap.set(userId, { count: 0, date: today });
    }
    const entry = groupMap.get(userId);
    entry.count += 1;
    scheduleSave();
    return entry.count;
}

function resetViolations(groupId, userId) {
    if (violationCache.has(groupId)) {
        const groupMap = violationCache.get(groupId);
        groupMap.delete(userId);
    }
    scheduleSave();
}

function addTagViolation(groupId, userId) {
    if (!tagViolationCache.has(groupId)) {
        tagViolationCache.set(groupId, new Map());
    }
    const groupMap = tagViolationCache.get(groupId);
    const today = new Date().toDateString();
    if (!groupMap.has(userId) || groupMap.get(userId).date !== today) {
        groupMap.set(userId, { count: 0, date: today });
    }
    const entry = groupMap.get(userId);
    entry.count += 1;
    scheduleSave();
    return entry.count;
}

function resetTagViolations(groupId, userId) {
    if (tagViolationCache.has(groupId)) {
        const groupMap = tagViolationCache.get(groupId);
        groupMap.delete(userId);
    }
    scheduleSave();
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

async function processGroupQueue(groupId, sock) {
    const queue = groupQueues.get(groupId);
    if (!queue || queue.length === 0) return;

    const task = queue.shift();

    try {
        const { msg, urlFound } = task;

        let isGroupAdmin = false;
        try {
            const groupMetadata = await sock.groupMetadata(groupId);
            const participant = groupMetadata.participants.find(p => p.id === msg.key.participant);
            isGroupAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        } catch (e) {}

        const userRank = await getUserRank(groupId, msg.key.participant, isGroupAdmin);
        const userLevel = getRankLevel(userRank);
        if (userLevel >= 2) return;

        try {
            await sock.sendMessage(groupId, { delete: msg.key });
        } catch (e) {}

        await sock.sendMessage(groupId, {
            text: `*↢ المستخدم〖 @${msg.key.participant.split('@')[0]} 〗*\n*↢ عـذراً ممنوع ارسـال الروابـط.*`,
            mentions: [msg.key.participant]
        });

        const count = addViolation(groupId, msg.key.participant);
        if (count >= 10) {
            const expiresAt = Date.now() + 3 * 24 * 60 * 60 * 1000;
            await addRestriction(groupId, msg.key.participant, expiresAt);
            resetViolations(groupId, msg.key.participant);
            const expireDate = formatDate(new Date(expiresAt));
            await sock.sendMessage(groupId, {
                text: `*↢ المستخدم〖 @${msg.key.participant.split('@')[0]} 〗*\n*↢ بسبب تكرارك لارسال الروابط تم تقييدك حتى「${expireDate}」*`,
                mentions: [msg.key.participant]
            });
        }
    } catch (e) {
        console.error('Error processing antilink queue task:', e);
    }

    if (queue.length > 0) {
        setTimeout(() => processGroupQueue(groupId, sock), 100);
    }
}

function pushToQueue(groupId, msg) {
    if (!groupQueues.has(groupId)) {
        groupQueues.set(groupId, []);
    }
    const queue = groupQueues.get(groupId);
    const isFirst = queue.length === 0;
    queue.push(msg);
    if (isFirst) {
        const sock = global.sock;
        if (sock) {
            setTimeout(() => processGroupQueue(groupId, sock), 0);
        }
    }
}

async function Antilink(msg, sock) {
    const jid = msg.key.remoteJid;
    if (!isJidGroup(jid)) return;

    const sender = msg.key.participant;
    if (!sender) return;

    const SenderMessage = msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text || '';
    if (!SenderMessage || typeof SenderMessage !== 'string') return;

    const config = loadConfig(jid);
    if (!config) return;

    const urlRegex = /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i;
    if (!urlRegex.test(SenderMessage.trim())) return;

    pushToQueue(jid, { msg, urlFound: true });
}

process.on('exit', () => {
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }
    saveViolationsNow();
    saveTagViolationsNow();
});

module.exports = { Antilink, clearConfigCache, flushConfigCache, resetViolations, resetTagViolations };
