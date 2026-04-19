const axios = require('axios');

module.exports = async function (sock, chatId) {
    try {
        const apiKey = 'dcd720a6f1914e2d9dba9790c188c08c';
        const response = await axios.get(`https://newsapi.org/v2/everything?q=news&language=en&apiKey=${apiKey}&pageSize=5&sortBy=publishedAt`);
        
        if (!response.data.articles || response.data.articles.length === 0) {
            await sock.sendMessage(chatId, { text: '❌ عذراً، لا توجد أخبار متاحة الآن.' });
            return;
        }
        
        const articles = response.data.articles;
        let newsMessage = '🌍 *آخر الأخبار العالمية*:\n\n';
        articles.forEach((article, index) => {
            const title = article.title || 'No title';
            const description = article.description || 'No description';
            const source = article.source.name || 'Unknown';
            newsMessage += `${index + 1}. *${title}*\n📡 ${source}\n${description}\n\n`;
        });
        await sock.sendMessage(chatId, { text: newsMessage });
    } catch (error) {
        console.error('Error fetching news:', error);
        await sock.sendMessage(chatId, { text: '❌ عذراً، لا يمكن جلب الأخبار الآن.' });
    }
};
