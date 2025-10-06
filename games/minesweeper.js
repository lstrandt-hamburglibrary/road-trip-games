// Minesweeper Game
(function() {
    'use strict';

    // Minesweeper Game State
    let minesweeperState = {
        rows: 9,
        cols: 9,
        mines: 10,
        board: [],
        revealed: [],
        flagged: [],
        gameOver: false,
        firstClick: true,
        minesRemaining: 10,
        timer: 0,
        timerInterval: null
    };

    let touchTimer = null;
    let touchedCell = null;

    function launchMinesweeper() {
        // Reset game state
        minesweeperState = {
            rows: 9,
            cols: 9,
            mines: 10,
            board: [],
            revealed: [],
            flagged: [],
            gameOver: false,
            firstClick: true,
            minesRemaining: 10,
            timer: 0,
            timerInterval: null
        };

        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('minesweeperGame').style.display = 'block';
        showMinesweeperSetup();
    }

    function exitMinesweeper() {
        if (minesweeperState.timerInterval) {
            clearInterval(minesweeperState.timerInterval);
        }
        document.getElementById('minesweeperGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    }

    function showMinesweeperSetup() {
        const content = document.getElementById('minesweeperContent');
        content.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; color: white;">
                <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">💣 Minesweeper</h2>
                <p style="font-size: 1.2rem; margin-bottom: 2rem;">Clear the board without hitting any mines!</p>
                <div style="background: rgba(255,255,255,0.2); padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;">How to Play:</h3>
                    <p style="text-align: left; max-width: 500px; margin: 0 auto; line-height: 1.6;">
                        • Click to reveal a square<br>
                        • Numbers show how many mines are adjacent<br>
                        • Long press (or right-click) to flag a mine<br>
                        • Clear all non-mine squares to win!
                    </p>
                </div>
                <h3 style="margin-bottom: 1rem;">Choose Difficulty:</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; max-width: 600px; margin: 0 auto;">
                    <button onclick="startMinesweeper(9, 9, 10)" style="background: white; color: #667eea; border: none; padding: 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        😊 Beginner<br>
                        <span style="font-size: 0.9rem; font-weight: normal;">9×9, 10 mines</span>
                    </button>
                    <button onclick="startMinesweeper(16, 16, 40)" style="background: rgba(255,255,255,0.3); color: white; border: 2px solid white; padding: 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        😐 Intermediate<br>
                        <span style="font-size: 0.9rem; font-weight: normal;">16×16, 40 mines</span>
                    </button>
                    <button onclick="startMinesweeper(16, 30, 99)" style="background: rgba(255,255,255,0.3); color: white; border: 2px solid white; padding: 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        😰 Expert<br>
                        <span style="font-size: 0.9rem; font-weight: normal;">16×30, 99 mines</span>
                    </button>
                </div>
            </div>
        `;
    }

    function startMinesweeper(rows, cols, mines) {
        minesweeperState.rows = rows;
        minesweeperState.cols = cols;
        minesweeperState.mines = mines;
        minesweeperState.minesRemaining = mines;
        minesweeperState.board = Array(rows).fill(null).map(() => Array(cols).fill(0));
        minesweeperState.revealed = Array(rows).fill(null).map(() => Array(cols).fill(false));
        minesweeperState.flagged = Array(rows).fill(null).map(() => Array(cols).fill(false));
        minesweeperState.firstClick = true;
        minesweeperState.gameOver = false;
        minesweeperState.timer = 0;

        showMinesweeperBoard();
    }

    function placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        while (minesPlaced < minesweeperState.mines) {
            const row = Math.floor(Math.random() * minesweeperState.rows);
            const col = Math.floor(Math.random() * minesweeperState.cols);

            // Don't place mine on first click or if already has mine
            if ((row === excludeRow && col === excludeCol) || minesweeperState.board[row][col] === -1) {
                continue;
            }

            minesweeperState.board[row][col] = -1;
            minesPlaced++;

            // Update adjacent numbers
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < minesweeperState.rows &&
                        newCol >= 0 && newCol < minesweeperState.cols &&
                        minesweeperState.board[newRow][newCol] !== -1) {
                        minesweeperState.board[newRow][newCol]++;
                    }
                }
            }
        }
    }

    function showMinesweeperBoard() {
        const content = document.getElementById('minesweeperContent');
        content.innerHTML = `
            <div style="text-align: center;">
                <div style="display: flex; justify-content: space-around; max-width: 300px; margin: 0 auto 1.5rem; background: #c0c0c0; border: 3px solid #808080; padding: 0.5rem;">
                    <div style="background: black; color: red; font-family: 'Courier New', monospace; font-size: 1.5rem; font-weight: bold; padding: 0.3rem 0.8rem; border: 2px inset #808080;">
                        ${String(minesweeperState.minesRemaining).padStart(3, '0')}
                    </div>
                    <button onclick="resetMinesweeper()" style="background: #c0c0c0; border: 2px outset #808080; font-size: 1.5rem; padding: 0.2rem 0.5rem; cursor: pointer;">
                        ${minesweeperState.gameOver ? (checkMinesweeperWin() ? '😎' : '😵') : '🙂'}
                    </button>
                    <div style="background: black; color: red; font-family: 'Courier New', monospace; font-size: 1.5rem; font-weight: bold; padding: 0.3rem 0.8rem; border: 2px inset #808080;">
                        ${String(minesweeperState.timer).padStart(3, '0')}
                    </div>
                </div>

                <div style="display: inline-block; background: #c0c0c0; padding: 0.5rem; border: 3px solid #808080;">
                    ${renderMinesweeperBoard()}
                </div>
            </div>
        `;
    }

    function renderMinesweeperBoard() {
        // Calculate responsive cell size to fit screen
        const screenWidth = window.innerWidth;
        const padding = 40; // Account for container padding and margins
        const availableWidth = screenWidth - padding;
        const gap = minesweeperState.cols - 1; // 1px gap between cells
        const calculatedSize = Math.floor((availableWidth - gap) / minesweeperState.cols);

        // Set min 18px, max 35px
        const cellSize = Math.min(35, Math.max(18, calculatedSize)) + 'px';

        let html = `<div style="display: grid; grid-template-columns: repeat(${minesweeperState.cols}, ${cellSize}); gap: 1px; background: #808080;">`;

        for (let row = 0; row < minesweeperState.rows; row++) {
            for (let col = 0; col < minesweeperState.cols; col++) {
                const revealed = minesweeperState.revealed[row][col];
                const flagged = minesweeperState.flagged[row][col];
                const value = minesweeperState.board[row][col];

                let content = '';
                let style = `width: ${cellSize}; height: ${cellSize}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; cursor: pointer; user-select: none; touch-action: manipulation;`;

                if (revealed) {
                    style += 'border: 1px solid #7a7a7a; background: #bdbdbd;';
                    if (value === -1) {
                        content = '💣';
                        if (minesweeperState.gameOver) {
                            style += 'background: red;';
                        }
                    } else if (value > 0) {
                        content = value;
                        const colors = ['', 'blue', 'green', 'red', 'darkblue', 'darkred', 'cyan', 'black', 'gray'];
                        style += `color: ${colors[value]};`;
                    }
                } else {
                    style += 'border: 3px outset #dfdfdf; background: #c0c0c0;';
                    if (flagged) {
                        content = '🚩';
                    }
                }

                html += `
                    <div onmousedown="revealCell(${row}, ${col})"
                         oncontextmenu="toggleFlag(${row}, ${col}); return false;"
                         ontouchstart="handleTouchStart(event, ${row}, ${col})"
                         ontouchend="handleTouchEnd(event)"
                         style="${style}">
                        ${content}
                    </div>
                `;
            }
        }

        html += '</div>';
        return html;
    }

    function handleTouchStart(e, row, col) {
        touchedCell = { row, col };
        touchTimer = setTimeout(() => {
            toggleFlag(row, col);
            touchTimer = null;
        }, 500);
    }

    function handleTouchEnd(e) {
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
            if (touchedCell) {
                revealCell(touchedCell.row, touchedCell.col);
            }
        }
        touchedCell = null;
    }

    function revealCell(row, col) {
        if (minesweeperState.gameOver || minesweeperState.revealed[row][col] || minesweeperState.flagged[row][col]) {
            return;
        }

        // First click - place mines avoiding this cell
        if (minesweeperState.firstClick) {
            minesweeperState.firstClick = false;
            placeMines(row, col);
            // Start timer
            minesweeperState.timerInterval = setInterval(() => {
                minesweeperState.timer++;
                if (minesweeperState.timer <= 999) {
                    showMinesweeperBoard();
                }
            }, 1000);
        }

        minesweeperState.revealed[row][col] = true;

        // Hit a mine
        if (minesweeperState.board[row][col] === -1) {
            minesweeperState.gameOver = true;
            clearInterval(minesweeperState.timerInterval);
            revealAllMines();
            showMinesweeperBoard();
            setTimeout(() => alert('💣 Game Over! You hit a mine!'), 100);
            return;
        }

        // Empty cell - reveal adjacent cells
        if (minesweeperState.board[row][col] === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < minesweeperState.rows &&
                        newCol >= 0 && newCol < minesweeperState.cols) {
                        revealCell(newRow, newCol);
                    }
                }
            }
        }

        // Check for win
        if (checkMinesweeperWin()) {
            minesweeperState.gameOver = true;
            clearInterval(minesweeperState.timerInterval);
            showMinesweeperBoard();
            setTimeout(() => alert(`🎉 You Win! Time: ${minesweeperState.timer}s`), 100);
            return;
        }

        showMinesweeperBoard();
    }

    function toggleFlag(row, col) {
        if (minesweeperState.gameOver || minesweeperState.revealed[row][col]) {
            return;
        }

        minesweeperState.flagged[row][col] = !minesweeperState.flagged[row][col];
        minesweeperState.minesRemaining += minesweeperState.flagged[row][col] ? -1 : 1;
        showMinesweeperBoard();
    }

    function checkMinesweeperWin() {
        for (let row = 0; row < minesweeperState.rows; row++) {
            for (let col = 0; col < minesweeperState.cols; col++) {
                if (minesweeperState.board[row][col] !== -1 && !minesweeperState.revealed[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    function revealAllMines() {
        for (let row = 0; row < minesweeperState.rows; row++) {
            for (let col = 0; col < minesweeperState.cols; col++) {
                if (minesweeperState.board[row][col] === -1) {
                    minesweeperState.revealed[row][col] = true;
                }
            }
        }
    }

    function resetMinesweeper() {
        startMinesweeper(minesweeperState.rows, minesweeperState.cols, minesweeperState.mines);
    }

    // Expose functions to global scope
    window.launchMinesweeper = launchMinesweeper;
    window.exitMinesweeper = exitMinesweeper;
    window.startMinesweeper = startMinesweeper;
    window.revealCell = revealCell;
    window.toggleFlag = toggleFlag;
    window.handleTouchStart = handleTouchStart;
    window.handleTouchEnd = handleTouchEnd;
    window.resetMinesweeper = resetMinesweeper;

})();
