
const fs = require('fs');
const path = require('path');

const subscriptionPath = path.join(__dirname, '../data/subscriptions.json');

function loadSubscriptions() {
    try {
        if (!fs.existsSync(subscriptionPath)) {
            fs.writeFileSync(subscriptionPath, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(fs.readFileSync(subscriptionPath, 'utf8'));
    } catch (error) {
        console.error('Error loading subscriptions:', error);
        return {};
    }
}

function saveSubscriptions(data) {
    try {
        fs.writeFileSync(subscriptionPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving subscriptions:', error);
        return false;
    }
}

const subscriptionStates = new Map();

async function handleSubscriptionManagement(sock, chatId, message, senderId, cleanMessage, isSenderAdmin) {
    const subscriptions = loadSubscriptions();
    const state = subscriptionStates.get(chatId);

    const subscriptionCommands = ['اضف اشتراك', 'اضف_اشتراك', 'حذف اشتراك', 'حذف_اشتراك', 'عرض الاشتراك', 'عرض_الاشتراك'];
    const isSubscriptionCommand = subscriptionCommands.includes(cleanMessage);
    const isWaitingForInput = state && state.senderId === senderId;

    if (!isSubscriptionCommand && !isWaitingForInput) {
        return false;
    }

    if (isSubscriptionCommand && !isSenderAdmin && !message.key.fromMe) {
        await sock.sendMessage(chatId, { 
            text: '*↢ هـذا الامـر يخـص〖 الادمن 〗*' 
        }, { quoted: message });
        return true;
    }

    if (cleanMessage === 'اضف اشتراك' || cleanMessage === 'اضف_اشتراك') {
        subscriptionStates.set(chatId, { step: 'waiting_link', senderId });
        await sock.sendMessage(chatId, { 
            text: '*↢ ارسل رابط المجموعة المراد اضافتها كاشتراك اجباري.*' 
        }, { quoted: message });
        return true;
    }

    // Waiting for link
    if (state && state.step === 'waiting_link' && state.senderId === senderId) {
        const linkMatch = message.message?.conversation?.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/i) ||
                          message.message?.extendedTextMessage?.text?.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/i);
        
        if (!linkMatch) {
            await sock.sendMessage(chatId, { 
                text: '*↢ رابط غير صالح، ارسل رابط مجموعة واتساب.*' 
            }, { quoted: message });
            return true;
        }

        const inviteCode = linkMatch[1];
        const fullLink = `https://chat.whatsapp.com/${inviteCode}`;

        try {
            // Join the group to verify and check if bot is admin
            let targetGroupId;
            try {
                const result = await sock.groupAcceptInvite(inviteCode);
                targetGroupId = result;
            } catch (e) {
                // Already in group, extract ID from error or try to find it
                const groups = await sock.groupFetchAllParticipating();
                for (const [gid, gdata] of Object.entries(groups)) {
                    if (gdata.inviteCode === inviteCode) {
                        targetGroupId = gid;
                        break;
                    }
                }
            }

            if (!targetGroupId) {
                await sock.sendMessage(chatId, { 
                    text: '*↢ فشل الانضمام للمجموعة، تأكد من صلاحية الرابط.*' 
                }, { quoted: message });
                subscriptionStates.delete(chatId);
                return true;
            }

            // Check if bot is admin
            const groupMetadata = await sock.groupMetadata(targetGroupId);
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = groupMetadata.participants.find(p => p.id === botId);

            if (!botParticipant || !botParticipant.admin) {
                await sock.sendMessage(chatId, { 
                    text: '*↢ عـذراً البوت ليس مشرفاً قم برفعه مشرف اولاً.*' 
                }, { quoted: message });
                subscriptionStates.delete(chatId);
                return true;
            }

            // Add subscription
            if (!subscriptions[chatId]) {
                subscriptions[chatId] = [];
            }

            const subData = {
                link: fullLink,
                groupId: targetGroupId,
                groupName: groupMetadata.subject,
                addedBy: senderId,
                addedAt: Date.now()
            };

            subscriptions[chatId].push(subData);
            saveSubscriptions(subscriptions);
            subscriptionStates.delete(chatId);

            await sock.sendMessage(chatId, { 
                text: '*↢ تـم اضافة المجموعة كاشتراك اجباري*\n*↢ لـن يتمكن الاعضاء من ارسال رسائل في القروب الا بعد الاشتراك بها*' 
            }, { quoted: message });

        } catch (error) {
            console.error('Error adding subscription:', error);
            await sock.sendMessage(chatId, { 
                text: '*↢ حدث خطأ أثناء اضافة الاشتراك.*' 
            }, { quoted: message });
            subscriptionStates.delete(chatId);
        }
        return true;
    }

    // حذف اشتراك
    if (cleanMessage === 'حذف اشتراك' || cleanMessage === 'حذف_اشتراك') {
        const groupSubs = subscriptions[chatId] || [];
        
        if (groupSubs.length === 0) {
            await sock.sendMessage(chatId, { 
                text: '*↢ لا توجد اشتراكات مضافة.*' 
            }, { quoted: message });
            return true;
        }

        let text = '*↢ قائمـة الاشتـراك الاجبـاري*\n*ٴ┈─┈─┈─┈─┈─┈─┈─┈─*\n';
        const numbers = ['𝟭', '𝟮', '𝟯', '𝟰', '𝟱', '𝟲', '𝟳', '𝟴', '𝟵', '𝟭𝟬'];
        
        groupSubs.forEach((sub, index) => {
            text += `${numbers[index] || (index + 1)} - ${sub.link}\n`;
        });
        
        text += '\n*↢ ارسـل رقـم القروب المراد حذفه من الاشتراك الاجباري.*';
        
        await sock.sendMessage(chatId, { 
            text,
            mentions: []
        }, { quoted: message, linkPreview: false });
        
        subscriptionStates.set(chatId, { step: 'waiting_delete_number', senderId });
        return true;
    }

    // Delete subscription by number
    if (state && state.step === 'waiting_delete_number' && state.senderId === senderId) {
        const number = parseInt(cleanMessage);
        const groupSubs = subscriptions[chatId] || [];
        
        if (isNaN(number) || number < 1 || number > groupSubs.length) {
            await sock.sendMessage(chatId, { 
                text: '*↢ رقم غير صالح.*' 
            }, { quoted: message });
            return true;
        }

        groupSubs.splice(number - 1, 1);
        subscriptions[chatId] = groupSubs;
        saveSubscriptions(subscriptions);
        subscriptionStates.delete(chatId);

        await sock.sendMessage(chatId, { 
            text: '*↢ تم حذف القروب بنجاح... ☑️*' 
        }, { quoted: message });
        return true;
    }

    // عرض الاشتراك
    if (cleanMessage === 'عرض الاشتراك' || cleanMessage === 'عرض_الاشتراك') {
        const groupSubs = subscriptions[chatId] || [];
        
        if (groupSubs.length === 0) {
            await sock.sendMessage(chatId, { 
                text: '*↢ لا توجد اشتراكات مضافة.*' 
            }, { quoted: message });
            return true;
        }

        let text = '*↢ قائمـة الاشتـراك الاجبـاري*\n*ٴ┈─┈─┈─┈─┈─┈─┈─┈─*\n';
        const numbers = ['𝟭', '𝟮', '𝟯', '𝟰', '𝟱', '𝟲', '𝟳', '𝟴', '𝟵', '𝟭𝟬'];
        
        groupSubs.forEach((sub, index) => {
            text += `${numbers[index] || (index + 1)} - ${sub.link}\n`;
        });
        
        await sock.sendMessage(chatId, { 
            text,
            mentions: []
        }, { quoted: message, linkPreview: false });
        return true;
    }

    return false;
}

// Check if user is subscribed to required groups
async function checkUserSubscription(sock, chatId, senderId) {
    const subscriptions = loadSubscriptions();
    const groupSubs = subscriptions[chatId] || [];
    
    if (groupSubs.length === 0) {
        return { subscribed: true };
    }

    for (const sub of groupSubs) {
        try {
            const groupMetadata = await sock.groupMetadata(sub.groupId);
            const isMember = groupMetadata.participants.some(p => p.id === senderId);
            
            if (!isMember) {
                return { 
                    subscribed: false, 
                    link: sub.link,
                    groupName: sub.groupName 
                };
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    }

    return { subscribed: true };
}

module.exports = {
    handleSubscriptionManagement,
    checkUserSubscription,
    loadSubscriptions
};
