module.exports = async function(sock, chatId, message) {
    const txt = `*قـائمـة اوامــر التسـليـة والالعـاب.*
*ٴ┈┈─┈─┈─┈─┈─┈─┈─┈*
*↢ التسـليـة*
*ٴ┈┈─┈─┈─┈─┈─┈─┈──*
*- حب ↢بالـرد*
*- كره ↢بالرد*
*- حظي - حظه↢بالـرد*
*- عمري - عمره ↢بالـرد*
*- وجهي - وجهه ↢بالـرد*
*- برجي - برجه ↢بالـرد*
*- امنيتي - امنيته↢بالـرد*
*- نجومي - نجومه↢بالـرد*
*- مزاجي - مزاجه↢بالـرد*
*- من يحبني - من يحبه↢بالـرد*
*- من يكرهني - من يكرهه↢بالـرد*
*- غباء - غبائه↢بالـرد*
*- نكته*
*- ذكاء*
*- مزحة*
*- شِعر*
*- ايش تختار*
*- اقتباس*`;

    await sock.sendMessage(chatId, {
        text: txt,
        contextInfo: {
            externalAdReply: {
                title: "قائمة التسلية والألعاب",
                body: "Knight Bot",
                thumbnailUrl: "https://i.ibb.co/KG7Byyn/20241222-192450.jpg",
                sourceUrl: global.channelLink,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: message });
};