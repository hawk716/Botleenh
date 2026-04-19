
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../data/groupSettings.json');

function loadSettings() {
    try {
        if (!fs.existsSync(settingsPath)) {
            const defaultData = {};
            fs.writeFileSync(settingsPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (error) {
        console.error('Error loading group settings:', error);
        return {};
    }
}

function saveSettings(data) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving group settings:', error);
        return false;
    }
}

function getGroupSettings(groupId) {
    const settings = loadSettings();
    if (!settings[groupId]) {
        settings[groupId] = {
            ban_enabled: true,
            download_enabled: true,
            link_enabled: true,
            kickme_enabled: false,
            demoteme_enabled: false,
            mention_enabled: true,
            games_enabled: true,
            menus_enabled: true,
            mutehim_enabled: true,
            callowner_enabled: true
        };
        saveSettings(settings);
    }
    return settings[groupId];
}

function updateGroupSetting(groupId, setting, value) {
    const settings = loadSettings();
    if (!settings[groupId]) {
        settings[groupId] = getGroupSettings(groupId);
    }
    settings[groupId][setting] = value;
    saveSettings(settings);
    return true;
}

function isFeatureEnabled(groupId, feature) {
    const settings = getGroupSettings(groupId);
    return settings[feature] !== false;
}

module.exports = {
    loadSettings,
    saveSettings,
    getGroupSettings,
    updateGroupSetting,
    isFeatureEnabled
};
