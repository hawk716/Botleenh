const fs = require('fs');
const path = require('path');

const CMDLOCK_FILE = path.join(__dirname, '../data/cmdlocks.json');

function ensureCmdLockFile() {
    const dir = path.dirname(CMDLOCK_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(CMDLOCK_FILE)) {
        fs.writeFileSync(CMDLOCK_FILE, JSON.stringify({}));
    }
}

function readCmdLocks() {
    ensureCmdLockFile();
    try {
        const data = fs.readFileSync(CMDLOCK_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading cmdlocks file:', error);
        return {};
    }
}

function writeCmdLocks(cmdlocks) {
    ensureCmdLockFile();
    try {
        fs.writeFileSync(CMDLOCK_FILE, JSON.stringify(cmdlocks, null, 2));
    } catch (error) {
        console.error('Error writing cmdlocks file:', error);
    }
}

async function setCmdLock(chatId, commandName, requiredRank) {
    const cmdlocks = readCmdLocks();
    
    if (!cmdlocks[chatId]) {
        cmdlocks[chatId] = {};
    }
    
    cmdlocks[chatId][commandName] = requiredRank;
    writeCmdLocks(cmdlocks);
    return true;
}

async function getCmdLock(chatId, commandName) {
    const cmdlocks = readCmdLocks();
    return cmdlocks[chatId] && cmdlocks[chatId][commandName];
}

async function removeCmdLock(chatId, commandName) {
    const cmdlocks = readCmdLocks();
    
    if (cmdlocks[chatId] && cmdlocks[chatId][commandName]) {
        delete cmdlocks[chatId][commandName];
        writeCmdLocks(cmdlocks);
    }
    
    return true;
}

async function getAllCmdLocks(chatId) {
    const cmdlocks = readCmdLocks();
    return cmdlocks[chatId] || {};
}

module.exports = {
    setCmdLock,
    getCmdLock,
    removeCmdLock,
    getAllCmdLocks
};
