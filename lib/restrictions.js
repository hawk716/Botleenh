
const fs = require('fs');
const path = require('path');

const restrictionsFilePath = path.join(__dirname, '../data/restrictions.json');

// Load restrictions data
function loadRestrictions() {
    try {
        if (!fs.existsSync(restrictionsFilePath)) {
            const defaultData = {};
            fs.writeFileSync(restrictionsFilePath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(restrictionsFilePath, 'utf8'));
    } catch (error) {
        console.error('Error loading restrictions:', error);
        return {};
    }
}

// Save restrictions data
function saveRestrictions(data) {
    try {
        const dir = path.dirname(restrictionsFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(restrictionsFilePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving restrictions:', error);
        return false;
    }
}

// Parse duration string
function parseDuration(durationStr) {
    const match = durationStr.match(/(\d+)\s*(سنة|سنوات|شهر|اشهر|ساعة|ساعات|دقيقة|دقائق|ثانية|ثواني)/);
    
    if (!match) return null;
    
    const amount = parseInt(match[1]);
    const unit = match[2];
    
    let milliseconds = 0;
    
    switch (unit) {
        case 'سنة':
        case 'سنوات':
            milliseconds = amount * 365 * 24 * 60 * 60 * 1000;
            break;
        case 'شهر':
        case 'اشهر':
            milliseconds = amount * 30 * 24 * 60 * 60 * 1000;
            break;
        case 'ساعة':
        case 'ساعات':
            milliseconds = amount * 60 * 60 * 1000;
            break;
        case 'دقيقة':
        case 'دقائق':
            milliseconds = amount * 60 * 1000;
            break;
        case 'ثانية':
        case 'ثواني':
            milliseconds = amount * 1000;
            break;
    }
    
    return Date.now() + milliseconds;
}

// Add restriction
async function addRestriction(groupId, userId, duration = null) {
    const restrictions = loadRestrictions();
    if (!restrictions[groupId]) restrictions[groupId] = {};
    
    restrictions[groupId][userId] = {
        restrictedAt: Date.now(),
        expiresAt: duration
    };
    
    saveRestrictions(restrictions);
    return true;
}

// Remove restriction
async function removeRestriction(groupId, userId) {
    const restrictions = loadRestrictions();
    if (restrictions[groupId] && restrictions[groupId][userId]) {
        delete restrictions[groupId][userId];
        saveRestrictions(restrictions);
    }
    return true;
}

// Check if user is restricted
async function isRestricted(groupId, userId) {
    const restrictions = loadRestrictions();
    if (!restrictions[groupId] || !restrictions[groupId][userId]) return false;
    
    const restriction = restrictions[groupId][userId];
    
    // Check if restriction has expired
    if (restriction.expiresAt && Date.now() > restriction.expiresAt) {
        await removeRestriction(groupId, userId);
        return false;
    }
    
    return true;
}

// Get restriction info
async function getRestrictionInfo(groupId, userId) {
    const restrictions = loadRestrictions();
    if (!restrictions[groupId] || !restrictions[groupId][userId]) return null;
    
    return restrictions[groupId][userId];
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}/${month}/${day}/${hours}:${minutes}`;
}

module.exports = {
    addRestriction,
    removeRestriction,
    isRestricted,
    getRestrictionInfo,
    parseDuration,
    formatDate
};
