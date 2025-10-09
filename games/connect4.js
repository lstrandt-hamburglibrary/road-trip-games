// Connect 4 Game
(function() {
    'use strict';

    // Connect 4 Game State
    let connect4State = {
        board: Array(6).fill(null).map(() => Array(7).fill(null)),
        currentPlayer: 1,
        player1Name: '',
        player2Name: '',
        isAI: false,
        gameOver: false
    };

    function launchConnectFour() {
        // Reset game state
        connect4State = {
            board: Array(6).fill(null).map(() => Array(7).fill(null)),
            currentPlayer: 1,
            player1Name: '',
            player2Name: '',
            isAI: false,
            gameOver: false
        };

        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('connect4Game').style.display = 'block';
        showConnect4Setup();
    }

    function exitConnect4() {
        document.getElementById('connect4Game').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    }

    function showConnect4Setup() {
        const content = document.getElementById('connect4Content');
        content.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; color: white;">
                <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">🔴 Welcome to Connect 4!</h2>
                <p style="font-size: 1.2rem; margin-bottom: 2rem;">Drop your discs and connect four in a row!</p>
                <div style="background: rgba(255,255,255,0.2); padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;">How to Play:</h3>
                    <p style="text-align: left; max-width: 500px; margin: 0 auto; line-height: 1.6;">
                        1. Players take turns dropping colored discs<br>
                        2. Discs fall to the lowest available position<br>
                        3. First to get 4 in a row wins (horizontal, vertical, or diagonal)!
                    </p>
                </div>
                <h3 style="margin-bottom: 1rem;">Choose Game Mode:</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; max-width: 600px; margin: 0 auto;">
                    <button onclick="selectConnect4PassAndPlay()" style="background: white; color: #f5576c; border: none; padding: 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        👥 Pass & Play<br>
                        <span style="font-size: 0.9rem; font-weight: normal;">2 Players</span>
                    </button>
                    <button onclick="selectConnect4VsAI()" style="background: rgba(255,255,255,0.3); color: white; border: 2px solid white; padding: 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        🤖 vs Computer<br>
                        <span style="font-size: 0.9rem; font-weight: normal;">Single Player</span>
                    </button>
                </div>
            </div>
        `;
    }

    function selectConnect4PassAndPlay() {
        connect4State.isAI = false;
        showConnect4PlayerNames();
    }

    function selectConnect4VsAI() {
        connect4State.isAI = true;
        showConnect4PlayerNames();
    }

    function showConnect4PlayerNames() {
        const content = document.getElementById('connect4Content');
        content.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; color: white;">
                <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">🔴 Player Names</h2>
                <div style="background: rgba(255,255,255,0.2); padding: 2rem; border-radius: 10px; max-width: 400px; margin: 0 auto;">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 1.1rem;">Player 1 Name (🔴 Red):</label>
                        <input type="text" id="connect4Player1Name" placeholder="Enter name" value="${connect4State.player1Name || ''}"
                               style="width: 100%; padding: 0.75rem; border: none; border-radius: 8px; font-size: 1rem;">
                    </div>
                    ${!connect4State.isAI ? `
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 1.1rem;">Player 2 Name (🟡 Yellow):</label>
                        <input type="text" id="connect4Player2Name" placeholder="Enter name" value="${connect4State.player2Name || ''}"
                               style="width: 100%; padding: 0.75rem; border: none; border-radius: 8px; font-size: 1rem;">
                    </div>
                    ` : ''}
                    <button onclick="startConnect4WithNames()" style="background: white; color: #f5576c; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold; width: 100%;">
                        Start Game
                    </button>
                </div>
            </div>
        `;
    }

    function startConnect4WithNames() {
        const player1Input = document.getElementById('connect4Player1Name').value.trim();
        const player2Input = connect4State.isAI ? 'Computer' : document.getElementById('connect4Player2Name').value.trim();

        connect4State.player1Name = player1Input || 'Player 1';
        connect4State.player2Name = player2Input || 'Player 2';

        showConnect4Board();
    }

    function showConnect4Board() {
        const content = document.getElementById('connect4Content');
        const currentPlayerName = connect4State.currentPlayer === 1 ? connect4State.player1Name : connect4State.player2Name;
        const currentColor = connect4State.currentPlayer === 1 ? '🔴' : '🟡';

        content.innerHTML = `
            <div style="text-align: center;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 1.5rem; border-radius: 15px; margin-bottom: 2rem;">
                    <h2 style="margin-bottom: 0.5rem;">${currentColor} ${currentPlayerName}'s Turn</h2>
                    <p>Click a column to drop your disc!</p>
                </div>

                <div style="background: #0066cc; padding: 8px; border-radius: 15px; box-shadow: 0 8px 16px rgba(0,0,0,0.3); max-width: min(400px, 90vw); margin: 0 auto; box-sizing: border-box;">
                    ${renderConnect4Board()}
                </div>
            </div>
        `;
    }

    function renderConnect4Board() {
        let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.3rem; width: 100%;">`;

        // Render board from top to bottom (row 0 is top)
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = connect4State.board[row][col];
                let content = '';
                let bg = 'white';

                if (cell === 1) {
                    content = '🔴';
                    bg = '#ffcccc';
                } else if (cell === 2) {
                    content = '🟡';
                    bg = '#ffffcc';
                }

                const clickable = !connect4State.gameOver && cell === null && isColumnAvailable(col);

                html += `
                    <div onclick="${clickable ? `dropDisc(${col})` : ''}"
                         style="width: 100%; aspect-ratio: 1/1; background: ${bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: clamp(1rem, 3vw, 1.5rem); cursor: ${clickable ? 'pointer' : 'default'}; transition: all 0.2s; border: 2px solid #004999; box-sizing: border-box;"
                         ${clickable ? `onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'"` : ''}>
                        ${content}
                    </div>
                `;
            }
        }

        html += '</div>';
        return html;
    }

    function isColumnAvailable(col) {
        return connect4State.board[0][col] === null;
    }

    function dropDisc(col) {
        if (connect4State.gameOver) return;

        // Find the lowest available row in this column
        let row = -1;
        for (let r = 5; r >= 0; r--) {
            if (connect4State.board[r][col] === null) {
                row = r;
                break;
            }
        }

        if (row === -1) return; // Column is full

        // Place the disc
        connect4State.board[row][col] = connect4State.currentPlayer;

        // Check for win
        if (checkConnect4Win(row, col)) {
            connect4State.gameOver = true;
            showConnect4Winner();
            return;
        }

        // Check for draw
        if (isBoardFull()) {
            connect4State.gameOver = true;
            showConnect4Draw();
            return;
        }

        // Switch player
        connect4State.currentPlayer = connect4State.currentPlayer === 1 ? 2 : 1;

        // If AI mode and now AI's turn
        if (connect4State.isAI && connect4State.currentPlayer === 2) {
            setTimeout(() => makeAIMove(), 800);
        } else {
            showConnect4Board();
        }
    }

    function checkConnect4Win(row, col) {
        const player = connect4State.board[row][col];

        // Check horizontal
        let count = 1;
        for (let c = col - 1; c >= 0 && connect4State.board[row][c] === player; c--) count++;
        for (let c = col + 1; c < 7 && connect4State.board[row][c] === player; c++) count++;
        if (count >= 4) return true;

        // Check vertical
        count = 1;
        for (let r = row - 1; r >= 0 && connect4State.board[r][col] === player; r--) count++;
        for (let r = row + 1; r < 6 && connect4State.board[r][col] === player; r++) count++;
        if (count >= 4) return true;

        // Check diagonal (top-left to bottom-right)
        count = 1;
        for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && connect4State.board[r][c] === player; r--, c--) count++;
        for (let r = row + 1, c = col + 1; r < 6 && c < 7 && connect4State.board[r][c] === player; r++, c++) count++;
        if (count >= 4) return true;

        // Check diagonal (top-right to bottom-left)
        count = 1;
        for (let r = row - 1, c = col + 1; r >= 0 && c < 7 && connect4State.board[r][c] === player; r--, c++) count++;
        for (let r = row + 1, c = col - 1; r < 6 && c >= 0 && connect4State.board[r][c] === player; r++, c--) count++;
        if (count >= 4) return true;

        return false;
    }

    function isBoardFull() {
        return connect4State.board[0].every(cell => cell !== null);
    }

    function makeAIMove() {
        // Simple AI: try to win, block opponent, or pick random
        const aiPlayer = 2;
        const humanPlayer = 1;

        // Try to win
        for (let col = 0; col < 7; col++) {
            if (isColumnAvailable(col)) {
                const row = getLowestRow(col);
                connect4State.board[row][col] = aiPlayer;
                if (checkConnect4Win(row, col)) {
                    connect4State.gameOver = true;
                    showConnect4Winner();
                    return;
                }
                connect4State.board[row][col] = null; // Undo
            }
        }

        // Try to block
        for (let col = 0; col < 7; col++) {
            if (isColumnAvailable(col)) {
                const row = getLowestRow(col);
                connect4State.board[row][col] = humanPlayer;
                if (checkConnect4Win(row, col)) {
                    connect4State.board[row][col] = aiPlayer;
                    if (isBoardFull()) {
                        connect4State.gameOver = true;
                        showConnect4Draw();
                    } else {
                        connect4State.currentPlayer = 1;
                        showConnect4Board();
                    }
                    return;
                }
                connect4State.board[row][col] = null; // Undo
            }
        }

        // Pick random available column
        const availableCols = [];
        for (let col = 0; col < 7; col++) {
            if (isColumnAvailable(col)) availableCols.push(col);
        }

        if (availableCols.length > 0) {
            const col = availableCols[Math.floor(Math.random() * availableCols.length)];
            dropDisc(col);
        }
    }

    function getLowestRow(col) {
        for (let r = 5; r >= 0; r--) {
            if (connect4State.board[r][col] === null) return r;
        }
        return -1;
    }

    function showConnect4Winner() {
        const winner = connect4State.currentPlayer;
        const winnerName = winner === 1 ? connect4State.player1Name : connect4State.player2Name;
        const winnerColor = winner === 1 ? '🔴' : '🟡';

        const content = document.getElementById('connect4Content');
        content.innerHTML = `
            <div style="text-align: center; padding: 4rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; color: white;">
                <h2 style="font-size: 4rem; margin-bottom: 1rem;">🎉 Victory!</h2>
                <p style="font-size: 2rem; margin-bottom: 1rem;">${winnerColor} ${winnerName} Wins!</p>
                <p style="font-size: 1.2rem; margin-bottom: 3rem;">Four in a row!</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="launchConnectFour()" style="background: white; color: #f5576c; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">🔄 Play Again</button>
                    <button onclick="exitConnect4()" style="background: rgba(255,255,255,0.3); color: white; border: 2px solid white; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">← Back to Games</button>
                </div>
            </div>
        `;
    }

    function showConnect4Draw() {
        const content = document.getElementById('connect4Content');
        content.innerHTML = `
            <div style="text-align: center; padding: 4rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; color: white;">
                <h2 style="font-size: 4rem; margin-bottom: 1rem;">🤝 Draw!</h2>
                <p style="font-size: 2rem; margin-bottom: 3rem;">Board is full - it's a tie!</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="launchConnectFour()" style="background: white; color: #f5576c; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">🔄 Play Again</button>
                    <button onclick="exitConnect4()" style="background: rgba(255,255,255,0.3); color: white; border: 2px solid white; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">← Back to Games</button>
                </div>
            </div>
        `;
    }

    // Expose functions to global scope
    window.launchConnectFour = launchConnectFour;
    window.exitConnect4 = exitConnect4;
    window.selectConnect4PassAndPlay = selectConnect4PassAndPlay;
    window.selectConnect4VsAI = selectConnect4VsAI;
    window.startConnect4WithNames = startConnect4WithNames;
    window.dropDisc = dropDisc;

})();
