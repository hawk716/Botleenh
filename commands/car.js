const axios = require('axios');
const cheerio = require('cheerio');

async function getSuitableCar(name) {
    try {
        const userInputs = JSON.stringify({ name });
        const toolID = 'السيارة-التي-تصلح-لك';
        const url = `https://tasleyah.com/apiPages/toolsResult2?userInputs=${encodeURIComponent(userInputs)}&toolID=${encodeURIComponent(toolID)}`;

        const response = await axios.get(url, {
            headers: {
                accept: 'text/html',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const resPage2 = $('#resPage2');
        if (!resPage2.length) return 'لم يتم العثور على نتائج لهذا الاسم.';

        const car = resPage2.attr('data-value') || resPage2.attr('data-names') || 'غير معروف';
        if (car === 'غير معروف') {
            const toolResText = $('#toolRes').text().trim();
            return toolResText || 'لا توجد سيارة متوفرة حالياً.';
        }
        return car;
    } catch (error) {
        console.error('Error fetching car:', error.message);
        return 'حدث خطأ أثناء جلب البيانات.';
    }
}

module.exports = async (sock, chatId, message, args) => {
    const text = typeof args === 'string' ? args.trim() : '';
    const name = text || '';

    if (!name) {
        await sock.sendMessage(chatId, { text: `*↢ قـم بارسال سيارتي + الاسم*\n*↢ مثـال: سيارتي محمد*` }, { quoted: message });
        return;
    }

    const car = await getSuitableCar(name);
    await sock.sendMessage(chatId, { text: `*↢ ${name}، السيارة المناسبة لك ↞${car} 🏎️*` }, { quoted: message });
};
