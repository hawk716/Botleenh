const { ttdl } = require("ruhend-scraper");
const axios = require('axios');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

async function tiktokCommand(sock, chatId, message) {
    try {
        // Check if message has already been processed
        if (processedMessages.has(message.key.id)) {
            return;
        }

        // Add message ID to processed set
        processedMessages.add(message.key.id);

        // Clean up old message IDs after 5 minutes
        setTimeout(() => {
            processedMessages.delete(message.key.id);
        }, 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const url = text.replace(/^(تيك|تيك توك|tiktok|tik|tt)\s*/i, '').trim();

        if (!url) {
            return;
        }

        // Check for various TikTok URL formats
        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/,
            /https?:\/\/(?:www\.)?tiktok\.com\/t\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));

        if (!isValidUrl) {
            return;
        }

        await sock.sendMessage(chatId, {
            react: { text: '🔄', key: message.key }
        });

        try {
            // Try multiple APIs in sequence
            const apis = [
                `https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(url)}`,
                `https://api.princetechn.com/api/download/tiktokdlv2?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
                `https://api.princetechn.com/api/download/tiktokdlv3?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
                `https://api.princetechn.com/api/download/tiktokdlv4?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
                `https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`
            ];



            let videoUrl = null;
            let audioUrl = null;
            let title = null;

            // Try each API until one works
            for (const apiUrl of apis) {
                try {
                    const response = await axios.get(apiUrl, { timeout: 10000 });

                    if (response.data) {
                        // Handle different API response formats
                        if (response.data.result && response.data.result.videoUrl) {
                            // PrinceTech API format
                            videoUrl = response.data.result.videoUrl;
                            audioUrl = response.data.result.audioUrl;
                            title = response.data.result.title;
                            break;
                        } else if (response.data.tiktok && response.data.tiktok.video) {
                            // Dreaded API format
                            videoUrl = response.data.tiktok.video;
                            break;
                        } else if (response.data.video) {
                            // Alternative format
                            videoUrl = response.data.video;
                            break;
                        }
                    }
                } catch (apiError) {
                    console.error(`TikTok API failed: ${apiError.message}`);
                    continue;
                }
            }

            // If no API worked, try the original ttdl method
            if (!videoUrl) {
                let downloadData = await ttdl(url);
                if (downloadData && downloadData.data && downloadData.data.length > 0) {
                    const mediaData = downloadData.data;
                    for (let i = 0; i < Math.min(20, mediaData.length); i++) {
                        const media = mediaData[i];
                        const mediaUrl = media.url;

                        // Check if URL ends with common video extensions
                        const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                                      media.type === 'video';

                        if (isVideo) {
                            await sock.sendMessage(chatId, {
                                video: { url: mediaUrl },
                                mimetype: "video/mp4",
                                caption: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧"
                            }, { quoted: message });
                        } else {
                            await sock.sendMessage(chatId, {
                                image: { url: mediaUrl },
                                caption: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧"
                            }, { quoted: message });
                        }
                    }
                    return;
                }
            }

            // Send the video if we got a URL from the APIs
            if (videoUrl) {
                try {
                    // Download video as buffer
                    const videoResponse = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });

                    const videoBuffer = Buffer.from(videoResponse.data);

                    const caption = title ? `𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧\n\n📝 Title: ${title}` : "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧";

                    await sock.sendMessage(chatId, {
                        video: videoBuffer,
                        mimetype: "video/mp4",
                        caption: caption
                    }, { quoted: message });

                    // If we have audio URL, download and send it as well
                    if (audioUrl) {
                        try {
                            const audioResponse = await axios.get(audioUrl, {
                                responseType: 'arraybuffer',
                                timeout: 30000,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                                }
                            });

                            const audioBuffer = Buffer.from(audioResponse.data);

                            await sock.sendMessage(chatId, {
                                audio: audioBuffer,
                                mimetype: "audio/mp3",
                                caption: "🎵 Audio from TikTok"
                            }, { quoted: message });
                        } catch (audioError) {
                            console.error(`Failed to download audio: ${audioError.message}`);
                        }
                    }
                    return;
                } catch (downloadError) {
                    console.error(`Failed to download video: ${downloadError.message}`);
                    // Fallback to URL method
                    try {
                        const caption = title ? `𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧\n\n📝 Title: ${title}` : "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧";

                        await sock.sendMessage(chatId, {
                            video: { url: videoUrl },
                            mimetype: "video/mp4",
                            caption: caption
                        }, { quoted: message });
                        return;
                    } catch (urlError) {
                        console.error(`URL method also failed: ${urlError.message}`);
                    }
                }
            }

            // If we reach here, no method worked
            return await sock.sendMessage(chatId, { 
                text: "❌ فشل تحميل فيديو تيك توك. جميع طرق التحميل فشلت. الرجاء المحاولة برابط مختلف أو التحقق من توفر الفيديو."
            });
        } catch (error) {
            console.error('Error in TikTok download:', error);
            await sock.sendMessage(chatId, { 
                text: "فشل تحميل فيديو تيك توك. الرجاء المحاولة برابط مختلف."
            });
        }
    } catch (error) {
        console.error('Error in TikTok command:', error);
        await sock.sendMessage(chatId, { 
            text: "حدث خطأ أثناء معالجة الطلب. الرجاء المحاولة لاحقاً."
        });
    }
}

// Function to handle song downloads with the new format and duplicate prevention
async function downloadSong(sock, chatId, message, url) {
    // Check if message has already been processed
    if (processedMessages.has(message.key.id)) {
        return;
    }
    processedMessages.add(message.key.id);
    setTimeout(() => {
        processedMessages.delete(message.key.id);
    }, 5 * 60 * 1000);

    try {
        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        // Placeholder for actual song download logic
        // This part would involve fetching song details and URL
        const songTitle = "Sherine - Batmanna Ansak | شيرين - بتمنى أنساك";
        const songDuration = "3:00";

        const formattedMessage = `*➦:𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱 : ${songTitle} 🎵*\n*➦:𝘁𝗶𝗺𝗲 : ${songDuration} ⏱*`;
        
        await sock.sendMessage(chatId, { text: formattedMessage }, { quoted: message });

    } catch (error) {
        console.error('Error in downloadSong command:', error);
        await sock.sendMessage(chatId, { 
            text: "فشل تحميل الأغنية. الرجاء المحاولة برابط مختلف."
        });
    }
}

// Function to handle Instagram story downloads with the new format and duplicate prevention
async function instagramStoryCommand(sock, chatId, message) {
    // Check if message has already been processed
    if (processedMessages.has(message.key.id)) {
        return;
    }
    processedMessages.add(message.key.id);
    setTimeout(() => {
        processedMessages.delete(message.key.id);
    }, 5 * 60 * 1000);

    const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
    const command = text.match(/^(انستقرام|انسـتا)\s*/i);

    if (!command) {
        return;
    }

    const url = text.replace(/^(انستقرام|انسـتا)\s*/i, '').trim();

    if (!url) {
        await sock.sendMessage(chatId, { 
            text: "*الاستخدام:انستـقرام <الـرابـط>*\n*انسـتا <الرابط>*"
        }, { quoted: message });
        return;
    }

    // Placeholder for actual Instagram story download logic
    // This part would involve fetching story data and sending it
    await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });
    await sock.sendMessage(chatId, { 
        text: `*➦:downloading Instagram story from: ${url} 🎵*`
    });
}


module.exports = {
    tiktokCommand,
    downloadSong,
    instagramStoryCommand
};