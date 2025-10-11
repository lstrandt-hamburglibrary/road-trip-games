// Dots and Boxes Game
(function() {
    'use strict';

    // Game state
    const dotsState = {
        gridSize: 6, // 6x6 dots creates 5x5 boxes
        currentPlayer: 0, // 0 = Player 1 (Blue), 1 = Player 2/AI (Red)
        scores: [0, 0],
        horizontalLines: [], // [row][col] - line below dot
        verticalLines: [],   // [row][col] - line to right of dot
        boxes: [],           // [row][col] - which player captured this box (or null)
        gameMode: null,      // 'pass-and-play' or 'vs-ai'
        gameOver: false,
        aiDifficulty: 'medium'
    };

    const COLORS = ['#4169E1', '#DC143C']; // Blue, Red
    const PLAYER_NAMES = ['Player 1', 'Player 2'];

    // Initialize game state
    function initGame() {
        dotsState.horizontalLines = [];
        dotsState.verticalLines = [];
        dotsState.boxes = [];

        for (let i = 0; i < dotsState.gridSize; i++) {
            dotsState.horizontalLines[i] = [];
            dotsState.verticalLines[i] = [];
            dotsState.boxes[i] = [];
            for (let j = 0; j < dotsState.gridSize; j++) {
                dotsState.horizontalLines[i][j] = false;
                dotsState.verticalLines[i][j] = false;
                dotsState.boxes[i][j] = null;
            }
        }

        dotsState.currentPlayer = 0;
        dotsState.scores = [0, 0];
        dotsState.gameOver = false;
    }

    // Launch game and show mode selection
    window.launchDotsAndBoxes = function() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="padding: 1rem; max-width: 600px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="showGamesMenu()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        ← Back
                    </button>
                    <h2 style="margin: 0; font-size: 1.5rem;">📦 Dots and Boxes</h2>
                    <div style="width: 80px;"></div>
                </div>

                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h3 style="text-align: center; margin-bottom: 1.5rem;">Select Game Mode</h3>

                    <button onclick="startDotsAndBoxes('pass-and-play')" style="width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; margin-bottom: 1rem; font-weight: bold;">
                        👥 Pass and Play
                    </button>

                    <button onclick="startDotsAndBoxes('vs-ai')" style="width: 100%; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; padding: 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold;">
                        🤖 Play vs Computer
                    </button>

                    <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        <h4 style="margin-top: 0;">How to Play:</h4>
                        <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                            <li>Take turns drawing lines between dots</li>
                            <li>Complete a box to capture it and score a point</li>
                            <li>When you complete a box, you get another turn!</li>
                            <li>Player with the most boxes wins</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    };

    // Start game with selected mode
    window.startDotsAndBoxes = function(mode) {
        dotsState.gameMode = mode;
        initGame();
        renderGame();
    };

    // Render the game board
    function renderGame() {
        const app = document.getElementById('app');
        const boxesTotal = (dotsState.gridSize - 1) * (dotsState.gridSize - 1);
        const boxesRemaining = boxesTotal - dotsState.scores[0] - dotsState.scores[1];

        let playerIndicator = '';
        if (!dotsState.gameOver) {
            const currentName = dotsState.gameMode === 'vs-ai' && dotsState.currentPlayer === 1
                ? 'Computer'
                : PLAYER_NAMES[dotsState.currentPlayer];
            playerIndicator = `
                <div style="text-align: center; padding: 1rem; background: ${COLORS[dotsState.currentPlayer]}; color: white; border-radius: 8px; margin-bottom: 1rem; font-size: 1.2rem; font-weight: bold;">
                    ${currentName}'s Turn
                </div>
            `;
        }

        app.innerHTML = `
            <div style="padding: 1rem; max-width: 600px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="launchDotsAndBoxes()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        ← Menu
                    </button>
                    <h2 style="margin: 0; font-size: 1.5rem;">📦 Dots and Boxes</h2>
                    <button onclick="startDotsAndBoxes('${dotsState.gameMode}')" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        New Game
                    </button>
                </div>

                <div style="display: flex; justify-content: space-around; margin-bottom: 1rem;">
                    <div style="background: ${COLORS[0]}; color: white; padding: 1rem; border-radius: 8px; flex: 1; margin-right: 0.5rem; text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">Player 1</div>
                        <div style="font-size: 2rem; font-weight: bold;">${dotsState.scores[0]}</div>
                    </div>
                    <div style="background: ${COLORS[1]}; color: white; padding: 1rem; border-radius: 8px; flex: 1; margin-left: 0.5rem; text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">${dotsState.gameMode === 'vs-ai' ? 'Computer' : 'Player 2'}</div>
                        <div style="font-size: 2rem; font-weight: bold;">${dotsState.scores[1]}</div>
                    </div>
                </div>

                ${playerIndicator}

                <div id="dots-board" style="background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block; margin: 0 auto; display: block; width: fit-content; max-width: 100%;">
                    ${renderBoard()}
                </div>

                ${dotsState.gameOver ? `
                    <div style="text-align: center; padding: 1.5rem; background: ${dotsState.scores[0] > dotsState.scores[1] ? COLORS[0] : dotsState.scores[1] > dotsState.scores[0] ? COLORS[1] : '#95a5a6'}; color: white; border-radius: 8px; margin-top: 1rem; font-size: 1.3rem; font-weight: bold;">
                        ${dotsState.scores[0] > dotsState.scores[1] ? '🎉 Player 1 Wins!' : dotsState.scores[1] > dotsState.scores[0] ? (dotsState.gameMode === 'vs-ai' ? '🤖 Computer Wins!' : '🎉 Player 2 Wins!') : '🤝 It\'s a Tie!'}
                    </div>
                ` : ''}
            </div>
        `;

        // If it's AI's turn, make AI move after a delay
        if (!dotsState.gameOver && dotsState.gameMode === 'vs-ai' && dotsState.currentPlayer === 1) {
            setTimeout(makeAIMove, 500);
        }
    }

    // Render the board SVG
    function renderBoard() {
        const dotSize = 8;
        const spacing = 50;
        const padding = 20;
        const width = padding * 2 + (dotsState.gridSize - 1) * spacing;
        const height = padding * 2 + (dotsState.gridSize - 1) * spacing;

        let svg = `<svg width="${width}" height="${height}" style="display: block;">`;

        // Draw boxes (filled squares)
        for (let row = 0; row < dotsState.gridSize - 1; row++) {
            for (let col = 0; col < dotsState.gridSize - 1; col++) {
                if (dotsState.boxes[row][col] !== null) {
                    const x = padding + col * spacing;
                    const y = padding + row * spacing;
                    const player = dotsState.boxes[row][col];
                    svg += `<rect x="${x + dotSize/2}" y="${y + dotSize/2}" width="${spacing - dotSize}" height="${spacing - dotSize}" fill="${COLORS[player]}" opacity="0.3"/>`;
                    svg += `<text x="${x + spacing/2}" y="${y + spacing/2}" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="bold" fill="${COLORS[player]}">${player + 1}</text>`;
                }
            }
        }

        // Draw horizontal lines (below each dot)
        for (let row = 0; row < dotsState.gridSize; row++) {
            for (let col = 0; col < dotsState.gridSize - 1; col++) {
                const x1 = padding + col * spacing;
                const y1 = padding + row * spacing;
                const x2 = x1 + spacing;
                const y2 = y1;

                if (dotsState.horizontalLines[row][col]) {
                    // Line is drawn
                    svg += `<line x1="${x1 + dotSize/2}" y1="${y1}" x2="${x2 - dotSize/2}" y2="${y2}" stroke="#333" stroke-width="4" stroke-linecap="round"/>`;
                } else if (!dotsState.gameOver) {
                    // Clickable area for drawing line
                    svg += `<line x1="${x1 + dotSize/2}" y1="${y1}" x2="${x2 - dotSize/2}" y2="${y2}" stroke="#ddd" stroke-width="3" stroke-linecap="round"/>`;
                    svg += `<rect x="${x1 + dotSize/2}" y="${y1 - 10}" width="${spacing - dotSize}" height="20" fill="transparent" style="cursor: pointer;" onclick="drawLine('h', ${row}, ${col})"/>`;
                }
            }
        }

        // Draw vertical lines (to the right of each dot)
        for (let row = 0; row < dotsState.gridSize - 1; row++) {
            for (let col = 0; col < dotsState.gridSize; col++) {
                const x1 = padding + col * spacing;
                const y1 = padding + row * spacing;
                const x2 = x1;
                const y2 = y1 + spacing;

                if (dotsState.verticalLines[row][col]) {
                    // Line is drawn
                    svg += `<line x1="${x1}" y1="${y1 + dotSize/2}" x2="${x2}" y2="${y2 - dotSize/2}" stroke="#333" stroke-width="4" stroke-linecap="round"/>`;
                } else if (!dotsState.gameOver) {
                    // Clickable area for drawing line
                    svg += `<line x1="${x1}" y1="${y1 + dotSize/2}" x2="${x2}" y2="${y2 - dotSize/2}" stroke="#ddd" stroke-width="3" stroke-linecap="round"/>`;
                    svg += `<rect x="${x1 - 10}" y="${y1 + dotSize/2}" width="20" height="${spacing - dotSize}" fill="transparent" style="cursor: pointer;" onclick="drawLine('v', ${row}, ${col})"/>`;
                }
            }
        }

        // Draw dots
        for (let row = 0; row < dotsState.gridSize; row++) {
            for (let col = 0; col < dotsState.gridSize; col++) {
                const x = padding + col * spacing;
                const y = padding + row * spacing;
                svg += `<circle cx="${x}" cy="${y}" r="${dotSize}" fill="#333"/>`;
            }
        }

        svg += '</svg>';
        return svg;
    }

    // Draw a line
    window.drawLine = function(type, row, col) {
        if (dotsState.gameOver) return;
        if (dotsState.gameMode === 'vs-ai' && dotsState.currentPlayer === 1) return; // Don't allow moves during AI turn

        // Check if line already exists
        if (type === 'h' && dotsState.horizontalLines[row][col]) return;
        if (type === 'v' && dotsState.verticalLines[row][col]) return;

        // Draw the line
        if (type === 'h') {
            dotsState.horizontalLines[row][col] = true;
        } else {
            dotsState.verticalLines[row][col] = true;
        }

        // Check if any boxes were completed
        const completedBoxes = checkCompletedBoxes(type, row, col);

        if (completedBoxes > 0) {
            // Player gets another turn
            dotsState.scores[dotsState.currentPlayer] += completedBoxes;
        } else {
            // Switch player
            dotsState.currentPlayer = 1 - dotsState.currentPlayer;
        }

        // Check if game is over
        const totalBoxes = (dotsState.gridSize - 1) * (dotsState.gridSize - 1);
        if (dotsState.scores[0] + dotsState.scores[1] === totalBoxes) {
            dotsState.gameOver = true;
        }

        renderGame();
    };

    // Check if drawing a line completed any boxes
    function checkCompletedBoxes(type, row, col) {
        let completedCount = 0;

        if (type === 'h') {
            // Horizontal line - check box above and below
            if (row > 0) {
                // Box above
                if (isBoxComplete(row - 1, col)) {
                    dotsState.boxes[row - 1][col] = dotsState.currentPlayer;
                    completedCount++;
                }
            }
            if (row < dotsState.gridSize - 1) {
                // Box below
                if (isBoxComplete(row, col)) {
                    dotsState.boxes[row][col] = dotsState.currentPlayer;
                    completedCount++;
                }
            }
        } else {
            // Vertical line - check box to left and right
            if (col > 0) {
                // Box to the left
                if (isBoxComplete(row, col - 1)) {
                    dotsState.boxes[row][col - 1] = dotsState.currentPlayer;
                    completedCount++;
                }
            }
            if (col < dotsState.gridSize - 1) {
                // Box to the right
                if (isBoxComplete(row, col)) {
                    dotsState.boxes[row][col] = dotsState.currentPlayer;
                    completedCount++;
                }
            }
        }

        return completedCount;
    }

    // Check if a specific box is complete
    function isBoxComplete(row, col) {
        if (dotsState.boxes[row][col] !== null) return false; // Already captured

        return dotsState.horizontalLines[row][col] &&     // Top
               dotsState.horizontalLines[row + 1][col] && // Bottom
               dotsState.verticalLines[row][col] &&       // Left
               dotsState.verticalLines[row][col + 1];     // Right
    }

    // AI Move
    function makeAIMove() {
        if (dotsState.gameOver) return;

        // Strategy:
        // 1. Try to complete a box if possible
        // 2. Avoid giving opponent a box (don't draw the 3rd side)
        // 3. Otherwise, make a random safe move

        let move = findBoxCompletingMove();
        if (!move) {
            move = findSafeMove();
        }
        if (!move) {
            move = findRandomMove();
        }

        if (move) {
            drawLine(move.type, move.row, move.col);
        }
    }

    // Find a move that completes a box
    function findBoxCompletingMove() {
        for (let row = 0; row < dotsState.gridSize; row++) {
            for (let col = 0; col < dotsState.gridSize - 1; col++) {
                if (!dotsState.horizontalLines[row][col]) {
                    // Try this horizontal line
                    dotsState.horizontalLines[row][col] = true;
                    const boxes = checkCompletedBoxes('h', row, col);
                    dotsState.horizontalLines[row][col] = false;

                    if (boxes > 0) {
                        return { type: 'h', row, col };
                    }
                }
            }
        }

        for (let row = 0; row < dotsState.gridSize - 1; row++) {
            for (let col = 0; col < dotsState.gridSize; col++) {
                if (!dotsState.verticalLines[row][col]) {
                    // Try this vertical line
                    dotsState.verticalLines[row][col] = true;
                    const boxes = checkCompletedBoxes('v', row, col);
                    dotsState.verticalLines[row][col] = false;

                    if (boxes > 0) {
                        return { type: 'v', row, col };
                    }
                }
            }
        }

        return null;
    }

    // Find a move that doesn't create a box opportunity for opponent
    function findSafeMove() {
        const safeMoves = [];

        for (let row = 0; row < dotsState.gridSize; row++) {
            for (let col = 0; col < dotsState.gridSize - 1; col++) {
                if (!dotsState.horizontalLines[row][col]) {
                    if (!wouldCreateOpportunity('h', row, col)) {
                        safeMoves.push({ type: 'h', row, col });
                    }
                }
            }
        }

        for (let row = 0; row < dotsState.gridSize - 1; row++) {
            for (let col = 0; col < dotsState.gridSize; col++) {
                if (!dotsState.verticalLines[row][col]) {
                    if (!wouldCreateOpportunity('v', row, col)) {
                        safeMoves.push({ type: 'v', row, col });
                    }
                }
            }
        }

        if (safeMoves.length > 0) {
            return safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }

        return null;
    }

    // Check if a move would give the opponent an opportunity to complete a box
    function wouldCreateOpportunity(type, row, col) {
        if (type === 'h') {
            // Check box above
            if (row > 0 && dotsState.boxes[row - 1][col] === null) {
                const sides = countBoxSides(row - 1, col);
                if (sides === 2) return true; // Would create 3rd side
            }
            // Check box below
            if (row < dotsState.gridSize - 1 && dotsState.boxes[row][col] === null) {
                const sides = countBoxSides(row, col);
                if (sides === 2) return true;
            }
        } else {
            // Check box to left
            if (col > 0 && dotsState.boxes[row][col - 1] === null) {
                const sides = countBoxSides(row, col - 1);
                if (sides === 2) return true;
            }
            // Check box to right
            if (col < dotsState.gridSize - 1 && dotsState.boxes[row][col] === null) {
                const sides = countBoxSides(row, col);
                if (sides === 2) return true;
            }
        }
        return false;
    }

    // Count how many sides a box currently has
    function countBoxSides(row, col) {
        let count = 0;
        if (dotsState.horizontalLines[row][col]) count++;       // Top
        if (dotsState.horizontalLines[row + 1][col]) count++;   // Bottom
        if (dotsState.verticalLines[row][col]) count++;         // Left
        if (dotsState.verticalLines[row][col + 1]) count++;     // Right
        return count;
    }

    // Find any random available move
    function findRandomMove() {
        const moves = [];

        for (let row = 0; row < dotsState.gridSize; row++) {
            for (let col = 0; col < dotsState.gridSize - 1; col++) {
                if (!dotsState.horizontalLines[row][col]) {
                    moves.push({ type: 'h', row, col });
                }
            }
        }

        for (let row = 0; row < dotsState.gridSize - 1; row++) {
            for (let col = 0; col < dotsState.gridSize; col++) {
                if (!dotsState.verticalLines[row][col]) {
                    moves.push({ type: 'v', row, col });
                }
            }
        }

        if (moves.length > 0) {
            return moves[Math.floor(Math.random() * moves.length)];
        }

        return null;
    }

})();
