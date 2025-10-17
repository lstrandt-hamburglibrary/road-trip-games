// Centipede - Classic 1980 Atari Arcade Game
(function() {
    let gameCanvas, ctx;
    let gameState = 'menu'; // menu, playing, gameOver
    let player;
    let centipedes = [];
    let mushrooms = [];
    let bullets = [];
    let enemies = [];
    let score = 0;
    let lives = 3;
    let level = 1;
    let animationId;

    const GAME_WIDTH = 480;
    const GAME_HEIGHT = 600;
    const GRID_SIZE = 16;
    const COLS = GAME_WIDTH / GRID_SIZE; // 30 columns
    const ROWS = GAME_HEIGHT / GRID_SIZE; // 37.5 rows
    const PLAYER_AREA_ROWS = 6; // Player can only move in bottom 6 rows
    const PLAYER_START_ROW = ROWS - 2;

    // Colors
    const COLOR_BG = '#000000';
    const COLOR_PLAYER = '#00ff00';
    const COLOR_CENTIPEDE = '#ff0000';
    const COLOR_MUSHROOM = '#ffaa00';
    const COLOR_BULLET = '#ffffff';
    const COLOR_SPIDER = '#ff00ff';
    const COLOR_FLEA = '#00ffff';
    const COLOR_SCORPION = '#ffff00';
    const COLOR_POISON = '#ff00ff';
    const COLOR_EXPLOSIVE = '#00ccff'; // Bright blue for explosive rocks

    // Player object
    function createPlayer() {
        return {
            x: Math.floor(COLS / 2) * GRID_SIZE,
            y: PLAYER_START_ROW * GRID_SIZE,
            speed: 3,
            invincible: false,
            invincibleTimer: 0
        };
    }

    // Create centipede
    function createCentipede(length, startX, startY, direction) {
        const segments = [];
        for (let i = 0; i < length; i++) {
            segments.push({
                x: startX - (i * GRID_SIZE),
                y: startY,
                gridX: Math.floor((startX - (i * GRID_SIZE)) / GRID_SIZE),
                gridY: Math.floor(startY / GRID_SIZE)
            });
        }
        return {
            segments: segments,
            direction: direction || 'right',
            moveTimer: 0,
            moveDelay: 20 - (level * 2) // Gets faster with levels
        };
    }

    // Initialize mushrooms
    function initMushrooms() {
        mushrooms = [];
        // Create random mushrooms in playing field (not in player area)
        const mushroomCount = 30 + (level * 5);
        for (let i = 0; i < mushroomCount; i++) {
            const x = Math.floor(Math.random() * COLS);
            const y = Math.floor(Math.random() * (ROWS - PLAYER_AREA_ROWS));

            // Check if mushroom already exists at this position
            if (!mushrooms.find(m => m.gridX === x && m.gridY === y)) {
                mushrooms.push({
                    gridX: x,
                    gridY: y,
                    x: x * GRID_SIZE,
                    y: y * GRID_SIZE,
                    health: 4,
                    poisoned: false,
                    explosive: false
                });
            }
        }

        // Add 5 explosive mushrooms per level
        const explosiveCount = 5;
        for (let i = 0; i < explosiveCount; i++) {
            const x = Math.floor(Math.random() * COLS);
            const y = Math.floor(Math.random() * (ROWS - PLAYER_AREA_ROWS));

            // Check if mushroom already exists at this position
            if (!mushrooms.find(m => m.gridX === x && m.gridY === y)) {
                mushrooms.push({
                    gridX: x,
                    gridY: y,
                    x: x * GRID_SIZE,
                    y: y * GRID_SIZE,
                    health: 4,
                    poisoned: false,
                    explosive: true
                });
            }
        }
    }

    // Initialize game
    function initGame() {
        if (!player) {
            player = createPlayer();
        }
        centipedes = [];
        bullets = [];
        enemies = [];

        initMushrooms();

        // Create initial centipede
        const centipedeLength = 12;
        centipedes.push(createCentipede(centipedeLength, GAME_WIDTH - GRID_SIZE, 0, 'left'));

        gameState = 'playing';
        if (!animationId) {
            gameLoop();
        }
    }

    // Update game state
    function update() {
        if (gameState !== 'playing') return;

        // Update invincibility timer
        if (player.invincibleTimer > 0) {
            player.invincibleTimer--;
            if (player.invincibleTimer === 0) {
                player.invincible = false;
            }
        }

        // Player movement
        const playerMinY = (ROWS - PLAYER_AREA_ROWS) * GRID_SIZE;

        if (keys.left && player.x > 0) {
            player.x -= player.speed;
        }
        if (keys.right && player.x < GAME_WIDTH - GRID_SIZE) {
            player.x += player.speed;
        }
        if (keys.up && player.y > playerMinY) {
            player.y -= player.speed;
        }
        if (keys.down && player.y < GAME_HEIGHT - GRID_SIZE) {
            player.y += player.speed;
        }

        // Continuous shooting while space is held
        if (keys.space) {
            shoot();
        }

        // Update centipedes
        updateCentipedes();

        // Update bullets
        updateBullets();

        // Update enemies
        updateEnemies();

        // Spawn enemies
        spawnEnemies();

        // Check if level complete
        if (centipedes.length === 0) {
            nextLevel();
        }
    }

    // Update centipede movement
    function updateCentipedes() {
        for (let c = centipedes.length - 1; c >= 0; c--) {
            const centipede = centipedes[c];
            centipede.moveTimer++;

            if (centipede.moveTimer >= centipede.moveDelay) {
                centipede.moveTimer = 0;
                moveCentipede(centipede);
            }

            // Check collision with player (if not invincible)
            if (!player.invincible) {
                for (let segment of centipede.segments) {
                    if (Math.abs(segment.x - player.x) < GRID_SIZE &&
                        Math.abs(segment.y - player.y) < GRID_SIZE) {
                        loseLife();
                    }
                }
            }
        }
    }

    // Move centipede
    function moveCentipede(centipede) {
        const head = centipede.segments[0];
        let newX = head.x;
        let newY = head.y;
        let shouldDrop = false;

        // Move head based on direction
        if (centipede.direction === 'right') {
            newX += GRID_SIZE;
        } else {
            newX -= GRID_SIZE;
        }

        // Check for obstacles
        const newGridX = Math.floor(newX / GRID_SIZE);
        const newGridY = Math.floor(newY / GRID_SIZE);

        // Check screen edges
        if (newX < 0 || newX >= GAME_WIDTH) {
            shouldDrop = true;
        }

        // Check for mushroom collision
        const mushroom = mushrooms.find(m => m.gridX === newGridX && m.gridY === newGridY);
        if (mushroom) {
            if (mushroom.poisoned) {
                // Fall straight down to player area
                newY = (ROWS - PLAYER_AREA_ROWS - 1) * GRID_SIZE;
                newX = head.x; // Keep same X
                mushroom.poisoned = false; // Reset poison
            } else {
                shouldDrop = true;
            }
        }

        // Drop down and reverse direction
        if (shouldDrop) {
            newY += GRID_SIZE;
            newX = head.x; // Stay in same column
            centipede.direction = centipede.direction === 'right' ? 'left' : 'right';
        }

        // Update all segments (follow the leader)
        for (let i = centipede.segments.length - 1; i > 0; i--) {
            centipede.segments[i].x = centipede.segments[i - 1].x;
            centipede.segments[i].y = centipede.segments[i - 1].y;
            centipede.segments[i].gridX = centipede.segments[i - 1].gridX;
            centipede.segments[i].gridY = centipede.segments[i - 1].gridY;
        }

        // Update head
        head.x = newX;
        head.y = newY;
        head.gridX = Math.floor(newX / GRID_SIZE);
        head.gridY = Math.floor(newY / GRID_SIZE);
    }

    // Update bullets
    function updateBullets() {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            bullet.y -= bullet.speed;

            // Remove if off screen
            if (bullet.y < 0) {
                bullets.splice(i, 1);
                continue;
            }

            // Check collision with centipedes (tighter hitbox)
            for (let c = centipedes.length - 1; c >= 0; c--) {
                const centipede = centipedes[c];
                for (let s = centipede.segments.length - 1; s >= 0; s--) {
                    const segment = centipede.segments[s];
                    const hitRadius = 8; // Half of grid size for tighter collision
                    if (Math.abs(bullet.x - (segment.x + GRID_SIZE / 2)) < hitRadius &&
                        Math.abs(bullet.y - (segment.y + GRID_SIZE / 2)) < hitRadius) {

                        // Create mushroom at segment position
                        mushrooms.push({
                            gridX: segment.gridX,
                            gridY: segment.gridY,
                            x: segment.x,
                            y: segment.y,
                            health: 4,
                            poisoned: false
                        });

                        // Split centipede if hit in middle
                        if (s > 0 && s < centipede.segments.length - 1) {
                            // Create new centipede from rear part
                            const rearSegments = centipede.segments.splice(s + 1);
                            if (rearSegments.length > 0) {
                                centipedes.push({
                                    segments: rearSegments,
                                    direction: centipede.direction,
                                    moveTimer: 0,
                                    moveDelay: centipede.moveDelay
                                });
                            }
                        }

                        // Remove segment
                        centipede.segments.splice(s, 1);

                        // Remove centipede if no segments left
                        if (centipede.segments.length === 0) {
                            centipedes.splice(c, 1);
                        }

                        // Remove bullet
                        bullets.splice(i, 1);
                        score += 10;
                        return;
                    }
                }
            }

            // Check collision with mushrooms (tighter hitbox)
            for (let m = mushrooms.length - 1; m >= 0; m--) {
                const mushroom = mushrooms[m];
                const hitRadius = 8; // Half of grid size for tighter collision
                if (Math.abs(bullet.x - (mushroom.x + GRID_SIZE / 2)) < hitRadius &&
                    Math.abs(bullet.y - (mushroom.y + GRID_SIZE / 2)) < hitRadius) {
                    mushroom.health--;
                    if (mushroom.health <= 0) {
                        // Check if it's an explosive mushroom
                        if (mushroom.explosive) {
                            // Trigger explosion!
                            explode(mushroom.gridX, mushroom.gridY);
                            score += 50; // Bonus for explosive!
                        } else {
                            score += 1;
                        }
                        mushrooms.splice(m, 1);
                    }
                    bullets.splice(i, 1);
                    break;
                }
            }

            // Check collision with enemies (tighter hitbox)
            for (let e = enemies.length - 1; e >= 0; e--) {
                const enemy = enemies[e];
                const hitRadius = 8; // Half of grid size for tighter collision
                if (Math.abs(bullet.x - enemy.x) < hitRadius &&
                    Math.abs(bullet.y - enemy.y) < hitRadius) {

                    if (enemy.type === 'flea') {
                        enemy.health--;
                        if (enemy.health <= 0) {
                            enemies.splice(e, 1);
                            score += 200;
                        }
                    } else if (enemy.type === 'spider') {
                        enemies.splice(e, 1);
                        // Score based on distance
                        const distance = Math.abs(player.y - enemy.y);
                        if (distance < GRID_SIZE * 3) score += 900;
                        else if (distance < GRID_SIZE * 5) score += 600;
                        else score += 300;
                    } else if (enemy.type === 'scorpion') {
                        enemies.splice(e, 1);
                        score += 1000;
                    }

                    bullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    // Update enemies
    function updateEnemies() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];

            if (enemy.type === 'spider') {
                // Zigzag movement with very wide, gentle pattern
                enemy.x += enemy.vx;
                enemy.y += enemy.vy;
                enemy.bounceTimer++;

                // Keep spider within player area bounds
                const playerMinY = (ROWS - PLAYER_AREA_ROWS) * GRID_SIZE;
                const playerMaxY = GAME_HEIGHT - GRID_SIZE;

                // Bounce when hitting bounds or after traveling enough for very wide zigzag
                if (enemy.y <= playerMinY || enemy.y >= playerMaxY || enemy.bounceTimer > 80) {
                    enemy.vy = -enemy.vy;
                    enemy.bounceTimer = 0;
                }

                // Remove if off screen
                if (enemy.x < -GRID_SIZE || enemy.x > GAME_WIDTH + GRID_SIZE) {
                    enemies.splice(i, 1);
                    continue;
                }

                // Eat mushrooms
                for (let m = mushrooms.length - 1; m >= 0; m--) {
                    const mushroom = mushrooms[m];
                    if (Math.abs(enemy.x - mushroom.x) < GRID_SIZE &&
                        Math.abs(enemy.y - mushroom.y) < GRID_SIZE &&
                        mushroom.gridY >= ROWS - PLAYER_AREA_ROWS) {
                        mushrooms.splice(m, 1);
                    }
                }

                // Check collision with player (if not invincible)
                if (!player.invincible &&
                    Math.abs(enemy.x - player.x) < GRID_SIZE &&
                    Math.abs(enemy.y - player.y) < GRID_SIZE) {
                    loseLife();
                }

            } else if (enemy.type === 'flea') {
                // Fall down
                enemy.y += enemy.speed;

                // Drop mushrooms
                if (Math.random() < 0.1) {
                    const gridX = Math.floor(enemy.x / GRID_SIZE);
                    const gridY = Math.floor(enemy.y / GRID_SIZE);
                    if (!mushrooms.find(m => m.gridX === gridX && m.gridY === gridY)) {
                        mushrooms.push({
                            gridX: gridX,
                            gridY: gridY,
                            x: gridX * GRID_SIZE,
                            y: gridY * GRID_SIZE,
                            health: 4,
                            poisoned: false
                        });
                    }
                }

                // Remove if off screen
                if (enemy.y > GAME_HEIGHT) {
                    enemies.splice(i, 1);
                }

            } else if (enemy.type === 'scorpion') {
                // Move horizontally
                enemy.x += enemy.vx;

                // Poison mushrooms
                const gridX = Math.floor(enemy.x / GRID_SIZE);
                const gridY = Math.floor(enemy.y / GRID_SIZE);
                for (let mushroom of mushrooms) {
                    if (mushroom.gridX === gridX && mushroom.gridY === gridY) {
                        mushroom.poisoned = true;
                    }
                }

                // Remove if off screen
                if (enemy.x < -GRID_SIZE || enemy.x > GAME_WIDTH + GRID_SIZE) {
                    enemies.splice(i, 1);
                }
            }
        }
    }

    // Spawn enemies
    function spawnEnemies() {
        // Spider
        if (enemies.filter(e => e.type === 'spider').length === 0 && Math.random() < 0.005) {
            const fromLeft = Math.random() < 0.5;
            const playerMinY = (ROWS - PLAYER_AREA_ROWS) * GRID_SIZE;
            enemies.push({
                type: 'spider',
                x: fromLeft ? -GRID_SIZE : GAME_WIDTH + GRID_SIZE,
                y: playerMinY + GRID_SIZE * 3, // Start in middle of player area
                vx: fromLeft ? 0.75 : -0.75, // 50% slower horizontal movement
                vy: 1, // Very slow vertical speed for very wide zigzag
                bounceTimer: 0
            });
        }

        // Flea (only when few mushrooms in player area)
        const playerAreaMushrooms = mushrooms.filter(m => m.gridY >= ROWS - PLAYER_AREA_ROWS);
        if (playerAreaMushrooms.length < 3 &&
            enemies.filter(e => e.type === 'flea').length === 0 &&
            Math.random() < 0.003) {
            enemies.push({
                type: 'flea',
                x: Math.floor(Math.random() * COLS) * GRID_SIZE,
                y: 0,
                speed: 3,
                health: 2
            });
        }

        // Scorpion
        if (enemies.filter(e => e.type === 'scorpion').length === 0 && Math.random() < 0.002) {
            const fromLeft = Math.random() < 0.5;
            enemies.push({
                type: 'scorpion',
                x: fromLeft ? -GRID_SIZE : GAME_WIDTH + GRID_SIZE,
                y: Math.floor(Math.random() * (ROWS - PLAYER_AREA_ROWS - 5) + 5) * GRID_SIZE,
                vx: fromLeft ? 1.5 : -1.5
            });
        }
    }

    // Player shoots
    function shoot() {
        // Only one bullet on screen at a time (authentic Centipede mechanic)
        if (bullets.length === 0) {
            bullets.push({
                x: player.x + GRID_SIZE / 2,
                y: player.y,
                speed: 8
            });
        }
    }

    // Explode - destroys everything within 3 grid spaces
    function explode(centerX, centerY) {
        const BLAST_RADIUS = 3;

        // Destroy mushrooms in radius
        for (let m = mushrooms.length - 1; m >= 0; m--) {
            const mushroom = mushrooms[m];
            const distance = Math.max(
                Math.abs(mushroom.gridX - centerX),
                Math.abs(mushroom.gridY - centerY)
            );
            if (distance <= BLAST_RADIUS) {
                mushrooms.splice(m, 1);
                score += 2; // Bonus points for chain destruction
            }
        }

        // Destroy centipede segments in radius
        for (let c = centipedes.length - 1; c >= 0; c--) {
            const centipede = centipedes[c];
            for (let s = centipede.segments.length - 1; s >= 0; s--) {
                const segment = centipede.segments[s];
                const distance = Math.max(
                    Math.abs(segment.gridX - centerX),
                    Math.abs(segment.gridY - centerY)
                );
                if (distance <= BLAST_RADIUS) {
                    // Split centipede if hit in middle
                    if (s > 0 && s < centipede.segments.length - 1) {
                        const rearSegments = centipede.segments.splice(s + 1);
                        if (rearSegments.length > 0) {
                            centipedes.push({
                                segments: rearSegments,
                                direction: centipede.direction,
                                moveTimer: 0,
                                moveDelay: centipede.moveDelay
                            });
                        }
                    }
                    centipede.segments.splice(s, 1);
                    score += 15; // Bonus for explosive kill
                }
            }
            // Remove centipede if no segments left
            if (centipede.segments.length === 0) {
                centipedes.splice(c, 1);
            }
        }

        // Destroy enemies in radius
        for (let e = enemies.length - 1; e >= 0; e--) {
            const enemy = enemies[e];
            const enemyGridX = Math.floor(enemy.x / GRID_SIZE);
            const enemyGridY = Math.floor(enemy.y / GRID_SIZE);
            const distance = Math.max(
                Math.abs(enemyGridX - centerX),
                Math.abs(enemyGridY - centerY)
            );
            if (distance <= BLAST_RADIUS) {
                enemies.splice(e, 1);
                score += 100; // Bonus for explosive kill
            }
        }
    }

    // Lose a life
    function loseLife() {
        lives--;
        if (lives <= 0) {
            gameOver();
        } else {
            // Respawn player with invincibility
            player.x = Math.floor(COLS / 2) * GRID_SIZE;
            player.y = PLAYER_START_ROW * GRID_SIZE;
            player.invincible = true;
            player.invincibleTimer = 120; // 2 seconds at 60fps
        }
    }

    // Next level
    function nextLevel() {
        level++;
        gameState = 'levelComplete';

        // Show level complete message briefly
        setTimeout(() => {
            // Clear everything for new level
            centipedes = [];
            bullets = [];
            enemies = [];

            // Repair some mushrooms (like original game)
            for (let mushroom of mushrooms) {
                if (mushroom.health < 4) {
                    mushroom.health = Math.min(4, mushroom.health + 1);
                }
                mushroom.poisoned = false;
            }

            // Add new explosive mushrooms for this level
            const explosiveCount = 5;
            for (let i = 0; i < explosiveCount; i++) {
                const x = Math.floor(Math.random() * COLS);
                const y = Math.floor(Math.random() * (ROWS - PLAYER_AREA_ROWS));

                // Check if mushroom already exists at this position
                if (!mushrooms.find(m => m.gridX === x && m.gridY === y)) {
                    mushrooms.push({
                        gridX: x,
                        gridY: y,
                        x: x * GRID_SIZE,
                        y: y * GRID_SIZE,
                        health: 4,
                        poisoned: false,
                        explosive: true
                    });
                }
            }

            // Reset player position and invincibility
            player.x = Math.floor(COLS / 2) * GRID_SIZE;
            player.y = PLAYER_START_ROW * GRID_SIZE;
            player.invincible = false;
            player.invincibleTimer = 0;

            // Create new centipede for this level
            const centipedeLength = 12;
            centipedes.push(createCentipede(centipedeLength, GAME_WIDTH - GRID_SIZE, 0, 'left'));

            gameState = 'playing';
        }, 2000);
    }

    // Game over
    function gameOver() {
        gameState = 'gameOver';
        cancelAnimationFrame(animationId);
    }

    // Draw game
    function draw() {
        // Clear canvas
        ctx.fillStyle = COLOR_BG;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (gameState === 'menu') {
            drawMenu();
        } else if (gameState === 'playing') {
            drawMushrooms();
            drawCentipedes();
            drawBullets();
            drawEnemies();
            drawPlayer();
            drawHUD();
            drawPlayerAreaBorder();
        } else if (gameState === 'levelComplete') {
            drawMushrooms();
            drawHUD();
            drawPlayerAreaBorder();
            drawLevelComplete();
        } else if (gameState === 'gameOver') {
            drawGameOver();
        }
    }

    // Draw player area border
    function drawPlayerAreaBorder() {
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, (ROWS - PLAYER_AREA_ROWS) * GRID_SIZE);
        ctx.lineTo(GAME_WIDTH, (ROWS - PLAYER_AREA_ROWS) * GRID_SIZE);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw mushrooms
    function drawMushrooms() {
        for (let mushroom of mushrooms) {
            // Explosive mushrooms are bright blue
            if (mushroom.explosive) {
                ctx.fillStyle = COLOR_EXPLOSIVE;
            } else {
                ctx.fillStyle = mushroom.poisoned ? COLOR_POISON : COLOR_MUSHROOM;
            }

            const size = GRID_SIZE - 4;
            const x = mushroom.x + 2;
            const y = mushroom.y + 2;

            // Draw mushroom cap
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw health indicator (for all mushrooms)
            if (!mushroom.explosive) {
                ctx.fillStyle = COLOR_BG;
                const spots = 4 - mushroom.health;
                for (let i = 0; i < spots; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    const spotX = x + size / 2 + Math.cos(angle) * (size / 4);
                    const spotY = y + size / 2 + Math.sin(angle) * (size / 4);
                    ctx.beginPath();
                    ctx.arc(spotX, spotY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    // Draw centipedes
    function drawCentipedes() {
        for (let centipede of centipedes) {
            for (let i = 0; i < centipede.segments.length; i++) {
                const segment = centipede.segments[i];
                const isHead = i === 0;

                ctx.fillStyle = isHead ? '#ff4444' : COLOR_CENTIPEDE;
                const size = GRID_SIZE - 4;

                // Draw segment
                ctx.beginPath();
                ctx.arc(segment.x + GRID_SIZE / 2, segment.y + GRID_SIZE / 2, size / 2, 0, Math.PI * 2);
                ctx.fill();

                // Draw eyes on head
                if (isHead) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(segment.x + GRID_SIZE / 2 - 3, segment.y + GRID_SIZE / 2 - 2, 2, 0, Math.PI * 2);
                    ctx.arc(segment.x + GRID_SIZE / 2 + 3, segment.y + GRID_SIZE / 2 - 2, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    // Draw bullets
    function drawBullets() {
        ctx.fillStyle = COLOR_BULLET;
        for (let bullet of bullets) {
            ctx.fillRect(bullet.x - 2, bullet.y, 4, 8);
        }
    }

    // Draw enemies
    function drawEnemies() {
        for (let enemy of enemies) {
            if (enemy.type === 'spider') {
                ctx.fillStyle = COLOR_SPIDER;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, GRID_SIZE / 2, 0, Math.PI * 2);
                ctx.fill();

                // Legs
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(enemy.x, enemy.y);
                    ctx.lineTo(enemy.x + Math.cos(angle) * GRID_SIZE, enemy.y + Math.sin(angle) * GRID_SIZE);
                    ctx.stroke();
                }
            } else if (enemy.type === 'flea') {
                ctx.fillStyle = COLOR_FLEA;
                ctx.fillRect(enemy.x, enemy.y, GRID_SIZE - 4, GRID_SIZE);
            } else if (enemy.type === 'scorpion') {
                ctx.fillStyle = COLOR_SCORPION;
                ctx.fillRect(enemy.x, enemy.y, GRID_SIZE, GRID_SIZE - 4);
                // Tail
                ctx.fillRect(enemy.x + GRID_SIZE - 4, enemy.y - 6, 4, 10);
            }
        }
    }

    // Draw player
    function drawPlayer() {
        // Blink effect when invincible
        if (player.invincible && Math.floor(player.invincibleTimer / 5) % 2 === 0) {
            return; // Don't draw every other interval for blinking effect
        }

        ctx.fillStyle = COLOR_PLAYER;
        const size = GRID_SIZE - 4;

        // Body
        ctx.beginPath();
        ctx.arc(player.x + GRID_SIZE / 2, player.y + GRID_SIZE / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Gun
        ctx.fillRect(player.x + GRID_SIZE / 2 - 2, player.y - 6, 4, 8);
    }

    // Draw HUD
    function drawHUD() {
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 10, 20);
        ctx.fillText(`LIVES: ${lives}`, 10, 40);
        ctx.fillText(`LEVEL: ${level}`, 10, 60);
    }

    // Draw menu
    function drawMenu() {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐛 CENTIPEDE', GAME_WIDTH / 2, 100);

        ctx.font = '18px Arial';
        ctx.fillText('Shoot all the centipede segments!', GAME_WIDTH / 2, 180);
        ctx.fillText('Arrow Keys: Move', GAME_WIDTH / 2, 250);
        ctx.fillText('Space: Shoot', GAME_WIDTH / 2, 280);

        ctx.font = '14px Arial';
        ctx.fillText('ENEMIES:', GAME_WIDTH / 2, 330);
        ctx.fillText('🕷️ Spider - Eats mushrooms (300-900 pts)', GAME_WIDTH / 2, 355);
        ctx.fillText('🦟 Flea - Drops mushrooms (200 pts)', GAME_WIDTH / 2, 380);
        ctx.fillText('🦂 Scorpion - Poisons mushrooms (1000 pts)', GAME_WIDTH / 2, 405);

        ctx.fillStyle = COLOR_EXPLOSIVE;
        ctx.fillText('💣 EXPLOSIVE MUSHROOMS:', GAME_WIDTH / 2, 440);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Bright blue - blast everything within 3 spaces!', GAME_WIDTH / 2, 465);

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#00ff00';
        ctx.fillText('TAP SCREEN OR PRESS SPACE', GAME_WIDTH / 2, 500);
    }

    // Draw level complete
    function drawLevelComplete() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '28px Arial';
        ctx.fillText(`Starting Level ${level}...`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    }

    // Draw game over
    function drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = '28px Arial';
        ctx.fillText(`Final Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.fillText(`Level Reached: ${level}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#00ff00';
        ctx.fillText('TAP SCREEN OR PRESS SPACE', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
    }

    // Game loop
    function gameLoop() {
        update();
        draw();

        if (gameState === 'playing' || gameState === 'levelComplete') {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    // Input handling
    const keys = {};

    function handleKeyDown(e) {
        keys[e.key.toLowerCase()] = true;
        keys.up = keys['arrowup'] || keys['w'];
        keys.down = keys['arrowdown'] || keys['s'];
        keys.left = keys['arrowleft'] || keys['a'];
        keys.right = keys['arrowright'] || keys['d'];
        keys.space = keys[' '] || false;

        // Prevent default scroll behavior for arrow keys during gameplay
        if (gameState === 'playing' && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            e.preventDefault();
        }

        if (gameState === 'menu' && e.code === 'Space') {
            e.preventDefault();
            score = 0;
            lives = 3;
            level = 1;
            initGame();
        } else if (gameState === 'gameOver' && e.code === 'Space') {
            e.preventDefault();
            score = 0;
            lives = 3;
            level = 1;
            gameState = 'menu';
            draw();
        } else if (gameState === 'playing' && e.code === 'Space') {
            e.preventDefault();
        }
    }

    function handleKeyUp(e) {
        const key = e.key.toLowerCase();
        keys[key] = false;
        keys.up = keys['arrowup'] || keys['w'];
        keys.down = keys['arrowdown'] || keys['s'];
        keys.left = keys['arrowleft'] || keys['a'];
        keys.right = keys['arrowright'] || keys['d'];
        keys.space = keys[' '] || false;
    }

    // Launch game
    window.launchCentipede = function() {
        const content = document.getElementById('centipedeContent');

        content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <canvas id="centipedeCanvas" width="${GAME_WIDTH}" height="${GAME_HEIGHT}" style="
                    border: 4px solid #00ff00;
                    border-radius: 10px;
                    max-width: 100%;
                    height: auto;
                    background: #000000;
                "></canvas>

                <div style="text-align: center; color: #666;">
                    <p style="margin: 0.5rem 0;">🎮 Arrow Keys to move, Space to shoot</p>
                    <p style="margin: 0.5rem 0;">🐛 Destroy all centipede segments!</p>
                    <p style="margin: 0.5rem 0;">⚠️ Watch out for Spider, Flea, and Scorpion!</p>
                    <p style="margin: 0.5rem 0; color: #00ccff; font-weight: bold;">💣 Hit bright blue explosive mushrooms to clear 3 spaces!</p>
                </div>

                <!-- Mobile Touch Controls -->
                <div id="centipedeControls" style="display: flex; justify-content: space-between; width: 100%; max-width: 500px; align-items: flex-end; margin-top: 1rem; padding: 0 1rem;">
                    <button id="centipedeBtnFire" style="width: 90px; height: 90px; background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%); color: white; border: none; border-radius: 50%; font-size: 1.2rem; cursor: pointer; touch-action: manipulation; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">FIRE</button>
                    <div style="display: grid; grid-template-columns: repeat(3, 70px); grid-template-rows: repeat(3, 70px); gap: 8px;">
                        <div style="grid-column: 2;"></div>
                        <button id="centipedeBtnUp" style="grid-column: 2; width: 70px; height: 70px; background: linear-gradient(135deg, #00ff00 0%, #00aa00 100%); color: white; border: none; border-radius: 15px; font-size: 2rem; cursor: pointer; touch-action: manipulation; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">▲</button>
                        <div></div>

                        <button id="centipedeBtnLeft" style="width: 70px; height: 70px; background: linear-gradient(135deg, #00ff00 0%, #00aa00 100%); color: white; border: none; border-radius: 15px; font-size: 2rem; cursor: pointer; touch-action: manipulation; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">◀</button>
                        <div></div>
                        <button id="centipedeBtnRight" style="width: 70px; height: 70px; background: linear-gradient(135deg, #00ff00 0%, #00aa00 100%); color: white; border: none; border-radius: 15px; font-size: 2rem; cursor: pointer; touch-action: manipulation; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">▶</button>

                        <div></div>
                        <button id="centipedeBtnDown" style="grid-column: 2; width: 70px; height: 70px; background: linear-gradient(135deg, #00ff00 0%, #00aa00 100%); color: white; border: none; border-radius: 15px; font-size: 2rem; cursor: pointer; touch-action: manipulation; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">▼</button>
                        <div></div>
                    </div>
                </div>
            </div>
        `;

        // Show game section
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('centipedeGame').style.display = 'block';

        // Scroll to top first, then prevent body scrolling while game is active
        window.scrollTo(0, 0);
        document.body.style.overflow = 'hidden';

        // Initialize canvas
        gameCanvas = document.getElementById('centipedeCanvas');
        ctx = gameCanvas.getContext('2d');

        gameState = 'menu';
        draw();

        // Event listeners (passive: false allows preventDefault to work)
        document.addEventListener('keydown', handleKeyDown, { passive: false });
        document.addEventListener('keyup', handleKeyUp);

        // Setup mobile controls
        setupMobileControls();
    };

    // Setup mobile touch controls
    function setupMobileControls() {
        const canvas = gameCanvas;
        const btnUp = document.getElementById('centipedeBtnUp');
        const btnDown = document.getElementById('centipedeBtnDown');
        const btnLeft = document.getElementById('centipedeBtnLeft');
        const btnRight = document.getElementById('centipedeBtnRight');
        const btnFire = document.getElementById('centipedeBtnFire');

        // Add canvas click/touch to start/restart game
        const handleCanvasClick = () => {
            if (gameState === 'menu') {
                score = 0;
                lives = 3;
                level = 1;
                initGame();
            } else if (gameState === 'gameOver') {
                score = 0;
                lives = 3;
                level = 1;
                gameState = 'menu';
                draw();
            }
        };

        canvas.addEventListener('click', handleCanvasClick);
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleCanvasClick();
        });

        if (btnUp) {
            btnUp.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keys.up = true;
            });
            btnUp.addEventListener('touchend', (e) => {
                e.preventDefault();
                keys.up = false;
            });
            btnUp.addEventListener('mousedown', (e) => {
                e.preventDefault();
                keys.up = true;
            });
            btnUp.addEventListener('mouseup', (e) => {
                e.preventDefault();
                keys.up = false;
            });
        }

        if (btnDown) {
            btnDown.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keys.down = true;
            });
            btnDown.addEventListener('touchend', (e) => {
                e.preventDefault();
                keys.down = false;
            });
            btnDown.addEventListener('mousedown', (e) => {
                e.preventDefault();
                keys.down = true;
            });
            btnDown.addEventListener('mouseup', (e) => {
                e.preventDefault();
                keys.down = false;
            });
        }

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keys.left = true;
            });
            btnLeft.addEventListener('touchend', (e) => {
                e.preventDefault();
                keys.left = false;
            });
            btnLeft.addEventListener('mousedown', (e) => {
                e.preventDefault();
                keys.left = true;
            });
            btnLeft.addEventListener('mouseup', (e) => {
                e.preventDefault();
                keys.left = false;
            });
        }

        if (btnRight) {
            btnRight.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keys.right = true;
            });
            btnRight.addEventListener('touchend', (e) => {
                e.preventDefault();
                keys.right = false;
            });
            btnRight.addEventListener('mousedown', (e) => {
                e.preventDefault();
                keys.right = true;
            });
            btnRight.addEventListener('mouseup', (e) => {
                e.preventDefault();
                keys.right = false;
            });
        }

        if (btnFire) {
            btnFire.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keys.space = true;
            });
            btnFire.addEventListener('touchend', (e) => {
                e.preventDefault();
                keys.space = false;
            });
            btnFire.addEventListener('mousedown', (e) => {
                e.preventDefault();
                keys.space = true;
            });
            btnFire.addEventListener('mouseup', (e) => {
                e.preventDefault();
                keys.space = false;
            });
        }
    }

    // Exit to menu
    window.exitCentipedeToMenu = function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        document.removeEventListener('keydown', handleKeyDown, { passive: false });
        document.removeEventListener('keyup', handleKeyUp);

        // Restore body scrolling
        document.body.style.overflow = '';

        document.getElementById('centipedeGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };
})();
