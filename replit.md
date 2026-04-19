# Knight Bot - WhatsApp Bot

## Overview
Knight Bot is a WhatsApp bot built using Node.js and the Baileys library. It provides comprehensive group management features, interactive games, multimedia processing capabilities, and various utility commands for WhatsApp users. The bot aims to enhance user interaction within WhatsApp groups and offer a wide range of functionalities, from entertainment to information retrieval. The project has successfully completed a full Arabic localization, making it fully functional in Arabic with a hierarchical menu system.

## User Preferences
### Coding Standards
1. **Translation Only - No Rewriting**: Modifications should be limited to translating texts from English to Arabic, maintaining the exact same structure and form without rewriting code or changing programming logic.
2. **No Comments**: Do not add programming comments to keep the code clean and organized. The code should be clear without the need for comments.
3. **Short, Human-Readable Function Names**: Use short, easy-to-read function names. Avoid long and complex names. Do not use underscores (`_`); use `camelCase` for names.
4. **Human-Readable Code**: The code must be understandable and easy to read, avoiding unnecessary complexities. Use clear and descriptive variable names.
5. **Maintain Order**: Do not reorder existing code. Maintain the current file structure. Modifications must be precise and specific.
6. **Mandatory Documentation of Changes**: Any modification, no matter how small, must be immediately documented in `replit.md` under the "Recent Changes" section with the date. Clearly mention the modified files and the changes made to ensure full project history tracking.

## System Architecture
The bot is a backend application developed in Node.js 20, utilizing the `@whiskeysockets/baileys` library for WhatsApp Web API integration.
- **Project Structure**:
    - `index.js`: Main entry point and connection handler.
    - `main.js`: Core message and event handling logic.
    - `commands/`: Directory for individual command implementations, including a hierarchical menu system (`menu1.js` to `menu6.js`).
    - `lib/`: Contains utility functions and helpers.
    - `data/`: Used for JSON data storage for bot state.
    - `session/`: Stores WhatsApp authentication session data.
    - `settings.js`: Bot configuration, including `ownerNumber` and `botName`.
- **Key Features**:
    - **Group Management**: Commands for tagging all members, kicking, promoting, and demoting users.
    - **Games**: Interactive games like tic-tac-toe, trivia, and hangman.
    - **Media Tools**: Functionality for creating stickers, text-to-speech (TTS), and applying image effects.
    - **Utilities**: Provides weather information, translation services, and news updates.
    - **Anti-spam**: Features such as anti-link, anti-call, and anti-bad-word.
    - **Auto-responses**: Configurable automatic replies.
    - **Download Tools**: Supports downloading content from platforms like YouTube, Instagram, and TikTok.
    - **Hierarchical Menu System**: Organized into 6 categories (Administration, Settings, Lock/Unlock, Entertainment, Developer, Service) accessible via `.menu` or `.help`, and `.م1` through `.م6` or `.1` through `.6`.
    - **Arabic Localization**: All commands and responses are fully translated into Arabic.
- **UI/UX Decisions**: The bot primarily interacts via WhatsApp messages. The menu system is designed for clarity and ease of navigation using structured lists and professional formatting with symbols like `◂` and `•`.
- **Deployment**: The bot is designed for continuous operation on a VM, initiated with `node index.js`. It requires a one-time WhatsApp pairing using a pairing code.

## External Dependencies
- **WhatsApp Web API**: `@whiskeysockets/baileys` library.
- **Web Scraping**: `axios`, `cheerio`.
- **Image Processing**: `sharp`, `jimp`.
- **Video/Audio Processing**: `fluent-ffmpeg`.
- **Authentication**: `qrcode-terminal` (for initial pairing code generation).
- **Logging**: `pino`.
- **News API**: For fetching global news.
- **Al Jazeera API**: Custom integration for Arabic news.

## Recent Changes

### November 26, 2025 - New Entertainment Commands
**New Files:**
1. `commands/zodiac-age.js` - Contains zodiac, age estimation, and joke commands

**Modified Files:**
1. `main.js` - Added imports and command handlers for new commands

**New Commands:**
- `برجي` / `برجه` - Determines zodiac sign from birthdate (day/month)
- `عمري` / `عمره` - Fun age estimation with humorous comments based on age ranges
- `نكته` / `نكتة` - Random funny jokes in Arabic

