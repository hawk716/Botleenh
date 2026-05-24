const choices = [
    '*↢ ايــش تـخــتـار، تكون وسيم او ذكي😎🤓*',
    '*↢ ايــش تـخــتـار، نت مجاني او آيفون🛜📱*',
    '*↢ ايــش تـخــتـار، تكون متسامح او تنتقم🤍🖤*',
    '*↢ ايــش تـخــتـار، تكون غني او مشهور💰😏*',
    '*↢ ايــش تـخــتـار، تشرب قهوة او شاي☕🍵*',
    '*↢ ايــش تـخــتـار، الليل او النهار🌙☀️*',
    '*↢ ايــش تـخــتـار، تفضل الهدوء او الحفلات🤫🎉*',
    '*↢ ايــش تـخــتـار، تقرأ كتاب او تشوف فيلم📖🎬*',
    '*↢ ايــش تـخــتـار، تسافر او تقعد بالبيت✈️🏠*',
    '*↢ ايــش تـخــتـار، تستمع لموسيقى او صمت🎵🔇*'
];

async function chooseCommand(sock, chatId, message) {
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    await sock.sendMessage(chatId, {
        text: randomChoice
    }, { quoted: message });
}

module.exports = { chooseCommand, choices };
