const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '../memory');

// Ensure memory directory exists
if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

/**
 * Get memory file path for a user
 */
function getMemoryPath(userId) {
    // Sanitize userId for filename
    const safeId = userId.replace(/[^a-zA-Z0-9@_-]/g, '_');
    return path.join(MEMORY_DIR, `${safeId}.json`);
}

/**
 * Load conversation memory for a user
 */
function loadMemory(userId) {
    try {
        const filePath = getMemoryPath(userId);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(data);
            // Ensure it's an array of messages
            if (Array.isArray(parsed.messages)) {
                return parsed.messages;
            }
        }
    } catch (e) {
        console.log(`[Memory] Failed to load for ${userId}: ${e.message}`);
    }
    return [];
}

/**
 * Save conversation memory for a user
 */
function saveMemory(userId, messages) {
    try {
        const filePath = getMemoryPath(userId);
        const data = JSON.stringify({ messages }, null, 2);
        fs.writeFileSync(filePath, data, 'utf8');
    } catch (e) {
        console.log(`[Memory] Failed to save for ${userId}: ${e.message}`);
    }
}

/**
 * Add a message to user's memory with metadata
 * @param {string} userId - WhatsApp user ID (JID)
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message text
 * @param {object} meta - Additional metadata { senderName, chatId, etc. }
 */
function addToMemory(userId, role, content, meta = {}) {
    const memory = loadMemory(userId);
    
    const messageEntry = {
        role,
        content,
        timestamp: Date.now(),
        ...meta
    };
    
    memory.push(messageEntry);
    
    // Keep last 50 messages for richer context
    if (memory.length > 50) {
        memory.splice(0, memory.length - 50);
    }
    
    saveMemory(userId, memory);
    return memory;
}

/**
 * Clear user memory
 */
function clearMemory(userId) {
    const filePath = getMemoryPath(userId);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

/**
 * Get conversation context for a user, formatted for LLM
 * Optionally includes user name in a system note
 */
function getConversationContext(userId, includeNames = false) {
    const memory = loadMemory(userId);
    
    if (!includeNames) {
        // Simple: just role and content
        return memory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }
    
    // Advanced: include user name in context
    // This helps the AI remember who they're talking to
    const context = [];
    for (const msg of memory) {
        if (msg.role === 'user' && msg.senderName) {
            context.push({
                role: 'user',
                content: `[${msg.senderName || 'مستخدم'}]: ${msg.content}`
            });
        } else {
            context.push({
                role: msg.role,
                content: msg.content
            });
        }
    }
    return context;
}

module.exports = {
    loadMemory,
    saveMemory,
    addToMemory,
    clearMemory,
    getConversationContext
};
