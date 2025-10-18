// Tic Tac Toe Game
(function() {
    'use strict';

    const GAME_MODES = {
        PVP: 'pvp',
        VS_AI: 'vsai'
    };

    let gameState = {
        mode: null,
        board: Array(9).fill(null), // 0-8 representing the 3x3 grid
        currentPlayer: 'X', // X always goes first
        gameOver: false,
        winner: null,
        scores: {
            X: 0,
            O: 0,
            draws: 0
        }
    };

    function launchTicTacToe() {
        // Reset scores when launching
        gameState.scores = { X: 0, O: 0, draws: 0 };
        gameState.mode = null;

        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('tictactoeGame').style.display = 'block';
        updateDisplay();
    }

    function exitTicTacToe() {
        document.getElementById('tictactoeGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    }

    // Winning combinations (indices)
    const WINNING_COMBINATIONS = [
        [0, 1, 2], // Top row
        [3, 4, 5], // Middle row
        [6, 7, 8], // Bottom row
        [0, 3, 6], // Left column
        [1, 4, 7], // Middle column
        [2, 5, 8], // Right column
        [0, 4, 8], // Diagonal top-left to bottom-right
        [2, 4, 6]  // Diagonal top-right to bottom-left
    ];

    function initGame(mode) {
        gameState.mode = mode;
        gameState.board = Array(9).fill(null);
        gameState.currentPlayer = 'X';
        gameState.gameOver = false;
        gameState.winner = null;

        updateDisplay();

        // If AI mode and O's turn, make AI move
        if (mode === GAME_MODES.VS_AI && gameState.currentPlayer === 'O') {
            setTimeout(makeAIMove, 500);
        }
    }

    function makeMove(index) {
        // Can't move if game is over or cell is occupied
        if (gameState.gameOver || gameState.board[index] !== null) {
            return;
        }

        // Make the move
        gameState.board[index] = gameState.currentPlayer;

        // Check for winner or draw
        const winner = checkWinner();
        if (winner) {
            gameState.gameOver = true;
            gameState.winner = winner;
            gameState.scores[winner]++;
        } else if (gameState.board.every(cell => cell !== null)) {
            // Board is full, it's a draw
            gameState.gameOver = true;
            gameState.winner = 'draw';
            gameState.scores.draws++;
        } else {
            // Switch players
            gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';

            // If AI mode and now O's turn, make AI move
            if (gameState.mode === GAME_MODES.VS_AI && gameState.currentPlayer === 'O') {
                setTimeout(makeAIMove, 500);
            }
        }

        updateDisplay();
    }

    function checkWinner() {
        for (const combo of WINNING_COMBINATIONS) {
            const [a, b, c] = combo;
            if (gameState.board[a] &&
                gameState.board[a] === gameState.board[b] &&
                gameState.board[a] === gameState.board[c]) {
                return gameState.board[a];
            }
        }
        return null;
    }

    function makeAIMove() {
        if (gameState.gameOver) return;

        // Simple AI strategy:
        // 1. Try to win
        // 2. Block opponent from winning
        // 3. Take center if available
        // 4. Take a corner
        // 5. Take any available space

        let move = findWinningMove('O') ||
                   findWinningMove('X') ||
                   (gameState.board[4] === null ? 4 : null) ||
                   findCornerMove() ||
                   findAnyMove();

        if (move !== null) {
            makeMove(move);
        }
    }

    function findWinningMove(player) {
        for (const combo of WINNING_COMBINATIONS) {
            const [a, b, c] = combo;
            const cells = [gameState.board[a], gameState.board[b], gameState.board[c]];

            // Count how many cells this player has in this combination
            const playerCount = cells.filter(cell => cell === player).length;
            const emptyCount = cells.filter(cell => cell === null).length;

            // If player has 2 in a row and one empty, take the empty one
            if (playerCount === 2 && emptyCount === 1) {
                if (gameState.board[a] === null) return a;
                if (gameState.board[b] === null) return b;
                if (gameState.board[c] === null) return c;
            }
        }
        return null;
    }

    function findCornerMove() {
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => gameState.board[i] === null);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        return null;
    }

    function findAnyMove() {
        for (let i = 0; i < 9; i++) {
            if (gameState.board[i] === null) {
                return i;
            }
        }
        return null;
    }

    function updateDisplay() {
        const contentDiv = document.getElementById('tictactoeContent');

        if (!gameState.mode) {
            // Show mode selection
            contentDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h2>Tic Tac Toe</h2>
                    <p style="margin: 1.5rem 0;">Choose game mode:</p>
                    <button onclick="window.tictactoe.start('pvp')"
                            style="display: block; margin: 1rem auto; padding: 1rem 2rem; font-size: 1.1rem; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; min-width: 200px;">
                        👥 Pass & Play
                    </button>
                    <button onclick="window.tictactoe.start('vsai')"
                            style="display: block; margin: 1rem auto; padding: 1rem 2rem; font-size: 1.1rem; background: #9b59b6; color: white; border: none; border-radius: 8px; cursor: pointer; min-width: 200px;">
                        🤖 vs Computer
                    </button>
                </div>
            `;
            return;
        }

        // Game board
        let html = `
            <div style="padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="window.tictactoe.backToMenu()"
                            style="padding: 0.5rem 1rem; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        ← Back
                    </button>
                    <div style="text-align: center;">
                        <strong>${gameState.mode === GAME_MODES.PVP ? 'Pass & Play' : 'vs Computer'}</strong>
                    </div>
                    <button onclick="window.tictactoe.newGame()"
                            style="padding: 0.5rem 1rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        New Game
                    </button>
                </div>

                <!-- Score Board -->
                <div style="display: flex; justify-content: space-around; margin-bottom: 1.5rem; padding: 1rem; background: #f0f0f0; border-radius: 8px;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #e74c3c;">X</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${gameState.scores.X}</div>
                        <div style="font-size: 0.8rem; color: #7f8c8d;">${gameState.mode === GAME_MODES.VS_AI ? 'You' : 'Player 1'}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1rem; color: #95a5a6;">Draws</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${gameState.scores.draws}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #3498db;">O</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${gameState.scores.O}</div>
                        <div style="font-size: 0.8rem; color: #7f8c8d;">${gameState.mode === GAME_MODES.VS_AI ? 'AI' : 'Player 2'}</div>
                    </div>
                </div>

                <!-- Current Turn or Game Over Message -->
                <div style="text-align: center; margin-bottom: 1rem; min-height: 2.5rem;">
        `;

        if (gameState.gameOver) {
            if (gameState.winner === 'draw') {
                html += `<div style="font-size: 1.3rem; font-weight: bold; color: #95a5a6;">It's a Draw!</div>`;
            } else {
                const winnerName = gameState.mode === GAME_MODES.VS_AI
                    ? (gameState.winner === 'X' ? 'You Win!' : 'AI Wins!')
                    : `Player ${gameState.winner} Wins!`;
                const winnerColor = gameState.winner === 'X' ? '#e74c3c' : '#3498db';
                html += `<div style="font-size: 1.3rem; font-weight: bold; color: ${winnerColor};">${winnerName}</div>`;
            }
        } else {
            const currentColor = gameState.currentPlayer === 'X' ? '#e74c3c' : '#3498db';
            const currentName = gameState.mode === GAME_MODES.VS_AI && gameState.currentPlayer === 'O'
                ? "AI's Turn"
                : `${gameState.currentPlayer}'s Turn`;
            html += `<div style="font-size: 1.2rem; font-weight: bold; color: ${currentColor};">${currentName}</div>`;
        }

        html += `</div>`;

        // Game Grid
        html += `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 400px; margin: 0 auto; aspect-ratio: 1;">
        `;

        for (let i = 0; i < 9; i++) {
            const cell = gameState.board[i];
            const cellColor = cell === 'X' ? '#e74c3c' : cell === 'O' ? '#3498db' : '#ecf0f1';
            const textColor = cell ? 'white' : '#bdc3c7';
            const cursor = !gameState.gameOver && !cell ? 'pointer' : 'default';
            const disabled = gameState.gameOver || cell !== null;

            html += `
                <button onclick="window.tictactoe.move(${i})"
                        ${disabled ? 'disabled' : ''}
                        style="
                            aspect-ratio: 1;
                            font-size: 3rem;
                            font-weight: bold;
                            background: ${cellColor};
                            color: ${textColor};
                            border: 3px solid #34495e;
                            border-radius: 10px;
                            cursor: ${cursor};
                            transition: all 0.2s;
                            ${!disabled ? 'box-shadow: 0 4px 6px rgba(0,0,0,0.1);' : ''}
                        "
                        ${!disabled ? `onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"` : ''}>
                    ${cell || ''}
                </button>
            `;
        }

        html += `
                </div>
            </div>
        `;

        contentDiv.innerHTML = html;
    }

    function newGame() {
        initGame(gameState.mode);
    }

    function backToMenu() {
        exitTicTacToe();
    }

    // Expose functions to window
    window.launchTicTacToe = launchTicTacToe;
    window.exitTicTacToe = exitTicTacToe;
    window.tictactoe = {
        start: initGame,
        move: makeMove,
        newGame: newGame,
        backToMenu: backToMenu
    };
})();
