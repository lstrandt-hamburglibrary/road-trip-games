// Qix - Classic 1981 Taito Arcade Game
(function() {
    'use strict';

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const GRID_SIZE = 4; // Size of grid cells for area tracking
    const GRID_COLS = CANVAS_WIDTH / GRID_SIZE;
    const GRID_ROWS = CANVAS_HEIGHT / GRID_SIZE;

    let gameState = {
        canvas: null,
        ctx: null,
        animationId: null,
        gameStarted: false,
        gameOver: false,

        // Player marker
        marker: {
            x: 0,
            y: CANVAS_HEIGHT / 2,
            speed: 2,
            drawing: false,
            drawSpeed: 'fast', // 'fast' or 'slow'
            onEdge: true,
            path: [], // Current drawing path
        },

        // The Qix
        qixes: [],

        // Sparx
        sparx: [],
        sparxTimer: 0,
        sparxInterval: 600, // Frames until new Sparx spawn

        // Grid for tracking claimed/unclaimed areas
        grid: [],

        // Game state
        score: 0,
        lives: 3,
        level: 1,
        percentClaimed: 0,
        targetPercent: 75,

        // Controls
        keys: {},
    };

    // Initialize game
    function initGame() {
        gameState.gameStarted = false;
        gameState.gameOver = false;
        gameState.score = 0;
        gameState.lives = 3;
        gameState.level = 1;
        gameState.percentClaimed = 0;
        gameState.sparxTimer = 0;

        resetLevel();
    }

    function resetLevel() {
        // Initialize grid - 0 = unclaimed, 1 = claimed, 2 = edge
        gameState.grid = [];
        for (let y = 0; y < GRID_ROWS; y++) {
            gameState.grid[y] = [];
            for (let x = 0; x < GRID_COLS; x++) {
                // Mark edges as claimed
                if (x === 0 || x === GRID_COLS - 1 || y === 0 || y === GRID_ROWS - 1) {
                    gameState.grid[y][x] = 1;
                } else {
                    gameState.grid[y][x] = 0;
                }
            }
        }

        // Reset marker
        gameState.marker = {
            x: 0,
            y: CANVAS_HEIGHT / 2,
            speed: 2, // Reduced from 3 to align better with 4px grid
            drawing: false,
            drawSpeed: 'fast',
            onEdge: true,
            path: [],
        };

        // Spawn Qix
        gameState.qixes = [];
        const numQixes = Math.min(1 + Math.floor(gameState.level / 5), 2);
        for (let i = 0; i < numQixes; i++) {
            spawnQix();
        }

        // Spawn Sparx
        gameState.sparx = [];
        spawnSparx(true);  // Clockwise
        spawnSparx(false); // Counter-clockwise

        calculatePercentClaimed();
    }

    function spawnQix() {
        // Spawn in middle area
        gameState.qixes.push({
            x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200,
            y: CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 200,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            points: generateQixPoints(),
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
        });
    }

    function generateQixPoints() {
        const points = [];
        const numSegments = 8;
        for (let i = 0; i < numSegments; i++) {
            points.push({
                x: (Math.random() - 0.5) * 60,
                y: (Math.random() - 0.5) * 60,
            });
        }
        return points;
    }

    function spawnSparx(clockwise) {
        gameState.sparx.push({
            x: 0,
            y: 0,
            side: 'top',
            position: 0,
            clockwise: clockwise,
            speed: 2,
            super: false,
        });
    }

    function calculatePercentClaimed() {
        let claimed = 0;
        let total = 0;

        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                total++;
                if (gameState.grid[y][x] === 1) {
                    claimed++;
                }
            }
        }

        gameState.percentClaimed = Math.floor((claimed / total) * 100);
    }

    function getEdges() {
        // Get list of all edge segments for Sparx to follow
        const edges = [];

        // Find perimeter of unclaimed area
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                if (gameState.grid[y][x] === 0) {
                    // Check if adjacent to claimed area
                    const neighbors = [
                        { x: x - 1, y: y },
                        { x: x + 1, y: y },
                        { x: x, y: y - 1 },
                        { x: x, y: y + 1 },
                    ];

                    for (const n of neighbors) {
                        if (n.x >= 0 && n.x < GRID_COLS && n.y >= 0 && n.y < GRID_ROWS) {
                            if (gameState.grid[n.y][n.x] === 1) {
                                edges.push({ x: x * GRID_SIZE, y: y * GRID_SIZE });
                                break;
                            }
                        }
                    }
                }
            }
        }

        return edges;
    }

    function isOnEdge(x, y) {
        const gx = Math.floor(x / GRID_SIZE);
        const gy = Math.floor(y / GRID_SIZE);

        if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) return false;

        // Check if on claimed area
        if (gameState.grid[gy][gx] === 1) {
            // Check if adjacent to unclaimed (include diagonals for better corner handling)
            const neighbors = [
                { x: gx - 1, y: gy },
                { x: gx + 1, y: gy },
                { x: gx, y: gy - 1 },
                { x: gx, y: gy + 1 },
                { x: gx - 1, y: gy - 1 },
                { x: gx + 1, y: gy - 1 },
                { x: gx - 1, y: gy + 1 },
                { x: gx + 1, y: gy + 1 },
            ];

            for (const n of neighbors) {
                if (n.x >= 0 && n.x < GRID_COLS && n.y >= 0 && n.y < GRID_ROWS) {
                    if (gameState.grid[n.y][n.x] === 0) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    function floodFill(startX, startY, visited) {
        const stack = [{ x: startX, y: startY }];
        const filled = [];
        let hitQix = false;

        while (stack.length > 0) {
            const { x, y } = stack.pop();

            if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) continue;
            if (visited[y][x]) continue;
            if (gameState.grid[y][x] === 1) continue; // Already claimed

            visited[y][x] = true;
            filled.push({ x, y });

            // Check if Qix is in this cell
            for (const qix of gameState.qixes) {
                const qgx = Math.floor(qix.x / GRID_SIZE);
                const qgy = Math.floor(qix.y / GRID_SIZE);
                if (qgx === x && qgy === y) {
                    hitQix = true;
                }
            }

            // Add neighbors
            stack.push({ x: x - 1, y: y });
            stack.push({ x: x + 1, y: y });
            stack.push({ x: x, y: y - 1 });
            stack.push({ x: x, y: y + 1 });
        }

        return { filled, hitQix };
    }

    function claimArea() {
        if (gameState.marker.path.length < 2) return;

        // Mark path as claimed
        for (const point of gameState.marker.path) {
            const gx = Math.floor(point.x / GRID_SIZE);
            const gy = Math.floor(point.y / GRID_SIZE);
            if (gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS) {
                gameState.grid[gy][gx] = 1;
            }
        }

        // Find all unclaimed regions
        const visited = [];
        for (let y = 0; y < GRID_ROWS; y++) {
            visited[y] = [];
            for (let x = 0; x < GRID_COLS; x++) {
                visited[y][x] = false;
            }
        }

        const regions = [];
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                if (!visited[y][x] && gameState.grid[y][x] === 0) {
                    const region = floodFill(x, y, visited);
                    regions.push(region);
                }
            }
        }

        // Claim regions that don't contain Qix
        let totalClaimed = 0;
        for (const region of regions) {
            if (!region.hitQix) {
                for (const cell of region.filled) {
                    gameState.grid[cell.y][cell.x] = 1;
                    totalClaimed++;
                }
            }
        }

        // Award points
        const multiplier = gameState.marker.drawSpeed === 'slow' ? 2 : 1;
        const points = totalClaimed * 10 * multiplier;
        gameState.score += points;

        calculatePercentClaimed();

        // Check level complete
        if (gameState.percentClaimed >= gameState.targetPercent) {
            const bonus = (gameState.percentClaimed - gameState.targetPercent) * 1000;
            gameState.score += bonus;
            gameState.level++;
            setTimeout(() => {
                if (!gameState.gameOver) {
                    resetLevel();
                }
            }, 2000);
        }

        gameState.marker.path = [];
    }

    function loseLife() {
        gameState.lives--;

        if (gameState.lives > 0) {
            setTimeout(() => {
                if (!gameState.gameOver) {
                    gameState.marker = {
                        x: 0,
                        y: CANVAS_HEIGHT / 2,
                        speed: 2,
                        drawing: false,
                        drawSpeed: 'fast',
                        onEdge: true,
                        path: [],
                    };
                }
            }, 1000);
        } else {
            gameState.gameOver = true;
        }
    }

    function update(dt) {
        if (!gameState.gameStarted || gameState.gameOver) return;

        const marker = gameState.marker;

        // Update Qix movement
        for (const qix of gameState.qixes) {
            qix.x += qix.vx;
            qix.y += qix.vy;
            qix.rotation += qix.rotationSpeed;

            // Bounce off claimed areas
            const gx = Math.floor(qix.x / GRID_SIZE);
            const gy = Math.floor(qix.y / GRID_SIZE);

            if (gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS) {
                if (gameState.grid[gy][gx] === 1) {
                    qix.vx *= -1;
                    qix.vy *= -1;
                    qix.x += qix.vx * 2;
                    qix.y += qix.vy * 2;
                }
            }

            // Bounce off edges
            if (qix.x < 50 || qix.x > CANVAS_WIDTH - 50) qix.vx *= -1;
            if (qix.y < 50 || qix.y > CANVAS_HEIGHT - 50) qix.vy *= -1;

            // Random direction changes
            if (Math.random() < 0.02) {
                qix.vx += (Math.random() - 0.5) * 2;
                qix.vy += (Math.random() - 0.5) * 2;

                // Limit speed
                const speed = Math.sqrt(qix.vx ** 2 + qix.vy ** 2);
                if (speed > 5) {
                    qix.vx = (qix.vx / speed) * 5;
                    qix.vy = (qix.vy / speed) * 5;
                }
            }
        }

        // Update Sparx
        for (let i = gameState.sparx.length - 1; i >= 0; i--) {
            const sparx = gameState.sparx[i];

            // Simple edge following (move along perimeter)
            if (sparx.clockwise) {
                sparx.position += sparx.speed;
            } else {
                sparx.position -= sparx.speed;
            }

            const perimeterLength = (CANVAS_WIDTH + CANVAS_HEIGHT) * 2;
            sparx.position = ((sparx.position % perimeterLength) + perimeterLength) % perimeterLength;

            // Calculate position on perimeter
            if (sparx.position < CANVAS_WIDTH) {
                sparx.x = sparx.position;
                sparx.y = 0;
                sparx.side = 'top';
            } else if (sparx.position < CANVAS_WIDTH + CANVAS_HEIGHT) {
                sparx.x = CANVAS_WIDTH;
                sparx.y = sparx.position - CANVAS_WIDTH;
                sparx.side = 'right';
            } else if (sparx.position < CANVAS_WIDTH * 2 + CANVAS_HEIGHT) {
                sparx.x = CANVAS_WIDTH - (sparx.position - CANVAS_WIDTH - CANVAS_HEIGHT);
                sparx.y = CANVAS_HEIGHT;
                sparx.side = 'bottom';
            } else {
                sparx.x = 0;
                sparx.y = CANVAS_HEIGHT - (sparx.position - CANVAS_WIDTH * 2 - CANVAS_HEIGHT);
                sparx.side = 'left';
            }

            // Check collision with marker
            const dist = Math.sqrt((sparx.x - marker.x) ** 2 + (sparx.y - marker.y) ** 2);
            if (dist < 10) {
                loseLife();
                return;
            }
        }

        // Spawn more Sparx over time
        gameState.sparxTimer++;
        if (gameState.sparxTimer > gameState.sparxInterval) {
            gameState.sparxTimer = 0;
            spawnSparx(Math.random() < 0.5);
            spawnSparx(Math.random() < 0.5);
        }

        // Move marker - only allow 4 directions (no diagonals)
        let dx = 0, dy = 0;

        // Prioritize most recent key press by checking vertical first, then horizontal
        // This prevents diagonal movement
        if (gameState.keys['ArrowUp'] || gameState.keys['w']) {
            dy = -1;
        } else if (gameState.keys['ArrowDown'] || gameState.keys['s']) {
            dy = 1;
        } else if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
            dx = -1;
        } else if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
            dx = 1;
        }

        if (dx !== 0 || dy !== 0) {
            // Apply speed (no normalization needed - only one direction at a time)
            dx = dx * marker.speed;
            dy = dy * marker.speed;

            const newX = marker.x + dx;
            const newY = marker.y + dy;

            // Check bounds
            if (newX >= 0 && newX <= CANVAS_WIDTH && newY >= 0 && newY <= CANVAS_HEIGHT) {
                if (marker.drawing) {
                    // Can move anywhere when drawing
                    marker.x = newX;
                    marker.y = newY;
                    marker.path.push({ x: marker.x, y: marker.y });

                    // Check if completed box (back to edge)
                    if (isOnEdge(marker.x, marker.y)) {
                        marker.drawing = false;
                        marker.onEdge = true;
                        claimArea();
                    }

                    // Check if Qix hit the path
                    for (const qix of gameState.qixes) {
                        for (const point of marker.path) {
                            const dist = Math.sqrt((qix.x - point.x) ** 2 + (qix.y - point.y) ** 2);
                            if (dist < 20) {
                                loseLife();
                                return;
                            }
                        }
                    }
                } else {
                    // Can only move on edges when not drawing
                    if (isOnEdge(newX, newY)) {
                        marker.x = newX;
                        marker.y = newY;
                    }
                }
            }
        }
    }

    function render() {
        const ctx = gameState.ctx;

        // Clear screen
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw claimed areas
        ctx.fillStyle = '#0066cc';
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                if (gameState.grid[y][x] === 1) {
                    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                }
            }
        }

        // Draw current path
        if (gameState.marker.path.length > 0) {
            ctx.strokeStyle = gameState.marker.drawSpeed === 'slow' ? '#ff6600' : '#00ccff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(gameState.marker.path[0].x, gameState.marker.path[0].y);
            for (let i = 1; i < gameState.marker.path.length; i++) {
                ctx.lineTo(gameState.marker.path[i].x, gameState.marker.path[i].y);
            }
            ctx.stroke();
        }

        // Draw Qix
        for (const qix of gameState.qixes) {
            ctx.save();
            ctx.translate(qix.x, qix.y);
            ctx.rotate(qix.rotation);
            ctx.strokeStyle = '#ff0066';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < qix.points.length; i++) {
                const p1 = qix.points[i];
                const p2 = qix.points[(i + 1) % qix.points.length];
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
            ctx.stroke();
            ctx.restore();
        }

        // Draw Sparx
        for (const sparx of gameState.sparx) {
            ctx.fillStyle = sparx.super ? '#ffff00' : '#ff3333';
            ctx.beginPath();
            ctx.arc(sparx.x, sparx.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw marker
        ctx.save();
        ctx.translate(gameState.marker.x, gameState.marker.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();

        // Draw HUD
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);
        ctx.fillText(`LIVES: ${gameState.lives}`, 20, 60);

        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${gameState.level}`, CANVAS_WIDTH / 2, 30);
        ctx.fillText(`${gameState.percentClaimed}% / ${gameState.targetPercent}%`, CANVAS_WIDTH / 2, 60);

        ctx.textAlign = 'right';
        const speedText = gameState.marker.drawSpeed === 'slow' ? 'SLOW (2x)' : 'FAST (1x)';
        ctx.fillText(speedText, CANVAS_WIDTH - 20, 30);

        // Start screen
        if (!gameState.gameStarted) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('QIX', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

            ctx.font = '24px monospace';
            ctx.fillText('Press any direction to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

            ctx.font = '18px monospace';
            ctx.fillText('Arrow Keys / WASD to move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
            ctx.fillText('F = Fast Draw (1x pts) | S = Slow Draw (2x pts)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
            ctx.fillText('Claim 75% of the playfield!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
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
            ctx.fillText(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

            ctx.font = '24px monospace';
            ctx.fillText('Click "Play Again" to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
        }

        // Level complete message
        if (gameState.percentClaimed >= gameState.targetPercent && !gameState.gameOver) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
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
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'f', 'F', 's', 'S'].includes(e.key)) {
            e.preventDefault();
        }

        gameState.keys[e.key] = true;

        if (e.key === ' ' && !gameState.gameStarted && !gameState.gameOver) {
            gameState.gameStarted = true;
        }

        // Start drawing
        if ((e.key === 'f' || e.key === 'F') && gameState.gameStarted && !gameState.gameOver) {
            if (gameState.marker.onEdge && !gameState.marker.drawing) {
                gameState.marker.drawing = true;
                gameState.marker.drawSpeed = 'fast';
                gameState.marker.onEdge = false;
                gameState.marker.path = [{ x: gameState.marker.x, y: gameState.marker.y }];
            }
        }

        if ((e.key === 's' || e.key === 'S') && gameState.gameStarted && !gameState.gameOver) {
            if (gameState.marker.onEdge && !gameState.marker.drawing) {
                gameState.marker.drawing = true;
                gameState.marker.drawSpeed = 'slow';
                gameState.marker.onEdge = false;
                gameState.marker.path = [{ x: gameState.marker.x, y: gameState.marker.y }];
                gameState.marker.speed = 1; // Slower movement, aligns with grid
            }
        }
    }

    function handleKeyUp(e) {
        gameState.keys[e.key] = false;

        // Reset speed when releasing slow draw
        if ((e.key === 's' || e.key === 'S') && gameState.marker.drawSpeed === 'slow') {
            gameState.marker.speed = 2;
        }
    }

    window.launchQix = function() {
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('qixGame').style.display = 'block';

        showQixGame();
    };

    function showQixGame() {
        const content = document.getElementById('qixContent');
        content.innerHTML = `
            <div style="text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="exitQix()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        ← Back
                    </button>
                    <h2 style="margin: 0; font-size: 1.5rem;">🎨 Qix</h2>
                    <button onclick="restartQix()" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        🔄 Play Again
                    </button>
                </div>

                <canvas id="qixCanvas" width="800" height="600" style="border: 4px solid #333; border-radius: 10px; background: #000; max-width: 100%; height: auto; display: block; margin: 0 auto;"></canvas>

                <!-- Mobile Controls -->
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
                    <div style="display: grid; grid-template-columns: repeat(3, 80px); gap: 0.5rem;">
                        <div></div>
                        <button id="qixUpBtn" style="background: #667eea; color: white; border: none; padding: 1rem; border-radius: 12px; cursor: pointer; font-size: 1.5rem; font-weight: bold; touch-action: manipulation;">
                            ⬆️
                        </button>
                        <div></div>

                        <button id="qixLeftBtn" style="background: #667eea; color: white; border: none; padding: 1rem; border-radius: 12px; cursor: pointer; font-size: 1.5rem; font-weight: bold; touch-action: manipulation;">
                            ⬅️
                        </button>
                        <div></div>
                        <button id="qixRightBtn" style="background: #667eea; color: white; border: none; padding: 1rem; border-radius: 12px; cursor: pointer; font-size: 1.5rem; font-weight: bold; touch-action: manipulation;">
                            ➡️
                        </button>

                        <div></div>
                        <button id="qixDownBtn" style="background: #667eea; color: white; border: none; padding: 1rem; border-radius: 12px; cursor: pointer; font-size: 1.5rem; font-weight: bold; touch-action: manipulation;">
                            ⬇️
                        </button>
                        <div></div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button id="qixFastBtn" style="background: #00ccff; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; touch-action: manipulation;">
                            ⚡ FAST (1x)
                        </button>
                        <button id="qixSlowBtn" style="background: #ff6600; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; touch-action: manipulation;">
                            🐢 SLOW (2x)
                        </button>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem;">
                    <h4 style="color: #333; margin-bottom: 1rem;">How to Play:</h4>
                    <ul style="color: #666; text-align: left; line-height: 1.8;">
                        <li>🎯 <strong>Objective:</strong> Claim 75% of the playfield to complete each level</li>
                        <li>📐 <strong>Drawing:</strong> Press F (Fast) or S (Slow) to start drawing lines</li>
                        <li>⚡ <strong>Fast Draw (blue):</strong> Quick but worth 1x points</li>
                        <li>🐢 <strong>Slow Draw (orange):</strong> Slower but worth 2x points!</li>
                        <li>💎 Move your diamond marker and draw lines to close off areas</li>
                        <li>🎨 When you complete a box, the side WITHOUT the Qix gets claimed</li>
                        <li>☠️ <strong>The Qix:</strong> Don't let it touch your incomplete lines!</li>
                        <li>⚠️ <strong>Sparx:</strong> Red enemies patrol the edges - avoid them!</li>
                        <li>🏆 Bonus: Every 1% above 75% = 1,000 bonus points!</li>
                    </ul>
                </div>
            </div>
        `;

        initGame();

        gameState.canvas = document.getElementById('qixCanvas');
        gameState.ctx = gameState.canvas.getContext('2d');

        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Mobile controls
        const upBtn = document.getElementById('qixUpBtn');
        const downBtn = document.getElementById('qixDownBtn');
        const leftBtn = document.getElementById('qixLeftBtn');
        const rightBtn = document.getElementById('qixRightBtn');
        const fastBtn = document.getElementById('qixFastBtn');
        const slowBtn = document.getElementById('qixSlowBtn');

        upBtn.addEventListener('touchstart', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.keys['ArrowUp'] = true;
        });
        upBtn.addEventListener('touchend', () => gameState.keys['ArrowUp'] = false);
        upBtn.addEventListener('mousedown', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.keys['ArrowUp'] = true;
        });
        upBtn.addEventListener('mouseup', () => gameState.keys['ArrowUp'] = false);

        downBtn.addEventListener('touchstart', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.keys['ArrowDown'] = true;
        });
        downBtn.addEventListener('touchend', () => gameState.keys['ArrowDown'] = false);
        downBtn.addEventListener('mousedown', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.keys['ArrowDown'] = true;
        });
        downBtn.addEventListener('mouseup', () => gameState.keys['ArrowDown'] = false);

        leftBtn.addEventListener('touchstart', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.keys['ArrowLeft'] = true;
        });
        leftBtn.addEventListener('touchend', () => gameState.keys['ArrowLeft'] = false);
        leftBtn.addEventListener('mousedown', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.keys['ArrowLeft'] = true;
        });
        leftBtn.addEventListener('mouseup', () => gameState.keys['ArrowLeft'] = false);

        rightBtn.addEventListener('touchstart', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.keys['ArrowRight'] = true;
        });
        rightBtn.addEventListener('touchend', () => gameState.keys['ArrowRight'] = false);
        rightBtn.addEventListener('mousedown', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.keys['ArrowRight'] = true;
        });
        rightBtn.addEventListener('mouseup', () => gameState.keys['ArrowRight'] = false);

        fastBtn.addEventListener('click', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            if (gameState.marker.onEdge && !gameState.marker.drawing) {
                gameState.marker.drawing = true;
                gameState.marker.drawSpeed = 'fast';
                gameState.marker.onEdge = false;
                gameState.marker.path = [{ x: gameState.marker.x, y: gameState.marker.y }];
            }
        });

        slowBtn.addEventListener('click', () => {
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            if (gameState.marker.onEdge && !gameState.marker.drawing) {
                gameState.marker.drawing = true;
                gameState.marker.drawSpeed = 'slow';
                gameState.marker.onEdge = false;
                gameState.marker.path = [{ x: gameState.marker.x, y: gameState.marker.y }];
                gameState.marker.speed = 1;
            }
        });

        // Start game loop
        lastTime = 0;
        gameLoop(0);
    }

    window.exitQix = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        document.getElementById('qixGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

    window.restartQix = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        showQixGame();
    };

})();
