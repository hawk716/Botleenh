const fs = require('fs');
const path = require('path');

// Path to store auto status configuration
const configPath = path.join(__dirname, '../data/autoStatus.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ 
        enabled: false, 
        reactOn: false 
    }));
}

async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        // Check if sender is owner
        if (!msg.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '• عذراً الامر يخص ↤︎ 〖  الادمن 〗 فقط .'
            });
            return;
        }

        // Read current config
        let config = JSON.parse(fs.readFileSync(configPath));

        // If no arguments, show current status
        if (!args || args.length === 0) {
            const status = config.enabled ? 'مفعل' : 'معطل';
            const reactStatus = config.reactOn ? 'مفعل' : 'معطل';
            await sock.sendMessage(chatId, { 
                text: `🔄 *إعدادات الحالة التلقائية*\n\n📱 *عرض الحالة التلقائي:* ${status}\n💫 *تفاعلات الحالة:* ${reactStatus}\n\n*الأوامر:*\n.autostatus on - تفعيل عرض الحالة التلقائي\n.autostatus off - تعطيل عرض الحالة التلقائي\n.autostatus react on - تفعيل تفاعلات الحالة\n.autostatus react off - تعطيل تفاعلات الحالة`
            });
            return;
        }

        // Handle on/off commands
        const command = args[0].toLowerCase();

        if (command === 'on') {
            config.enabled = true;
            fs.writeFileSync(configPath, JSON.stringify(config));
            await sock.sendMessage(chatId, { 
                text: '✅ تم تفعيل عرض الحالة التلقائي!\nسيقوم البوت الآن بعرض جميع حالات جهات الاتصال تلقائياً.'
            });
        } else if (command === 'off') {
            config.enabled = false;
            fs.writeFileSync(configPath, JSON.stringify(config));
            await sock.sendMessage(chatId, { 
                text: '❌ تم تعطيل عرض الحالة التلقائي!\nلن يقوم البوت بعرض الحالات تلقائياً.'
            });
        } else if (command === 'react') {
            // Handle react subcommand
            if (!args[1]) {
                await sock.sendMessage(chatId, { 
                    text: '❌ يرجى تحديد on/off للتفاعلات!\nاستخدم: .autostatus react on/off'
                });
                return;
            }

            const reactCommand = args[1].toLowerCase();
            if (reactCommand === 'on') {
                config.reactOn = true;
                fs.writeFileSync(configPath, JSON.stringify(config));
                await sock.sendMessage(chatId, { 
                    text: '💫 تم تفعيل تفاعلات الحالة!\nسيقوم البوت الآن بالتفاعل مع تحديثات الحالة.'
                });
            } else if (reactCommand === 'off') {
                config.reactOn = false;
                fs.writeFileSync(configPath, JSON.stringify(config));
                await sock.sendMessage(chatId, { 
                    text: '❌ تم تعطيل تفاعلات الحالة!\nلن يقوم البوت بالتفاعل مع تحديثات الحالة.'
                });
            } else {
                await sock.sendMessage(chatId, { 
                    text: '❌ أمر تفاعل غير صحيح! استخدم: .autostatus react on/off'
                });
            }
        } else {
            await sock.sendMessage(chatId, { 
                text: '❌ أمر غير صحيح! استخدم:\n.autostatus on/off - تفعيل/تعطيل عرض الحالة التلقائي\n.autostatus react on/off - تفعيل/تعطيل تفاعلات الحالة'
            });
        }

    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ حدث خطأ أثناء إدارة الحالة التلقائية!\n' + error.message
        });
    }
}

// Function to check if auto status is enabled
function isAutoStatusEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.enabled;
    } catch (error) {
        console.error('Error checking auto status config:', error);
        return false;
    }
}

// Function to check if status reactions are enabled
function isStatusReactionEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.reactOn;
    } catch (error) {
        console.error('Error checking status reaction config:', error);
        return false;
    }
}

// Function to react to status using proper method
async function reactToStatus(sock, statusKey) {
    try {
        if (!isStatusReactionEnabled()) {
            return;
        }

        // Use the proper relayMessage method for status reactions
        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: '💚'
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );

        // Removed success log - only keep errors
    } catch (error) {
        console.error('❌ Error reacting to status:', error.message);
    }
}

// Function to handle status updates
async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled()) {
            return;
        }

        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle status from messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await sock.readMessages([msg.key]);
                    const sender = msg.key.participant || msg.key.remoteJid;

                    // React to status if enabled
                    await reactToStatus(sock, msg.key);

                    // Removed success log - only keep errors
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        console.log('⚠️ Rate limit hit, waiting before retrying...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await sock.readMessages([msg.key]);
                    } else {
                        throw err;
                    }
                }
                return;
            }
        }

        // Handle direct status updates
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.key]);
                const sender = status.key.participant || status.key.remoteJid;

                // React to status if enabled
                await reactToStatus(sock, status.key);

                // Removed success log - only keep errors
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

        // Handle status in reactions
        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.reaction.key]);
                const sender = status.reaction.key.participant || status.reaction.key.remoteJid;

                // React to status if enabled
                await reactToStatus(sock, status.reaction.key);

                // Removed success log - only keep errors
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.reaction.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

module.exports = {
    autoStatusCommand,
    handleStatusUpdate
};