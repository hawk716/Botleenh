const axios = require('axios');

// معطّل مؤقتاً: مزوّد الأخبار (aljazeera-articles.vercel.app) غير متاح.
// نُظهر رسالة «معطل» الموحّدة بلا أي طلب شبكة.
// للتفعيل: DISABLED = false
const DISABLED = true;

module.exports = async function (sock, chatId, message) {
    if (DISABLED) {
        const sendOpts = message?.key ? { quoted: message } : {};
        await sock.sendMessage(chatId, {
            text: '*↢ امـر ( اخبار عربية ) معطـل حالياً ⚠️*'
        }, sendOpts);
        return;
    }

    try {
        const response = await axios.get('https://aljazeera-articles.vercel.app/get-liveblog');
        
        if (!response.data) {
            await sock.sendMessage(chatId, { text: '❌ عذراً، لا توجد أخبار متاحة الآن.' });
            return;
        }
        
        const { blogs, news } = response.data;
        let newsMessage = '📰 *أخبار العالم العربي*:\n\n';
        
        const allNews = [];
        
        if (blogs && blogs.length > 0) {
            blogs.forEach((blog) => {
                if (blog.content) {
                    allNews.push({
                        title: blog.content
                    });
                }
            });
        }
        
        if (news && news.length > 0) {
            news.forEach((article) => {
                if (article.title) {
                    allNews.push({
                        title: article.title
                    });
                }
            });
        }
        
        if (allNews.length === 0) {
            await sock.sendMessage(chatId, { text: '❌ عذراً، لا توجد أخبار متاحة الآن.' });
            return;
        }
        
        const displayNews = allNews.slice(0, 10);
        displayNews.forEach((item, index) => {
            newsMessage += `${index + 1}. ${item.title}\n\n`;
        });
        
        await sock.sendMessage(chatId, { text: newsMessage });
    } catch (error) {
        console.error('Error fetching Arabic news:', error);
        await sock.sendMessage(chatId, { text: '❌ عذراً، لا يمكن جلب الأخبار العربية الآن.' });
    }
};
