const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'data', 'messageCount.json');

function loadMessageCounts() {
    if (fs.existsSync(dataFilePath)) {
        const data = fs.readFileSync(dataFilePath);
        return JSON.parse(data);
    }
    return {};
}

function saveMessageCounts(messageCounts) {
    fs.writeFileSync(dataFilePath, JSON.stringify(messageCounts, null, 2));
}

function incrementMessageCount(groupId, userId) {
    const messageCounts = loadMessageCounts();

    if (!messageCounts[groupId]) {
        messageCounts[groupId] = {};
    }

    if (!messageCounts[groupId][userId]) {
        messageCounts[groupId][userId] = 0;
    }

    messageCounts[groupId][userId] += 1;

    saveMessageCounts(messageCounts);
}

// سرد بصيغة: 1. @user *- 119 رسالة*
// نستخدم النص العادي مع mentionsadaa ليعرض واتساب الاسم فوق @user كما في المثال.
function topMembers(sock, chatId, isGroup) {
    if (!isGroup) {
        sock.sendMessage(chatId, { text: '*↢ الامـر يخـص المجمـوعـات فقـط.*' });
        return;
    }

    const messageCounts = loadMessageCounts();
    const groupCounts = messageCounts[chatId] || {};

    const sortedMembers = Object.entries(groupCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Get top 5 members

    if (sortedMembers.length === 0) {
        sock.sendMessage(chatId, { text: '*↢ لا توجد رسائـل محسوبـة بعد.*' });
        return;
    }

    const lines = sortedMembers.map(([userId, count], index) =>
        `${index + 1}. @${userId.split('@')[0]} *- ${count} رسالة*`
    );

    sock.sendMessage(chatId, {
        text: `*↢التوب حسب عدد الرسائل،🏆:*\n${lines.join('\n')}`,
        mentions: sortedMembers.map(([userId]) => userId)
    });
}

module.exports = { incrementMessageCount, topMembers };
