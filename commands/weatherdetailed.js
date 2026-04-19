
const axios = require('axios');

module.exports = async function (sock, chatId, message, city) {
    try {
        const apiKey = '4902c0f2550f58298ad4146a92b65e10';
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ar`);
        const weather = response.data;
        
        // Convert timestamps to readable time
        const sunrise = new Date(weather.sys.sunrise * 1000).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        const sunset = new Date(weather.sys.sunset * 1000).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        
        // Create detailed weather message
        const weatherText = `╭═══════════════╮
   🌤️ *حالة الطقس في ${weather.name}*
╰═══════════════╯

📍 *الموقع:* ${weather.name}, ${weather.sys.country}

🌡️ *درجات الحرارة:*
  • الحالية: ${Math.round(weather.main.temp)}°C
  • المحسوسة: ${Math.round(weather.main.feels_like)}°C
  • الحد الأقصى: ${Math.round(weather.main.temp_max)}°C
  • الحد الأدنى: ${Math.round(weather.main.temp_min)}°C

☁️ *الوصف:* ${weather.weather[0].description}

💧 *الرطوبة:* ${weather.main.humidity}%

💨 *الرياح:* ${weather.wind.speed} م/ث

🔽 *الضغط الجوي:* ${weather.main.pressure} هكتوباسكال

👁️ *الرؤية:* ${(weather.visibility / 1000).toFixed(1)} كم

🌅 *الشروق:* ${sunrise}
🌇 *الغروب:* ${sunset}

━━━━━━━━━━━━━━━━━
⏰ آخر تحديث: ${new Date().toLocaleString('ar-SA')}`;

        await sock.sendMessage(chatId, { text: weatherText }, { quoted: message });
    } catch (error) {
        console.error('Error fetching detailed weather:', error);
        
        let errorMessage = '❌ عذراً، لا يمكن جلب معلومات الطقس الآن.';
        
        if (error.response && error.response.status === 404) {
            errorMessage = '❌ المدينة غير موجودة! الرجاء التأكد من اسم المدينة.';
        } else if (!city || city.trim() === '') {
            errorMessage = '❌ الرجاء كتابة اسم المدينة!\nمثال: جو الرياض';
        }
        
        await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
    }
};
