const fs = require('fs');
const path = require('path');

const customCommandsPath = path.join(__dirname, '../data/customCommands.json');

function logToFile(msg) {
    const logFile = path.join(__dirname, '../data', 'debug_custom.log');
    try {
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {}
}

function loadAllCustomCommands() {
    try {
        if (!fs.existsSync(customCommandsPath)) {
            fs.writeFileSync(customCommandsPath, JSON.stringify({}, null, 2));
            return {};
        }
        const raw = JSON.parse(fs.readFileSync(customCommandsPath, 'utf8'));

        // Migration: if old flat format detected (values are arrays), reset to per-group format.
        // Old format example: { "نكته": ["alias1", "alias2"] }
        // New format: { "<chatId>": { "نكته": ["alias1"] } }
        const isOldFormat = Object.values(raw).some(v => Array.isArray(v));
        if (isOldFormat) {
            fs.writeFileSync(customCommandsPath, JSON.stringify({}, null, 2));
            return {};
        }
        return raw;
    } catch (error) {
        console.error('Error loading custom commands:', error);
        return {};
    }
}

function saveAllCustomCommands(data) {
    try {
        fs.writeFileSync(customCommandsPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving custom commands:', error);
        return false;
    }
}

function loadGroupCustomCommands(chatId) {
    const all = loadAllCustomCommands();
    return all[chatId] || {};
}

function saveGroupCustomCommands(chatId, groupData) {
    const all = loadAllCustomCommands();
    if (!groupData || Object.keys(groupData).length === 0) {
        delete all[chatId];
    } else {
        all[chatId] = groupData;
    }
    return saveAllCustomCommands(all);
}

const commandStates = new Map();

async function handleCustomCommandManagement(sock, chatId, message, senderId, cleanMessage) {
    const customCommands = loadGroupCustomCommands(chatId);
    const state = commandStates.get(senderId);

    const validCommands = ['م1', '1', 'م2', '2', 'م3', '3', 'م4', '4', 'م5', '5', 'م6', '6', 'حب', 'كره', 'حظي', 'حظه', 'وجهي', 'وجهه', 'برجي', 'عمري', 'عمره', 'امنيتي', 'امنيته', 'نجومي', 'نجومه', 'مزاجي', 'مزاجه', 'غبائي', 'غبائه', 'من يحبني', 'من يحبه', 'من يكرهني', 'من يكرهه', 'نكته', 'نكتة', 'ايش تختار', 'ذكاء', 'شِعر', 'اقتباس', 'الاوامر', 'م'];

    logToFile(`[CustomCmd] chat=${chatId}, sender=${senderId}, msg="${cleanMessage}", state=${JSON.stringify(state)}`);

    if (cleanMessage === 'تغيير امر' || cleanMessage === 'تغيير_امر') {
        commandStates.set(senderId, { step: 'waiting_old_command', chatId });
        await sock.sendMessage(chatId, {
            text: '*↢ تمـام، ارسل امر البوت الذي تريد تغييره.*'
        }, { quoted: message });
        return true;
    }

    if (state && state.step === 'waiting_old_command' && state.chatId === chatId) {
        const commandExists = validCommands.includes(cleanMessage);
        let isExistingAlias = false;
        for (const aliases of Object.values(customCommands)) {
            if (aliases.includes(cleanMessage)) {
                isExistingAlias = true;
                break;
            }
        }

        if (!commandExists && !isExistingAlias) {
            await sock.sendMessage(chatId, {
                text: `*↢ عـذراً، الأمر ( ${cleanMessage} ) غير موجود.*`
            }, { quoted: message });
            return true;
        }

        commandStates.set(senderId, {
            step: 'waiting_new_command',
            oldCommand: cleanMessage,
            chatId
        });
        await sock.sendMessage(chatId, {
            text: `*↢ تمـام، ارسل الاسم الجديد لـ ( ${cleanMessage} ).*`
        }, { quoted: message });
        return true;
    }

    if (state && state.step === 'waiting_new_command' && state.chatId === chatId) {
        const oldCommand = state.oldCommand;
        const newCommand = cleanMessage;

        if (!customCommands[oldCommand]) {
            customCommands[oldCommand] = [];
        }

        if (!customCommands[oldCommand].includes(newCommand)) {
            customCommands[oldCommand].push(newCommand);
        }

        saveGroupCustomCommands(chatId, customCommands);
        commandStates.delete(senderId);

        await sock.sendMessage(chatId, {
            text: `*↢ تم تحديث الامر باسم ↫ ( ${newCommand} ) في هذه المجموعة.*`
        }, { quoted: message });
        return true;
    }

    if (cleanMessage === 'حذف امر' || cleanMessage === 'حذف_امر') {
        commandStates.set(senderId, { step: 'waiting_delete_command', chatId });
        await sock.sendMessage(chatId, {
            text: '*↢ ارسل الامر الذي وضعته مكان القديم لمسحه.*'
        }, { quoted: message });
        return true;
    }

    if (state && state.step === 'waiting_delete_command' && state.chatId === chatId) {
        const commandToDelete = cleanMessage;
        let deleted = false;

        for (const [oldCmd, aliases] of Object.entries(customCommands)) {
            const index = aliases.indexOf(commandToDelete);
            if (index > -1) {
                aliases.splice(index, 1);
                if (aliases.length === 0) {
                    delete customCommands[oldCmd];
                }
                deleted = true;
                break;
            }
        }

        saveGroupCustomCommands(chatId, customCommands);
        commandStates.delete(senderId);

        if (deleted) {
            await sock.sendMessage(chatId, {
                text: `*↢ تم مسح الامر ↫ ( ${commandToDelete} )*`
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: '*↢ الامر غير موجود في القائمة.*'
            }, { quoted: message });
        }
        return true;
    }

    if (cleanMessage === 'الاوامر المضافه' || cleanMessage === 'الاوامر_المضافه') {
        const commands = Object.entries(customCommands);

        if (commands.length === 0) {
            await sock.sendMessage(chatId, {
                text: '*↢ لا توجد اوامر مضافة في هذه المجموعة.*'
            }, { quoted: message });
            return true;
        }

        let text = '*↢ قائمـة الاوامـر المضافة في هذه المجموعة*\n*ٴ┈─┈─┈─┈─┈─┈─┈─┈─*\n';
        let idx = 1;
        commands.forEach(([oldCmd, aliases]) => {
            aliases.forEach(alias => {
                text += `*${idx}: ( ${oldCmd} ) ← ( ${alias} )*\n`;
                idx++;
            });
        });

        await sock.sendMessage(chatId, { text }, { quoted: message });
        return true;
    }

    if (cleanMessage === 'مسح الاوامر المضافه' || cleanMessage === 'مسح_الاوامر_المضافه') {
        saveGroupCustomCommands(chatId, {});
        await sock.sendMessage(chatId, {
            text: '*↢ تم مسح قائمة الاوامر المضافة في هذه المجموعة.*'
        }, { quoted: message });
        return true;
    }

    if (validCommands.includes(cleanMessage)) {
        return false;
    }

    return false;
}

function getOriginalCommand(cleanMessage, chatId) {
    if (!chatId) return null;
    const customCommands = loadGroupCustomCommands(chatId);

    for (const [originalCmd, aliases] of Object.entries(customCommands)) {
        if (aliases.includes(cleanMessage)) {
            return originalCmd;
        }
    }

    return null;
}

module.exports = {
    handleCustomCommandManagement,
    getOriginalCommand,
    loadGroupCustomCommands,
    loadCustomCommands: loadAllCustomCommands
};
