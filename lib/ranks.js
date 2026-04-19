
const fs = require('fs');
const path = require('path');

const ranksFilePath = path.join(__dirname, '../data/ranks.json');

function loadRanks() {
    try {
        if (!fs.existsSync(ranksFilePath)) {
            const defaultData = {};
            fs.writeFileSync(ranksFilePath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(ranksFilePath, 'utf8'));
    } catch (error) {
        console.error('Error loading ranks:', error);
        return {};
    }
}

function saveRanks(data) {
    try {
        const dir = path.dirname(ranksFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(ranksFilePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving ranks:', error);
        return false;
    }
}

async function getUserRank(groupId, userId, isGroupAdmin = false) {
    // If user is a WhatsApp group admin, they are a مالك
    if (isGroupAdmin) {
        return 'مالك';
    }
    
    const ranks = loadRanks();
    if (!ranks[groupId]) return 'عضو';
    
    const userRank = ranks[groupId][userId];
    return userRank || 'عضو';
}

async function setUserRank(groupId, userId, rank) {
    const ranks = loadRanks();
    if (!ranks[groupId]) ranks[groupId] = {};
    
    ranks[groupId][userId] = rank;
    saveRanks(ranks);
    return true;
}

async function removeUserRank(groupId, userId) {
    const ranks = loadRanks();
    if (ranks[groupId] && ranks[groupId][userId]) {
        delete ranks[groupId][userId];
        saveRanks(ranks);
    }
    return true;
}

async function getAllRanks(groupId) {
    const ranks = loadRanks();
    return ranks[groupId] || {};
}

async function hasPermission(groupId, userId, requiredRank) {
    const rankHierarchy = {
        'مالك': 4,
        'مدير': 3,
        'ادمن': 2,
        'مميز': 1,
        'عضو': 0
    };
    
    const userRank = await getUserRank(groupId, userId);
    const userLevel = rankHierarchy[userRank] || 0;
    const requiredLevel = rankHierarchy[requiredRank] || 0;
    
    return userLevel >= requiredLevel;
}

function getRankLevel(rank) {
    const rankHierarchy = {
        'مالك': 4,
        'مدير': 3,
        'ادمن': 2,
        'مميز': 1,
        'عضو': 0
    };
    return rankHierarchy[rank] || 0;
}

module.exports = {
    getUserRank,
    setUserRank,
    removeUserRank,
    getAllRanks,
    hasPermission,
    getRankLevel
};
