# AGENTS.md

## Stack & Entrypoints
- WhatsApp bot on Baileys `@whiskeysockets/baileys@^7.0.0-rc.9`. Requires **Node >=18**.
- `index.js` — socket lifecycle, auth, reconnection, event wiring. `main.js` — `handleMessages`/`handleGroupParticipantUpdate` dispatcher (all commands route through here).
- `settings.js` — `botName`, `ownerNumber` (`967715760166`), `packname`/`author` for stickers. `config.js` loads `.env` and defines `global.APIs`/`APIKeys`.
- `commands/` (~100 files) — one file per command, required by `main.js`. `lib/` — helpers (`lightweight_store.js`, `myfunc.js`, `isAdmin.js`, `ranks.js`, `antilink.js`, `isBotAdmin.js`, etc). `data/` — persisted JSON.

## Commands (package.json)
- `npm start` — normal start (`node index.js`).
- `npm run start:optimized` — production (512MB heap, GC tuning). Used by PM2/hosting panels.
- `npm run start:clean` — `cleanup && start:optimized`; `npm run start:fresh` — `reset-session && start`.
- `npm run cleanup` / `reset-session` — `cleanup.js`/`reset-session.js` (may be missing; check before use). Panel install: `npm run install:panel` (`--legacy-peer-deps` for `sharp`/`jimp` conflicts).
- `node index.js --pairing-code` — pairing-code auth (else QR). Uses `settings.ownerNumber` in non-TTY.
- No test/lint/typecheck scripts (`npm test` just exits 1).

## Session & State
- Auth in `./session/` (`useMultiFileAuthState`). Deleting it or exit 401 wipes session and restarts.
- `lib/lightweight_store.js` at `baileys_store.json` (`store.readFromFile()` on boot, flush every `settings.storeWriteInterval` = 10s). Don't bypass it with `makeInMemoryStore`.
- `data/` JSON is the source of truth for toggles/ranks/bans/warnings/subscriptions. Many files are read with `fs.readFileSync` per message — keep writes atomic (`JSON.stringify(..., null, 2)`).
- `index.js:71-78` — RAM guard: restarts via `process.exit(1)` if RSS >400MB. PM2 (`ecosystem.config.js`, app `leen-bot`, `max_memory_restart: 500M`) auto-restarts.

## Message Pipeline (`main.js:handleMessages`)
- Duplication guard in `index.js:133-158` (`processedMessageIds` Set cleared every 60s). `main.js` also ignores `type !== 'notify'` and ephemeral wrappers.
- Arabic commands: `cleanMessage` (lowercased, trimmed) + `normalizedCleanMessage` (spaces→`_`). Most commands match both forms (e.g. `منع الروابط` and `منع_الروابط`).
- Pre-command gates in order: public/private check (`data/messageCount.json:isPublic`) → subscription gate (`commands/subscription.js:checkUserSubscription`, invite links exempt) → `isBanned` (`lib/isBanned.js`, `data/banned.json`) → `isRestricted` (`lib/restrictions.js`) — restricted users' messages are deleted.
- **Bot admin gate** (`lib/isBotAdmin.js`): before the command `switch`, a regex matches known command prefixes; if matched and bot is not a WhatsApp admin in that group, replies `*↢عذراً لا استطيع اداره المجموعه وانا لست مشرفاً، قم بتعييني كمشرف أولاً.*` and returns. Runs fresh every command (no cache), handles Baileys `@lid` vs `@s.whatsapp.net` JIDs.
- `lib/toggleSystem.js` + `lib/groupSettings.js:isFeatureEnabled` gate menus/games/downloads/mentions per group. Respect before adding new commands.

## Adding/Editing Commands
- Create `commands/<name>.js` exporting `async (sock, chatId, message, ...)` and wire it in `main.js` imports + `switch (true)` block. Check existing pattern for admin/sudo guards.
- Admin check: `await isAdmin(sock, chatId, senderId, message)` (`lib/isAdmin.js`). Owner/sudo: `isSudo` from `lib/index.js` / `settings.ownerNumber` + `data/owner.json`.
- Ranks: `lib/ranks.js` (`getUserRank`/`setUserRank`, levels: عضو < ادمن < مدير < مالك < مالك أساسي).
- **Promote/Demote behavior**: `رفع مالك` (`commands/setowner.js:56-65`) also calls `groupParticipantsUpdate(..., "promote")` if user not already admin. `تنزيل مالك` (`commands/demoteowner.js:69-90`) calls `groupParticipantsUpdate(..., "demote")` and removes bot rank; primary owner (`مالك أساسي`) protected from demotion. `تنزيل مالك اساسي` blocked with message.
- **JID handling**: `promote.js:48,72` and `demote.js:50,106` now guard `jid.split('@')` with `typeof jid === 'string'` checks — Baileys may pass objects with `.id`.

## Gotchas
- `ecosystem.config.js:5` has hardcoded `cwd: /home/runner/workspace/leen` — fix `cwd` when deploying elsewhere.
- `package.json:16` `docker:build` is malformed (`docker build -t docker run -e SESSION_ID=...`).
- `pmblocker` (`commands/pmblocker.js`) and `anticall` (`commands/anticall.js`) block DMs/calls when enabled — test DMs will be blocked.
- No `.gitignore`; `session/`, `baileys_store.json`, `data/*.json` and `node_modules/` should not be committed.
- `lib/isBotAdmin.js` runs fresh `groupMetadata` fetch per command — no cache. If bot loses admin mid-session, next command will block.
- New commands `تنزيل مالك` and `تنزيل مالك اساسي` added in `main.js` switch — both route to `demoteowner.js`.
