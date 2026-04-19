
const fs = require('fs');
const path = require('path');

const customCommandsPath = path.join(__dirname, '../data/customCommands.json');

function loadCustomCommands() {
    try {
        if (!fs.existsSync(customCommandsPath)) {
            fs.writeFileSync(customCommandsPath, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(fs.readFileSync(customCommandsPath, 'utf8'));
    } catch (error) {
        console.error('Error loading custom commands:', error);
        return {};
    }
}

function saveCustomCommands(data) {
    try {
        fs.writeFileSync(customCommandsPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving custom commands:', error);
        return false;
    }
}

// State management for multi-step commands
const commandStates = new Map();

async function handleCustomCommandManagement(sock, chatId, message, senderId, cleanMessage) {
    const customCommands = loadCustomCommands();
    const state = commandStates.get(senderId);

    // تغيير امر
    if (cleanMessage === 'تغيير امر' || cleanMessage === 'تغيير_امر') {
        commandStates.set(senderId, { step: 'waiting_old_command', chatId });
        await sock.sendMessage(chatId, { 
            text: '*↢ تمـام، ارسل الامر القديم ليتم تغييره.*' 
        }, { quoted: message });
        return true;
    }

    // Step 1: User sent old command
    if (state && state.step === 'waiting_old_command') {
        commandStates.set(senderId, { 
            step: 'waiting_new_command', 
            oldCommand: cleanMessage,
            chatId 
        });
        await sock.sendMessage(chatId, { 
            text: `*↢ اعطني الامر الجديد لـ ( ${cleanMessage} ) ليتم وضعه مكانه.*` 
        }, { quoted: message });
        return true;
    }

    // Step 2: User sent new command
    if (state && state.step === 'waiting_new_command') {
        const oldCommand = state.oldCommand;
        const newCommand = cleanMessage;
        
        if (!customCommands[oldCommand]) {
            customCommands[oldCommand] = [];
        }
        
        if (!customCommands[oldCommand].includes(newCommand)) {
            customCommands[oldCommand].push(newCommand);
        }
        
        saveCustomCommands(customCommands);
        commandStates.delete(senderId);
        
        await sock.sendMessage(chatId, { 
            text: `*↢ تم تحديث الامر باسم ↫ ( ${newCommand} )*` 
        }, { quoted: message });
        return true;
    }

    // حذف امر
    if (cleanMessage === 'حذف امر' || cleanMessage === 'حذف_امر') {
        commandStates.set(senderId, { step: 'waiting_delete_command', chatId });
        await sock.sendMessage(chatId, { 
            text: '*↢ ارسل الامر الذي وضعته مكان القديم لمسحه.*' 
        }, { quoted: message });
        return true;
    }

    // Delete command step
    if (state && state.step === 'waiting_delete_command') {
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
        
        saveCustomCommands(customCommands);
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

    // الاوامر المضافه
    if (cleanMessage === 'الاوامر المضافه' || cleanMessage === 'الاوامر_المضافه') {
        const commands = Object.entries(customCommands);
        
        if (commands.length === 0) {
            await sock.sendMessage(chatId, { 
                text: '*↢ لا توجد اوامر مضافة.*' 
            }, { quoted: message });
            return true;
        }
        
        let text = '*↢ قائمـة الاوامـر المضافة*\n*ٴ┈─┈─┈─┈─┈─┈─┈─┈─*\n';
        commands.forEach(([oldCmd, aliases], index) => {
            aliases.forEach(alias => {
                text += `*${index + 1}: ( ${oldCmd} ) ← ( ${alias} )*\n`;
            });
        });
        
        await sock.sendMessage(chatId, { text }, { quoted: message });
        return true;
    }

    // مسح الاوامر المضافه
    if (cleanMessage === 'مسح الاوامر المضافه' || cleanMessage === 'مسح_الاوامر_المضافه') {
        saveCustomCommands({});
        await sock.sendMessage(chatId, { 
            text: '*↢ تم مسح قائمة الاوامر المضافة.*' 
        }, { quoted: message });
        return true;
    }

    return false;
}

// Check if a message matches a custom command
function getOriginalCommand(cleanMessage) {
    const customCommands = loadCustomCommands();
    
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
    loadCustomCommands
};
