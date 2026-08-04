const axios = require('axios');
const cheerio = require('cheerio');

/**
 * دالة لجلب أسماء الدلع لاسم معين من موقع تسلية
 * @param {string} name - الاسم المراد البحث عن دلع له
 * @returns {Promise<string[]>} - مصفوفة تحتوي على أسماء الدلع
 */
async function getNicknames(name) {
    try {
        const userInputs = JSON.stringify({ name });
        const toolID = 'أسماء-الدلع-المناسبة-لك';
        const url = `https://tasleyah.com/apiPages/toolsResult2?userInputs=${encodeURIComponent(userInputs)}&toolID=${encodeURIComponent(toolID)}`;

        const response = await axios.get(url, {
            headers: {
                accept: 'text/html',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const resPage2 = $('#resPage2');

        if (!resPage2.length) {
            return ['لم يتم العثور على نتائج لهذا الاسم.'];
        }

        const namesHtml = resPage2.attr('data-names');
        const $names = cheerio.load(namesHtml);

        const nicknames = [];
        $names('li').each((i, el) => {
            const text = $names(el).text().trim();
            if (text) nicknames.push(text);
        });

        if (nicknames.length === 0) {
            const plainText = $names.text().trim();
            if (plainText && !plainText.includes('لا توجد أسماء دلع')) {
                return [plainText];
            }
            return ['لا توجد أسماء دلع متوفرة لهذا الاسم حالياً.'];
        }

        return nicknames;
    } catch (error) {
        console.error('Error fetching nicknames:', error.message);
        return ['حدث خطأ أثناء جلب البيانات.'];
    }
}

module.exports = { getNicknames };
