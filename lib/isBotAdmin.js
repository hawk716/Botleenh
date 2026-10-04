const botLidCache = new Map();

async function discoverBotLid(sock, chatId) {
    try {
        const meta = await sock.groupMetadata(chatId);
        const botId = sock.user?.id;
        const botPhone = botId ? botId.split('@')[0].split(':')[0] : '';
        const botLid = sock.user?.lid;
        
        // 1. Try direct match with sock.user.id
        for (const p of meta.participants) {
            if (p.id === botId && p.admin) return botId;
        }
        
        // 2. Try sock.user.lid
        if (botLid) {
            for (const p of meta.participants) {
                if (p.id === botLid && p.admin) return botLid;
            }
        }
        
        // 3. Try cached LID
        const cached = botLidCache.get(chatId);
        if (cached) {
            for (const p of meta.participants) {
                if (p.id === cached && p.admin) return cached;
            }
        }
        
        // 4. Try phone number match (for @s.whatsapp.net participants)
        if (botPhone) {
            for (const p of meta.participants) {
                const pid = typeof p.id === 'string' ? p.id : '';
                const pidNum = pid.split('@')[0].split(':')[0];
                if (pidNum === botPhone && p.admin) {
                    if (pid.includes('@lid')) botLidCache.set(chatId, pid);
                    return pid;
                }
            }
        }
        
        // 5. Try to find bot by checking if any @lid admin could be the bot
        // (when bot is admin but phone number doesn't match due to @lid format)
        for (const p of meta.participants) {
            const pid = typeof p.id === 'string' ? p.id : '';
            if (p.admin && pid.includes('@lid')) {
                // Cache this as potential bot LID for future checks
                if (!botLidCache.has(chatId)) {
                    botLidCache.set(chatId, pid);
                    // Verify it's actually the bot by checking if it matches next time
                }
                // For now, if it's the only @lid admin, assume it's the bot
                const lidAdmins = meta.participants.filter(p2 => p2.admin && typeof p2.id === 'string' && p2.id.includes('@lid'));
                if (lidAdmins.length === 1) {
                    botLidCache.set(chatId, lidAdmins[0].id);
                    return lidAdmins[0].id;
                }
            }
        }
        
        return null;
    } catch { return null; }
}

async function isBotAdmin(sock, chatId) {
    if (!chatId.endsWith('@g.us')) return true;
    try {
        const meta = await sock.groupMetadata(chatId);
        const botId = sock.user?.id;
        if (!botId) return false;
        
        const discoveredLid = await discoverBotLid(sock, chatId);
        if (discoveredLid) {
            for (const p of meta.participants) {
                if (p.id === discoveredLid && p.admin) return true;
            }
        }
        
        // Fallback: check all known identifiers
        const botPhone = botId.split('@')[0].split(':')[0];
        const botLid = sock.user?.lid;
        
        for (const p of meta.participants) {
            const pid = typeof p.id === 'string' ? p.id : '';
            if (!pid) continue;
            
            const pidNum = pid.split('@')[0].split(':')[0];
            const isMatch = 
                pid === botId ||
                (botLid && pid === botLid) ||
                (discoveredLid && pid === discoveredLid) ||
                pidNum === botPhone;
            
            if (isMatch && p.admin) return true;
        }
        return false;
    } catch { return true; }
}

async function requireBotAdmin(sock, chatId, message) {
    const ok = await isBotAdmin(sock, chatId);
    if (!ok) {
        await sock.sendMessage(chatId, { text: '*↢عذراً لا استطيع اداره المجموعه وانا لست مشرفاً، قم بتعييني كمشرف أولاً.*' }, { quoted: message });
    }
    return ok;
}

module.exports = { isBotAdmin, requireBotAdmin, botLidCache };