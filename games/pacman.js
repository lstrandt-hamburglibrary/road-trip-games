// Pac-Man Game
(function() {
    console.log('🟡 Pac-Man v1.44.2 loaded - Ghost AI debug + wall collision fix enabled');

    let gameCanvas, ctx;
    let gameState = 'menu'; // menu, playing, gameOver, levelComplete
    let pacman;
    let ghosts = [];
    let dots = [];
    let powerPellets = [];
    let score = 0;
    let lives = 3;
    let level = 1;
    let highScore = parseInt(localStorage.getItem('pacmanHighScore') || '0');
    let animationId;
    let keys = {};
    let frameCount = 0;

    const CELL_SIZE = 20;
    const GAME_WIDTH = 28 * CELL_SIZE; // 28 cells wide (classic Pac-Man width)
    const GAME_HEIGHT = 31 * CELL_SIZE; // 31 cells tall (classic Pac-Man height)
    const PACMAN_SPEED = 1.5;
    const GHOST_SPEED = 1.3;
    const FRIGHTENED_GHOST_SPEED = 0.9;
    const POWER_PELLET_DURATION = 540; // frames (about 9 seconds at 60fps)
    const DOT_POINTS = 10;
    const POWER_PELLET_POINTS = 50;
    const GHOST_POINTS = [200, 400, 800, 1600]; // Points for eating 1st, 2nd, 3rd, 4th ghost

    // Maze layout (0 = empty, 1 = wall, 2 = dot, 3 = power pellet)
    const MAZE = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
        [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
        [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
        [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
        [1,1,1,1,1,1,2,1,1,0,1,1,1,0,0,1,1,1,0,1,1,2,1,1,1,1,1,1],
        [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
        [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
        [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
        [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
        [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
        [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    // Ghost names and colors - start in valid open paths
    const GHOST_DATA = [
        { name: 'Blinky', color: '#FF0000', startX: 5, startY: 5 }, // Red - top left area
        { name: 'Pinky', color: '#FFB8FF', startX: 22, startY: 5 }, // Pink - top right area
        { name: 'Inky', color: '#00FFFF', startX: 5, startY: 29 }, // Cyan - bottom left area
        { name: 'Clyde', color: '#FFB851', startX: 22, startY: 29 }  // Orange - bottom right area
    ];

    // Create Pac-Man
    function createPacman() {
        return {
            x: 14 * CELL_SIZE,
            y: 23 * CELL_SIZE,
            gridX: 14,
            gridY: 23,
            direction: { x: 0, y: 0 },
            nextDirection: { x: 0, y: 0 },
            speed: PACMAN_SPEED,
            mouthAngle: 0,
            mouthOpening: true
        };
    }

    // Create Ghost
    function createGhost(data) {
        return {
            name: data.name,
            color: data.color,
            x: data.startX * CELL_SIZE,
            y: data.startY * CELL_SIZE,
            gridX: data.startX,
            gridY: data.startY,
            startX: data.startX,
            startY: data.startY,
            direction: { x: 0, y: -1 },
            speed: GHOST_SPEED,
            mode: 'chase', // chase, frightened, eaten
            frightenedTimer: 0,
            eaten: false
        };
    }

    // Initialize game
    function initGame() {
        console.log('🎮 Starting new Pac-Man game');
        pacman = createPacman();
        ghosts = GHOST_DATA.map(data => createGhost(data));
        console.log('👻 Ghost starting positions:');
        ghosts.forEach(g => {
            console.log(`  - ${g.name}: (${g.gridX}, ${g.gridY}) - mode: ${g.mode}`);
        });
        keys = {};
        frameCount = 0;

        // Create dots and power pellets from maze
        dots = [];
        powerPellets = [];
        for (let y = 0; y < MAZE.length; y++) {
            for (let x = 0; x < MAZE[y].length; x++) {
                if (MAZE[y][x] === 2) {
                    dots.push({ x: x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2 });
                } else if (MAZE[y][x] === 3) {
                    powerPellets.push({ x: x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2 });
                }
            }
        }

        gameState = 'playing';
        gameLoop();
    }

    // Check if position is valid (not a wall)
    function isValidPosition(gridX, gridY) {
        if (gridY < 0 || gridY >= MAZE.length || gridX < 0 || gridX >= MAZE[0].length) {
            return false;
        }
        return MAZE[gridY][gridX] !== 1;
    }

    // Check if position is ghost house (forbidden for non-eaten ghosts)
    function isGhostHouse(gridX, gridY) {
        // Don't restrict ghost house - let ghosts roam freely
        return false;
    }

    // Get grid position from pixel position
    function getGridPosition(x, y) {
        return {
            gridX: Math.floor(x / CELL_SIZE),
            gridY: Math.floor(y / CELL_SIZE)
        };
    }

    // Check if entity is aligned with grid
    function isAlignedWithGrid(x, y) {
        return x % CELL_SIZE === 0 && y % CELL_SIZE === 0;
    }

    // Update Pac-Man
    function updatePacman() {
        // Update mouth animation
        if (frameCount % 5 === 0) {
            if (pacman.mouthOpening) {
                pacman.mouthAngle += 0.1;
                if (pacman.mouthAngle >= 0.4) pacman.mouthOpening = false;
            } else {
                pacman.mouthAngle -= 0.1;
                if (pacman.mouthAngle <= 0) pacman.mouthOpening = true;
            }
        }

        // Get current grid position
        const gridPos = getGridPosition(pacman.x, pacman.y);
        pacman.gridX = gridPos.gridX;
        pacman.gridY = gridPos.gridY;

        // Try to change direction if at grid intersection and queued direction is valid
        if (isAlignedWithGrid(pacman.x, pacman.y)) {
            const nextGridX = pacman.gridX + pacman.nextDirection.x;
            const nextGridY = pacman.gridY + pacman.nextDirection.y;

            if (isValidPosition(nextGridX, nextGridY)) {
                pacman.direction = { ...pacman.nextDirection };
            }
        }

        // Try to move in current direction
        let newX = pacman.x + pacman.direction.x * pacman.speed;
        let newY = pacman.y + pacman.direction.y * pacman.speed;

        // Check all corners of pacman's bounding box
        const checkPositions = [
            { x: newX + 2, y: newY + 2 },
            { x: newX + CELL_SIZE - 3, y: newY + 2 },
            { x: newX + 2, y: newY + CELL_SIZE - 3 },
            { x: newX + CELL_SIZE - 3, y: newY + CELL_SIZE - 3 }
        ];

        let canMove = true;
        for (let pos of checkPositions) {
            const checkGrid = getGridPosition(pos.x, pos.y);
            if (!isValidPosition(checkGrid.gridX, checkGrid.gridY)) {
                canMove = false;
                break;
            }
        }

        if (canMove) {
            pacman.x = newX;
            pacman.y = newY;
        } else {
            // Stop at grid boundary when hitting wall
            if (pacman.direction.x !== 0) {
                pacman.x = Math.round(pacman.x / CELL_SIZE) * CELL_SIZE;
            }
            if (pacman.direction.y !== 0) {
                pacman.y = Math.round(pacman.y / CELL_SIZE) * CELL_SIZE;
            }
            pacman.direction = { x: 0, y: 0 };
        }

        // Wrap around tunnels (left and right edges)
        if (pacman.x < 0) {
            pacman.x = GAME_WIDTH - CELL_SIZE;
        } else if (pacman.x >= GAME_WIDTH) {
            pacman.x = 0;
        }

        // Collect dots
        for (let i = dots.length - 1; i >= 0; i--) {
            const dot = dots[i];
            const distance = Math.sqrt(
                Math.pow(pacman.x + CELL_SIZE / 2 - dot.x, 2) +
                Math.pow(pacman.y + CELL_SIZE / 2 - dot.y, 2)
            );
            if (distance < CELL_SIZE / 2) {
                dots.splice(i, 1);
                score += DOT_POINTS;
            }
        }

        // Collect power pellets
        for (let i = powerPellets.length - 1; i >= 0; i--) {
            const pellet = powerPellets[i];
            const distance = Math.sqrt(
                Math.pow(pacman.x + CELL_SIZE / 2 - pellet.x, 2) +
                Math.pow(pacman.y + CELL_SIZE / 2 - pellet.y, 2)
            );
            if (distance < CELL_SIZE / 2) {
                powerPellets.splice(i, 1);
                score += POWER_PELLET_POINTS;
                console.log(`💊 Power Pellet eaten! Ghosts entering frightened mode for ${POWER_PELLET_DURATION} frames`);
                // Make ghosts frightened
                ghosts.forEach(ghost => {
                    if (ghost.mode !== 'eaten') {
                        ghost.mode = 'frightened';
                        ghost.frightenedTimer = POWER_PELLET_DURATION;
                        ghost.speed = FRIGHTENED_GHOST_SPEED;
                        // Reverse direction
                        ghost.direction.x *= -1;
                        ghost.direction.y *= -1;
                    }
                });
            }
        }

        // Check if level complete
        if (dots.length === 0 && powerPellets.length === 0) {
            gameState = 'levelComplete';
            setTimeout(() => {
                level++;
                // Don't increase speed on level up, keep it consistent
                initGame();
            }, 2000);
        }
    }

    // Simple ghost AI
    function updateGhost(ghost) {
        // Update frightened timer
        if (ghost.mode === 'frightened') {
            ghost.frightenedTimer--;
            if (ghost.frightenedTimer <= 0) {
                console.log(`👻 ${ghost.name}: Frightened mode ended, switching to chase at (${Math.round(ghost.x/CELL_SIZE)}, ${Math.round(ghost.y/CELL_SIZE)})`);
                ghost.mode = 'chase';
                ghost.speed = GHOST_SPEED;
                // Snap to grid to ensure clean transition
                ghost.x = Math.round(ghost.x / CELL_SIZE) * CELL_SIZE;
                ghost.y = Math.round(ghost.y / CELL_SIZE) * CELL_SIZE;
                // Direction will be re-evaluated on next grid-aligned check
            }
        }

        // Get current grid position
        const gridPos = getGridPosition(ghost.x, ghost.y);
        ghost.gridX = gridPos.gridX;
        ghost.gridY = gridPos.gridY;

        // If eaten, return to center of maze to regenerate
        if (ghost.mode === 'eaten') {
            const centerX = 14; // Center of 28-wide maze
            const centerY = 15; // Roughly center height
            const distToHome = Math.abs(ghost.gridX - centerX) + Math.abs(ghost.gridY - centerY);
            if (distToHome <= 1) { // Within 1 tile of center
                // Arrived at center - regenerate and resume chasing
                console.log(`💀 ${ghost.name}: Regenerated at center (${centerX}, ${centerY}), resuming chase mode`);
                ghost.mode = 'chase';
                ghost.speed = GHOST_SPEED;
                ghost.eaten = false;
                ghost.frightenedTimer = 0; // Reset timer to prevent issues
                ghost.x = centerX * CELL_SIZE;
                ghost.y = centerY * CELL_SIZE;
            }
        }

        // Choose direction at intersections
        if (isAlignedWithGrid(ghost.x, ghost.y)) {
            const possibleDirections = [
                { x: 0, y: -1 }, // up
                { x: 0, y: 1 },  // down
                { x: -1, y: 0 }, // left
                { x: 1, y: 0 }   // right
            ];

            // Filter out invalid directions (walls, reverse, and ghost house if not eaten)
            const validDirections = possibleDirections.filter(dir => {
                const nextX = ghost.gridX + dir.x;
                const nextY = ghost.gridY + dir.y;

                // Can't reverse direction
                const isReverse = dir.x === -ghost.direction.x && dir.y === -ghost.direction.y;

                // Check if valid position
                if (!isValidPosition(nextX, nextY)) return false;

                // Non-eaten ghosts can't enter ghost house
                if (ghost.mode !== 'eaten' && isGhostHouse(nextX, nextY)) return false;

                // Can't reverse
                if (isReverse) return false;

                return true;
            });

            if (validDirections.length > 0) {
                if (ghost.mode === 'frightened') {
                    // Random movement when frightened
                    ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                } else if (ghost.mode === 'eaten') {
                    // Head back to center of maze
                    const centerX = 14;
                    const centerY = 15;
                    let bestDir = validDirections[0];
                    let bestDist = Infinity;

                    validDirections.forEach(dir => {
                        const nextX = ghost.gridX + dir.x;
                        const nextY = ghost.gridY + dir.y;
                        const dist = Math.sqrt(Math.pow(nextX - centerX, 2) + Math.pow(nextY - centerY, 2));
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestDir = dir;
                        }
                    });
                    ghost.direction = bestDir;

                    // Log pathfinding for eaten ghosts (every 30 frames)
                    if (frameCount % 30 === 0) {
                        console.log(`👻 ${ghost.name} (EYES): At (${ghost.gridX}, ${ghost.gridY}), heading to center (${centerX}, ${centerY}), distance: ${Math.round(bestDist)}, direction: (${bestDir.x}, ${bestDir.y})`);
                    }
                } else {
                    // Chase Pac-Man continuously
                    const targetX = pacman.gridX;
                    const targetY = pacman.gridY;

                    // Find best direction toward Pac-Man
                    let bestDir = validDirections[0];
                    let bestDist = Infinity;

                    validDirections.forEach(dir => {
                        const nextX = ghost.gridX + dir.x;
                        const nextY = ghost.gridY + dir.y;
                        const dist = Math.sqrt(Math.pow(nextX - targetX, 2) + Math.pow(nextY - targetY, 2));
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestDir = dir;
                        }
                    });
                    ghost.direction = bestDir;

                    // Log chasing decision (only every 60 frames to avoid spam)
                    if (frameCount % 60 === 0) {
                        console.log(`🎯 ${ghost.name}: At (${ghost.gridX}, ${ghost.gridY}), chasing Pac-Man at (${targetX}, ${targetY}), distance: ${Math.round(bestDist)}`);
                    }
                }
            } else if (validDirections.length === 0) {
                // Fallback: if no valid directions (shouldn't happen), try to find any non-wall direction
                const allDirections = [
                    { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
                ];
                for (let dir of allDirections) {
                    const nextX = ghost.gridX + dir.x;
                    const nextY = ghost.gridY + dir.y;
                    if (isValidPosition(nextX, nextY)) {
                        ghost.direction = dir;
                        break;
                    }
                }
            }
        }

        // Move ghost
        const speed = ghost.mode === 'eaten' ? GHOST_SPEED * 2 : ghost.speed;
        const newX = ghost.x + ghost.direction.x * speed;
        const newY = ghost.y + ghost.direction.y * speed;

        // Check all corners to ensure ghost stays in valid area
        const checkPositions = [
            { x: newX + 2, y: newY + 2 },
            { x: newX + CELL_SIZE - 3, y: newY + 2 },
            { x: newX + 2, y: newY + CELL_SIZE - 3 },
            { x: newX + CELL_SIZE - 3, y: newY + CELL_SIZE - 3 }
        ];

        let canMove = true;
        for (let pos of checkPositions) {
            const checkGrid = getGridPosition(pos.x, pos.y);
            if (!isValidPosition(checkGrid.gridX, checkGrid.gridY)) {
                canMove = false;
                break;
            }
        }

        if (canMove) {
            ghost.x = newX;
            ghost.y = newY;
        } else {
            // Blocked - snap to grid and force direction re-evaluation
            if (frameCount % 60 === 0) {
                console.log(`🚧 ${ghost.name}: BLOCKED at (${ghost.gridX}, ${ghost.gridY}), forcing direction re-evaluation. Current direction: (${ghost.direction.x}, ${ghost.direction.y})`);
            }
            ghost.x = ghost.gridX * CELL_SIZE;
            ghost.y = ghost.gridY * CELL_SIZE;

            // Force re-evaluation by trying different directions immediately
            const possibleDirections = [
                { x: 0, y: -1 }, // up
                { x: 0, y: 1 },  // down
                { x: -1, y: 0 }, // left
                { x: 1, y: 0 }   // right
            ];

            // Filter valid directions
            const validDirections = possibleDirections.filter(dir => {
                const nextX = ghost.gridX + dir.x;
                const nextY = ghost.gridY + dir.y;
                const isReverse = dir.x === -ghost.direction.x && dir.y === -ghost.direction.y;
                return isValidPosition(nextX, nextY) && !isReverse;
            });

            if (validDirections.length > 0) {
                // Choose best direction based on mode
                if (ghost.mode === 'eaten') {
                    const centerX = 14;
                    const centerY = 15;
                    let bestDir = validDirections[0];
                    let bestDist = Infinity;
                    validDirections.forEach(dir => {
                        const nextX = ghost.gridX + dir.x;
                        const nextY = ghost.gridY + dir.y;
                        const dist = Math.sqrt(Math.pow(nextX - centerX, 2) + Math.pow(nextY - centerY, 2));
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestDir = dir;
                        }
                    });
                    ghost.direction = bestDir;
                } else if (ghost.mode === 'frightened') {
                    ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                } else {
                    // Chase Pac-Man
                    const targetX = pacman.gridX;
                    const targetY = pacman.gridY;
                    let bestDir = validDirections[0];
                    let bestDist = Infinity;
                    validDirections.forEach(dir => {
                        const nextX = ghost.gridX + dir.x;
                        const nextY = ghost.gridY + dir.y;
                        const dist = Math.sqrt(Math.pow(nextX - targetX, 2) + Math.pow(nextY - targetY, 2));
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestDir = dir;
                        }
                    });
                    ghost.direction = bestDir;
                }
                if (frameCount % 60 === 0) {
                    console.log(`  ✅ ${ghost.name}: New direction chosen: (${ghost.direction.x}, ${ghost.direction.y})`);
                }
            } else {
                // No valid moves at all - ghost is stuck in a wall!
                console.error(`❌ ${ghost.name}: STUCK IN WALL at (${ghost.gridX}, ${ghost.gridY})! This should never happen!`);
                // Emergency: teleport to a safe starting position
                ghost.x = 14 * CELL_SIZE;
                ghost.y = 15 * CELL_SIZE;
                ghost.gridX = 14;
                ghost.gridY = 15;
                console.log(`  🚑 ${ghost.name}: Emergency teleport to center (14, 15)`);
            }
        }

        // Wrap around tunnels (same as Pac-Man)
        if (ghost.x < 0) {
            console.log(`🌀 ${ghost.name}: Wrapping from left to right at y=${Math.round(ghost.y/CELL_SIZE)}`);
            ghost.x = GAME_WIDTH - CELL_SIZE;
        } else if (ghost.x >= GAME_WIDTH) {
            console.log(`🌀 ${ghost.name}: Wrapping from right to left at y=${Math.round(ghost.y/CELL_SIZE)}`);
            ghost.x = 0;
        }
    }

    // Check ghost collisions
    function checkGhostCollisions() {
        let ghostsEatenThisPowerPellet = 0;

        ghosts.forEach(ghost => {
            const distance = Math.sqrt(
                Math.pow(pacman.x - ghost.x, 2) +
                Math.pow(pacman.y - ghost.y, 2)
            );

            if (distance < CELL_SIZE) {
                if (ghost.mode === 'frightened') {
                    // Eat ghost
                    score += GHOST_POINTS[Math.min(ghostsEatenThisPowerPellet, 3)];
                    ghostsEatenThisPowerPellet++;
                    console.log(`🍴 Pac-Man ate ${ghost.name} at (${ghost.gridX}, ${ghost.gridY})! Now returning to center as eyes.`);
                    ghost.mode = 'eaten';
                    ghost.speed = GHOST_SPEED * 2;
                    ghost.eaten = true;
                    ghost.frightenedTimer = 0; // Clear timer when eaten
                } else if (ghost.mode !== 'eaten') {
                    // Pac-Man dies
                    lives--;
                    if (lives <= 0) {
                        gameOver();
                    } else {
                        // Reset positions
                        pacman = createPacman();
                        ghosts = GHOST_DATA.map(data => createGhost(data));
                    }
                }
            }
        });
    }

    // Update game state
    function update() {
        if (gameState !== 'playing') return;

        frameCount++;

        updatePacman();
        ghosts.forEach(ghost => updateGhost(ghost));
        checkGhostCollisions();
    }

    // Draw maze
    function drawMaze() {
        for (let y = 0; y < MAZE.length; y++) {
            for (let x = 0; x < MAZE[y].length; x++) {
                if (MAZE[y][x] === 1) {
                    ctx.fillStyle = '#0000FF';
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    ctx.strokeStyle = '#4040FF';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }

    // Draw dots
    function drawDots() {
        ctx.fillStyle = '#FFB897';
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Draw power pellets
    function drawPowerPellets() {
        if (frameCount % 20 < 10) { // Blinking effect
            ctx.fillStyle = '#FFB897';
            powerPellets.forEach(pellet => {
                ctx.beginPath();
                ctx.arc(pellet.x, pellet.y, 6, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    // Draw Pac-Man
    function drawPacman() {
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();

        // Calculate mouth direction
        let startAngle = pacman.mouthAngle;
        let endAngle = Math.PI * 2 - pacman.mouthAngle;

        if (pacman.direction.x > 0) { // Right
            startAngle = pacman.mouthAngle;
            endAngle = Math.PI * 2 - pacman.mouthAngle;
        } else if (pacman.direction.x < 0) { // Left
            startAngle = Math.PI + pacman.mouthAngle;
            endAngle = Math.PI - pacman.mouthAngle;
        } else if (pacman.direction.y > 0) { // Down
            startAngle = Math.PI / 2 + pacman.mouthAngle;
            endAngle = Math.PI / 2 - pacman.mouthAngle;
        } else if (pacman.direction.y < 0) { // Up
            startAngle = Math.PI * 1.5 + pacman.mouthAngle;
            endAngle = Math.PI * 1.5 - pacman.mouthAngle;
        }

        ctx.arc(
            pacman.x + CELL_SIZE / 2,
            pacman.y + CELL_SIZE / 2,
            CELL_SIZE / 2 - 2,
            startAngle,
            endAngle
        );
        ctx.lineTo(pacman.x + CELL_SIZE / 2, pacman.y + CELL_SIZE / 2);
        ctx.fill();
    }

    // Draw ghosts
    function drawGhost(ghost) {
        const x = ghost.x + CELL_SIZE / 2;
        const y = ghost.y + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 - 2;

        if (ghost.mode === 'eaten') {
            // Draw eyes only
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x - 4, y - 2, 3, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 2, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0000FF';
            ctx.beginPath();
            ctx.arc(x - 4, y - 2, 1.5, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw ghost body
            if (ghost.mode === 'frightened') {
                ctx.fillStyle = ghost.frightenedTimer < 100 && frameCount % 20 < 10 ? '#FFFFFF' : '#0000FF';
            } else {
                ctx.fillStyle = ghost.color;
            }

            // Body (rounded top)
            ctx.beginPath();
            ctx.arc(x, y - radius / 2, radius, Math.PI, 0, false);
            ctx.lineTo(x + radius, y + radius);

            // Wavy bottom
            ctx.lineTo(x + radius * 0.66, y + radius - 3);
            ctx.lineTo(x + radius * 0.33, y + radius);
            ctx.lineTo(x, y + radius - 3);
            ctx.lineTo(x - radius * 0.33, y + radius);
            ctx.lineTo(x - radius * 0.66, y + radius - 3);
            ctx.lineTo(x - radius, y + radius);
            ctx.lineTo(x - radius, y);
            ctx.fill();

            // Eyes
            if (ghost.mode === 'frightened') {
                // Frightened face
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
                ctx.arc(x + 3, y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Normal eyes
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(x - 4, y - 2, 4, 0, Math.PI * 2);
                ctx.arc(x + 4, y - 2, 4, 0, Math.PI * 2);
                ctx.fill();

                // Pupils (looking in direction of movement)
                ctx.fillStyle = '#0000FF';
                const pupilOffsetX = ghost.direction.x * 2;
                const pupilOffsetY = ghost.direction.y * 2;
                ctx.beginPath();
                ctx.arc(x - 4 + pupilOffsetX, y - 2 + pupilOffsetY, 2, 0, Math.PI * 2);
                ctx.arc(x + 4 + pupilOffsetX, y - 2 + pupilOffsetY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Draw HUD
    function drawHUD() {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 10, GAME_HEIGHT + 20);
        ctx.fillText(`High: ${highScore}`, 150, GAME_HEIGHT + 20);
        ctx.fillText(`Level: ${level}`, 300, GAME_HEIGHT + 20);

        // Draw lives
        for (let i = 0; i < lives; i++) {
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(450 + i * 25, GAME_HEIGHT + 15, 8, 0.2, Math.PI * 2 - 0.2);
            ctx.lineTo(450 + i * 25, GAME_HEIGHT + 15);
            ctx.fill();
        }
    }

    // Draw game
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT + 40);

        if (gameState === 'menu') {
            drawMenu();
        } else if (gameState === 'playing' || gameState === 'levelComplete') {
            drawMaze();
            drawDots();
            drawPowerPellets();
            drawPacman();
            ghosts.forEach(ghost => drawGhost(ghost));
            drawHUD();

            if (gameState === 'levelComplete') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                ctx.fillStyle = '#FFFF00';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('LEVEL COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2);
            }
        } else if (gameState === 'gameOver') {
            drawMaze();
            drawHUD();
            drawGameOver();
        }
    }

    // Draw menu
    function drawMenu() {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAC-MAN', GAME_WIDTH / 2, 150);

        // Draw sample characters
        ctx.save();
        ctx.translate(GAME_WIDTH / 2 - 100, 220);

        // Pac-Man
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(20, 20, 18, 0.3, Math.PI * 2 - 0.3);
        ctx.lineTo(20, 20);
        ctx.fill();

        // Ghosts
        const ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB851'];
        ghostColors.forEach((color, i) => {
            ctx.fillStyle = color;
            const x = 70 + i * 40;
            ctx.beginPath();
            ctx.arc(x, 15, 15, Math.PI, 0, false);
            ctx.lineTo(x + 15, 35);
            ctx.lineTo(x + 10, 32);
            ctx.lineTo(x + 5, 35);
            ctx.lineTo(x, 32);
            ctx.lineTo(x - 5, 35);
            ctx.lineTo(x - 10, 32);
            ctx.lineTo(x - 15, 35);
            ctx.lineTo(x - 15, 15);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x - 5, 15, 3, 0, Math.PI * 2);
            ctx.arc(x + 5, 15, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        ctx.font = '20px Arial';
        ctx.fillText('Use Arrow Keys to Move', GAME_WIDTH / 2, 320);
        ctx.fillText('Eat all dots to complete the level!', GAME_WIDTH / 2, 350);
        ctx.fillText('Power pellets let you eat ghosts!', GAME_WIDTH / 2, 380);

        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('PRESS SPACE TO START', GAME_WIDTH / 2, 450);

        if (highScore > 0) {
            ctx.font = '20px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`High Score: ${highScore}`, GAME_WIDTH / 2, 500);
        }
    }

    // Draw game over
    function drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);

        if (score > highScore) {
            ctx.fillStyle = '#FFFF00';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('NEW HIGH SCORE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        } else {
            ctx.fillText(`High Score: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        }

        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('PRESS SPACE TO PLAY AGAIN', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
    }

    // Game over
    function gameOver() {
        gameState = 'gameOver';

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('pacmanHighScore', highScore.toString());
        }

        cancelAnimationFrame(animationId);
    }

    // Game loop
    function gameLoop() {
        update();
        draw();

        if (gameState === 'playing' || gameState === 'levelComplete') {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    // Handle keyboard input
    function handleKeyDown(e) {
        if (gameState === 'menu' || gameState === 'gameOver') {
            if (e.code === 'Space') {
                e.preventDefault();
                score = 0;
                lives = 3;
                level = 1;
                initGame();
            }
        } else if (gameState === 'playing') {
            if (e.code === 'ArrowUp') {
                e.preventDefault();
                pacman.nextDirection = { x: 0, y: -1 };
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                pacman.nextDirection = { x: 0, y: 1 };
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                pacman.nextDirection = { x: -1, y: 0 };
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                pacman.nextDirection = { x: 1, y: 0 };
            }
        }
    }

    // Touch control variables
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    // Handle touch start
    function handleTouchStart(e) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();

        // Start game on tap if in menu or game over
        if (gameState === 'menu' || gameState === 'gameOver') {
            e.preventDefault();
            score = 0;
            lives = 3;
            level = 1;
            initGame();
        }
    }

    // Handle touch move (for swipe detection)
    function handleTouchMove(e) {
        if (gameState !== 'playing') return;
        e.preventDefault();
    }

    // Handle touch end (swipe detection)
    function handleTouchEnd(e) {
        if (gameState !== 'playing') return;

        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        const touchEndTime = Date.now();

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const deltaTime = touchEndTime - touchStartTime;

        // Minimum swipe distance (30px) and maximum time (300ms for a quick swipe)
        const minSwipeDistance = 30;

        if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
            // Determine primary direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    pacman.nextDirection = { x: 1, y: 0 }; // Right
                } else {
                    pacman.nextDirection = { x: -1, y: 0 }; // Left
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    pacman.nextDirection = { x: 0, y: 1 }; // Down
                } else {
                    pacman.nextDirection = { x: 0, y: -1 }; // Up
                }
            }
        }
    }

    // Handle d-pad button clicks
    function handleDPadClick(direction) {
        if (gameState === 'playing') {
            pacman.nextDirection = direction;
        }
    }

    // Launch Pac-Man
    window.launchPacman = function() {
        const content = document.getElementById('pacmanContent');

        content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <canvas id="pacmanCanvas" width="${GAME_WIDTH}" height="${GAME_HEIGHT + 40}" style="
                    border: 4px solid #0000FF;
                    border-radius: 10px;
                    max-width: 100%;
                    height: auto;
                    background: #000000;
                    cursor: pointer;
                    touch-action: none;
                "></canvas>

                <div style="text-align: center; color: #666;">
                    <p style="margin: 0.5rem 0;">🕹️ <strong>Controls:</strong> Arrow keys or swipe to move</p>
                    <p style="margin: 0.5rem 0;">💊 <strong>Strategy:</strong> Eat power pellets to turn ghosts blue!</p>
                </div>

                <!-- D-Pad Controls -->
                <div id="dpadControls" style="display: grid; grid-template-columns: repeat(3, 60px); grid-template-rows: repeat(3, 60px); gap: 5px; margin-top: 1rem;">
                    <div style="grid-column: 2;"></div>
                    <button id="btnUp" style="grid-column: 2; grid-row: 1; background: linear-gradient(145deg, #4a4a4a, #2a2a2a); border: 2px solid #666; border-radius: 10px; color: white; font-size: 24px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); user-select: none; -webkit-tap-highlight-color: transparent;">▲</button>
                    <div style="grid-column: 2;"></div>

                    <button id="btnLeft" style="grid-column: 1; grid-row: 2; background: linear-gradient(145deg, #4a4a4a, #2a2a2a); border: 2px solid #666; border-radius: 10px; color: white; font-size: 24px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); user-select: none; -webkit-tap-highlight-color: transparent;">◀</button>
                    <div style="grid-column: 2; grid-row: 2; background: #1a1a1a; border: 2px solid #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">PAC</div>
                    <button id="btnRight" style="grid-column: 3; grid-row: 2; background: linear-gradient(145deg, #4a4a4a, #2a2a2a); border: 2px solid #666; border-radius: 10px; color: white; font-size: 24px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); user-select: none; -webkit-tap-highlight-color: transparent;">▶</button>

                    <div style="grid-column: 2;"></div>
                    <button id="btnDown" style="grid-column: 2; grid-row: 3; background: linear-gradient(145deg, #4a4a4a, #2a2a2a); border: 2px solid #666; border-radius: 10px; color: white; font-size: 24px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); user-select: none; -webkit-tap-highlight-color: transparent;">▼</button>
                    <div style="grid-column: 2;"></div>
                </div>
            </div>
        `;

        // Show game section
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('pacmanGame').style.display = 'block';

        // Initialize canvas
        gameCanvas = document.getElementById('pacmanCanvas');
        ctx = gameCanvas.getContext('2d');

        gameState = 'menu';
        draw();

        // Event listeners for keyboard
        document.addEventListener('keydown', handleKeyDown);

        // Event listeners for touch on canvas (swipe)
        gameCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Event listeners for d-pad buttons
        document.getElementById('btnUp').addEventListener('click', () => handleDPadClick({ x: 0, y: -1 }));
        document.getElementById('btnDown').addEventListener('click', () => handleDPadClick({ x: 0, y: 1 }));
        document.getElementById('btnLeft').addEventListener('click', () => handleDPadClick({ x: -1, y: 0 }));
        document.getElementById('btnRight').addEventListener('click', () => handleDPadClick({ x: 1, y: 0 }));

        // Also handle touch events for d-pad (better mobile experience)
        document.getElementById('btnUp').addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDPadClick({ x: 0, y: -1 });
        });
        document.getElementById('btnDown').addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDPadClick({ x: 0, y: 1 });
        });
        document.getElementById('btnLeft').addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDPadClick({ x: -1, y: 0 });
        });
        document.getElementById('btnRight').addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDPadClick({ x: 1, y: 0 });
        });
    };

    // Exit to menu
    window.exitPacmanToMenu = function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        document.removeEventListener('keydown', handleKeyDown);

        // Remove touch event listeners
        if (gameCanvas) {
            gameCanvas.removeEventListener('touchstart', handleTouchStart);
            gameCanvas.removeEventListener('touchmove', handleTouchMove);
            gameCanvas.removeEventListener('touchend', handleTouchEnd);
        }

        document.getElementById('pacmanGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };
})();
