// Minesweeper Game - Complete implementation based on classic Windows Minesweeper
(function() {
    'use strict';

    // Game constants
    const DIFFICULTIES = {
        beginner: { rows: 9, cols: 9, mines: 10 },
        intermediate: { rows: 16, cols: 16, mines: 40 },
        expert: { rows: 30, cols: 16, mines: 99 }
    };

    // Game state
    let gameState = {
        difficulty: 'beginner',
        rows: 9,
        cols: 9,
        mines: 10,
        grid: [],
        revealed: [],
        flagged: [],
        gameOver: false,
        won: false,
        firstClick: true,
        timer: 0,
        timerInterval: null,
        minesRemaining: 10
    };

    // Initialize game
    function initGame(difficulty = 'beginner') {
        // Clear any existing timer
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }

        const config = DIFFICULTIES[difficulty];
        gameState = {
            difficulty: difficulty,
            rows: config.rows,
            cols: config.cols,
            mines: config.mines,
            grid: [],
            revealed: [],
            flagged: [],
            gameOver: false,
            won: false,
            firstClick: true,
            timer: 0,
            timerInterval: null,
            minesRemaining: config.mines
        };

        // Initialize empty grid (mines placed on first click)
        for (let r = 0; r < gameState.rows; r++) {
            gameState.grid[r] = [];
            gameState.revealed[r] = [];
            gameState.flagged[r] = [];
            for (let c = 0; c < gameState.cols; c++) {
                gameState.grid[r][c] = 0; // 0 = no mine, numbers = adjacent mine count
                gameState.revealed[r][c] = false;
                gameState.flagged[r][c] = false;
            }
        }

        renderGame();
    }

    // Place mines AFTER first click (ensures first click is always safe)
    function placeMines(safeRow, safeCol) {
        let minesPlaced = 0;
        const safeZone = [];

        // Mark 3x3 area around first click as safe zone
        for (let r = safeRow - 1; r <= safeRow + 1; r++) {
            for (let c = safeCol - 1; c <= safeCol + 1; c++) {
                if (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
                    safeZone.push(`${r},${c}`);
                }
            }
        }

        // Place mines randomly, avoiding safe zone
        while (minesPlaced < gameState.mines) {
            const r = Math.floor(Math.random() * gameState.rows);
            const c = Math.floor(Math.random() * gameState.cols);
            const key = `${r},${c}`;

            if (gameState.grid[r][c] !== 'mine' && !safeZone.includes(key)) {
                gameState.grid[r][c] = 'mine';
                minesPlaced++;
            }
        }

        // Calculate numbers for all non-mine cells
        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                if (gameState.grid[r][c] !== 'mine') {
                    gameState.grid[r][c] = countAdjacentMines(r, c);
                }
            }
        }
    }

    // Count mines in 8 adjacent cells
    function countAdjacentMines(row, col) {
        let count = 0;
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
                    if (gameState.grid[r][c] === 'mine') {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    // Flood fill algorithm to reveal empty cells
    function revealCell(row, col) {
        if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) {
            return;
        }
        if (gameState.revealed[row][col] || gameState.flagged[row][col]) {
            return;
        }

        gameState.revealed[row][col] = true;

        // If empty cell (0 adjacent mines), recursively reveal neighbors
        if (gameState.grid[row][col] === 0) {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r !== row || c !== col) {
                        revealCell(r, c);
                    }
                }
            }
        }
    }

    // Handle left click
    function handleLeftClick(row, col) {
        if (gameState.gameOver || gameState.flagged[row][col]) {
            return;
        }

        // First click - place mines
        if (gameState.firstClick) {
            gameState.firstClick = false;
            placeMines(row, col);
            startTimer();
        }

        // Already revealed
        if (gameState.revealed[row][col]) {
            return;
        }

        // Hit a mine
        if (gameState.grid[row][col] === 'mine') {
            gameState.gameOver = true;
            gameState.won = false;
            revealAllMines();
            stopTimer();
            renderGame();
            return;
        }

        // Reveal cell(s)
        revealCell(row, col);
        checkWin();
        renderGame();
    }

    // Handle right click (flagging)
    function handleRightClick(row, col, event) {
        event.preventDefault();

        if (gameState.gameOver || gameState.revealed[row][col]) {
            return;
        }

        gameState.flagged[row][col] = !gameState.flagged[row][col];
        gameState.minesRemaining += gameState.flagged[row][col] ? -1 : 1;
        renderGame();
    }

    // Handle middle click or both buttons (chording)
    function handleChording(row, col) {
        if (gameState.gameOver || !gameState.revealed[row][col]) {
            return;
        }

        const cellValue = gameState.grid[row][col];
        if (cellValue === 0 || cellValue === 'mine') {
            return;
        }

        // Count adjacent flags
        let flagCount = 0;
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
                    if (gameState.flagged[r][c]) {
                        flagCount++;
                    }
                }
            }
        }

        // If flag count matches number, reveal all unflagged neighbors
        if (flagCount === cellValue) {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
                        if (!gameState.flagged[r][c] && !gameState.revealed[r][c]) {
                            if (gameState.grid[r][c] === 'mine') {
                                gameState.gameOver = true;
                                gameState.won = false;
                                revealAllMines();
                                stopTimer();
                            } else {
                                revealCell(r, c);
                            }
                        }
                    }
                }
            }
            checkWin();
            renderGame();
        }
    }

    // Reveal all mines (game over)
    function revealAllMines() {
        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                if (gameState.grid[r][c] === 'mine') {
                    gameState.revealed[r][c] = true;
                }
            }
        }
    }

    // Check win condition
    function checkWin() {
        let allSafeCellsRevealed = true;
        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                if (gameState.grid[r][c] !== 'mine' && !gameState.revealed[r][c]) {
                    allSafeCellsRevealed = false;
                    break;
                }
            }
            if (!allSafeCellsRevealed) break;
        }

        if (allSafeCellsRevealed) {
            gameState.gameOver = true;
            gameState.won = true;
            stopTimer();

            // Auto-flag remaining mines
            for (let r = 0; r < gameState.rows; r++) {
                for (let c = 0; c < gameState.cols; c++) {
                    if (gameState.grid[r][c] === 'mine') {
                        gameState.flagged[r][c] = true;
                    }
                }
            }
            gameState.minesRemaining = 0;
        }
    }

    // Timer functions
    function startTimer() {
        gameState.timerInterval = setInterval(() => {
            gameState.timer++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        const timerEl = document.getElementById('minesweeperTimer');
        if (timerEl) {
            timerEl.textContent = String(gameState.timer).padStart(3, '0');
        }
    }

    // Render game
    function renderGame() {
        const content = document.getElementById('minesweeperContent');

        // Calculate cell size based on difficulty and available screen width
        // Reserve space for borders, padding, and margins (about 40px total)
        const availableWidth = Math.min(window.innerWidth - 40, 1200);

        // Calculate optimal cell size to fit screen
        let maxCellSize;
        if (gameState.difficulty === 'beginner') {
            maxCellSize = 30;
        } else if (gameState.difficulty === 'intermediate') {
            maxCellSize = 24;
        } else { // expert
            maxCellSize = 20;
        }

        // Ensure board fits on screen
        const calculatedSize = Math.floor(availableWidth / gameState.cols);
        const cellSize = Math.min(maxCellSize, Math.max(15, calculatedSize));

        // Scale UI elements for smaller boards
        const counterFontSize = Math.min(24, cellSize + 6);
        const buttonSize = Math.min(50, cellSize * 1.8);
        const buttonFontSize = Math.min(32, cellSize * 1.2);

        content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.25rem; max-width: 100%; overflow-x: hidden;">
                <!-- Difficulty Selection -->
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
                    <button onclick="changeDifficulty('beginner')" style="
                        background: ${gameState.difficulty === 'beginner' ? '#4CAF50' : '#e0e0e0'};
                        color: ${gameState.difficulty === 'beginner' ? 'white' : '#333'};
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Beginner (9x9)</button>
                    <button onclick="changeDifficulty('intermediate')" style="
                        background: ${gameState.difficulty === 'intermediate' ? '#FF9800' : '#e0e0e0'};
                        color: ${gameState.difficulty === 'intermediate' ? 'white' : '#333'};
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Intermediate (16x16)</button>
                    <button onclick="changeDifficulty('expert')" style="
                        background: ${gameState.difficulty === 'expert' ? '#F44336' : '#e0e0e0'};
                        color: ${gameState.difficulty === 'expert' ? 'white' : '#333'};
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Expert (30x16)</button>
                </div>

                <!-- Game Info Bar -->
                <div style="
                    background: #c0c0c0;
                    border: 3px solid #808080;
                    padding: 0.25rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: ${cellSize * gameState.cols + 4}px;
                    max-width: 100%;
                    box-sizing: border-box;
                    gap: 0.5rem;
                ">
                    <div style="
                        background: #000;
                        color: #f00;
                        font-family: 'Courier New', monospace;
                        font-size: ${counterFontSize}px;
                        font-weight: bold;
                        padding: 0.25rem 0.5rem;
                        border: 2px inset #808080;
                        min-width: ${counterFontSize * 2}px;
                        text-align: center;
                    ">${String(Math.max(0, gameState.minesRemaining)).padStart(3, '0')}</div>

                    <button onclick="initMinesweeper()" style="
                        background: #c0c0c0;
                        border: 3px outset #fff;
                        font-size: ${buttonFontSize}px;
                        width: ${buttonSize}px;
                        height: ${buttonSize}px;
                        cursor: pointer;
                        padding: 0;
                        flex-shrink: 0;
                    ">${gameState.gameOver ? (gameState.won ? '😎' : '😵') : '🙂'}</button>

                    <div style="
                        background: #000;
                        color: #f00;
                        font-family: 'Courier New', monospace;
                        font-size: ${counterFontSize}px;
                        font-weight: bold;
                        padding: 0.25rem 0.5rem;
                        border: 2px inset #808080;
                        min-width: ${counterFontSize * 2}px;
                        text-align: center;
                    " id="minesweeperTimer">${String(gameState.timer).padStart(3, '0')}</div>
                </div>

                <!-- Game Grid Container -->
                <div style="max-width: 100%; overflow-x: hidden;">
                    <div style="
                        display: inline-block;
                        background: #c0c0c0;
                        border: 3px solid #808080;
                        padding: 2px;
                    ">
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(${gameState.cols}, ${cellSize}px);
                            gap: 0;
                            background: #c0c0c0;
                        ">
                            ${renderGrid(cellSize)}
                        </div>
                    </div>
                </div>

                <!-- Instructions -->
                <div style="text-align: center; color: #666; font-size: 0.8rem; max-width: 600px; padding: 0 0.25rem;">
                    <p><strong>Left-click</strong> to reveal | <strong>Right-click</strong> to flag | <strong>Middle-click</strong> on numbers to chord</p>
                    <p style="margin-top: 0.15rem;">💡 First click is always safe! Numbers show adjacent mine count.</p>
                </div>
            </div>
        `;
    }

    // Render grid cells
    function renderGrid(cellSize) {
        let html = '';

        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                const revealed = gameState.revealed[r][c];
                const flagged = gameState.flagged[r][c];
                const value = gameState.grid[r][c];

                let content = '';
                let bgColor = '#c0c0c0';
                let border = '3px outset #fff';
                let color = '#000';
                let fontWeight = 'bold';

                if (flagged && !revealed) {
                    content = '🚩';
                    bgColor = '#c0c0c0';
                } else if (revealed) {
                    border = '1px solid #808080';
                    bgColor = '#bdbdbd';

                    if (value === 'mine') {
                        content = '💣';
                        bgColor = gameState.gameOver && !gameState.won ? '#ff0000' : '#bdbdbd';
                    } else if (value > 0) {
                        content = value;
                        const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
                        color = colors[value];
                    }
                }

                html += `
                    <div
                        onmousedown="handleMouseDown(event, ${r}, ${c})"
                        oncontextmenu="handleRightClickCell(${r}, ${c}, event)"
                        style="
                            width: ${cellSize}px;
                            height: ${cellSize}px;
                            background: ${bgColor};
                            border: ${border};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: ${cellSize * 0.6}px;
                            font-weight: ${fontWeight};
                            color: ${color};
                            cursor: ${gameState.gameOver ? 'default' : 'pointer'};
                            user-select: none;
                        "
                    >${content}</div>
                `;
            }
        }

        return html;
    }

    // Mouse event handling for chording
    window.handleMouseDown = function(event, row, col) {
        event.preventDefault();

        // Left click
        if (event.button === 0) {
            handleLeftClick(row, col);
        }
        // Middle click (chording)
        else if (event.button === 1) {
            handleChording(row, col);
        }
    };

    window.handleRightClickCell = function(row, col, event) {
        handleRightClick(row, col, event);
    };

    // Change difficulty
    window.changeDifficulty = function(difficulty) {
        initGame(difficulty);
    };

    // Initialize game
    window.initMinesweeper = function() {
        initGame(gameState.difficulty);
    };

    // Launch Minesweeper
    window.launchMinesweeper = function() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('minesweeperGame').style.display = 'block';
        initGame();
    };

    // Exit to menu
    window.exitMinesweeper = function() {
        stopTimer();
        document.getElementById('minesweeperGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

})();
