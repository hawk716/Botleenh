const axios = require('axios');
const cheerio = require('cheerio');

async function getLuckyNumber(name) {
    try {
        const userInputs = JSON.stringify({ "name": name });
        const toolID = "رقم-حظك";
        const url = `https://tasleyah.com/apiPages/toolsResult2?userInputs=${encodeURIComponent(userInputs)}&toolID=${encodeURIComponent(toolID)}`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Referer': 'https://tasleyah.com/b/%D8%B1%D9%82%D9%85-%D8%AD%D8%B8%D9%83'
            }
        });

        const $ = cheerio.load(response.data);
        const resPage = $('#resPage2');
        
        // استخراج رقم الحظ من سمة data-id والوصف من سمة data-value
        const luckyNumber = resPage.attr('data-id') || "";
        const description = resPage.attr('data-value') || "";
        
        if (!luckyNumber && !description) {
            return "لم يتم العثور على نتائج لهذا الاسم.";
        }

        // تنسيق النتيجة لتبدو مثل عرض الموقع
        return `الرقم المرتبط باسمك هو: ${luckyNumber}\n\n${description}`;
    } catch (error) {
        console.error('Error fetching lucky number:', error.message);
        return "حدث خطأ أثناء جلب البيانات.";
    }
}

module.exports = async (sock, chatId, message, args = '') => {
    const text = (args || '').trim();
    const name = text || '';

    if (!name) {
        await sock.sendMessage(chatId, { text: `*↢ قـم بارسال رقم حظي + الاسم*\n*↢ مثـال: رقم حظي محمد*` }, { quoted: message });
        return;
    }

    const result = await getLuckyNumber(name);
    const numberMatch = result.match(/هو: (\d+)/) || result.match(/: (\d+)/);
    const luckyNumber = numberMatch ? numberMatch[1] : '';
    const description = result.split('\n\n')[1] || '';
    
    const msg = `*↢ ${name}، رقم حظك ↞${luckyNumber}*☘️✨\n\n*↢شخصيتك هي↞ ${description} 🍀*`;
    await sock.sendMessage(chatId, { text: msg }, { quoted: message });
};