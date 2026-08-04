const axios = require('axios');
const cheerio = require('cheerio');

async function getTravelDestination(name, age) {
    try {
        const userInputs = JSON.stringify({ name, age: age.toString() });
        const toolID = 'إلى-أين-ستسافر؟';
        const url = `https://tasleyah.com/apiPages/toolsResult2?userInputs=${encodeURIComponent(userInputs)}&toolID=${encodeURIComponent(toolID)}`;

        const response = await axios.get(url, {
            headers: {
                accept: 'text/html',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const resPage2 = $('#resPage2');
        if (!resPage2.length) return 'لم يتم العثور على نتائج.';
        const destination = resPage2.attr('data-value') || resPage2.attr('data-names') || 'غير معروف';
        if (destination === 'غير معروف') {
            const toolResText = $('#toolRes').text().trim();
            return toolResText || 'لا توجد وجهة متوفرة حالياً.';
        }
        return destination;
    } catch (error) {
        console.error('Error fetching travel destination:', error.message);
        return 'حدث خطأ أثناء جلب البيانات.';
    }
}

module.exports = async (sock, chatId, message, args) => {
    const text = typeof args === 'string' ? args.trim() : '';
    const parts = text.split(/\s+/);
    const name = parts[0] || '';
    const ageInput = parts[1] || '25';

    if (!name) {
        await sock.sendMessage(chatId, { text: `*↢ قـم بارسال اين ستسافر + الاسم + العمر*\n*↢ مثـال: اين ستسافر محمد 18*` }, { quoted: message });
        return;
    }

    const cleanAge = ageInput.replace(/[^0-9]/g, '') || '25';
    const destination = await getTravelDestination(name, cleanAge);
    await sock.sendMessage(chatId, { text: `*↢ ${name}، وجهتك المقترحه ↞${destination} 🗺️*` }, { quoted: message });
};
