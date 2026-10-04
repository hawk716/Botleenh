const { UNDER_MAINTENANCE } = require('../lib/messages');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const sharp = require('sharp');
const settings = require('../settings');

async function blurCommand(sock, chatId, message, quotedMessage) {
    try {
        // Get the image to blur
        let imageBuffer;
        
        if (quotedMessage) {
            // If replying to a message
            if (!quotedMessage.imageMessage) {
                await sock.sendMessage(chatId, { 
                    text: '❌ يرجى الرد على رسالة تحتوي على صورة' 
                }, { quoted: message });
                return;
            }
            
            const quoted = {
                message: {
                    imageMessage: quotedMessage.imageMessage
                }
            };
            
            imageBuffer = await downloadMediaMessage(
                quoted,
                'buffer',
                { },
                { }
            );
        } else if (message.message?.imageMessage) {
            // If image is in current message
            imageBuffer = await downloadMediaMessage(
                message,
                'buffer',
                { },
                { }
            );
        } else {
            await sock.sendMessage(chatId, {
                text: '*↢ قــم بالرد او التعليق على صوره لجعلها مموه*'
            }, { quoted: message });
            return;
        }

        // Resize and optimize image
        const resizedImage = await sharp(imageBuffer)
            .resize(800, 800, { // Resize to max 800x800
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
            .toBuffer();

        // Apply blur effect directly using sharp
        const blurredImage = await sharp(resizedImage)
            .blur(10) // Blur radius of 10
            .toBuffer();

        // Send the blurred image
        await sock.sendMessage(chatId, {
            image: blurredImage,
            caption: '*↢ تـم تمويه الصوره بنجاح، ☑️*',
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: settings.newsletterJid || '120363400425238128@newsletter',
                    newsletterName: settings.packname || '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('Error in blur command:', error);
        await sock.sendMessage(chatId, { 
            text: UNDER_MAINTENANCE 
        }, { quoted: message });
    }
}

module.exports = blurCommand; 