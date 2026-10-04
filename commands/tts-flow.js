const { UNDER_MAINTENANCE } = require('../lib/messages');
const { LANGUAGES, hasDialects } = require('./tts-data');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const TIMEOUT_MS = 120000;

// معطّل مؤقتاً: توليد الصوت يعتمد على python3 + playwright + Chromium
// (غير مثبّت) وخدمة speechgen.io ترفض الطلب المباشر بلا اشتراك مدفوع.
// نردّ برسالة الصيانة الموحّدة. للتفعيل: DISABLED = false (بعد تجهيز الاعتمادية).
const DISABLED = true;

function isDisabled() { return DISABLED; }

const states = new Map();

function getState(senderId) {
  return states.get(senderId);
}

function clearState(senderId) {
  const state = states.get(senderId);
  if (state && state.timeout) clearTimeout(state.timeout);
  states.delete(senderId);
}

function setState(senderId, data) {
  if (states.has(senderId)) clearState(senderId);
  const timeout = setTimeout(() => {
    states.delete(senderId);
  }, TIMEOUT_MS);
  states.set(senderId, { ...data, timeout });
}

function isWaiting(senderId) {
  if (DISABLED) return false;
  return states.has(senderId);
}

// يعطي المستخدم رسالة الصيانة بدل أي خطوة من خطوات المسار.
async function replyDisabled(sock, chatId, msg) {
  try {
    await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, msg?.key ? { quoted: msg } : {});
  } catch (e) {
    console.error('Error in TTS disabled reply:', e.message);
  }
  states.delete(msg?.key?.participant);
  return true;
}

// Step 1: User sent a TTS command with text
async function startFlow(sock, chatId, senderId, text, msg) {
  if (DISABLED) return await replyDisabled(sock, chatId, msg);
  if (isWaiting(senderId)) return;
  const langList = LANGUAGES.map((l, i) => `*.${i + 1}. ${l.name} (${l.code})*`).join('\n');
  const message = `*↢ ارسـل اسم او رمز اللــغة التي تريد إستخدامها، 🌐🎤*\n━━━━━━━━━━━━━━\n${langList}`;
  try {
    await sock.sendMessage(chatId, { text: message }, msg?.key ? { quoted: msg } : {});
  } catch (e) {
    console.error('Error in TTS startFlow sendMessage:', e);
  }
  setState(senderId, { step: 'language', text });
}

function findLanguage(input) {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    const idx = parseInt(trimmed, 10) - 1;
    if (idx >= 0 && idx < LANGUAGES.length) return { index: idx };
    return null;
  }
  const lowerInput = trimmed.toLowerCase();
  const byCode = LANGUAGES.findIndex(l => l.code.toLowerCase() === lowerInput);
  if (byCode !== -1) return { index: byCode };
  const byName = LANGUAGES.findIndex(l => l.name === trimmed);
  if (byName !== -1) return { index: byName };
  return null;
}

function findDialect(lang, input) {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    const idx = parseInt(trimmed, 10) - 1;
    if (idx >= 0 && idx < lang.dialects.length) return { index: idx };
    return null;
  }
  const byName = lang.dialects.findIndex(d => d.name === trimmed);
  if (byName !== -1) return { index: byName };
  return null;
}

// Step 2: User sent language index/name/code
async function handleLanguage(sock, chatId, senderId, msg, resolvedIdx) {
  const state = getState(senderId);
  if (!state) return false;

  const lang = LANGUAGES[resolvedIdx];
  state.languageIndex = resolvedIdx;
  state.languageName = lang.name;
  state.languageCode = lang.code;

  if (hasDialects(resolvedIdx)) {
    const dialectList = lang.dialects.map((d, i) => `*.${i + 1}. ${d.name}*`).join('\n');
    const message = `*↢ ارسـل اللهـجه التي تريد إستخدامها للـــ ${lang.name} (${lang.code})، 🎙️*\n━━━━━━━━━━━━━━━\n${dialectList}`;
    await sock.sendMessage(chatId, { text: message }, msg?.key ? { quoted: msg } : {});
    state.step = 'dialect';
    setState(senderId, state);
    return true;
  }

  state.step = 'voice';
  state.apiCategory = lang.api;
  setState(senderId, state);
  return await showVoices(sock, chatId, senderId, msg);
}

// Step 3: User sent dialect index/name
async function handleDialect(sock, chatId, senderId, msg, resolvedIdx) {
  const state = getState(senderId);
  if (!state || state.step !== 'dialect') return false;

  const lang = LANGUAGES[state.languageIndex];
  if (!lang.dialects || resolvedIdx < 0 || resolvedIdx >= lang.dialects.length) {
    await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, msg?.key ? { quoted: msg } : {});
    return true;
  }

  const dialect = lang.dialects[resolvedIdx];
  state.apiCategory = dialect.api;
  state.step = 'voice';
  setState(senderId, state);
  return await showVoices(sock, chatId, senderId, msg);
}

