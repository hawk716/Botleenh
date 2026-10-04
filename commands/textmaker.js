const { UNDER_MAINTENANCE } = require('../lib/messages');
const { UltimateTextToImage, registerFont } = require('ultimate-text-to-image');
const fs = require('fs');
const path = require('path');

const FONT_PATH = path.join(__dirname, '..', 'fonts', 'NotoSansArabic-Regular.ttf');
const FONT_FAMILY = 'NotoSansArabic';

try {
  if (fs.existsSync(FONT_PATH)) {
    registerFont(FONT_PATH, { family: FONT_FAMILY });
  }
} catch (e) {
  console.warn('Font registration failed, using default font:', e.message);
}

const STYLES = {
  metallic: {
    backgroundColor: '#1a1a2e',
    fontColor: '#e0e0e0',
    strokeColor: '#555555',
    strokeSize: 2,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#444444',
    borderSize: 4,
  },
  ice: {
    backgroundColor: '#0d47a1',
    fontColor: '#ffffff',
    strokeColor: '#90caf9',
    strokeSize: 3,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#64b5f6',
    borderSize: 3,
  },
  snow: {
    backgroundColor: '#e3f2fd',
    fontColor: '#0d47a1',
    strokeColor: '#90caf9',
    strokeSize: 2,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#bbdefb',
    borderSize: 3,
  },
  impressive: {
    backgroundColor: '#4a148c',
    fontColor: '#ffeb3b',
    strokeColor: '#e040fb',
    strokeSize: 3,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#7c4dff',
    borderSize: 4,
  },
  matrix: {
    backgroundColor: '#000000',
    fontColor: '#00ff41',
    strokeColor: '#003b00',
    strokeSize: 2,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#00ff41',
    borderSize: 2,
  },
  light: {
    backgroundColor: '#000000',
    fontColor: '#00e5ff',
    strokeColor: '#006064',
    strokeSize: 3,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#00e5ff',
    borderSize: 3,
  },
  neon: {
    backgroundColor: '#1a1a1a',
    fontColor: '#ff00ff',
    strokeColor: '#ff00ff',
    strokeSize: 4,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#ff00ff',
    borderSize: 2,
  },
  devil: {
    backgroundColor: '#1a0000',
    fontColor: '#ff1744',
    strokeColor: '#b71c1c',
    strokeSize: 3,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#ff1744',
    borderSize: 3,
  },
  purple: {
    backgroundColor: '#2d1b4e',
    fontColor: '#e040fb',
    strokeColor: '#7c4dff',
    strokeSize: 3,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#e040fb',
    borderSize: 3,
  },
  thunder: {
    backgroundColor: '#0a0a2e',
    fontColor: '#ffea00',
    strokeColor: '#f57f17',
    strokeSize: 3,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#ffea00',
    borderSize: 3,
  },
  fire: {
    backgroundColor: '#1a0000',
    fontColor: '#ff6d00',
    strokeColor: '#ffab00',
    strokeSize: 3,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#ff6d00',
    borderSize: 3,
  },
  leaves: {
    backgroundColor: '#1b5e20',
    fontColor: '#a5d6a7',
    strokeColor: '#2e7d32',
    strokeSize: 2,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#4caf50',
    borderSize: 3,
  },
  glitch: {
    backgroundColor: '#000000',
    fontColor: '#ff0055',
    strokeColor: '#00ffff',
    strokeSize: 2,
    fontSize: 80,
    maxWidth: 900,
    borderColor: '#ffffff',
    borderSize: 2,
  },
};

function cleanText(text) {
  return text
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildImage(text, styleKey) {
  const style = STYLES[styleKey] || STYLES.metallic;
  const safeText = cleanText(text);
  if (!safeText) return null;

  const instance = new UltimateTextToImage(safeText, {
    fontFamily: FONT_FAMILY,
    fontSize: style.fontSize,
    fontColor: style.fontColor,
    strokeSize: style.strokeSize,
    strokeColor: style.strokeColor,
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderSize: style.borderSize,
    maxWidth: style.maxWidth,
    align: 'center',
    valign: 'middle',
    margin: 40,
    autoWrapLineHeightMultiplier: 1.4,
  });

  return instance.render().toBuffer('image/png');
}

async function textmakerCommand(sock, chatId, message, q, type) {
  try {
    const text = (typeof q === 'string' ? q : '').split(' ').slice(1).join(' ');
    if (!text) {
      return await sock.sendMessage(chatId, {
        text: 'من فضلك أدخل النص المراد تحويله\nمثال: .metallic Nick',
      }, { quoted: message });
    }

    const imageBuffer = buildImage(text, type);
    if (!imageBuffer) {
      return await sock.sendMessage(chatId, {
        text: UNDER_MAINTENANCE,
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      image: imageBuffer,
      caption: 'تم الإنشاء بواسطة KNIGHT-BOT',
    }, { quoted: message });
  } catch (error) {
    console.error('Error in text generator:', error);
    await sock.sendMessage(chatId, {
      text: UNDER_MAINTENANCE,
    }, { quoted: message });
  }
}

module.exports = { textmakerCommand };