**Technical Notes:**
- Zodiac calculation covers all 12 signs with correct date boundaries
- Age estimation is intentionally playful (random with funny comments per age range)
- Group link integration for age command flow (group -> private -> back to group)

### November 08, 2025 - Phase 2 Complete: Comprehensive Lock/Unlock System
**Modified Files:**
1. `commands/antilink.js` - Updated responses to unified format: `*↢ الرتبة 「 @username 」*\n*↢ تم قفل/فتح الروابط*`
2. `commands/antitag.js` - Updated responses to unified format
3. `commands/mute.js` - Updated responses to unified format for group lock
4. `commands/unmute.js` - Updated responses + added senderId parameter
5. `commands/menu2.js` - Complete update with all lock/unlock and toggle commands

**New Files:**
1. `commands/lock.js` - Comprehensive lock system for all media types:
   - Media: images, videos, GIFs (videoMessage.gifPlayback), stickers, files, audio, voice (audioMessage.ptt=true), contacts
   - Content: pins (contextInfo.pinnedMessage), forwards (contextInfo.isForwarded on all media), edits (protocolMessage.type === 1)
   - Special: media (all media types), all (everything)
2. `lib/lockSystem.js` - JSON storage system for lock settings in `data/locks.json`
3. `commands/toggle.js` - Enable/disable system for 15 features (welcome, replies, ranks, ids, ban, download, link, kickme, demoteme, mention, games, warnings, commands, anonymize, ownerCall)
4. `lib/toggleSystem.js` - JSON storage for toggle settings in `data/toggles.json`
5. `commands/cmdlock.js` - Command locking system for rank-based restrictions (managers+ only)
6. `lib/cmdLockSystem.js` - JSON storage for command locks in `data/cmdlocks.json`
7. `main.js` - Integrated all new commands + automatic lock detection system (handleLockDetection)

**Technical Implementation:**
- GIF detection: `videoMessage.gifPlayback` flag
- Voice detection: `audioMessage.ptt === true` flag
- Forward detection: `contextInfo.isForwarded` checked on all message types
- Pin detection: `contextInfo.pinnedMessage` 
- Edit detection: `protocolMessage.type === 1`
- Automatic message deletion when locks are active
- Unified response format across all commands

**Architect Review:** Pass - All functional requirements met, all advertised features implemented correctly.

### December 03, 2025 - WhatsApp Admin Auto-Owner Detection System
**Core System Changes:**
1. `lib/ranks.js` - Modified `getUserRank` function to accept `isGroupAdmin` parameter, automatically returning "مالك" rank for WhatsApp group admins

**Modified Command Files (30+ files):**
All files now fetch `groupMetadata`, detect WhatsApp admin status, and pass `isWhatsAppAdmin` to `getUserRank`:

*Rank Management Commands:*
- `setowner.js`, `setmanager.js`, `setadmin.js`, `setvip.js`
- `demoteowner.js`, `demotemanager.js`, `demoteadmin.js`, `demotevip.js`, `demote.js`

*Utility Commands:*
- `ban.js`, `unban.js`, `warn.js`, `warnings.js`, `kick.js`
- `restrict.js`, `unrestrict.js`

*Clear/Bulk Commands:*
- `clearadmins.js`, `clearbanned.js`, `clearrestricted.js`, `clearvips.js`
- `clearmanagers.js`, `clearowners.js`, `clearallranks.js`

*Settings Commands:*
- `toggle.js`, `togglesettings.js`, `antilink.js`, `antitag.js`, `cmdlock.js`
- `lock.js`, `mute.js`, `unmute.js`, `replies.js`

**Technical Implementation:**
- Pattern: All commands fetch `groupMetadata`, check `senderParticipant.admin`, pass result to `getUserRank(chatId, senderId, isWhatsAppAdmin)`
- WhatsApp admins automatically receive مالك (owner) privileges
- Legacy `isSenderAdmin` permission gates replaced with `senderLevel` checks using `getRankLevel(senderRank)`
- Rank levels: عضو (0), VIP (1), ادمن (2), مدير (3), مالك (4)

**Owner Promotion Message Format:**
`*↫ ابشـر لاتهـون رفعـته مالـك*\n*↫ الحلـو「 @username 」*`

**Architect Review:** Pass - All commands correctly implement WhatsApp admin detection system