// Othello Game (Reversi)
(function() {
    'use strict';

    const BOARD_SIZE = 8;
    const EMPTY = 0;
    const BLACK = 1;
    const WHITE = 2;

    let board = [];
    let currentPlayer = BLACK;
    let gameMode = null; // 'pvp' or 'ai'
    let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
    let gameActive = false;
    let validMoves = [];

    const DIRECTIONS = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    function initBoard() {
        board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
        // Initial setup - 4 discs in center
        const mid = BOARD_SIZE / 2;
        board[mid - 1][mid - 1] = WHITE;
        board[mid - 1][mid] = BLACK;
        board[mid][mid - 1] = BLACK;
        board[mid][mid] = WHITE;
        currentPlayer = BLACK;
        gameActive = true;
        validMoves = getValidMoves(BLACK);
    }

    function getValidMoves(player) {
        const moves = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (isValidMove(row, col, player)) {
                    moves.push([row, col]);
                }
            }
        }
        return moves;
    }

    function isValidMove(row, col, player) {
        if (board[row][col] !== EMPTY) return false;

        const opponent = player === BLACK ? WHITE : BLACK;
        let hasFlip = false;

        for (const [dr, dc] of DIRECTIONS) {
            let r = row + dr;
            let c = col + dc;
            let foundOpponent = false;

            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] === EMPTY) break;
                if (board[r][c] === opponent) {
                    foundOpponent = true;
                } else if (board[r][c] === player && foundOpponent) {
                    hasFlip = true;
                    break;
                } else {
                    break;
                }
                r += dr;
                c += dc;
            }
        }

        return hasFlip;
    }

    function flipDiscs(row, col, player) {
        const opponent = player === BLACK ? WHITE : BLACK;
        const toFlip = [];

        for (const [dr, dc] of DIRECTIONS) {
            let r = row + dr;
            let c = col + dc;
            const tempFlip = [];

            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] === EMPTY) break;
                if (board[r][c] === opponent) {
                    tempFlip.push([r, c]);
                } else if (board[r][c] === player) {
                    toFlip.push(...tempFlip);
                    break;
                } else {
                    break;
                }
                r += dr;
                c += dc;
            }
        }

        return toFlip;
    }

    function makeMove(row, col, player) {
        if (!isValidMove(row, col, player)) return false;

        board[row][col] = player;
        const flipped = flipDiscs(row, col, player);

        for (const [r, c] of flipped) {
            board[r][c] = player;
        }

        return true;
    }

    function getScore() {
        let black = 0, white = 0;
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === BLACK) black++;
                else if (board[row][col] === WHITE) white++;
            }
        }
        return { black, white };
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
        validMoves = getValidMoves(currentPlayer);

        // Check if current player has no valid moves
        if (validMoves.length === 0) {
            currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
            validMoves = getValidMoves(currentPlayer);

            // If both players have no valid moves, game is over
            if (validMoves.length === 0) {
                endGame();
                return false;
            } else {
                updateStatus(`${currentPlayer === BLACK ? 'Black' : 'White'} has no valid moves. Turn skipped.`);
            }
        }

        return true;
    }

    function endGame() {
        gameActive = false;
        const { black, white } = getScore();
        let message = '';

        if (black > white) {
            message = `Game Over! Black wins ${black}-${white}!`;
        } else if (white > black) {
            message = `Game Over! White wins ${white}-${black}!`;
        } else {
            message = `Game Over! It's a tie ${black}-${black}!`;
        }

        updateStatus(message);
    }

    // AI Logic
    function getAIMove() {
        if (validMoves.length === 0) return null;

        if (aiDifficulty === 'easy') {
            // Random move
            return validMoves[Math.floor(Math.random() * validMoves.length)];
        } else if (aiDifficulty === 'medium') {
            // Prefer corners, then edges, then middle
            return getBestMove(1);
        } else {
            // Hard: Look ahead 2 moves
            return getBestMove(2);
        }
    }

    function getBestMove(depth) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const [row, col] of validMoves) {
            const score = evaluateMove(row, col, currentPlayer, depth);
            if (score > bestScore) {
                bestScore = score;
                bestMove = [row, col];
            }
        }

        return bestMove;
    }

    function evaluateMove(row, col, player, depth) {
        // Copy board
        const savedBoard = board.map(r => [...r]);

        // Make move
        board[row][col] = player;
        const flipped = flipDiscs(row, col, player);
        for (const [r, c] of flipped) {
            board[r][c] = player;
        }

        let score = 0;

        // Position weights (corners are most valuable)
        const weights = [
            [100, -20, 10, 5, 5, 10, -20, 100],
            [-20, -50, -5, -5, -5, -5, -50, -20],
            [10, -5, 1, 1, 1, 1, -5, 10],
            [5, -5, 1, 0, 0, 1, -5, 5],
            [5, -5, 1, 0, 0, 1, -5, 5],
            [10, -5, 1, 1, 1, 1, -5, 10],
            [-20, -50, -5, -5, -5, -5, -50, -20],
            [100, -20, 10, 5, 5, 10, -20, 100]
        ];

        score += weights[row][col];
        score += flipped.length * 5;

        // If depth > 0, simulate opponent's best response
        if (depth > 1) {
            const opponent = player === BLACK ? WHITE : BLACK;
            const opponentMoves = getValidMoves(opponent);
            if (opponentMoves.length > 0) {
                let worstOpponentScore = Infinity;
                for (const [r, c] of opponentMoves.slice(0, 5)) { // Limit for performance
                    const opScore = evaluateMove(r, c, opponent, depth - 1);
                    worstOpponentScore = Math.min(worstOpponentScore, opScore);
                }
                score -= worstOpponentScore;
            }
        }

        // Restore board
        board = savedBoard;

        return score;
    }

    async function makeAIMove() {
        if (!gameActive || currentPlayer !== WHITE || gameMode !== 'ai') return;

        updateStatus('AI is thinking...');

        // Add slight delay for realism
        await new Promise(resolve => setTimeout(resolve, 500));

        const move = getAIMove();
        if (move) {
            const [row, col] = move;
            if (makeMove(row, col, WHITE)) {
                renderBoard();
                updateScore();

                if (switchPlayer()) {
                    renderBoard();
                    updateScore();
                }
            }
        }
    }

    function renderBoard() {
        const container = document.getElementById('othelloBoard');
        if (!container) return;

        container.innerHTML = '';
        container.style.cssText = `
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 2px;
            background: #2c3e50;
            padding: 2px;
            border-radius: 10px;
            max-width: 500px;
            margin: 0 auto;
            aspect-ratio: 1;
        `;

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.style.cssText = `
                    background: #27ae60;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s;
                    aspect-ratio: 1;
                `;

                const isValid = validMoves.some(([r, c]) => r === row && c === col);

                if (board[row][col] !== EMPTY) {
                    const disc = document.createElement('div');
                    disc.style.cssText = `
                        width: 80%;
                        height: 80%;
                        border-radius: 50%;
                        background: ${board[row][col] === BLACK ? '#2c3e50' : '#ecf0f1'};
                        border: 2px solid ${board[row][col] === BLACK ? '#1a252f' : '#bdc3c7'};
                        animation: placeDisc 0.3s ease-out;
                    `;
                    cell.appendChild(disc);
                } else if (isValid && gameActive && currentPlayer === BLACK) {
                    // Show hint for valid moves
                    cell.style.background = '#2ecc71';
                    const hint = document.createElement('div');
                    hint.style.cssText = `
                        width: 30%;
                        height: 30%;
                        border-radius: 50%;
                        background: rgba(44, 62, 80, 0.3);
                        border: 2px dashed #2c3e50;
                    `;
                    cell.appendChild(hint);
                }

                if (isValid && gameActive && currentPlayer === BLACK) {
                    cell.onclick = () => handleCellClick(row, col);
                    cell.onmouseover = () => {
                        if (gameActive && currentPlayer === BLACK) {
                            cell.style.background = '#2ecc71';
                        }
                    };
                    cell.onmouseout = () => {
                        cell.style.background = '#27ae60';
                    };
                }

                container.appendChild(cell);
            }
        }
    }

    async function handleCellClick(row, col) {
        if (!gameActive || currentPlayer !== BLACK || !isValidMove(row, col, BLACK)) return;

        if (makeMove(row, col, BLACK)) {
            renderBoard();
            updateScore();

            if (switchPlayer()) {
                renderBoard();
                updateScore();

                // If AI mode and it's AI's turn
                if (gameMode === 'ai' && currentPlayer === WHITE && gameActive) {
                    setTimeout(() => makeAIMove(), 300);
                }
            }
        }
    }

    function updateScore() {
        const { black, white } = getScore();
        const scoreEl = document.getElementById('othelloScore');
        if (scoreEl) {
            scoreEl.innerHTML = `
                <div style="display: flex; justify-content: center; gap: 3rem; margin: 1rem 0;">
                    <div style="text-align: center; ${currentPlayer === BLACK && gameActive ? 'opacity: 1; font-weight: bold;' : 'opacity: 0.6;'}">
                        <div style="font-size: 2rem;">⚫</div>
                        <div style="font-size: 1.5rem; margin-top: 0.5rem;">${black}</div>
                        <div style="font-size: 0.9rem; color: #666;">Black${gameMode === 'pvp' ? ' (You)' : ' (You)'}</div>
                    </div>
                    <div style="text-align: center; ${currentPlayer === WHITE && gameActive ? 'opacity: 1; font-weight: bold;' : 'opacity: 0.6;'}">
                        <div style="font-size: 2rem;">⚪</div>
                        <div style="font-size: 1.5rem; margin-top: 0.5rem;">${white}</div>
                        <div style="font-size: 0.9rem; color: #666;">White${gameMode === 'ai' ? ' (AI)' : ' (P2)'}</div>
                    </div>
                </div>
            `;
        }
    }

    function updateStatus(message) {
        const statusEl = document.getElementById('othelloStatus');
        if (statusEl) {
            if (message) {
                statusEl.textContent = message;
            } else {
                const playerName = currentPlayer === BLACK ? 'Black' : 'White';
                const suffix = gameMode === 'ai' && currentPlayer === WHITE ? ' (AI)' : '';
                statusEl.textContent = gameActive ? `${playerName}${suffix}'s turn` : 'Game Over';
            }
        }
    }

    function startGame(mode, difficulty = 'medium') {
        gameMode = mode;
        aiDifficulty = difficulty;
        initBoard();

        const content = document.getElementById('othelloContent');
        content.innerHTML = `
            <style>
                @keyframes placeDisc {
                    from {
                        transform: scale(0);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            </style>
            <div style="text-align: center; margin-bottom: 2rem;">
                <h3 id="othelloStatus" style="font-size: 1.5rem; color: #333; margin-bottom: 1rem;">Black's turn</h3>
                <div id="othelloScore"></div>
            </div>

            <div id="othelloBoard"></div>

            <div style="text-align: center; margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button onclick="window.resetOthello()" style="background: #3498db; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                    New Game
                </button>
                <button onclick="window.exitOthello()" style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                    Change Mode
                </button>
            </div>

            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem;">
                <h4 style="color: #333; margin-bottom: 1rem;">How to Play:</h4>
                <ul style="color: #666; line-height: 1.8; padding-left: 1.5rem;">
                    <li>Place discs to flank and flip opponent's discs</li>
                    <li>Valid moves are highlighted in lighter green</li>
                    <li>You must flip at least one opponent disc per move</li>
                    <li>If no valid moves, your turn is skipped</li>
                    <li>Game ends when board is full or both players have no moves</li>
                    <li>Player with most discs wins!</li>
                </ul>
            </div>
        `;

        renderBoard();
        updateScore();
        updateStatus();
    }

    function showModeSelection() {
        const content = document.getElementById('othelloContent');
        content.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #333; margin-bottom: 2rem; font-size: 1.5rem;">Choose Game Mode</h3>

                <div style="display: grid; gap: 1.5rem; max-width: 600px; margin: 0 auto;">
                    <div onclick="window.startOthelloPvP()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.5rem; margin-bottom: 0.5rem;">👥 Pass & Play</h4>
                        <p style="opacity: 0.9;">Play against a friend on the same device</p>
                    </div>

                    <div style="background: white; padding: 2rem; border-radius: 15px; border: 2px solid #e9ecef;">
                        <h4 style="color: #333; font-size: 1.5rem; margin-bottom: 1rem;">🤖 Play vs AI</h4>
                        <p style="color: #666; margin-bottom: 1.5rem;">Choose difficulty level:</p>
                        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                            <button onclick="window.startOthelloAI('easy')" style="background: #27ae60; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                Easy
                            </button>
                            <button onclick="window.startOthelloAI('medium')" style="background: #f39c12; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                Medium
                            </button>
                            <button onclick="window.startOthelloAI('hard')" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                Hard
                            </button>
                        </div>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem; text-align: left;">
                    <h4 style="color: #333; margin-bottom: 1rem;">About Othello (Reversi):</h4>
                    <p style="color: #666; line-height: 1.6;">
                        Othello is a classic strategy board game for two players. Players take turns placing discs on an 8×8 board.
                        Each move must flank one or more of the opponent's discs between the newly placed disc and another disc of the current player's color.
                        All flanked discs are then flipped to the current player's color. The game ends when neither player can make a valid move,
                        and the player with the most discs on the board wins.
                    </p>
                </div>
            </div>
        `;
    }

    // Expose functions to global scope
    window.launchOthello = function() {
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('othelloGame').style.display = 'block';
        showModeSelection();
    };

    window.startOthelloPvP = function() {
        startGame('pvp');
    };

    window.startOthelloAI = function(difficulty) {
        startGame('ai', difficulty);
    };

    window.resetOthello = function() {
        startGame(gameMode, aiDifficulty);
    };

    window.exitOthello = function() {
        showModeSelection();
    };

    window.exitOthelloToMenu = function() {
        document.getElementById('othelloGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

})();
