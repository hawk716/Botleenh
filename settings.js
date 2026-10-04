// يُحمَّل .env هنا لأن settings يُستدعى قبل config.js في index.js
try { require('dotenv').config() } catch {}

const settings = {
  packname: '𝐋𝐞𝐞𝐧𝐁𝐨𝐭',
  botName: "𝐋𝐞𝐞𝐧𝐁𝐨𝐭",
  botOwner: 'Professor',
  ownerNumber: '963938953339',
  // مفتاح Giphy: من البيئة فقط (GIPHY_API_KEY في .env).
  // كان مكتوباً هنا ← مكشوف في git.
  giphyApiKey: process.env.GIPHY_API_KEY || '',
  imgflipUsername: '',
  imgflipPassword: '',
  commandMode: "public",
  maxStoreMessages: 20,
  storeWriteInterval: 10000,
  description: "This is a bot for managing group commands and automating tasks.",
  version: "0.0.1",
  VERSION: "0. 0.1",
  newsletterJid: '120363400425238128@newsletter',
  updateZipUrl: "https://github.com/mruniquehacker/Knightbot-MD/archive/refs/heads/main.zip",
  };

module.exports = settings;
