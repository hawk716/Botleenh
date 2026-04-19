const axios = require('axios');

async function weatherCommand(sock, chatId, message, city, isDetailed = false) {
    try {
        const apiKey = '4902c0f2550f58298ad4146a92b65e10';
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ar`);
        const weather = response.data;

        let weatherText;
        
        if (isDetailed) {
            // Detailed weather info for "جو" command
            weatherText = `*↢الطقـس فـي ${weather.name}:*\n\n` +
                         `*↢ الحالـة:* ${weather.weather[0].description}\n` +
                         `*↢ درجـة الحـرارة:* ${weather.main.temp}°C\n` +
                         `*↢ الحـرارة المحسوسـة:* ${weather.main.feels_like}°C\n` +
                         `*↢ أدنـى حـرارة:* ${weather.main.temp_min}°C\n` +
                         `*↢ أعلـى حـرارة:* ${weather.main.temp_max}°C\n` +
                         `*↢ الرطوبـة:* ${weather.main.humidity}%\n` +
                         `*↢ الضغـط الجـوي:* ${weather.main.pressure} hPa\n` +
                         `*↢ سرعـة الريـاح:* ${weather.wind.speed} م/ث\n` +
                         `*↢ الرؤيـة:* ${weather.visibility / 1000} كم`;
        } else {
            // Simple weather info for "طقس" command
            weatherText = `*↢الطقـس فـي ${weather.name}: ${weather.weather[0].description}*\n*↢ درجـة الحـرارة: ${weather.main.temp}°C.*`;
        }

        await sock.sendMessage(chatId, { text: weatherText }, { quoted: message });
    } catch (error) {
        console.error('Error fetching weather:', error);

        let errorMessage = '❌ عذراً، لا يمكن جلب معلومات الطقس الآن.';

        if (error.response && error.response.status === 404) {
            errorMessage = '❌ المدينة غير موجودة! الرجاء التأكد من اسم المدينة.';
        } else if (!city || city.trim() === '') {
            errorMessage = '❌ الرجاء كتابة اسم المدينة!\nمثال: طقس الرياض';
        }

        await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
    }
}

module.exports = weatherCommand;