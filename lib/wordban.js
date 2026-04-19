
const fs = require('fs');
const path = require('path');

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
    for (const word of data[groupId].words) {
        if (lower.includes(word)) return word;
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

function shouldWarn(groupId, userId) {
    const data = load();
    if (!data[groupId]) return true;
    const today = new Date().toDateString();
    const lastWarn = data[groupId].warned[userId];
    if (lastWarn !== today) {
        data[groupId].warned[userId] = today;
        save(data);
        return true;
    }
    return false;
}

module.exports = { add, remove, check, clear, list, shouldWarn };
