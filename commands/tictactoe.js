const TicTacToe = require('../lib/tictactoe');

// Store games globally
const games = {};
let gameCounter = 0; // عداد لترقيم الألعاب

async function tictactoeCommand(sock, chatId, senderId, text) {
    try {
        // Check if player is already in a game
        if (Object.values(games).find(room => 
            room.id.startsWith('tictactoe') && 
            [room.game.playerX, room.game.playerO].includes(senderId)
        )) {
            await sock.sendMessage(chatId, { 
                text: '*⌯ أنت لا تزال في لعبة.*\n↤︎ اكتب `مستسلم` للاستسلام.' 
            });
            return;
        }

        // Create new room with unique game number
        gameCounter++;
        const gameNumber = gameCounter;
        
        const room = {
            id: 'tictactoe-' + (+new Date),
            gameNumber: gameNumber,
            x: chatId,
            o: '',
            game: new TicTacToe(senderId, 'o'),
            state: 'WAITING'
        };

        games[room.id] = room;

        await sock.sendMessage(chatId, { 
            text: `*⌯ تم بدء لعبة XO رقم ${gameNumber}*\n↤︎ اللي بيلعب يرسل \`انضم ${gameNumber}\``
        });

    } catch (error) {
        console.error('Error in tictactoe command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ خطأ في بدء اللعبة. حاول مرة أخرى.' 
        });
    }
}

async function joinTicTacToeGame(sock, chatId, senderId, gameNumber) {
    try {
        // Check if player is already in a game
        if (Object.values(games).find(room => 
            room.id.startsWith('tictactoe') && 
            [room.game.playerX, room.game.playerO].includes(senderId)
        )) {
            await sock.sendMessage(chatId, { 
                text: '*⌯ أنت لا تزال في لعبة.*\n↤︎ اكتب `مستسلم` للاستسلام.' 
            });
            return;
        }

        // Find the game with the specified number
        const room = Object.values(games).find(room => 
            room.gameNumber === gameNumber && 
            room.state === 'WAITING'
        );

        if (!room) {
            // لا ترسل أي رسالة، فقط تجاهل
            return;
        }

        // Join the room
        room.o = chatId;
        room.game.playerO = senderId;
        room.state = 'PLAYING';

        const arr = room.game.render().map(v => ({
            'X': '❎',
            'O': '⭕',
            '1': '1️⃣',
            '2': '2️⃣',
            '3': '3️⃣',
            '4': '4️⃣',
            '5': '5️⃣',
            '6': '6️⃣',
            '7': '7️⃣',
            '8': '8️⃣',
            '9': '9️⃣',
        }[v]));

        const str = `
*⌯ ابدأ يا @${room.game.currentTurn.split('@')[0]} رح يكون دوره بكتابة رقم من* 「 \`1 - 9\` 」
  ༺═──────────═༻
${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

↤︎ اكتب \`مستسلم\` للاستسلام
`;

        await sock.sendMessage(chatId, { 
            text: str,
            mentions: [room.game.currentTurn, room.game.playerX, room.game.playerO]
        });

    } catch (error) {
        console.error('Error joining game:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ خطأ في الانضمام للعبة.' 
        });
    }
}

async function handleTicTacToeMove(sock, chatId, senderId, text) {
    try {
        const isSurrender = /^(surrender|give up|استسلام|مستسلم)$/i.test(text);
        
        // Find player's game in PLAYING state
        let room = Object.values(games).find(room => 
            room.id.startsWith('tictactoe') && 
            [room.game.playerX, room.game.playerO].includes(senderId) && 
            room.state === 'PLAYING'
        );

        // If surrender command and no PLAYING game found, check WAITING games
        if (!room && isSurrender) {
            room = Object.values(games).find(room => 
                room.id.startsWith('tictactoe') && 
                room.game.playerX === senderId && 
                room.state === 'WAITING'
            );
            
            if (room) {
                // Delete the waiting game
                delete games[room.id];
                await sock.sendMessage(chatId, { 
                    text: '*⌯ لقد تم انهاء اللعبة، يمكنك انشاء لعبة جديدة.*'
                });
                return;
            }
        }

        if (!room) return;
        
        if (!isSurrender && !/^[1-9]$/.test(text)) return;

        // Allow surrender at any time, not just during player's turn
        if (senderId !== room.game.currentTurn && !isSurrender) {
            await sock.sendMessage(chatId, { 
                text: '❌ ليس دورك!' 
            });
            return;
        }

        let ok = isSurrender ? true : room.game.turn(
            senderId === room.game.playerO,
            parseInt(text) - 1
        );

        if (!ok) {
            await sock.sendMessage(chatId, { 
                text: '↤︎هذا المكان محجوز بالفعل.' 
            });
            return;
        }

        let winner = room.game.winner;
        let isTie = room.game.turns === 9;

        const arr = room.game.render().map(v => ({
            'X': '❎',
            'O': '⭕',
            '1': '1️⃣',
            '2': '2️⃣',
            '3': '3️⃣',
            '4': '4️⃣',
            '5': '5️⃣',
            '6': '6️⃣',
            '7': '7️⃣',
            '8': '8️⃣',
            '9': '9️⃣',
        }[v]));

        if (isSurrender) {
            // Set the winner to the opponent of the surrendering player
            winner = senderId === room.game.playerX ? room.game.playerO : room.game.playerX;
            
            // Send a surrender message without deleting the game yet
            await sock.sendMessage(chatId, { 
                text: `↤︎ @${senderId.split('@')[0]} استسلم 🏳️\n↤︎ @${winner.split('@')[0]} فاز باللعبة 🥳`,
                mentions: [senderId, winner]
            });
            
            // Don't return here - let the game deletion happen at the end with other win conditions
        }

        let gameStatus;
        if (winner) {
            gameStatus = `*⌯ @${winner.split('@')[0]} فاز باللعبة 🥳*`;
        } else if (isTie) {
            gameStatus = `🤝 انتهت اللعبة بالتعادل!`;
        } else {
            const currentSymbol = room.game.currentTurn === room.game.playerX ? '❎' : '⭕';
            gameStatus = `*⌯ الدور: @${room.game.currentTurn.split('@')[0]} 「 ${currentSymbol} 」*`;
        }

        const str = `
${gameStatus}

${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

▢ اللاعب ❎: @${room.game.playerX.split('@')[0]}
▢ اللاعب ⭕: @${room.game.playerO.split('@')[0]}

${!winner && !isTie ? '↤︎اكتب `مستسلم` للاستسلام' : ''}
`;

        const mentions = [
            room.game.playerX, 
            room.game.playerO,
            ...(winner ? [winner] : [room.game.currentTurn])
        ];

        await sock.sendMessage(room.x, { 
            text: str,
            mentions: mentions
        });

        if (room.x !== room.o) {
            await sock.sendMessage(room.o, { 
                text: str,
                mentions: mentions
            });
        }

        if (winner || isTie) {
            delete games[room.id];
        }

    } catch (error) {
        console.error('Error in tictactoe move:', error);
    }
}

module.exports = {
    tictactoeCommand,
    handleTicTacToeMove,
    joinTicTacToeGame
};
