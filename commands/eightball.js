const eightBallResponses = [
    "نعم، بالتأكيد!",
    "لا، مستحيل!",
    "اسأل لاحقاً.",
    "إنه مؤكد.",
    "مشكوك فيه جداً.",
    "بدون شك.",
    "إجابتي لا.",
    "الإشارات تشير إلى نعم."
];

async function eightBallCommand(sock, chatId, question) {
    // Trim the question and check if it's empty
    const trimmedQuestion = (question || '').trim();
    
    if (!trimmedQuestion) {
        await sock.sendMessage(chatId, { text: 'يرجى طرح سؤال!' });
        return;
    }

    const randomResponse = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
    await sock.sendMessage(chatId, { text: `🎱 ${randomResponse}` });
}

module.exports = { eightBallCommand };
