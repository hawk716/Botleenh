
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/members.json');

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

function setJoinDate(groupId, userId) {
    userId = typeof userId === 'string' ? userId : (userId?.id || userId?.jid || String(userId));
    const data = load();
    if (!data[groupId]) data[groupId] = {};
    if (!data[groupId][userId]) data[groupId][userId] = {};
    if (!data[groupId][userId].joinedAt) {
        data[groupId][userId].joinedAt = Date.now();
    }
    save(data);
}

function getJoinDate(groupId, userId) {
    userId = typeof userId === 'string' ? userId : (userId?.id || userId?.jid || String(userId));
    const data = load();
    return data[groupId]?.[userId]?.joinedAt || null;
}

function incrementEdits(groupId, userId) {
    userId = typeof userId === 'string' ? userId : (userId?.id || userId?.jid || String(userId));
    const data = load();
    if (!data[groupId]) data[groupId] = {};
    if (!data[groupId][userId]) data[groupId][userId] = {};
    if (!data[groupId][userId].edits) data[groupId][userId].edits = 0;
    data[groupId][userId].edits += 1;
    save(data);
    return data[groupId][userId].edits;
}

function getEditCount(groupId, userId) {
    userId = typeof userId === 'string' ? userId : (userId?.id || userId?.jid || String(userId));
    const data = load();
    return data[groupId]?.[userId]?.edits || 0;
}

function getMessageCount(groupId, userId) {
    userId = typeof userId === 'string' ? userId : (userId?.id || userId?.jid || String(userId));
    try {
        const msgPath = path.join(__dirname, '../data/messageCount.json');
        if (!fs.existsSync(msgPath)) return 0;
        const msgData = JSON.parse(fs.readFileSync(msgPath, 'utf8'));
        return msgData[groupId]?.[userId] || 0;
    } catch (e) {
        return 0;
    }
}

module.exports = { setJoinDate, getJoinDate, incrementEdits, getEditCount, getMessageCount };
