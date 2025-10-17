// Klax - Classic 1990 Atari Arcade Game
(function() {
    'use strict';

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const TILE_SIZE = 50;
    const WELL_COLS = 5;
    const WELL_ROWS = 5;
    const CONVEYOR_POSITIONS = 7; // Number of positions on conveyor
    const PADDLE_WIDTH = TILE_SIZE;
    const MAX_PADDLE_TILES = 5;

    const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

    let gameState = {
        canvas: null,
        ctx: null,
        animationId: null,
        gameStarted: false,
        gameOver: false,

        // Conveyor belt
        conveyor: [], // Array of tiles on the belt
        conveyorSpeed: 1, // Pixels per frame
        conveyorLength: 300, // Length of conveyor in pixels

        // Paddle
        paddle: {
            position: 2, // Which column (0-4)
            tiles: [], // Tiles on paddle (max 5)
        },

        // Well/Bucket
        well: [], // 5x5 grid of tiles

        // Scoring
        score: 0,
        wave: 1,
        waveGoal: 5, // Number of Klaxes needed
        klaxesMade: 0,
        drops: 0, // Tiles dropped
        maxDrops: 5,

        // Controls
        keys: {},
    };

    // Initialize game
    function initGame() {
        gameState.gameStarted = false;
        gameState.gameOver = false;
        gameState.score = 0;
        gameState.wave = 1;
        gameState.klaxesMade = 0;
        gameState.drops = 0;
        gameState.conveyor = [];
        gameState.paddle.tiles = [];

        resetWave();
    }

    function resetWave() {
        // Clear well
        gameState.well = [];
        for (let row = 0; row < WELL_ROWS; row++) {
            gameState.well[row] = [];
            for (let col = 0; col < WELL_COLS; col++) {
                gameState.well[row][col] = null;
            }
        }

        // Set wave goal
        gameState.waveGoal = 5 + gameState.wave * 2;
        gameState.klaxesMade = 0;
        gameState.drops = 0;
        gameState.maxDrops = 5 + gameState.wave;

        // Clear conveyor
        gameState.conveyor = [];

        // Spawn initial tiles on conveyor
        for (let i = 0; i < 3; i++) {
            spawnTile();
        }
    }

    function spawnTile() {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        gameState.conveyor.push({
            color: color,
            y: -100, // Start off screen
            column: Math.floor(Math.random() * WELL_COLS),
        });
    }

    function movePaddleLeft() {
        if (gameState.paddle.position > 0) {
            gameState.paddle.position--;
        }
    }

    function movePaddleRight() {
        if (gameState.paddle.position < WELL_COLS - 1) {
            gameState.paddle.position++;
        }
    }

    function catchTile() {
        // Check if there's a tile at the paddle position
        const paddleY = gameState.conveyorLength;

        for (let i = gameState.conveyor.length - 1; i >= 0; i--) {
            const tile = gameState.conveyor[i];
            if (tile.column === gameState.paddle.position &&
                Math.abs(tile.y - paddleY) < 20) {

                // Catch the tile if paddle has room
                if (gameState.paddle.tiles.length < MAX_PADDLE_TILES) {
                    gameState.paddle.tiles.push(tile.color);
                    gameState.conveyor.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    }

    function dropTile() {
        if (gameState.paddle.tiles.length === 0) return;

        const col = gameState.paddle.position;

        // Find the lowest empty row in this column
        for (let row = WELL_ROWS - 1; row >= 0; row--) {
            if (gameState.well[row][col] === null) {
                const color = gameState.paddle.tiles.pop();
                gameState.well[row][col] = color;

                // Check for matches after dropping
                setTimeout(() => checkMatches(), 100);
                return;
            }
        }

        // Column is full - game over
        gameState.gameOver = true;
    }

    function tossTileBack() {
        if (gameState.paddle.tiles.length === 0) return;

        const color = gameState.paddle.tiles.pop();
        gameState.conveyor.push({
            color: color,
            y: gameState.conveyorLength - 50,
            column: gameState.paddle.position,
        });
    }

    function checkMatches() {
        const matches = [];

        // Check horizontals
        for (let row = 0; row < WELL_ROWS; row++) {
            for (let col = 0; col <= WELL_COLS - 3; col++) {
                const color = gameState.well[row][col];
                if (color === null) continue;

                let length = 1;
                const matchTiles = [{row, col}];

                for (let c = col + 1; c < WELL_COLS; c++) {
                    if (gameState.well[row][c] === color) {
                        length++;
                        matchTiles.push({row, col: c});
                    } else {
                        break;
                    }
                }

                if (length >= 3) {
                    matches.push({
                        type: 'horizontal',
                        tiles: matchTiles,
                        length: length,
                    });
                }
            }
        }

        // Check verticals
        for (let col = 0; col < WELL_COLS; col++) {
            for (let row = 0; row <= WELL_ROWS - 3; row++) {
                const color = gameState.well[row][col];
                if (color === null) continue;

                let length = 1;
                const matchTiles = [{row, col}];

                for (let r = row + 1; r < WELL_ROWS; r++) {
                    if (gameState.well[r][col] === color) {
                        length++;
                        matchTiles.push({row: r, col});
                    } else {
                        break;
                    }
                }

                if (length >= 3) {
                    matches.push({
                        type: 'vertical',
                        tiles: matchTiles,
                        length: length,
                    });
                }
            }
        }

        // Check diagonals (down-right)
        for (let row = 0; row <= WELL_ROWS - 3; row++) {
            for (let col = 0; col <= WELL_COLS - 3; col++) {
                const color = gameState.well[row][col];
                if (color === null) continue;

                let length = 1;
                const matchTiles = [{row, col}];

                for (let i = 1; i < 5; i++) {
                    if (row + i < WELL_ROWS && col + i < WELL_COLS &&
                        gameState.well[row + i][col + i] === color) {
                        length++;
                        matchTiles.push({row: row + i, col: col + i});
                    } else {
                        break;
                    }
                }

                if (length >= 3) {
                    matches.push({
                        type: 'diagonal',
                        tiles: matchTiles,
                        length: length,
                    });
                }
            }
        }

        // Check diagonals (down-left)
        for (let row = 0; row <= WELL_ROWS - 3; row++) {
            for (let col = 2; col < WELL_COLS; col++) {
                const color = gameState.well[row][col];
                if (color === null) continue;

                let length = 1;
                const matchTiles = [{row, col}];

                for (let i = 1; i < 5; i++) {
                    if (row + i < WELL_ROWS && col - i >= 0 &&
                        gameState.well[row + i][col - i] === color) {
                        length++;
                        matchTiles.push({row: row + i, col: col - i});
                    } else {
                        break;
                    }
                }

                if (length >= 3) {
                    matches.push({
                        type: 'diagonal',
                        tiles: matchTiles,
                        length: length,
                    });
                }
            }
        }

        // Remove duplicates and process matches
        if (matches.length > 0) {
            processMatches(matches);
        }
    }

    function processMatches(matches) {
        // Remove matched tiles and award points
        const tilesToRemove = new Set();
        let totalScore = 0;

        for (const match of matches) {
            for (const tile of match.tiles) {
                tilesToRemove.add(`${tile.row},${tile.col}`);
            }

            // Score based on type and length
            let baseScore = 50; // Vertical
            if (match.type === 'horizontal') baseScore = 100;
            if (match.type === 'diagonal') baseScore = 5000;

            totalScore += baseScore * match.length;
            gameState.klaxesMade++;
        }

        // Apply multiplier for multiple matches
        if (matches.length > 1) {
            totalScore *= matches.length;
        }

        gameState.score += totalScore;

        // Remove tiles
        for (const tileKey of tilesToRemove) {
            const [row, col] = tileKey.split(',').map(Number);
            gameState.well[row][col] = null;
        }

        // Apply gravity
        applyGravity();

        // Check for chain reactions
        setTimeout(() => checkMatches(), 300);
    }

    function applyGravity() {
        for (let col = 0; col < WELL_COLS; col++) {
            // Collect non-null tiles from bottom to top
            const tiles = [];
            for (let row = WELL_ROWS - 1; row >= 0; row--) {
                if (gameState.well[row][col] !== null) {
                    tiles.push(gameState.well[row][col]);
                }
            }

            // Clear column
            for (let row = 0; row < WELL_ROWS; row++) {
                gameState.well[row][col] = null;
            }

            // Place tiles from bottom up
            for (let i = 0; i < tiles.length; i++) {
                gameState.well[WELL_ROWS - 1 - i][col] = tiles[i];
            }
        }
    }

    function update(dt) {
        if (!gameState.gameStarted || gameState.gameOver) return;

        // Move conveyor tiles down
        for (let i = gameState.conveyor.length - 1; i >= 0; i--) {
            const tile = gameState.conveyor[i];
            tile.y += gameState.conveyorSpeed;

            // Check if tile reached paddle position
            const paddleY = gameState.conveyorLength;
            if (tile.y >= paddleY - 10 && tile.y <= paddleY + 10) {
                // Auto-catch if paddle is in position and has room
                if (tile.column === gameState.paddle.position &&
                    gameState.paddle.tiles.length < MAX_PADDLE_TILES) {
                    gameState.paddle.tiles.push(tile.color);
                    gameState.conveyor.splice(i, 1);
                    continue;
                }
            }

            // Check if tile fell off
            if (tile.y > paddleY + 50) {
                gameState.conveyor.splice(i, 1);
                gameState.drops++;

                if (gameState.drops >= gameState.maxDrops) {
                    gameState.gameOver = true;
                }
            }
        }

        // Spawn new tiles
        if (Math.random() < 0.02) {
            spawnTile();
        }

        // Check wave complete
        if (gameState.klaxesMade >= gameState.waveGoal) {
            gameState.wave++;
            gameState.score += 10000; // Wave bonus
            setTimeout(() => {
                if (!gameState.gameOver) {
                    resetWave();
                }
            }, 2000);
        }

        // Handle controls
        if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
            movePaddleLeft();
            delete gameState.keys['ArrowLeft'];
            delete gameState.keys['a'];
        }
        if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
            movePaddleRight();
            delete gameState.keys['ArrowRight'];
            delete gameState.keys['d'];
        }
        if (gameState.keys[' ']) {
            dropTile();
            delete gameState.keys[' '];
        }
        if (gameState.keys['ArrowUp'] || gameState.keys['w']) {
            tossTileBack();
            delete gameState.keys['ArrowUp'];
            delete gameState.keys['w'];
        }
        if (gameState.keys['ArrowDown'] || gameState.keys['s']) {
            gameState.conveyorSpeed = 3; // Speed up
        } else {
            gameState.conveyorSpeed = 1; // Normal speed
        }
    }

    function render() {
        const ctx = gameState.ctx;

        // Clear screen
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw conveyor belt
        const conveyorX = CANVAS_WIDTH / 2;
        const conveyorStartY = 50;
        const conveyorEndY = conveyorStartY + gameState.conveyorLength;

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 5;
        for (let col = 0; col < WELL_COLS; col++) {
            const x = conveyorX - (WELL_COLS * TILE_SIZE) / 2 + col * TILE_SIZE + TILE_SIZE / 2;
            ctx.beginPath();
            ctx.moveTo(x, conveyorStartY);
            ctx.lineTo(x, conveyorEndY);
            ctx.stroke();
        }

        // Draw conveyor tiles
        for (const tile of gameState.conveyor) {
            const x = conveyorX - (WELL_COLS * TILE_SIZE) / 2 + tile.column * TILE_SIZE;
            const y = conveyorStartY + tile.y;

            ctx.fillStyle = tile.color;
            ctx.fillRect(x + 5, y - TILE_SIZE / 2, TILE_SIZE - 10, TILE_SIZE - 10);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 5, y - TILE_SIZE / 2, TILE_SIZE - 10, TILE_SIZE - 10);
        }

        // Draw paddle
        const paddleX = conveyorX - (WELL_COLS * TILE_SIZE) / 2 + gameState.paddle.position * TILE_SIZE;
        const paddleY = conveyorEndY + 20;

        ctx.fillStyle = '#ff6600';
        ctx.fillRect(paddleX, paddleY, TILE_SIZE, 10);

        // Draw paddle tiles
        for (let i = 0; i < gameState.paddle.tiles.length; i++) {
            ctx.fillStyle = gameState.paddle.tiles[i];
            ctx.fillRect(paddleX + 5, paddleY - 15 - i * 10, TILE_SIZE - 10, 8);
        }

        // Draw well
        const wellX = conveyorX - (WELL_COLS * TILE_SIZE) / 2;
        const wellY = paddleY + 40;

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.strokeRect(wellX, wellY, WELL_COLS * TILE_SIZE, WELL_ROWS * TILE_SIZE);

        // Draw well tiles
        for (let row = 0; row < WELL_ROWS; row++) {
            for (let col = 0; col < WELL_COLS; col++) {
                const color = gameState.well[row][col];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        wellX + col * TILE_SIZE + 5,
                        wellY + row * TILE_SIZE + 5,
                        TILE_SIZE - 10,
                        TILE_SIZE - 10
                    );
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                        wellX + col * TILE_SIZE + 5,
                        wellY + row * TILE_SIZE + 5,
                        TILE_SIZE - 10,
                        TILE_SIZE - 10
                    );
                }
            }
        }

        // Draw HUD
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);
        ctx.fillText(`WAVE: ${gameState.wave}`, 20, 60);
        ctx.fillText(`KLAXES: ${gameState.klaxesMade}/${gameState.waveGoal}`, 20, 90);
        ctx.fillText(`DROPS: ${gameState.drops}/${gameState.maxDrops}`, 20, 120);

        // Start screen
        if (!gameState.gameStarted) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('KLAX', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

            ctx.font = '24px monospace';
            ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

            ctx.font = '18px monospace';
            ctx.fillText('← → to move paddle', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
            ctx.fillText('SPACE to drop tile', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
            ctx.fillText('↑ to toss tile back | ↓ to speed up', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
            ctx.fillText('Match 3+ tiles to make Klaxes!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
        }

        // Game over screen
        if (gameState.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

            ctx.font = '32px monospace';
            ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
            ctx.fillText(`Wave Reached: ${gameState.wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

            ctx.font = '24px monospace';
            ctx.fillText('Click "Play Again" to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
        }

        // Wave complete message
        if (gameState.klaxesMade >= gameState.waveGoal && !gameState.gameOver) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`WAVE ${gameState.wave} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
    }

    let lastTime = 0;
    function gameLoop(time) {
        const dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

        update(dt);
        render();

        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    function handleKeyDown(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }

        gameState.keys[e.key] = true;

        if (e.key === ' ' && !gameState.gameStarted && !gameState.gameOver) {
            gameState.gameStarted = true;
        }
    }

    function handleKeyUp(e) {
        gameState.keys[e.key] = false;
    }

    window.launchKlax = function() {
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('klaxGame').style.display = 'block';

        showKlaxGame();
    };

    function showKlaxGame() {
        const content = document.getElementById('klaxContent');
        content.innerHTML = `
            <div style="text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="exitKlax()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        ← Back
                    </button>
                    <h2 style="margin: 0; font-size: 1.5rem;">🎮 Klax</h2>
                    <button onclick="restartKlax()" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        🔄 Play Again
                    </button>
                </div>

                <canvas id="klaxCanvas" width="800" height="600" style="border: 4px solid #333; border-radius: 10px; background: #000; max-width: 100%; height: auto; display: block; margin: 0 auto;"></canvas>

                <!-- Mobile Controls -->
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
                    <button id="klaxLeftBtn" style="background: #667eea; color: white; border: none; padding: 1.5rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.5rem; font-weight: bold; touch-action: manipulation;">
                        ⬅️
                    </button>
                    <button id="klaxDropBtn" style="background: #f59e0b; color: white; border: none; padding: 1.5rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; touch-action: manipulation;">
                        ⬇️ DROP
                    </button>
                    <button id="klaxRightBtn" style="background: #667eea; color: white; border: none; padding: 1.5rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.5rem; font-weight: bold; touch-action: manipulation;">
                        ➡️
                    </button>
                    <button id="klaxTossBtn" style="background: #ec4899; color: white; border: none; padding: 1.5rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; touch-action: manipulation;">
                        ⬆️ TOSS
                    </button>
                    <button id="klaxSpeedBtn" style="background: #10b981; color: white; border: none; padding: 1.5rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; touch-action: manipulation;">
                        ⚡ SPEED
                    </button>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem;">
                    <h4 style="color: #333; margin-bottom: 1rem;">How to Play:</h4>
                    <ul style="color: #666; text-align: left; line-height: 1.8;">
                        <li>🎯 <strong>Objective:</strong> Match 3+ tiles of the same color to make "Klaxes"</li>
                        <li>⬅️➡️ <strong>Move Paddle:</strong> Position yourself to catch falling tiles</li>
                        <li>📦 <strong>Catch:</strong> Paddle automatically catches tiles (holds up to 5)</li>
                        <li>⬇️ <strong>Drop:</strong> Press SPACE to drop top tile into the well below</li>
                        <li>⬆️ <strong>Toss Back:</strong> Send your top tile back onto the conveyor</li>
                        <li>⚡ <strong>Speed Up:</strong> Hold DOWN ARROW to speed up the conveyor</li>
                        <li>📊 <strong>Scoring:</strong> Diagonals (5000) > Horizontals (100) > Verticals (50)</li>
                        <li>🎯 <strong>Wave Goal:</strong> Make the required number of Klaxes to advance</li>
                        <li>☠️ <strong>Lose if:</strong> Well fills up OR too many tiles drop</li>
                        <li>🏆 <strong>Chains:</strong> Gravity makes tiles fall - can create chain reactions!</li>
                    </ul>
                </div>
            </div>
        `;

        initGame();

        gameState.canvas = document.getElementById('klaxCanvas');
        gameState.ctx = gameState.canvas.getContext('2d');

        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Mobile controls
        const leftBtn = document.getElementById('klaxLeftBtn');
        const rightBtn = document.getElementById('klaxRightBtn');
        const dropBtn = document.getElementById('klaxDropBtn');
        const tossBtn = document.getElementById('klaxTossBtn');
        const speedBtn = document.getElementById('klaxSpeedBtn');

        leftBtn.addEventListener('click', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            movePaddleLeft();
        });

        rightBtn.addEventListener('click', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            movePaddleRight();
        });

        dropBtn.addEventListener('click', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            dropTile();
        });

        tossBtn.addEventListener('click', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            tossTileBack();
        });

        speedBtn.addEventListener('touchstart', () => {
            gameState.conveyorSpeed = 3;
        });
        speedBtn.addEventListener('touchend', () => {
            gameState.conveyorSpeed = 1;
        });
        speedBtn.addEventListener('mousedown', () => {
            gameState.conveyorSpeed = 3;
        });
        speedBtn.addEventListener('mouseup', () => {
            gameState.conveyorSpeed = 1;
        });

        // Start game loop
        lastTime = 0;
        gameLoop(0);
    }

    window.exitKlax = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        document.getElementById('klaxGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

    window.restartKlax = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        showKlaxGame();
    };

})();
