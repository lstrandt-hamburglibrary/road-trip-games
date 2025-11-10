// Caverns of Mars - A faithful remake of the 1981 Atari classic
// by Greg Christensen, reimagined for Road Trip Games

(function() {
    'use strict';

    let canvas = null;
    let ctx = null;
    let gameLoopId = null;

    // Game constants
    const GAME_WIDTH = 600;
    const GAME_HEIGHT = 700;
    const SHIP_WIDTH = 30;
    const SHIP_HEIGHT = 30;
    const CAVE_WIDTH = 300;
    const SCROLL_SPEED = 2;
    const GRAVITY = 0.3;
    const MAX_FALL_SPEED = 4; // Increased from 2.5
    const SHOOT_SLOWDOWN = 1.5; // Increased from 0.4 - much stronger control
    const FUEL_DRAIN_RATE = 0.05; // Reduced from 0.1
    const SHOOT_FUEL_COST = 0.15; // Reduced from 0.3
    const FUEL_TANK_VALUE = 30;

    // Game state
    let gameState = {
        mode: 'menu', // menu, playing, descending, planting, escaping, won, gameover
        difficulty: 'medium',
        score: 0,
        highScore: localStorage.getItem('cavernsHighScore') || 0,
        level: 1,
        sectionsComplete: 0
    };

    // Player ship
    let ship = {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT * 0.4, // Start at 40% from top
        vx: 0,
        vy: 0,
        fuel: 100,
        health: 100,
        shooting: false
    };

    // Cave generation
    let cave = {
        segments: [],
        scrollOffset: 0,
        totalDepth: 0,
        sectionsPerLevel: { easy: 3, medium: 4, hard: 6 }
    };

    // Entities
    let bullets = [];
    let enemies = [];
    let fuelTanks = [];
    let explosions = [];

    // Input
    let keys = {};
    let mouseX = 0;
    let mouseY = 0;
    let mouseDown = false;

    // Cave segment generation
    function generateCaveSegment(y, isReactor = false) {
        const baseWidth = CAVE_WIDTH;
        const variance = Math.random() * 60 - 30;
        const leftWall = (GAME_WIDTH - baseWidth) / 2 + variance;
        const rightWall = leftWall + baseWidth;

        return {
            y: y,
            leftWall: leftWall,
            rightWall: rightWall,
            isReactor: isReactor
        };
    }

    function initializeCave() {
        cave.segments = [];
        cave.scrollOffset = 0;

        const totalSections = cave.sectionsPerLevel[gameState.difficulty];
        const segmentHeight = 50;
        const sectionsDepth = totalSections * 2000; // Each section is 2000 pixels

        // Generate cave segments
        for (let i = 0; i < sectionsDepth / segmentHeight + 20; i++) {
            const y = i * segmentHeight;
            const isReactor = (i * segmentHeight >= sectionsDepth - 100 && i * segmentHeight < sectionsDepth);
            cave.segments.push(generateCaveSegment(y, isReactor));
        }

        cave.totalDepth = sectionsDepth;

        // Add fuel tanks throughout
        fuelTanks = [];
        for (let i = 0; i < sectionsDepth / 300; i++) {
            const segment = cave.segments[Math.floor(Math.random() * cave.segments.length)];
            fuelTanks.push({
                x: segment.leftWall + Math.random() * (segment.rightWall - segment.leftWall - 30),
                y: segment.y + Math.random() * 50,
                width: 25,
                height: 25,
                active: true
            });
        }

        // Add enemies
        enemies = [];
        for (let i = 0; i < sectionsDepth / 400; i++) {
            const segment = cave.segments[Math.floor(Math.random() * cave.segments.length)];
            enemies.push({
                x: segment.leftWall + Math.random() * (segment.rightWall - segment.leftWall - 20),
                y: segment.y + Math.random() * 50,
                width: 20,
                height: 20,
                vx: Math.random() * 2 - 1,
                active: true,
                type: Math.random() > 0.5 ? 'rocket' : 'torpedo'
            });
        }
    }

    function resetGame() {
        ship.x = GAME_WIDTH / 2;
        ship.y = GAME_HEIGHT * 0.4; // Reset to 40% from top
        ship.vx = 0;
        ship.vy = 0;
        ship.fuel = 100;
        ship.health = 100;
        ship.shooting = false;

        gameState.score = 0;
        gameState.level = 1;
        gameState.sectionsComplete = 0;

        bullets = [];
        explosions = [];

        initializeCave();
    }

    function startGame(difficulty) {
        gameState.difficulty = difficulty;
        gameState.mode = 'descending';
        resetGame();
    }

    function updateShip(dt) {
        // Horizontal movement
        if (keys['ArrowLeft'] || keys['a']) {
            ship.vx = -3;
        } else if (keys['ArrowRight'] || keys['d']) {
            ship.vx = 3;
        } else {
            ship.vx *= 0.9;
        }

        // Shooting
        ship.shooting = keys[' '] || mouseDown;

        // Vertical movement (gravity and shooting)
        if (ship.shooting && ship.fuel > 0) {
            if (gameState.mode === 'escaping') {
                // When escaping, shooting propels you upward - accelerate upward each frame
                ship.vy -= SHOOT_SLOWDOWN * 2; // 2x acceleration when escaping!
                ship.vy = Math.max(ship.vy, -10); // Much faster cap (was -5)
                // Less fuel cost when escaping (you need it!)
                ship.fuel = Math.max(0, ship.fuel - SHOOT_FUEL_COST * 0.2);
            } else {
                // When descending, shooting slows you down
                ship.vy = Math.max(ship.vy - SHOOT_SLOWDOWN, -1);
                ship.fuel = Math.max(0, ship.fuel - SHOOT_FUEL_COST);
            }

            // Create bullets (firing downward) - but not when escaping!
            if (gameState.mode !== 'escaping' && Math.random() < 0.3) {
                // Bullets start at ship position in world coordinates
                const worldY = ship.y + cave.scrollOffset;
                bullets.push({
                    x: ship.x - 10,
                    y: worldY + SHIP_HEIGHT / 2,
                    vy: 8, // Positive = down in world space
                    active: true
                });
                bullets.push({
                    x: ship.x + 10,
                    y: worldY + SHIP_HEIGHT / 2,
                    vy: 8,
                    active: true
                });
            }
        } else {
            // Gravity always pulls downward (but not during escape)
            if (gameState.mode === 'escaping') {
                // During escape, no gravity when not thrusting - maintain speed
                // This lets you coast upward
            } else {
                ship.vy = Math.min(ship.vy + GRAVITY * dt, MAX_FALL_SPEED);
            }
        }

        // Update position
        ship.x += ship.vx;

        // Keep ship on screen horizontally
        ship.x = Math.max(20, Math.min(GAME_WIDTH - 20, ship.x));

        // Fuel drain
        ship.fuel = Math.max(0, ship.fuel - FUEL_DRAIN_RATE * dt);

        // Check if out of fuel
        if (ship.fuel <= 0) {
            gameState.mode = 'gameover';
        }

        // Ship moves down the screen, cave scrolls to keep ship centered
        if (gameState.mode === 'descending') {
            ship.y += ship.vy;

            // Keep ship roughly centered, scroll cave as needed
            const targetY = GAME_HEIGHT * 0.4;
            if (ship.y > targetY) {
                const diff = ship.y - targetY;
                cave.scrollOffset += diff;
                ship.y = targetY;
            }
        } else if (gameState.mode === 'escaping') {
            // Move ship based on velocity (negative vy = upward)
            ship.y += ship.vy;

            const targetY = GAME_HEIGHT * 0.5;
            if (ship.y < targetY) {
                // Ship going too high, scroll cave up
                const diff = targetY - ship.y;
                cave.scrollOffset -= diff;
                ship.y = targetY;
            }
        }

        // Check if reached reactor
        if (gameState.mode === 'descending' && cave.scrollOffset >= cave.totalDepth - 200) {
            gameState.mode = 'planting';
            setTimeout(() => {
                gameState.mode = 'escaping';
                createExplosion(GAME_WIDTH / 2, GAME_HEIGHT + cave.totalDepth);
            }, 2000);
        }

        // Check if escaped
        if (gameState.mode === 'escaping' && cave.scrollOffset <= 0) {
            gameState.mode = 'won';
            gameState.score += 1000;
            if (gameState.score > gameState.highScore) {
                gameState.highScore = gameState.score;
                localStorage.setItem('cavernsHighScore', gameState.highScore);
            }
        }
    }

    function updateBullets(dt) {
        bullets.forEach(bullet => {
            if (!bullet.active) return;

            bullet.y += bullet.vy;

            // Remove off-screen bullets
            if (bullet.y > GAME_HEIGHT + cave.scrollOffset + 100) {
                bullet.active = false;
            }

            // Check collision with fuel tanks
            fuelTanks.forEach(tank => {
                if (!tank.active) return;
                if (checkCollision(bullet, tank)) {
                    tank.active = false;
                    bullet.active = false;
                    ship.fuel = Math.min(100, ship.fuel + FUEL_TANK_VALUE);
                    gameState.score += 10;
                    createExplosion(tank.x, tank.y);
                }
            });

            // Check collision with enemies
            enemies.forEach(enemy => {
                if (!enemy.active) return;
                if (checkCollision(bullet, enemy)) {
                    enemy.active = false;
                    bullet.active = false;
                    gameState.score += 50;
                    createExplosion(enemy.x, enemy.y);
                }
            });

            // Check collision with cave walls
            const bulletWorldY = bullet.y + cave.scrollOffset;
            const segment = getCaveSegmentAtY(bulletWorldY);
            if (segment) {
                if (bullet.x < segment.leftWall || bullet.x > segment.rightWall) {
                    bullet.active = false;
                    createExplosion(bullet.x, bullet.y);
                    // Carve a small hole
                    if (bullet.x < segment.leftWall) {
                        segment.leftWall -= 5;
                    } else {
                        segment.rightWall += 5;
                    }
                }
            }
        });

        bullets = bullets.filter(b => b.active);
    }

    function updateEnemies(dt) {
        enemies.forEach(enemy => {
            if (!enemy.active) return;

            enemy.x += enemy.vx;

            // Bounce off walls
            const enemyWorldY = enemy.y;
            const segment = getCaveSegmentAtY(enemyWorldY);
            if (segment) {
                if (enemy.x < segment.leftWall || enemy.x > segment.rightWall - enemy.width) {
                    enemy.vx *= -1;
                }
            }

            // Check collision with ship
            if (checkCollision(enemy, {x: ship.x - SHIP_WIDTH/2, y: ship.y - SHIP_HEIGHT/2, width: SHIP_WIDTH, height: SHIP_HEIGHT})) {
                enemy.active = false;
                ship.health -= 20;
                createExplosion(enemy.x, enemy.y);

                if (ship.health <= 0) {
                    gameState.mode = 'gameover';
                }
            }
        });
    }

    function updateExplosions(dt) {
        explosions.forEach(exp => {
            exp.age += dt;
            exp.radius += 2;
            exp.opacity -= 0.02;
        });
        explosions = explosions.filter(exp => exp.opacity > 0);
    }

    function createExplosion(x, y) {
        explosions.push({
            x: x,
            y: y,
            radius: 5,
            opacity: 1,
            age: 0
        });
    }

    function checkCollision(a, b) {
        const aBox = {
            x: a.x - (a.width || 4) / 2,
            y: a.y - (a.height || 4) / 2,
            width: a.width || 4,
            height: a.height || 4
        };
        const bBox = {
            x: b.x,
            y: b.y,
            width: b.width,
            height: b.height
        };

        return aBox.x < bBox.x + bBox.width &&
               aBox.x + aBox.width > bBox.x &&
               aBox.y < bBox.y + bBox.height &&
               aBox.y + aBox.height > bBox.y;
    }

    function getCaveSegmentAtY(worldY) {
        return cave.segments.find(seg => Math.abs(seg.y - worldY) < 25);
    }

    function checkCaveCollision() {
        const shipWorldY = ship.y + cave.scrollOffset;
        const segment = getCaveSegmentAtY(shipWorldY);

        if (segment && !segment.isReactor) {
            const shipLeft = ship.x - SHIP_WIDTH / 2;
            const shipRight = ship.x + SHIP_WIDTH / 2;

            if (shipLeft < segment.leftWall || shipRight > segment.rightWall) {
                ship.health -= 5;
                if (ship.health <= 0) {
                    gameState.mode = 'gameover';
                }
            }
        }
    }

    function update(dt) {
        if (gameState.mode === 'descending' || gameState.mode === 'escaping') {
            updateShip(dt);
            updateBullets(dt);
            updateEnemies(dt);
            updateExplosions(dt);
            checkCaveCollision();
        } else if (gameState.mode === 'planting') {
            updateExplosions(dt);
        }
    }

    function draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (gameState.mode === 'menu') {
            drawMenu();
        } else if (gameState.mode === 'won') {
            drawVictory();
        } else if (gameState.mode === 'gameover') {
            drawGameOver();
        } else {
            drawGame();
        }
    }

    function drawMenu() {
        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CAVERNS OF MARS', GAME_WIDTH / 2, 100);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('A tribute to the 1981 Atari classic', GAME_WIDTH / 2, 140);
        ctx.fillText('by Greg Christensen', GAME_WIDTH / 2, 160);

        ctx.font = '20px Arial';
        ctx.fillText('Select Difficulty:', GAME_WIDTH / 2, 220);

        // Difficulty buttons
        drawButton('EASY (3 Sections)', GAME_WIDTH / 2 - 100, 260, 200, 40, gameState.difficulty === 'easy');
        drawButton('MEDIUM (4 Sections)', GAME_WIDTH / 2 - 100, 320, 200, 40, gameState.difficulty === 'medium');
        drawButton('HARD (6 Sections)', GAME_WIDTH / 2 - 100, 380, 200, 40, gameState.difficulty === 'hard');

        ctx.fillStyle = '#f7931e';
        ctx.font = '14px Arial';
        ctx.fillText('Controls:', GAME_WIDTH / 2, 460);
        ctx.fillText('Arrow Keys or A/D: Move', GAME_WIDTH / 2, 485);
        ctx.fillText('SPACE or Click: Fire (slows descent)', GAME_WIDTH / 2, 510);
        ctx.fillText('Shoot fuel tanks to refill!', GAME_WIDTH / 2, 535);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`High Score: ${gameState.highScore}`, GAME_WIDTH / 2, 570);
    }

    function drawButton(text, x, y, w, h, highlighted) {
        ctx.fillStyle = highlighted ? '#f7931e' : '#667eea';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w / 2, y + h / 2 + 6);
    }

    function drawGame() {
        // Draw cave walls
        ctx.fillStyle = '#8B4513';
        cave.segments.forEach(segment => {
            const screenY = segment.y - cave.scrollOffset;

            if (screenY > -100 && screenY < GAME_HEIGHT + 100) {
                // Left wall
                ctx.fillRect(0, screenY, segment.leftWall, 50);
                // Right wall
                ctx.fillRect(segment.rightWall, screenY, GAME_WIDTH - segment.rightWall, 50);

                // Reactor highlight
                if (segment.isReactor) {
                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(segment.leftWall, screenY, segment.rightWall - segment.leftWall, 50);
                    ctx.fillStyle = '#8B4513';
                }

                // Cave texture
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, screenY + i * 16);
                    ctx.lineTo(segment.leftWall, screenY + i * 16);
                    ctx.moveTo(segment.rightWall, screenY + i * 16);
                    ctx.lineTo(GAME_WIDTH, screenY + i * 16);
                    ctx.stroke();
                }
            }
        });

        // Draw fuel tanks
        ctx.fillStyle = '#ffff00';
        fuelTanks.forEach(tank => {
            if (!tank.active) return;
            const screenY = tank.y - cave.scrollOffset;
            if (screenY > -50 && screenY < GAME_HEIGHT + 50) {
                ctx.fillRect(tank.x, screenY, tank.width, tank.height);
                ctx.strokeStyle = '#ff8800';
                ctx.lineWidth = 2;
                ctx.strokeRect(tank.x, screenY, tank.width, tank.height);

                // F for fuel
                ctx.fillStyle = '#000';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('F', tank.x + tank.width / 2, screenY + tank.height / 2 + 6);
            }
        });

        // Draw enemies
        enemies.forEach(enemy => {
            if (!enemy.active) return;
            const screenY = enemy.y - cave.scrollOffset;
            if (screenY > -50 && screenY < GAME_HEIGHT + 50) {
                if (enemy.type === 'rocket') {
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.moveTo(enemy.x + enemy.width / 2, screenY);
                    ctx.lineTo(enemy.x, screenY + enemy.height);
                    ctx.lineTo(enemy.x + enemy.width, screenY + enemy.height);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    ctx.fillStyle = '#ff00ff';
                    ctx.fillRect(enemy.x, screenY, enemy.width, enemy.height);
                }
            }
        });

        // Draw bullets
        ctx.fillStyle = '#00ffff';
        bullets.forEach(bullet => {
            const screenY = bullet.y - cave.scrollOffset;
            if (screenY > -10 && screenY < GAME_HEIGHT + 10) {
                ctx.fillRect(bullet.x - 2, screenY - 5, 4, 10);
            }
        });

        // Draw explosions
        explosions.forEach(exp => {
            const screenY = exp.y - cave.scrollOffset;
            ctx.fillStyle = `rgba(255, 150, 0, ${exp.opacity})`;
            ctx.beginPath();
            ctx.arc(exp.x, screenY, exp.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 255, 0, ${exp.opacity * 0.7})`;
            ctx.beginPath();
            ctx.arc(exp.x, screenY, exp.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw ship
        ctx.save();
        ctx.translate(ship.x, ship.y);

        // Ship body
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(0, -SHIP_HEIGHT / 2);
        ctx.lineTo(-SHIP_WIDTH / 2, SHIP_HEIGHT / 2);
        ctx.lineTo(SHIP_WIDTH / 2, SHIP_HEIGHT / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#00aa00';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cannons
        ctx.fillStyle = '#888';
        ctx.fillRect(-SHIP_WIDTH / 2 - 3, 0, 3, 10);
        ctx.fillRect(SHIP_WIDTH / 2, 0, 3, 10);

        // Thruster effect when shooting
        if (ship.shooting) {
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.arc(0, SHIP_HEIGHT / 2, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Draw HUD
        drawHUD();

        // Draw mission status
        if (gameState.mode === 'planting') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, GAME_HEIGHT / 2 - 50, GAME_WIDTH, 100);
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PLANTING REACTOR BOMB...', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        } else if (gameState.mode === 'escaping') {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ESCAPE! REACTOR CRITICAL!', GAME_WIDTH / 2, 30);

            // Show escape progress
            const escapePercent = Math.max(0, 100 - (cave.scrollOffset / cave.totalDepth * 100)).toFixed(0);
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`ESCAPED: ${escapePercent}%`, GAME_WIDTH / 2, 55);
        }
    }

    function drawHUD() {
        // Background for HUD
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);

        // Fuel bar
        ctx.fillStyle = '#333';
        ctx.fillRect(10, GAME_HEIGHT - 50, 150, 20);
        const fuelColor = ship.fuel > 30 ? '#00ff00' : ship.fuel > 15 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = fuelColor;
        ctx.fillRect(10, GAME_HEIGHT - 50, ship.fuel * 1.5, 20);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(10, GAME_HEIGHT - 50, 150, 20);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('FUEL', 10, GAME_HEIGHT - 55);

        // Health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(10, GAME_HEIGHT - 25, 150, 20);
        const healthColor = ship.health > 50 ? '#00ff00' : ship.health > 25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(10, GAME_HEIGHT - 25, ship.health * 1.5, 20);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(10, GAME_HEIGHT - 25, 150, 20);
        ctx.fillStyle = '#fff';
        ctx.fillText('HEALTH', 10, GAME_HEIGHT - 30);

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`SCORE: ${gameState.score}`, GAME_WIDTH - 10, GAME_HEIGHT - 35);

        // Depth
        const depthPercent = Math.min(100, (cave.scrollOffset / cave.totalDepth * 100).toFixed(0));
        ctx.fillText(`DEPTH: ${depthPercent}%`, GAME_WIDTH - 10, GAME_HEIGHT - 10);
    }

    function drawVictory() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION SUCCESS!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.fillText(`High Score: ${gameState.highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

        ctx.font = '18px Arial';
        ctx.fillStyle = '#f7931e';
        ctx.fillText('Click anywhere to return to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
    }

    function drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION FAILED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.fillText(`High Score: ${gameState.highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

        ctx.font = '18px Arial';
        ctx.fillStyle = '#f7931e';
        ctx.fillText('Click anywhere to return to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
    }

    // Game loop
    let lastTime = 0;
    function gameLoop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 16.67, 2);
        lastTime = timestamp;

        update(dt);
        draw();

        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // Event handlers
    function handleKeyDown(e) {
        // Prevent default scrolling for game controls
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'a', 'd', 'w', 's'].includes(e.key)) {
            e.preventDefault();
        }
        keys[e.key] = true;
    }

    function handleKeyUp(e) {
        keys[e.key] = false;
    }

    function handleMouseMove(e) {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (GAME_WIDTH / rect.width);
        mouseY = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);
    }

    function handleMouseDown(e) {
        mouseDown = true;
        handleClick(mouseX, mouseY);
    }

    function handleMouseUp() {
        mouseDown = false;
    }

    function handleTouchStart(e) {
        if (!canvas) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouseX = (touch.clientX - rect.left) * (GAME_WIDTH / rect.width);
        mouseY = (touch.clientY - rect.top) * (GAME_HEIGHT / rect.height);
        mouseDown = true;
        handleClick(mouseX, mouseY);
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        mouseDown = false;
    }

    function handleTouchMove(e) {
        if (!canvas) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouseX = (touch.clientX - rect.left) * (GAME_WIDTH / rect.width);
        mouseY = (touch.clientY - rect.top) * (GAME_HEIGHT / rect.height);
    }

    function handleClick(x, y) {
        if (gameState.mode === 'menu') {
            // Check difficulty buttons
            if (x >= GAME_WIDTH / 2 - 100 && x <= GAME_WIDTH / 2 + 100) {
                if (y >= 260 && y <= 300) {
                    startGame('easy');
                } else if (y >= 320 && y <= 360) {
                    startGame('medium');
                } else if (y >= 380 && y <= 420) {
                    startGame('hard');
                }
            }
        } else if (gameState.mode === 'won' || gameState.mode === 'gameover') {
            gameState.mode = 'menu';
        }
    }

    // Resize canvas
    function resizeCanvas() {
        if (!canvas) return;

        // Set canvas resolution
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;

        // Calculate display size (fit to container, maintain aspect ratio)
        const container = canvas.parentElement;
        const maxWidth = Math.min(container.clientWidth - 40, 600); // Max 600px width
        const aspectRatio = GAME_HEIGHT / GAME_WIDTH;

        canvas.style.width = maxWidth + 'px';
        canvas.style.height = (maxWidth * aspectRatio) + 'px';
    }

    function launchCavernsOfMars() {
        // Show game section
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('cavernsOfMarsGame').style.display = 'block';

        // Initialize canvas
        canvas = document.getElementById('cavernsCanvas');
        ctx = canvas.getContext('2d');

        // Reset game state
        gameState.mode = 'menu';
        gameState.difficulty = 'medium';
        gameState.score = 0;
        gameState.highScore = localStorage.getItem('cavernsHighScore') || 0;

        // Setup event listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchend', handleTouchEnd);
        canvas.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('resize', resizeCanvas);

        resizeCanvas();

        // Start game loop
        lastTime = performance.now();
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function exitCavernsOfMars() {
        // Cancel game loop
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }

        // Remove event listeners
        if (canvas) {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchend', handleTouchEnd);
            canvas.removeEventListener('touchmove', handleTouchMove);
        }
        window.removeEventListener('resize', resizeCanvas);

        // Hide game section
        document.getElementById('cavernsOfMarsGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';

        // Clear canvas reference
        canvas = null;
        ctx = null;

        // Reset keys
        keys = {};
    }

    // Expose functions to window
    window.launchCavernsOfMars = launchCavernsOfMars;
    window.exitCavernsOfMars = exitCavernsOfMars;
})();