// Step 4: Show voices for the selected category
async function showVoices(sock, chatId, senderId, msg) {
  const state = getState(senderId);
  if (!state) return false;

  try {
    const res = await fetch('https://speechgen.io/index.php?r=api/voices');
    const allVoices = await res.json();
    const voices = allVoices[state.apiCategory];

    if (!voices || voices.length === 0) {
      await sock.sendMessage(chatId, {
        text: `*↢ عذراً، لا توجد أصوات متاحة للـ ${state.apiCategory} حالياً.*`
      }, msg?.key ? { quoted: msg } : {});
      clearState(senderId);
      return true;
    }

    state.voices = voices;
    setState(senderId, state);

    const chunks = [];
    for (let i = 0; i < voices.length; i++) {
      const v = voices[i];
      const gender = v.sex === 'male' ? 'ذكر' : v.sex === 'female' ? 'أنثى' : v.sex === 'girl' ? 'طفلة' : 'محايد';
      const typeLabel = v.type === 'hd' ? '⭐' : v.type === 'pro' ? '✅' : '';
      chunks.push(`*.${i + 1}.* ${typeLabel} ${v.voice} (${gender})`);
    }

    const msgText = `*↢ اختر الصوت المناسب: 🎤*\n━━━━━━━━━━━━━━\n${chunks.join('\n')}`;
    await sock.sendMessage(chatId, { text: msgText }, msg?.key ? { quoted: msg } : {});

    state.step = 'voice_select';
    setState(senderId, state);
    return true;
  } catch (e) {
    console.error('Error fetching voices:', e);
    await sock.sendMessage(chatId, {
      text: UNDER_MAINTENANCE
    }, msg?.key ? { quoted: msg } : {});
    clearState(senderId);
    return true;
  }
}

// Step 5: User sent voice number or name
async function handleVoice(sock, chatId, senderId, msg, userInput) {
  const state = getState(senderId);
  if (!state || !state.voices) return false;

  const trimmed = userInput.trim();
  let idx = -1;

  // Try as number
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10) - 1;
    if (num >= 0 && num < state.voices.length) idx = num;
  }

  // Try by voice name (case-insensitive)
  if (idx === -1) {
    const voiceIdx = state.voices.findIndex(v => v.voice.toLowerCase() === trimmed.toLowerCase());
    if (voiceIdx !== -1) idx = voiceIdx;
  }

  if (idx === -1) {
    await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, msg?.key ? { quoted: msg } : {});
    return true;
  }

  const selectedVoice = state.voices[idx].voice;
  await sock.sendMessage(chatId, { text: `*↢ جاري إنشاء الصوت بصوت ${selectedVoice}... ⏳*` }, msg?.key ? { quoted: msg } : {});

  const fileName = `speechgen-${Date.now()}.mp3`;
  const outputPath = path.join(__dirname, '..', 'assets', fileName);
  const pythonScript = path.join(__dirname, 'speechgen-tts.py');
  const escapedText = state.text.replace(/"/g, '\\"');
  const cmd = `python3 "${pythonScript}" --text "${escapedText}" --voice "${selectedVoice}" --output "${outputPath}"`;

  exec(cmd, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }, async (err, stdout, stderr) => {
    const sendOpts = msg?.key ? { quoted: msg } : {};
    if (err || !stdout.includes('OK:')) {
      console.error('SpeechGen TTS error:', stderr || stdout || err?.message);
      await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, sendOpts).catch(() => {});
      return;
    }

    const resultPath = stdout.trim().replace('OK:', '');
    if (fs.existsSync(resultPath)) {
      try {
        await sock.sendMessage(chatId, {
          audio: { url: resultPath },
          mimetype: 'audio/mpeg',
          ptt: false
        }, sendOpts);
      } catch (sendErr) {
        console.error('Error sending audio:', sendErr);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, sendOpts).catch(() => {});
      }
      setTimeout(() => {
        try { if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath); } catch (e) {}
      }, 15000);
    }
  });

  clearState(senderId);
  return true;
}

// Main handler - called from main.js when user is in TTS flow
async function handleTtsInput(sock, chatId, message, senderId, userMessage) {
  if (DISABLED) return false;
  if (!isWaiting(senderId)) return false;

  const state = getState(senderId);
  if (!state) return false;

  const trimmed = userMessage.trim();

  // Ignore obviously large inputs (likely duplicate command text, not user response)
  if (trimmed.length > 30) return true;

  if (state.step === 'language') {
    let resolvedIdx = null;
    const num = parseInt(trimmed, 10);
    if (!isNaN(num)) {
      resolvedIdx = num - 1;
    } else {
      const match = findLanguage(trimmed);
      if (match) resolvedIdx = match.index;
    }

    if (resolvedIdx !== null && resolvedIdx >= 0 && resolvedIdx < LANGUAGES.length) {
      return await handleLanguage(sock, chatId, senderId, message, resolvedIdx);
    }
    await sock.sendMessage(chatId, { text: '*↢ اللغة غير معروفة. أرسل الرقم أو الاسم أو الرمز (مثال: 1، العربية، ar).*' }, message?.key ? { quoted: message } : {});
    return true;
  }

  if (state.step === 'dialect') {
    const lang = LANGUAGES[state.languageIndex];
    let resolvedIdx = null;
    const num = parseInt(trimmed, 10);
    if (!isNaN(num)) {
      resolvedIdx = num - 1;
    } else {
      const match = findDialect(lang, trimmed);
      if (match) resolvedIdx = match.index;
    }

    if (resolvedIdx !== null && resolvedIdx >= 0 && lang.dialects && resolvedIdx < lang.dialects.length) {
      return await handleDialect(sock, chatId, senderId, message, resolvedIdx);
    }
    await sock.sendMessage(chatId, { text: '*↢ اللهجة غير معروفة. أرسل الرقم أو اسم اللهجة.*' }, message?.key ? { quoted: message } : {});
    return true;
  }

  if (state.step === 'voice_select') {
    if (!trimmed) {
      await sock.sendMessage(chatId, { text: '*↢ يرجى إرسال رقم أو اسم الصوت.*' }, message?.key ? { quoted: message } : {});
      return true;
    }
    return await handleVoice(sock, chatId, senderId, message, trimmed);
  }

  return false;
}

module.exports = {
  startFlow,
  handleTtsInput,
  isWaiting,
  isDisabled,
  clearState,
  LANGUAGES,
};
