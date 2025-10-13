// Pac-Man Game - Grid-based architecture
(function() {
    'use strict';

    // Game Constants
    const TILE_SIZE = 20;
    const GRID_WIDTH = 28;
    const GRID_HEIGHT = 31;
    const CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE;
    const CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE;

    // Tile types
    const TILE = {
        EMPTY: 0,
        WALL: 1,
        DOT: 2,
        POWER: 3,
        GHOST_HOUSE: 4,
        TUNNEL: 5
    };

    // Directions
    const DIR = {
        UP: { x: 0, y: -1, name: 'UP' },
        DOWN: { x: 0, y: 1, name: 'DOWN' },
        LEFT: { x: -1, y: 0, name: 'LEFT' },
        RIGHT: { x: 1, y: 0, name: 'RIGHT' },
        NONE: { x: 0, y: 0, name: 'NONE' }
    };

    // Game state
    let canvas, ctx;
    let gameState = 'menu'; // menu, playing, paused, gameover
    let score = 0;
    let lives = 3;
    let level = 1;
    let dotsRemaining = 0;
    let powerMode = false;
    let powerModeTimer = 0;
    const POWER_MODE_DURATION = 300; // 10 seconds at 30 FPS

    // Maze layout (classic Pac-Man inspired)
    let maze = [];
    let originalMaze = [];

    // Entities
    let pacman = null;
    let ghosts = [];

    // Game loop
    let animationFrameId = null;
    let lastFrameTime = 0;
    const FRAME_RATE = 30;
    const FRAME_DURATION = 1000 / FRAME_RATE;

    // Initialize maze (classic Pac-Man layout)
    function createMaze() {
        // 1=wall, 0=empty, 2=dot, 3=power pellet, 4=ghost house, 5=tunnel
        const layout = [
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
            [1,1,1,1,1,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
            [5,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,5],
            [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
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

        maze = layout.map(row => [...row]);
        originalMaze = layout.map(row => [...row]);

        // Count dots
        dotsRemaining = 0;
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (maze[y][x] === TILE.DOT || maze[y][x] === TILE.POWER) {
                    dotsRemaining++;
                }
            }
        }
    }

    // Check if tile is walkable
    function isWalkable(x, y) {
        if (y < 0 || y >= GRID_HEIGHT || x < 0 || x >= GRID_WIDTH) {
            return false;
        }
        return maze[y][x] !== TILE.WALL;
    }

    // Check if tile is walkable for ghosts
    function isWalkableForGhost(x, y, ghost) {
        if (y < 0 || y >= GRID_HEIGHT) return false;

        // Handle tunnel wrapping
        if (y === 14 && (x < 0 || x >= GRID_WIDTH)) {
            return true;
        }

        if (x < 0 || x >= GRID_WIDTH) return false;

        const tile = maze[y][x];

        // Eaten/exiting ghosts can move through ghost house
        if (ghost.mode === 'eaten' || ghost.mode === 'exiting') {
            return tile !== TILE.WALL;
        }

        // Normal ghosts can't enter ghost house
        return tile !== TILE.WALL && tile !== TILE.GHOST_HOUSE;
    }

    // Get available directions at intersection
    function getAvailableDirections(x, y, currentDir, isGhost, ghost) {
        const directions = [];
        const checkFunc = isGhost ?
            (dx, dy) => isWalkableForGhost(x + dx, y + dy, ghost) :
            (dx, dy) => isWalkable(x + dx, y + dy);

        // Check all four directions
        if (checkFunc(0, -1) && currentDir.name !== 'DOWN') directions.push(DIR.UP);
        if (checkFunc(0, 1) && currentDir.name !== 'UP') directions.push(DIR.DOWN);
        if (checkFunc(-1, 0) && currentDir.name !== 'RIGHT') directions.push(DIR.LEFT);
        if (checkFunc(1, 0) && currentDir.name !== 'LEFT') directions.push(DIR.RIGHT);

        return directions;
    }

    // Pac-Man entity
    function createPacman() {
        return {
            gridX: 14,
            gridY: 23,
            pixelX: 14 * TILE_SIZE + TILE_SIZE / 2,
            pixelY: 23 * TILE_SIZE + TILE_SIZE / 2,
            direction: DIR.NONE,
            nextDirection: DIR.NONE,
            speed: 3.5, // pixels per frame (~105 px/sec at 30fps)
            animation: 0
        };
    }

    // Ghost entity
    function createGhost(name, color, startX, startY, scatterTarget) {
        return {
            name: name,
            color: color,
            gridX: startX,
            gridY: startY,
            pixelX: startX * TILE_SIZE + TILE_SIZE / 2,
            pixelY: startY * TILE_SIZE + TILE_SIZE / 2,
            startX: startX,
            startY: startY,
            direction: DIR.LEFT,
            mode: 'chase', // chase, frightened, eaten, exiting
            scatterTarget: scatterTarget,
            speed: 3.0, // pixels per frame (~90 px/sec at 30fps)
            animation: 0
        };
    }

    // Initialize ghosts with unique personalities
    function createGhosts() {
        const ghosts = [
            createGhost('Blinky', '#FF0000', 14, 11, { x: 25, y: 0 }),  // Red - starts outside, direct chase
            createGhost('Pinky', '#FFB8FF', 14, 13, { x: 2, y: 0 }),    // Pink - in house, ambush
            createGhost('Inky', '#00FFFF', 13, 13, { x: 27, y: 30 }),   // Cyan - in house, complex
            createGhost('Clyde', '#FFB851', 15, 13, { x: 0, y: 30 })    // Orange - in house, shy
        ];

        // Ghosts in the house should start in exiting mode
        ghosts.forEach(ghost => {
            if (ghost.gridY >= 12 && ghost.gridY <= 14) {
                ghost.mode = 'exiting';
            }
        });

        return ghosts;
    }

    // BFS pathfinding for eaten ghosts
    function findPathBFS(startX, startY, targetX, targetY, ghost) {
        const queue = [{ x: startX, y: startY, path: [] }];
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === targetX && current.y === targetY) {
                return current.path.length > 0 ? current.path[0] : DIR.NONE;
            }

            // Try all four directions
            const directions = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
            for (const dir of directions) {
                let nextX = current.x + dir.x;
                let nextY = current.y + dir.y;

                // Handle tunnel wrapping
                if (nextY === 14) {
                    if (nextX < 0) nextX = GRID_WIDTH - 1;
                    if (nextX >= GRID_WIDTH) nextX = 0;
                }

                if (isWalkableForGhost(nextX, nextY, ghost)) {
                    const key = `${nextX},${nextY}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        queue.push({
                            x: nextX,
                            y: nextY,
                            path: [...current.path, dir]
                        });
                    }
                }
            }
        }

        return DIR.NONE;
    }

    // Ghost AI - Target selection based on personality
    function getGhostTarget(ghost) {
        // Eaten ghosts return to ghost house
        if (ghost.mode === 'eaten') {
            return { x: 14, y: 14 };
        }

        // Exiting ghosts move to exit position
        if (ghost.mode === 'exiting') {
            return { x: 14, y: 11 };
        }

        // Frightened ghosts move randomly
        if (ghost.mode === 'frightened') {
            return null; // Will choose random direction
        }

        // Scatter mode - each ghost goes to their corner
        if (ghost.mode === 'scatter') {
            return ghost.scatterTarget;
        }

        // Chase mode - each ghost has unique targeting
        switch (ghost.name) {
            case 'Blinky': // Red - directly target Pac-Man
                return { x: pacman.gridX, y: pacman.gridY };

            case 'Pinky': // Pink - target 4 tiles ahead of Pac-Man
                return {
                    x: pacman.gridX + (pacman.direction.x * 4),
                    y: pacman.gridY + (pacman.direction.y * 4)
                };

            case 'Inky': // Cyan - complex targeting using Blinky
                const blinky = ghosts.find(g => g.name === 'Blinky');
                if (blinky) {
                    const pivotX = pacman.gridX + (pacman.direction.x * 2);
                    const pivotY = pacman.gridY + (pacman.direction.y * 2);
                    return {
                        x: pivotX + (pivotX - blinky.gridX),
                        y: pivotY + (pivotY - blinky.gridY)
                    };
                }
                return { x: pacman.gridX, y: pacman.gridY };

            case 'Clyde': // Orange - chase when far, scatter when close
                const dist = Math.abs(ghost.gridX - pacman.gridX) + Math.abs(ghost.gridY - pacman.gridY);
                if (dist > 8) {
                    return { x: pacman.gridX, y: pacman.gridY };
                } else {
                    return ghost.scatterTarget;
                }

            default:
                return { x: pacman.gridX, y: pacman.gridY };
        }
    }

    // Choose best direction for ghost
    function chooseGhostDirection(ghost) {
        const target = getGhostTarget(ghost);

        // Frightened mode - choose random valid direction
        if (ghost.mode === 'frightened') {
            const available = getAvailableDirections(ghost.gridX, ghost.gridY, ghost.direction, true, ghost);
            if (available.length > 0) {
                return available[Math.floor(Math.random() * available.length)];
            }
            return ghost.direction;
        }

        // Eaten mode - use BFS pathfinding
        if (ghost.mode === 'eaten') {
            const dir = findPathBFS(ghost.gridX, ghost.gridY, target.x, target.y, ghost);
            return dir !== DIR.NONE ? dir : ghost.direction;
        }

        // Exiting mode - move to exit
        if (ghost.mode === 'exiting') {
            const dir = findPathBFS(ghost.gridX, ghost.gridY, target.x, target.y, ghost);
            return dir !== DIR.NONE ? dir : ghost.direction;
        }

        // Normal chase/scatter - choose direction that minimizes distance to target
        const available = getAvailableDirections(ghost.gridX, ghost.gridY, ghost.direction, true, ghost);
        if (available.length === 0) {
            return ghost.direction;
        }

        let bestDir = available[0];
        let bestDist = Infinity;

        for (const dir of available) {
            const nextX = ghost.gridX + dir.x;
            const nextY = ghost.gridY + dir.y;
            const dist = Math.abs(nextX - target.x) + Math.abs(nextY - target.y);
            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }

        return bestDir;
    }

    // Check if entity is aligned with grid
    function isAlignedWithGrid(pixelX, pixelY) {
        return Math.abs(pixelX % TILE_SIZE - TILE_SIZE / 2) < 3 &&
               Math.abs(pixelY % TILE_SIZE - TILE_SIZE / 2) < 3;
    }

    // Update Pac-Man
    function updatePacman() {
        pacman.animation++;

        // Update grid position based on pixel position (centered entities)
        pacman.gridX = Math.floor(pacman.pixelX / TILE_SIZE);
        pacman.gridY = Math.floor(pacman.pixelY / TILE_SIZE);

        // Try to change direction when aligned with grid
        if (isAlignedWithGrid(pacman.pixelX, pacman.pixelY) && pacman.nextDirection !== DIR.NONE) {
            const nextGridX = pacman.gridX + pacman.nextDirection.x;
            const nextGridY = pacman.gridY + pacman.nextDirection.y;
            if (isWalkable(nextGridX, nextGridY)) {
                pacman.direction = pacman.nextDirection;
                pacman.nextDirection = DIR.NONE;
                // Snap to grid center
                pacman.pixelX = pacman.gridX * TILE_SIZE + TILE_SIZE / 2;
                pacman.pixelY = pacman.gridY * TILE_SIZE + TILE_SIZE / 2;
            }
        }

        // Move in current direction
        if (pacman.direction !== DIR.NONE) {
            const newPixelX = pacman.pixelX + pacman.direction.x * pacman.speed;
            const newPixelY = pacman.pixelY + pacman.direction.y * pacman.speed;
            const newGridX = Math.floor(newPixelX / TILE_SIZE);
            const newGridY = Math.floor(newPixelY / TILE_SIZE);

            // Handle tunnel wrapping
            if (newGridY === 14) {
                if (newPixelX < 0) {
                    pacman.pixelX = (GRID_WIDTH - 1) * TILE_SIZE + TILE_SIZE / 2;
                    return;
                }
                if (newPixelX >= GRID_WIDTH * TILE_SIZE) {
                    pacman.pixelX = TILE_SIZE / 2;
                    return;
                }
            }

            // Check if we can move to the new position
            if (isWalkable(newGridX, newGridY)) {
                pacman.pixelX = newPixelX;
                pacman.pixelY = newPixelY;

                // Eat dot or power pellet (only when grid position changes)
                if (pacman.gridX !== newGridX || pacman.gridY !== newGridY) {
                    const tile = maze[newGridY][newGridX];
                    if (tile === TILE.DOT) {
                        maze[newGridY][newGridX] = TILE.EMPTY;
                        score += 10;
                        dotsRemaining--;
                    } else if (tile === TILE.POWER) {
                        maze[newGridY][newGridX] = TILE.EMPTY;
                        score += 50;
                        dotsRemaining--;
                        activatePowerMode();
                    }
                }
            } else {
                // Hit wall, stop
                pacman.direction = DIR.NONE;
            }
        }
    }

    // Activate power mode
    function activatePowerMode() {
        powerMode = true;
        powerModeTimer = POWER_MODE_DURATION;

        // Make all non-eaten ghosts frightened
        // They continue in their current direction until next intersection
        ghosts.forEach(ghost => {
            if (ghost.mode !== 'eaten' && ghost.mode !== 'exiting') {
                ghost.mode = 'frightened';
            }
        });
    }

    // Update ghosts
    function updateGhosts() {
        ghosts.forEach(ghost => {
            ghost.animation++;

            // Update grid position based on pixel position (centered entities)
            ghost.gridX = Math.floor(ghost.pixelX / TILE_SIZE);
            ghost.gridY = Math.floor(ghost.pixelY / TILE_SIZE);

            // Check if reached target in special modes
            if (ghost.mode === 'eaten' && ghost.gridX === 14 && ghost.gridY === 14) {
                ghost.mode = 'exiting';
            }

            if (ghost.mode === 'exiting' && ghost.gridX === 14 && ghost.gridY === 11) {
                ghost.mode = 'chase';
            }

            // Choose direction when aligned with grid
            if (isAlignedWithGrid(ghost.pixelX, ghost.pixelY)) {
                const newDirection = chooseGhostDirection(ghost);
                if (newDirection !== DIR.NONE) {
                    // Only snap to grid center when changing direction
                    if (newDirection.name !== ghost.direction.name) {
                        ghost.pixelX = ghost.gridX * TILE_SIZE + TILE_SIZE / 2;
                        ghost.pixelY = ghost.gridY * TILE_SIZE + TILE_SIZE / 2;
                    }
                    ghost.direction = newDirection;
                }
            }

            // Determine speed based on mode
            let currentSpeed = ghost.speed;
            if (ghost.mode === 'eaten') {
                currentSpeed = 5.0; // Faster when eaten (~150 px/sec)
            } else if (ghost.mode === 'frightened') {
                currentSpeed = 2.0; // Slower when frightened (~60 px/sec)
            }

            // Move in current direction
            if (ghost.direction !== DIR.NONE) {
                const newPixelX = ghost.pixelX + ghost.direction.x * currentSpeed;
                const newPixelY = ghost.pixelY + ghost.direction.y * currentSpeed;
                const newGridX = Math.floor(newPixelX / TILE_SIZE);
                const newGridY = Math.floor(newPixelY / TILE_SIZE);

                // Handle tunnel wrapping
                if (newGridY === 14) {
                    if (newPixelX < 0) {
                        ghost.pixelX = (GRID_WIDTH - 1) * TILE_SIZE + TILE_SIZE / 2;
                        return;
                    }
                    if (newPixelX >= GRID_WIDTH * TILE_SIZE) {
                        ghost.pixelX = TILE_SIZE / 2;
                        return;
                    }
                }

                // Check if we can move to the new position
                if (isWalkableForGhost(newGridX, newGridY, ghost)) {
                    ghost.pixelX = newPixelX;
                    ghost.pixelY = newPixelY;
                }
            }
        });
    }

    // Check collisions
    function checkCollisions() {
        ghosts.forEach(ghost => {
            if (ghost.gridX === pacman.gridX && ghost.gridY === pacman.gridY) {
                if (ghost.mode === 'frightened') {
                    // Eat ghost
                    ghost.mode = 'eaten';
                    score += 200;
                } else if (ghost.mode !== 'eaten' && ghost.mode !== 'exiting') {
                    // Pac-Man dies
                    loseLife();
                }
            }
        });
    }

    // Lose a life
    function loseLife() {
        lives--;
        if (lives <= 0) {
            gameState = 'gameover';
        } else {
            // Reset positions
            pacman = createPacman();
            ghosts = createGhosts();
            powerMode = false;
            powerModeTimer = 0;
        }
    }

    // Update power mode timer
    function updatePowerMode() {
        if (powerMode) {
            powerModeTimer--;
            if (powerModeTimer <= 0) {
                powerMode = false;
                // Return frightened ghosts to chase mode
                ghosts.forEach(ghost => {
                    if (ghost.mode === 'frightened') {
                        ghost.mode = 'chase';
                    }
                });
            }
        }
    }

    // Check level complete
    function checkLevelComplete() {
        if (dotsRemaining <= 0) {
            level++;
            createMaze();
            pacman = createPacman();
            ghosts = createGhosts();
            powerMode = false;
            powerModeTimer = 0;
        }
    }

    // Game update loop
    function update() {
        if (gameState !== 'playing') return;

        updatePacman();
        updateGhosts();
        checkCollisions();
        updatePowerMode();
        checkLevelComplete();
    }

    // Render maze
    function renderMaze() {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const tile = maze[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                if (tile === TILE.WALL) {
                    ctx.fillStyle = '#2121FF';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#4242FF';
                    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
                } else if (tile === TILE.DOT) {
                    ctx.fillStyle = '#FFB897';
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === TILE.POWER) {
                    ctx.fillStyle = '#FFB897';
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 5, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === TILE.GHOST_HOUSE) {
                    ctx.fillStyle = '#FF69B4';
                    ctx.globalAlpha = 0.2;
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.globalAlpha = 1.0;
                }
            }
        }
    }

    // Render Pac-Man
    function renderPacman() {
        const px = pacman.pixelX;
        const py = pacman.pixelY;
        const radius = TILE_SIZE / 2 - 2;

        // Mouth animation
        const mouthAngle = Math.abs(Math.sin(pacman.animation * 0.2)) * 0.4;

        let startAngle = mouthAngle;
        let endAngle = Math.PI * 2 - mouthAngle;

        // Rotate based on direction
        if (pacman.direction === DIR.RIGHT) {
            startAngle = mouthAngle;
            endAngle = Math.PI * 2 - mouthAngle;
        } else if (pacman.direction === DIR.LEFT) {
            startAngle = Math.PI + mouthAngle;
            endAngle = Math.PI - mouthAngle;
        } else if (pacman.direction === DIR.UP) {
            startAngle = Math.PI * 1.5 + mouthAngle;
            endAngle = Math.PI * 1.5 - mouthAngle;
        } else if (pacman.direction === DIR.DOWN) {
            startAngle = Math.PI * 0.5 + mouthAngle;
            endAngle = Math.PI * 0.5 - mouthAngle;
        }

        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(px, py, radius, startAngle, endAngle);
        ctx.lineTo(px, py);
        ctx.closePath();
        ctx.fill();
    }

    // Render ghost
    function renderGhost(ghost) {
        const px = ghost.pixelX;
        const py = ghost.pixelY;
        const radius = TILE_SIZE / 2 - 2;

        if (ghost.mode === 'eaten') {
            // Just eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(px - 4, py, 3, 0, Math.PI * 2);
            ctx.arc(px + 4, py, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0000FF';
            ctx.beginPath();
            ctx.arc(px - 4, py, 1.5, 0, Math.PI * 2);
            ctx.arc(px + 4, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Full ghost body
            ctx.fillStyle = ghost.mode === 'frightened' ? '#0000FF' : ghost.color;

            // Body
            ctx.beginPath();
            ctx.arc(px, py - 2, radius, Math.PI, 0);
            ctx.lineTo(px + radius, py + radius);
            ctx.lineTo(px + radius - 4, py + radius - 4);
            ctx.lineTo(px, py + radius);
            ctx.lineTo(px - radius + 4, py + radius - 4);
            ctx.lineTo(px - radius, py + radius);
            ctx.closePath();
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(px - 4, py - 2, 3, 0, Math.PI * 2);
            ctx.arc(px + 4, py - 2, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(px - 4, py - 2, 1.5, 0, Math.PI * 2);
            ctx.arc(px + 4, py - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Render UI
    function renderUI() {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 10, CANVAS_HEIGHT + 25);
        ctx.fillText(`LEVEL: ${level}`, 150, CANVAS_HEIGHT + 25);

        // Lives
        ctx.fillText('LIVES:', 300, CANVAS_HEIGHT + 25);
        for (let i = 0; i < lives; i++) {
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(370 + i * 25, CANVAS_HEIGHT + 20, 8, 0.2, Math.PI * 2 - 0.2);
            ctx.lineTo(370 + i * 25, CANVAS_HEIGHT + 20);
            ctx.closePath();
            ctx.fill();
        }

        // Power mode indicator
        if (powerMode) {
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`POWER! ${Math.ceil(powerModeTimer / FRAME_RATE)}s`, CANVAS_WIDTH / 2, CANVAS_HEIGHT + 25);
        }
    }

    // Render game
    function render() {
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT + 40);

        if (gameState === 'menu') {
            ctx.fillStyle = '#FFFF00';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAC-MAN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '18px Arial';
            ctx.fillText('Use Arrow Keys to Move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
            ctx.fillText('Eat all dots to win!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
            ctx.fillText('Click to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
        } else if (gameState === 'playing' || gameState === 'paused') {
            renderMaze();
            renderPacman();
            ghosts.forEach(renderGhost);
            renderUI();

            if (gameState === 'paused') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            }
        } else if (gameState === 'gameover') {
            renderMaze();
            renderUI();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
            ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
        }
    }

    // Game loop
    function gameLoop(timestamp) {
        if (!lastFrameTime) lastFrameTime = timestamp;
        const deltaTime = timestamp - lastFrameTime;

        if (deltaTime >= FRAME_DURATION) {
            update();
            render();
            lastFrameTime = timestamp - (deltaTime % FRAME_DURATION);
        }

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // Handle keyboard input
    function handleKeyDown(e) {
        if (gameState !== 'playing') return;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                pacman.nextDirection = DIR.UP;
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                pacman.nextDirection = DIR.DOWN;
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                pacman.nextDirection = DIR.LEFT;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                pacman.nextDirection = DIR.RIGHT;
                e.preventDefault();
                break;
            case ' ':
            case 'Escape':
                gameState = gameState === 'playing' ? 'paused' : 'playing';
                e.preventDefault();
                break;
        }
    }

    // Handle canvas click
    function handleClick() {
        if (gameState === 'menu' || gameState === 'gameover') {
            startGame();
        } else if (gameState === 'paused') {
            gameState = 'playing';
        }
    }

    // Start game
    function startGame() {
        score = 0;
        lives = 3;
        level = 1;
        powerMode = false;
        powerModeTimer = 0;

        createMaze();
        pacman = createPacman();
        ghosts = createGhosts();

        gameState = 'playing';
    }

    // Initialize game
    function initGame() {
        canvas = document.getElementById('pacmanCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        ctx = canvas.getContext('2d');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT + 40; // Extra space for UI

        createMaze();
        pacman = createPacman();
        ghosts = createGhosts();

        // Event listeners
        document.addEventListener('keydown', handleKeyDown);
        canvas.addEventListener('click', handleClick);

        // Start game loop
        gameLoop(0);
    }

    // Launch game
    window.launchPacman = function() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('pacmanGame').style.display = 'block';

        if (!animationFrameId) {
            initGame();
        }
    };

    // Exit game
    window.exitPacman = function() {
        document.getElementById('pacmanGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        gameState = 'menu';
        lastFrameTime = 0;
    };

})();
