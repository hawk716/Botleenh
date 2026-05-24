const fs = require('fs');
const path = require('path');

const subscriptionPath = path.join(__dirname, '../data/subscriptions.json');

let pendingSubscriptionRequest = null;

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

const subscriptionCommands = ['تفعيل الاشتراك', 'تفعيل_الاشتراك', 'اضف اشتراك', 'اضف_اشتراك', 'حذف اشتراك', 'حذف_الاشتراك', 'عرض الاشتراك', 'عرض_الاشتراك'];

async function handleSubscriptionManagement(sock, chatId, message, senderId, cleanMessage, isSenderAdmin) {
    const subscriptions = loadSubscriptions();
    const isSubscriptionCommand = subscriptionCommands.includes(cleanMessage);
    
    if (!isSubscriptionCommand) {
        return false;
    }
    
    // Handle delete subscription
    if (cleanMessage === 'حذف اشتراك' || cleanMessage === 'حذف_الاشتراك') {
        if (!isSenderAdmin && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '*↢ هذا الأمر للمشرفين فقط*' });
            return true;
        }
        const deletedGroupName = subscriptions[chatId]?.groupName || '';
        delete subscriptions[chatId];
        saveSubscriptions(subscriptions);
        await sock.sendMessage(chatId, { text: `*↫ تـم الغاء الاشتراك الإجباري*\n*للمجموعـة:* ${deletedGroupName}` });
        return true;
    }
    
    // Handle view subscription
    if (cleanMessage === 'عرض الاشتراك' || cleanMessage === 'عرض_الاشتراك') {
        if (subscriptions[chatId]) {
            const sub = subscriptions[chatId];
            await sock.sendMessage(chatId, { text: `*↫الاشتـراك الإجباري مفعل ✅*\n*للمجموعـة:* ${sub.groupName}\n*رابط الإنضـمام:* ${sub.inviteLink || 'غير متوفر'}` });
        } else {
            await sock.sendMessage(chatId, { text: '*↫ الاشتـراك الإجباري غير مفعل*' });
        }
        return true;
    }
    
    // Handle enable subscription
    if (cleanMessage === 'تفعيل الاشتراك' || cleanMessage === 'تفعيل_الاشتراك' || 
        cleanMessage === 'اضف اشتراك' || cleanMessage === 'اضف_اشتراك') {
        
        // "اضف اشتراك" - just request, don't activate
        if (cleanMessage === 'اضف اشتراك' || cleanMessage === 'اضف_اشتراك') {
            return await requestSubscription(sock, chatId, senderId);
        }
        
        // "تفعيل الاشتراك" - check pending request first
        if (pendingSubscriptionRequest) {
            try {
                // Get invite code from CURRENT group (where bot IS admin, not target group)
                let inviteLink = '';
                try {
                    const inviteCode = await sock.groupInviteCode(chatId);
                    inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
                } catch (e) {
                    console.log(`[SUB] Could not get invite code from current group: ${e.message}`);
                }
                
                subscriptions[pendingSubscriptionRequest.targetChatId] = {
                    groupId: pendingSubscriptionRequest.targetChatId,
                    groupName: pendingSubscriptionRequest.groupName,
                    inviteLink: inviteLink,
                    requiredGroupId: chatId,
                    addedBy: senderId,
                    addedAt: Date.now()
                };
                saveSubscriptions(subscriptions);
                
                await sock.sendMessage(chatId, {
                    text: `*↫ تـم تفعيـل الاشتراك الإجباري*\n*للمجموعـة:* ${pendingSubscriptionRequest.groupName}\n*رابط الإنضـمام:* ${inviteLink || 'غير متوفر'}`
                });
                
                pendingSubscriptionRequest = null;
                return true;
                
            } catch (err) {
                console.log(`[SUB] Error: ${err.message}`);
                pendingSubscriptionRequest = null;
                await sock.sendMessage(chatId, { text: '*↢ خطأ في تفعيل الاشتراك، يرجى المحاولة مرة أخرى*' });
                return true;
            }
        }
        
        // No pending - enable for THIS group
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = groupMetadata.participants.find(p => p.id === botId);
            
            if (!botParticipant) {
                await sock.sendMessage(chatId, { text: '*↢ البوت ليس عضواً في هذه المجموعة*\nأضف البوت أولاً ثم أرسل الأمر' });
                return true;
            }
            
            if (!botParticipant.admin) {
                await sock.sendMessage(chatId, { text: '*↢ البوت ليس مشرفاً في هذه المجموعة*\nارفع البوت إلى مشرف ثم أرسل الأمر' });
                return true;
            }
            
            let inviteLink = '';
            try {
                const inviteCode = await sock.groupInviteCode(chatId);
                inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            } catch (e) {}
            
            subscriptions[chatId] = {
                groupId: chatId,
                groupName: groupMetadata.subject,
                inviteLink: inviteLink,
                requiredGroupId: chatId,
                addedBy: senderId,
                addedAt: Date.now()
            };
            saveSubscriptions(subscriptions);
            
            await sock.sendMessage(chatId, {
                text: `*↫ تـم تفعيـل الاشتراك الإجباري*\n*للمجموعـة:* ${groupMetadata.subject}\n*رابط الإنضـمام:* ${inviteLink || 'غير متوفر'}`
            });
            return true;
            
        } catch (err) {
            console.log(`[SUB] Error: ${err.message}`);
            await sock.sendMessage(chatId, { text: '*↢ خطأ*' });
            return true;
        }
    }
    
    return false;
}

