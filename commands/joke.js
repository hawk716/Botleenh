let jokes = [];
try {
  const data = require('../data/joke.json');
  const arr = Array.isArray(data) ? data : data.jokes;
  if (Array.isArray(arr)) jokes = arr.filter((x) => typeof x === 'string' && x.trim().length > 0);
} catch (e) {
  jokes = [];
}

function pickRandomJoke() {
  if (!jokes.length) return 'لا توجد نكت متاحة حالياً.';
  return jokes[Math.floor(Math.random() * jokes.length)];
}

async function jokeCmd(sock, chatId, msg) {
  const text = pickRandomJoke();
  await sock.sendMessage(chatId, { text }, { quoted: msg });
}

function getJokeCount() {
  return jokes.length;
}

function getAllJokes() {
  return jokes.slice();
}

module.exports = {
  jokeCmd,
  getRandomJoke: pickRandomJoke,
  getJokeCount,
  getAllJokes
};
