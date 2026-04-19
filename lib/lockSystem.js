const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(__dirname, '../data/locks.json');

const LOCK_TYPES = {
    IMAGES: 'images',
    VIDEOS: 'videos',
    GIFS: 'gifs',
    STICKERS: 'stickers',
    FILES: 'files',
    AUDIO: 'audio',
    VOICE: 'voice',
    PINS: 'pins',
    CONTACTS: 'contacts',
    FORWARDS: 'forwards',
    EDITS: 'edits',
    MEDIA: 'media',
    ALL: 'all'
};

function ensureLockFile() {
    const dir = path.dirname(LOCK_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOCK_FILE)) {
        fs.writeFileSync(LOCK_FILE, JSON.stringify({}));
    }
}

function readLocks() {
    ensureLockFile();
    try {
        const data = fs.readFileSync(LOCK_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading locks file:', error);
        return {};
    }
}

function writeLocks(locks) {
    ensureLockFile();
    try {
        fs.writeFileSync(LOCK_FILE, JSON.stringify(locks, null, 2));
    } catch (error) {
        console.error('Error writing locks file:', error);
    }
}

async function setLock(chatId, lockType) {
    const locks = readLocks();
    
    if (!locks[chatId]) {
        locks[chatId] = {};
    }
    
    locks[chatId][lockType] = true;
    writeLocks(locks);
    return true;
}

async function getLock(chatId, lockType) {
    const locks = readLocks();
    return locks[chatId] && locks[chatId][lockType] === true;
}

async function removeLock(chatId, lockType) {
    const locks = readLocks();
    
    if (locks[chatId] && locks[chatId][lockType]) {
        delete locks[chatId][lockType];
        writeLocks(locks);
    }
    
    return true;
}

async function getAllLocks(chatId) {
    const locks = readLocks();
    return locks[chatId] || {};
}

module.exports = {
    setLock,
    getLock,
    removeLock,
    getAllLocks,
    LOCK_TYPES
};
