const fs = require('fs');
const path = require('path');

const TOGGLE_FILE = path.join(__dirname, '../data/toggles.json');

const TOGGLE_TYPES = {
    WELCOME: 'welcome',
    REPLIES: 'replies',
    PROMOTE: 'promote',
    ID: 'id',
    BAN: 'ban',
    RESTRICT: 'restrict',
    DOWNLOAD: 'download',
    LINK: 'link',
    KICKME: 'kickme',
    DEMOTEME: 'demoteme',
    MENTION: 'mention',
    GAMES: 'games',
    WARN: 'warn',
    COMMANDS: 'commands',
    MUTEHIM: 'mutehim',
    OWNER_CALL: 'owner_call'
};

function ensureToggleFile() {
    const dir = path.dirname(TOGGLE_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(TOGGLE_FILE)) {
        fs.writeFileSync(TOGGLE_FILE, JSON.stringify({}));
    }
}

function readToggles() {
    ensureToggleFile();
    try {
        const data = fs.readFileSync(TOGGLE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading toggles file:', error);
        return {};
    }
}

function writeToggles(toggles) {
    ensureToggleFile();
    try {
        fs.writeFileSync(TOGGLE_FILE, JSON.stringify(toggles, null, 2));
    } catch (error) {
        console.error('Error writing toggles file:', error);
    }
}

async function setToggle(chatId, toggleType) {
    const toggles = readToggles();
    
    if (!toggles[chatId]) {
        toggles[chatId] = {};
    }
    
    toggles[chatId][toggleType] = true;
    writeToggles(toggles);
    return true;
}

async function getToggle(chatId, toggleType) {
    const toggles = readToggles();
    if (!toggles[chatId]) {
        return true;
    }
    return toggles[chatId][toggleType] !== false;
}

async function removeToggle(chatId, toggleType) {
    const toggles = readToggles();
    
    if (!toggles[chatId]) {
        toggles[chatId] = {};
    }
    
    toggles[chatId][toggleType] = false;
    writeToggles(toggles);
    return true;
}

async function getAllToggles(chatId) {
    const toggles = readToggles();
    return toggles[chatId] || {};
}

module.exports = {
    setToggle,
    getToggle,
    removeToggle,
    getAllToggles,
    TOGGLE_TYPES
};
