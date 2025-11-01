// Frogger - Classic 1981 Konami arcade game
(function() {
    'use strict';

    // Game constants
    const CANVAS_WIDTH = 560;
    const CANVAS_HEIGHT = 728;
    const TILE_SIZE = 56;
    const COLS = 10;
    const ROWS = 13;

    // Lane configuration
    const ROAD_LANES = [7, 8, 9, 10, 11]; // Rows with vehicles
    const WATER_LANES = [1, 2, 3, 4, 5]; // Rows with logs/turtles
    const SAFE_LANES = [0, 6, 12]; // Safe zones
    const HOME_ROW = 0;
    const START_ROW = 12;

    // Home positions (lily pads)
    const HOME_POSITIONS = [1, 3, 5, 7, 9]; // Column positions

    // Vehicle types and speeds (base speeds - much slower)
    const VEHICLE_TYPES = [
        { emoji: '🚗', width: 1, speed: 0.6, color: '#e74c3c' },
        { emoji: '🚕', width: 1, speed: 0.7, color: '#f39c12' },
        { emoji: '🚙', width: 1, speed: 0.5, color: '#3498db' },
        { emoji: '🚚', width: 2, speed: 0.4, color: '#95a5a6' },
        { emoji: '🚌', width: 2, speed: 0.45, color: '#9b59b6' }
    ];

    // River obstacle types (base speeds - much slower)
    const LOG_TYPES = [
        { emoji: '🪵', width: 3, speed: 0.5 },
        { emoji: '🪵', width: 4, speed: 0.4 },
        { emoji: '🪵', width: 2, speed: 0.6 }
    ];

    // Game state
    let gameState = {
        canvas: null,
        ctx: null,
        frog: { row: START_ROW, col: 5, moving: false, moveProgress: 0 },
        lives: 3,
        score: 0,
        level: 1,
        timeLeft: 60,
        timeMax: 60,
        gameOver: false,
        won: false,
        homesOccupied: [false, false, false, false, false],
        frogsHome: 0,
        vehicles: [],
        waterObstacles: [],
        keys: { up: false, down: false, left: false, right: false },
        moveQueued: null,
        animationId: null,
        timerInterval: null,
        specialItems: [], // Lady frog, flies
        crocodiles: [] // Crocodile positions on logs
    };

    // Initialize game
    function initGame() {
        const canvas = document.getElementById('froggerCanvas');
        if (!canvas) return;

        gameState.canvas = canvas;
        gameState.ctx = canvas.getContext('2d');

        resetGame();
        setupEventListeners();
        startTimer();
        gameLoop();
    }

    function resetGame() {
        gameState.score = 0;
        gameState.lives = 3;
        gameState.level = 1;
        gameState.gameOver = false;
        gameState.won = false;
        gameState.homesOccupied = [false, false, false, false, false];
        gameState.frogsHome = 0;
        resetLevel();
    }

    function resetLevel() {
        gameState.timeLeft = gameState.timeMax;
        gameState.frog = { row: START_ROW, col: 5, moving: false, moveProgress: 0 };
        gameState.moveQueued = null;
        createVehicles();
        createWaterObstacles();
        createSpecialItems();
    }

    function resetFrog() {
        gameState.frog = { row: START_ROW, col: 5, moving: false, moveProgress: 0 };
        gameState.moveQueued = null;
        gameState.timeLeft = gameState.timeMax;
    }

    // Create vehicles for road lanes
    function createVehicles() {
        gameState.vehicles = [];

        ROAD_LANES.forEach((row, index) => {
            const direction = index % 2 === 0 ? 1 : -1; // Alternate directions
            const vehicleType = VEHICLE_TYPES[index % VEHICLE_TYPES.length];
            const speed = vehicleType.speed * (1 + gameState.level * 0.05) * direction; // Reduced from 0.1 to 0.05
            const gap = 3 + Math.random() * 2;

            // Create multiple vehicles per lane
            for (let i = 0; i < COLS; i += gap) {
                gameState.vehicles.push({
                    row: row,
                    col: i + Math.random() * gap,
                    type: vehicleType,
                    speed: speed,
                    direction: direction
                });
            }
        });
    }

    // Create logs and turtles for water lanes
    function createWaterObstacles() {
        gameState.waterObstacles = [];
        gameState.crocodiles = [];

        WATER_LANES.forEach((row, index) => {
            const direction = index % 2 === 0 ? -1 : 1; // Alternate opposite from road
            const logType = LOG_TYPES[index % LOG_TYPES.length];
            const isTurtle = index % 2 === 1;
            const speed = logType.speed * (1 + gameState.level * 0.04) * direction; // Reduced from 0.08 to 0.04
            const gap = 4 + Math.random() * 2;

            // Create multiple obstacles per lane
            for (let i = 0; i < COLS * 1.5; i += gap) {
                const obstacle = {
                    row: row,
                    col: i + Math.random() * gap,
                    width: logType.width,
                    speed: speed,
                    direction: direction,
                    isTurtle: isTurtle,
                    diving: false,
                    diveTimer: Math.random() * 300 + 200
                };

                gameState.waterObstacles.push(obstacle);

                // Some logs are crocodiles (level 2+)
                if (!isTurtle && gameState.level >= 2 && Math.random() < 0.15) {
                    gameState.crocodiles.push({
                        obstacle: obstacle,
                        mouthOpen: false,
                        mouthTimer: Math.random() * 200 + 100
                    });
                }
            }
        });
    }

    // Create special items (lady frog, flies)
    function createSpecialItems() {
        gameState.specialItems = [];

        // Maybe spawn a fly in one of the homes
        if (Math.random() < 0.3) {
            const availableHomes = HOME_POSITIONS.filter((_, i) => !gameState.homesOccupied[i]);
            if (availableHomes.length > 0) {
                const homeCol = availableHomes[Math.floor(Math.random() * availableHomes.length)];
                gameState.specialItems.push({
                    type: 'fly',
                    row: HOME_ROW,
                    col: homeCol,
                    points: 200
                });
            }
        }

        // Maybe spawn a lady frog on a log
        if (Math.random() < 0.2 && gameState.waterObstacles.length > 0) {
            const randomObstacle = gameState.waterObstacles[Math.floor(Math.random() * gameState.waterObstacles.length)];
            if (!randomObstacle.isTurtle) {
                gameState.specialItems.push({
                    type: 'ladyFrog',
                    row: randomObstacle.row,
                    col: randomObstacle.col + 1,
                    obstacle: randomObstacle,
                    points: 200
                });
            }
        }
    }

    // Setup controls
    function setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (gameState.gameOver) return;

            if (e.key === 'ArrowUp' && !gameState.keys.up) {
                gameState.keys.up = true;
                queueMove('up');
            }
            if (e.key === 'ArrowDown' && !gameState.keys.down) {
                gameState.keys.down = true;
                queueMove('down');
            }
            if (e.key === 'ArrowLeft' && !gameState.keys.left) {
                gameState.keys.left = true;
                queueMove('left');
            }
            if (e.key === 'ArrowRight' && !gameState.keys.right) {
                gameState.keys.right = true;
                queueMove('right');
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowUp') gameState.keys.up = false;
            if (e.key === 'ArrowDown') gameState.keys.down = false;
            if (e.key === 'ArrowLeft') gameState.keys.left = false;
            if (e.key === 'ArrowRight') gameState.keys.right = false;
        });
    }

    // Setup mobile touch controls
    function setupMobileControls() {
        const btnUp = document.getElementById('froggerBtnUp');
        const btnDown = document.getElementById('froggerBtnDown');
        const btnLeft = document.getElementById('froggerBtnLeft');
        const btnRight = document.getElementById('froggerBtnRight');

        if (btnUp) {
            btnUp.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!gameState.gameOver) queueMove('up');
            });
            btnUp.addEventListener('click', (e) => {
                e.preventDefault();
                if (!gameState.gameOver) queueMove('up');
            });
        }

        if (btnDown) {
            btnDown.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!gameState.gameOver) queueMove('down');
            });
            btnDown.addEventListener('click', (e) => {
                e.preventDefault();
                if (!gameState.gameOver) queueMove('down');
            });
        }

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!gameState.gameOver) queueMove('left');
            });
            btnLeft.addEventListener('click', (e) => {
                e.preventDefault();
                if (!gameState.gameOver) queueMove('left');
            });
        }

        if (btnRight) {
            btnRight.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!gameState.gameOver) queueMove('right');
            });
            btnRight.addEventListener('click', (e) => {
                e.preventDefault();
                if (!gameState.gameOver) queueMove('right');
            });
        }
    }

    // Queue a movement
    function queueMove(direction) {
        if (!gameState.frog.moving) {
            gameState.moveQueued = direction;
        }
    }

    // Process queued movement
    function processMove() {
        if (gameState.moveQueued && !gameState.frog.moving) {
            const direction = gameState.moveQueued;
            gameState.moveQueued = null;

            let newRow = gameState.frog.row;
            let newCol = gameState.frog.col;

            if (direction === 'up') newRow--;
            else if (direction === 'down') newRow++;
            else if (direction === 'left') newCol--;
            else if (direction === 'right') newCol++;

            // Check boundaries
            if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS) {
                return; // Can't move out of bounds
            }

            // Award points for moving forward
            if (direction === 'up' && newRow < gameState.frog.row) {
                gameState.score += 10;
            }

            gameState.frog.row = newRow;
            gameState.frog.col = newCol;
            gameState.frog.moving = true;
            gameState.frog.moveProgress = 0;
        }
    }

    // Start timer
    function startTimer() {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }

        gameState.timerInterval = setInterval(() => {
            if (!gameState.gameOver && !gameState.frog.moving) {
                gameState.timeLeft -= 0.5;

                if (gameState.timeLeft <= 0) {
                    loseLife();
                }
            }
        }, 500);
    }

    function stopTimer() {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
    }

    // Update game state
    function updateGame() {
        if (gameState.gameOver) return;

        // Process queued movement
        processMove();

        // Update frog movement animation
        if (gameState.frog.moving) {
            gameState.frog.moveProgress += 0.2;
            if (gameState.frog.moveProgress >= 1) {
                gameState.frog.moving = false;
                gameState.frog.moveProgress = 0;

                // Check for collisions/events after move completes
                checkFrogPosition();
            }
        }

        // Update vehicles
        for (let vehicle of gameState.vehicles) {
            vehicle.col += vehicle.speed * 0.05;

            // Wrap around
            if (vehicle.direction > 0 && vehicle.col > COLS + 2) {
                vehicle.col = -vehicle.type.width - 2;
            } else if (vehicle.direction < 0 && vehicle.col < -vehicle.type.width - 2) {
                vehicle.col = COLS + 2;
            }
        }

        // Update water obstacles
        for (let obstacle of gameState.waterObstacles) {
            obstacle.col += obstacle.speed * 0.05;

            // Wrap around
            if (obstacle.direction > 0 && obstacle.col > COLS + 2) {
                obstacle.col = -obstacle.width - 2;
            } else if (obstacle.direction < 0 && obstacle.col < -obstacle.width - 2) {
                obstacle.col = COLS + 2;
            }

            // Update turtle diving
            if (obstacle.isTurtle) {
                obstacle.diveTimer--;
                if (obstacle.diveTimer <= 0) {
                    obstacle.diving = !obstacle.diving;
                    obstacle.diveTimer = obstacle.diving ? 60 : 200;
                }
            }
        }

        // Update crocodiles
        for (let croc of gameState.crocodiles) {
            croc.mouthTimer--;
            if (croc.mouthTimer <= 0) {
                croc.mouthOpen = !croc.mouthOpen;
                croc.mouthTimer = croc.mouthOpen ? 60 : 150;
            }
        }

        // Move frog with water obstacle if standing on one
        if (!gameState.frog.moving && WATER_LANES.includes(gameState.frog.row)) {
            const standingOn = getWaterObstacleAt(gameState.frog.row, gameState.frog.col);
            if (standingOn && !standingOn.diving) {
                gameState.frog.col += standingOn.speed * 0.05;

                // Check if frog went off screen
                if (gameState.frog.col < 0 || gameState.frog.col >= COLS) {
                    loseLife();
                }
            }
        }

        // Update lady frog position (follows her log)
        for (let item of gameState.specialItems) {
            if (item.type === 'ladyFrog' && item.obstacle) {
                item.col = item.obstacle.col + 1;
            }
        }

        updateDisplay();
    }

    // Check frog position for collisions and events
    function checkFrogPosition() {
        const { row, col } = gameState.frog;

        // Check if reached home
        if (row === HOME_ROW) {
            const homeIndex = HOME_POSITIONS.indexOf(col);
            if (homeIndex !== -1) {
                if (gameState.homesOccupied[homeIndex]) {
                    // Home already occupied
                    loseLife();
                } else {
                    // Success! Frog reached home
                    frogHome(homeIndex);
                }
                return;
            } else {
                // Jumped into wall/bank at top
                loseLife();
                return;
            }
        }

        // Check vehicle collision
        if (ROAD_LANES.includes(row)) {
            for (let vehicle of gameState.vehicles) {
                if (vehicle.row === row) {
                    const frogLeft = col;
                    const frogRight = col + 1;
                    const vehLeft = vehicle.col;
                    const vehRight = vehicle.col + vehicle.type.width;

                    if (frogRight > vehLeft && frogLeft < vehRight) {
                        loseLife();
                        return;
                    }
                }
            }
        }

        // Check water - must be on log/turtle
        if (WATER_LANES.includes(row)) {
            const standingOn = getWaterObstacleAt(row, col);

            if (!standingOn || (standingOn.isTurtle && standingOn.diving)) {
                // Fell in water or turtle is diving
                loseLife();
                return;
            }

            // Check if standing on crocodile mouth
            for (let croc of gameState.crocodiles) {
                if (croc.obstacle === standingOn && croc.mouthOpen) {
                    const mouthCol = standingOn.col + standingOn.width - 1;
                    if (Math.abs(col - mouthCol) < 0.5) {
                        loseLife();
                        return;
                    }
                }
            }
        }

        // Check special item collection
        for (let i = gameState.specialItems.length - 1; i >= 0; i--) {
            const item = gameState.specialItems[i];
            if (item.row === row && Math.abs(item.col - col) < 0.8) {
                gameState.score += item.points;
                gameState.specialItems.splice(i, 1);
            }
        }
    }

    // Get water obstacle at position
    function getWaterObstacleAt(row, col) {
        for (let obstacle of gameState.waterObstacles) {
            if (obstacle.row === row) {
                const left = obstacle.col;
                const right = obstacle.col + obstacle.width;
                if (col >= left && col < right) {
                    return obstacle;
                }
            }
        }
        return null;
    }

    // Frog reached home successfully
    function frogHome(homeIndex) {
        gameState.homesOccupied[homeIndex] = true;
        gameState.frogsHome++;
        gameState.score += 50;

        // Bonus for remaining time
        gameState.score += Math.floor(gameState.timeLeft * 20);

        // Check if all homes occupied
        if (gameState.frogsHome >= 5) {
            levelComplete();
        } else {
            resetFrog();
        }
    }

    // Level complete
    function levelComplete() {
        gameState.score += 1000;
        gameState.level++;
        gameState.frogsHome = 0;
        gameState.homesOccupied = [false, false, false, false, false];

        // Reduce time at higher levels
        if (gameState.level > 3) {
            gameState.timeMax = 45;
        }
        if (gameState.level > 5) {
            gameState.timeMax = 30;
        }

        resetLevel();
    }

    // Lose a life
    function loseLife() {
        gameState.lives--;

        if (gameState.lives <= 0) {
            gameOver();
        } else {
            resetFrog();
        }
    }

    // Game over
    function gameOver() {
        gameState.gameOver = true;
        stopTimer();
        document.getElementById('froggerGameOverScreen').style.display = 'flex';
        document.getElementById('froggerFinalScore').textContent = gameState.score;
    }

    // Update display
    function updateDisplay() {
        document.getElementById('froggerScore').textContent = gameState.score;
        document.getElementById('froggerLives').textContent = gameState.lives;
        document.getElementById('froggerLevel').textContent = gameState.level;
        document.getElementById('froggerTime').textContent = Math.max(0, Math.floor(gameState.timeLeft));
    }

    // Render game
    function renderGame() {
        const ctx = gameState.ctx;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw lanes
        for (let row = 0; row < ROWS; row++) {
            const y = row * TILE_SIZE;

            if (ROAD_LANES.includes(row)) {
                // Road lane
                ctx.fillStyle = '#333333';
            } else if (WATER_LANES.includes(row)) {
                // Water lane
                ctx.fillStyle = '#2980b9';
            } else if (row === HOME_ROW) {
                // Home row (top)
                ctx.fillStyle = '#27ae60';
            } else {
                // Safe lane
                ctx.fillStyle = '#2ecc71';
            }

            ctx.fillRect(0, y, CANVAS_WIDTH, TILE_SIZE);
        }

        // Draw home slots
        for (let i = 0; i < HOME_POSITIONS.length; i++) {
            const col = HOME_POSITIONS[i];
            const x = col * TILE_SIZE;
            const y = HOME_ROW * TILE_SIZE;

            if (gameState.homesOccupied[i]) {
                // Occupied home - show frog
                ctx.font = `${TILE_SIZE - 4}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🐸', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
            } else {
                // Empty home - show lily pad
                ctx.fillStyle = '#16a085';
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw vehicles
        for (let vehicle of gameState.vehicles) {
            const x = vehicle.col * TILE_SIZE;
            const y = vehicle.row * TILE_SIZE;
            const width = vehicle.type.width * TILE_SIZE;

            ctx.fillStyle = vehicle.type.color;
            ctx.fillRect(x, y + 5, width, TILE_SIZE - 10);

            ctx.font = `${TILE_SIZE - 8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(vehicle.type.emoji, x + width / 2, y + TILE_SIZE / 2);
        }

        // Draw water obstacles
        for (let obstacle of gameState.waterObstacles) {
            const x = obstacle.col * TILE_SIZE;
            const y = obstacle.row * TILE_SIZE;
            const width = obstacle.width * TILE_SIZE;

            if (obstacle.isTurtle) {
                // Draw turtle(s)
                if (obstacle.diving) {
                    ctx.fillStyle = 'rgba(52, 73, 94, 0.5)';
                    ctx.fillRect(x, y + 10, width, TILE_SIZE - 20);
                } else {
                    ctx.fillStyle = '#16a085';
                    for (let i = 0; i < obstacle.width; i++) {
                        ctx.fillRect(x + i * TILE_SIZE + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                    }
                    ctx.font = `${TILE_SIZE - 12}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    for (let i = 0; i < obstacle.width; i++) {
                        ctx.fillText('🐢', x + i * TILE_SIZE + TILE_SIZE / 2, y + TILE_SIZE / 2);
                    }
                }
            } else {
                // Draw log
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x, y + 10, width, TILE_SIZE - 20);
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y + 10, width, TILE_SIZE - 20);

                // Check if this log is a crocodile
                const croc = gameState.crocodiles.find(c => c.obstacle === obstacle);
                if (croc && croc.mouthOpen) {
                    // Draw crocodile mouth at end
                    const mouthX = x + width - TILE_SIZE / 2;
                    ctx.font = `${TILE_SIZE - 4}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🐊', mouthX, y + TILE_SIZE / 2);
                }
            }
        }

        // Draw special items
        for (let item of gameState.specialItems) {
            const x = item.col * TILE_SIZE;
            const y = item.row * TILE_SIZE;

            ctx.font = `${TILE_SIZE - 4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (item.type === 'fly') {
                ctx.fillText('🪰', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
            } else if (item.type === 'ladyFrog') {
                ctx.fillText('👸', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
            }
        }

        // Draw frog
        const frogX = gameState.frog.col * TILE_SIZE;
        const frogY = gameState.frog.row * TILE_SIZE;

        ctx.font = `${TILE_SIZE - 4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐸', frogX + TILE_SIZE / 2, frogY + TILE_SIZE / 2);
    }

    // Game loop
    function gameLoop() {
        updateGame();
        renderGame();
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    // Export functions to window
    window.launchFrogger = function() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('froggerGame').style.display = 'block';
        initGame();
        setupMobileControls();
    };

    window.exitFrogger = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        stopTimer();
        document.getElementById('froggerGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

    window.froggerRestart = function() {
        document.getElementById('froggerGameOverScreen').style.display = 'none';
        resetGame();
        startTimer();
    };

})();
