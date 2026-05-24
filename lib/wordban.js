
const fs = require('fs');
const path = require('path');
const { addRestriction } = require('./restrictions');

const dataPath = path.join(__dirname, '../data/wordban.json');

function load() {
    try {
        if (!fs.existsSync(dataPath)) {
            fs.writeFileSync(dataPath, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (e) {
        return {};
    }
}

function save(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function add(groupId, word) {
    const data = load();
    if (!data[groupId]) data[groupId] = { words: [], warned: {} };
    if (!data[groupId].words.includes(word.toLowerCase())) {
        data[groupId].words.push(word.toLowerCase());
        save(data);
        return true;
    }
    return false;
}

function remove(groupId, word) {
    const data = load();
    if (!data[groupId]) return false;
    const index = data[groupId].words.indexOf(word.toLowerCase());
    if (index > -1) {
        data[groupId].words.splice(index, 1);
        save(data);
        return true;
    }
    return false;
}

function check(groupId, text) {
    const data = load();
    if (!data[groupId]) return null;
    const lower = text.toLowerCase();
    const words = lower.split(/[\s,،.\n\r\t]+/).filter(Boolean);
    for (const word of data[groupId].words) {
        if (words.includes(word)) return word;
    }
    return null;
}

function clear(groupId) {
    const data = load();
    if (data[groupId]) {
        delete data[groupId];
        save(data);
        return true;
    }
    return false;
}

function list(groupId) {
    const data = load();
    return data[groupId]?.words || [];
}

function addViolation(groupId, userId) {
    const data = load();
    if (!data[groupId]) data[groupId] = { words: [], warned: {}, violations: {}, restricted: {} };
    if (!data[groupId].violations) data[groupId].violations = {};
    
    const today = new Date().toDateString();
    if (!data[groupId].violations[userId]) {
        data[groupId].violations[userId] = { count: 0, date: today };
    }
    
    if (data[groupId].violations[userId].date !== today) {
        data[groupId].violations[userId] = { count: 0, date: today };
    }
    
    data[groupId].violations[userId].count += 1;
    const count = data[groupId].violations[userId].count;
    save(data);
    return count;
}

function getViolationCount(groupId, userId) {
    const data = load();
    if (!data[groupId]?.violations?.[userId]) return 0;
    const today = new Date().toDateString();
    if (data[groupId].violations[userId].date !== today) {
        data[groupId].violations[userId] = { count: 0, date: today };
        save(data);
        return 0;
    }
    return data[groupId].violations[userId].count;
}

async function checkAndRestrict(sock, chatId, senderId, bannedWord) {
    const count = addViolation(chatId, senderId);
    
    if (count >= 10) {
        const expiresAt = Date.now() + 3 * 24 * 60 * 60 * 1000;
        await addRestriction(chatId, senderId, expiresAt);
        
        try {
            await sock.sendMessage(chatId, {
                text: `*↫ تـم تقييد @${senderId.split('@')[0]} لمدة 3 ايام لاستخدام كلمة ممنوعه*`,
                mentions: [senderId]
            });
        } catch (e) {
            console.error('Error sending restrict message:', e);
        }
        return true;
    }
    return false;
}

module.exports = { add, remove, check, clear, list, addViolation, getViolationCount, checkAndRestrict };