async function requestSubscription(sock, chatId, senderId) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = groupMetadata.participants.find(p => p.id === botId);
        
        // Try to get invite code now if bot is member and admin
        let inviteLink = '';
        if (botParticipant && botParticipant.admin) {
            try {
                const inviteCode = await sock.groupInviteCode(chatId);
                inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            } catch (e) {
                console.log(`[SUB] Could not get invite code: ${e.message}`);
            }
        }
        
        pendingSubscriptionRequest = {
            targetChatId: chatId,
            groupName: groupMetadata.subject,
            inviteLink: inviteLink, // Store now if available
            requestTime: Date.now()
        };
        
        await sock.sendMessage(chatId, {
            text: `*↢ ارفـع البوت مشرف في أي مجموعة، ثم ارسل 'تفعيل الاشتراك'*\n\n*ملاحظة:* _يجب ان يكون البوت مشرفاً في المجموعة._`
        });
        return true;
    } catch (err) {
        console.log(`[SUB] Error requesting subscription: ${err.message}`);
        await sock.sendMessage(chatId, { text: '*↢ خطأ في جلب معلومات المجموعة*' });
        return true;
    }
}

async function checkUserSubscription(sock, chatId, senderId) {
    const subscriptions = loadSubscriptions();
    const sub = subscriptions[chatId];
    
    console.log(`[SUB-CHECK] chatId: ${chatId}, senderId: ${senderId}`);
    console.log(`[SUB-CHECK] subscriptions:`, Object.keys(subscriptions));
    console.log(`[SUB-CHECK] sub for this chat:`, sub);

    if (!sub) {
        return { subscribed: true };
    }

    try {
        // Check if user is in the REQUIRED group (the one with the invite link)
        const requiredGroupId = sub.requiredGroupId || sub.groupId;
        console.log(`[SUB-CHECK] Checking membership in required group: ${requiredGroupId}`);
        
        const groupMetadata = await sock.groupMetadata(requiredGroupId);
        const isMember = groupMetadata.participants.some(p => p.id === senderId);
        
        console.log(`[SUB-CHECK] isMember: ${isMember}`);

        if (!isMember) {
            return {
                subscribed: false,
                groupId: requiredGroupId,
                groupName: sub.groupName,
                inviteLink: sub.inviteLink || `https://chat.whatsapp.com/${requiredGroupId}`
            };
        }
    } catch (error) {
        console.error('Error checking subscription:', error);
    }

    return { subscribed: true };
}

module.exports = {
    handleSubscriptionManagement,
    checkUserSubscription,
    requestSubscription
};