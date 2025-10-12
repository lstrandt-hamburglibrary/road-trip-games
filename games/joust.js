// Joust Game
(function() {
    'use strict';

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const GRAVITY = 0.5;
    const FLAP_POWER = -10;
    const MOVE_SPEED = 4;

    let gameState = {
        player: null,
        enemies: [],
        eggs: [],
        platforms: [],
        score: 0,
        wave: 1,
        lives: 3,
        gameOver: false,
        gameStarted: false,
        keys: {},
        canvas: null,
        ctx: null,
        animationId: null
    };

    // Platform layouts for different waves
    const WAVE_PLATFORMS = {
        1: [
            { y: 520, width: 800, x: 0 },    // Full width bottom platform
            { y: 380, width: 250, x: 50 },   // Left platform
            { y: 380, width: 250, x: 500 },  // Right platform
            { y: 240, width: 200, x: 300 }   // Upper center platform
        ],
        2: [
            { y: 520, width: 600, x: 100 },  // Shorter bottom platform
            { y: 350, width: 200, x: 50 },   // Left middle
            { y: 350, width: 200, x: 550 }   // Right middle
        ],
        3: [
            { y: 520, width: 400, x: 200 },  // Even shorter bottom
            { y: 400, width: 250, x: 50 },   // Left lower
            { y: 400, width: 250, x: 500 },  // Right lower
            { y: 250, width: 300, x: 250 }   // Upper center
        ],
        4: [
            { y: 450, width: 400, x: 200 },  // Center platform
            { y: 350, width: 200, x: 50 },   // Left middle
            { y: 350, width: 200, x: 550 },  // Right middle
            { y: 250, width: 250, x: 275 },  // Upper center
            { y: 150, width: 150, x: 100 },  // Top left
            { y: 150, width: 150, x: 550 }   // Top right
        ]
    };

    class Player {
        constructor() {
            this.x = CANVAS_WIDTH / 2;
            this.y = 300;
            this.width = 40;
            this.height = 40;
            this.velocityY = 0;
            this.velocityX = 0;
            this.direction = 1; // 1 for right, -1 for left
            this.invincible = false;
            this.invincibleTimer = 0;
        }

        flap() {
            this.velocityY = FLAP_POWER;
        }

        update() {
            // Update invincibility timer
            if (this.invincible) {
                this.invincibleTimer--;
                if (this.invincibleTimer <= 0) {
                    this.invincible = false;
                }
            }

            // Apply friction to horizontal movement (momentum decay)
            this.velocityX *= 0.92;

            // Apply gravity
            this.velocityY += GRAVITY;

            // Update position
            this.y += this.velocityY;
            this.x += this.velocityX;

            // Wrap around screen horizontally
            if (this.x < -this.width) this.x = CANVAS_WIDTH;
            if (this.x > CANVAS_WIDTH) this.x = -this.width;

            // Check platform collisions
            let onPlatform = false;
            gameState.platforms.forEach(platform => {
                // Check if player overlaps with platform horizontally
                if (this.x + this.width > platform.x && this.x < platform.x + platform.width) {

                    // Landing on top of platform (falling down)
                    if (this.velocityY > 0 &&
                        this.y + this.height >= platform.y &&
                        this.y + this.height <= platform.y + 15) {
                        this.y = platform.y - this.height;
                        this.velocityY = 0;
                        onPlatform = true;
                    }

                    // Hitting platform from below (flying up)
                    else if (this.velocityY < 0 &&
                        this.y <= platform.y + 15 &&
                        this.y >= platform.y) {
                        this.y = platform.y + 15;
                        this.velocityY = 0;
                    }
                }
            });

            // Lava boundary - lose a life if player touches lava (unless invincible)
            if (!this.invincible && this.y + this.height > CANVAS_HEIGHT - 50) {
                this.loseLife();
            }

            // Top boundary
            if (this.y < 0) {
                this.y = 0;
                this.velocityY = 0;
            }
        }

        loseLife() {
            gameState.lives--;
            if (gameState.lives <= 0) {
                gameState.gameOver = true;
                gameState.gameStarted = false;
            } else {
                // Respawn player at center of a middle platform with invincibility
                // Pick a safe platform (prefer upper-middle platforms, not bottom)
                let spawnPlatform = gameState.platforms[1]; // Usually a middle platform
                if (!spawnPlatform) {
                    spawnPlatform = gameState.platforms[0]; // Fallback to first platform
                }

                this.x = spawnPlatform.x + (spawnPlatform.width / 2) - (this.width / 2);
                this.y = spawnPlatform.y - this.height;
                this.velocityY = 0;
                this.velocityX = 0;
                this.invincible = true;
                this.invincibleTimer = 120; // 2 seconds at 60fps
            }
        }

        draw(ctx) {
            // Blink when invincible (draw every other 10 frames)
            if (this.invincible && Math.floor(this.invincibleTimer / 10) % 2 === 0) {
                return; // Don't draw (blink effect)
            }

            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

            // Draw simple directional sprite (larger)
            ctx.fillStyle = '#FFD700'; // Gold color for player

            if (this.direction === 1) {
                // Facing right - draw triangle pointing right
                ctx.beginPath();
                ctx.moveTo(-22, -18);  // Top left
                ctx.lineTo(-22, 18);   // Bottom left
                ctx.lineTo(22, 0);     // Right point
                ctx.closePath();
                ctx.fill();

                // Add eye
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(8, -4, 3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Facing left - draw triangle pointing left
                ctx.beginPath();
                ctx.moveTo(22, -18);   // Top right
                ctx.lineTo(22, 18);    // Bottom right
                ctx.lineTo(-22, 0);    // Left point
                ctx.closePath();
                ctx.fillStyle = '#FFD700';
                ctx.fill();

                // Add eye
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-8, -4, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    class Enemy {
        constructor(wave, x = null, y = null) {
            this.x = x !== null ? x : (Math.random() < 0.5 ? 0 : CANVAS_WIDTH);
            this.y = y !== null ? y : (Math.random() * 300 + 100);
            this.width = 40;
            this.height = 40;
            this.velocityY = 0;
            this.velocityX = (Math.random() < 0.5 ? -1 : 1) * (2 + wave * 0.3);
            this.direction = this.velocityX > 0 ? 1 : -1;
            this.flapTimer = Math.random() * 20; // Random start time for varied flapping
            this.flapInterval = 20 + Math.random() * 25;
            this.targetHeight = 150 + Math.random() * 300; // Target height to patrol around
            this.targetChangeTimer = Math.random() * 180; // Change target every 3 seconds
        }

        update() {
            // Change target height periodically
            this.targetChangeTimer--;
            if (this.targetChangeTimer <= 0) {
                this.targetHeight = 150 + Math.random() * 300;
                this.targetChangeTimer = 120 + Math.random() * 120; // 2-4 seconds
            }

            // AI flapping - patrol around target height
            this.flapTimer++;

            // Determine if should flap based on target height
            const aboveTarget = this.y < this.targetHeight - 50;
            const belowTarget = this.y > this.targetHeight + 50;
            const tooLow = this.y > CANVAS_HEIGHT - 200;

            // Flap when below target or too low, but not when above target
            const shouldFlap = (belowTarget || tooLow) && !aboveTarget;
            const flapThreshold = shouldFlap ? this.flapInterval * 0.7 : this.flapInterval * 1.5;

            if (this.flapTimer >= flapThreshold && shouldFlap) {
                this.velocityY = FLAP_POWER * (0.6 + Math.random() * 0.3);
                this.flapTimer = 0;
                this.flapInterval = 20 + Math.random() * 25;
            }

            // Apply gravity
            this.velocityY += GRAVITY;

            // Update position
            this.y += this.velocityY;
            this.x += this.velocityX;

            // Wrap around screen horizontally
            if (this.x < -this.width) {
                this.x = CANVAS_WIDTH;
            }
            if (this.x > CANVAS_WIDTH) {
                this.x = -this.width;
            }

            // Check platform collisions
            gameState.platforms.forEach(platform => {
                // Check if enemy overlaps with platform horizontally
                if (this.x + this.width > platform.x && this.x < platform.x + platform.width) {

                    // Landing on top of platform (falling down)
                    if (this.velocityY > 0 &&
                        this.y + this.height >= platform.y &&
                        this.y + this.height <= platform.y + 15) {
                        this.y = platform.y - this.height;
                        this.velocityY = 0;
                    }

                    // Hitting platform from below (flying up)
                    else if (this.velocityY < 0 &&
                        this.y <= platform.y + 15 &&
                        this.y >= platform.y) {
                        this.y = platform.y + 15;
                        this.velocityY = 0;
                    }
                }
            });

            // Don't let enemies fall into lava - they fly back up very aggressively
            if (this.y + this.height > CANVAS_HEIGHT - 50) {
                this.y = CANVAS_HEIGHT - 50 - this.height;
                this.velocityY = FLAP_POWER * 1.2; // Very strong upward boost
                this.flapTimer = 0; // Reset flap timer to flap again immediately
                this.flapInterval = 15; // Quick successive flaps to get away from lava
            }

            // Top boundary
            if (this.y < 0) {
                this.y = 0;
                this.velocityY = 0;
            }

            // Update direction based on velocity
            if (this.velocityX !== 0) {
                this.direction = this.velocityX > 0 ? 1 : -1;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

            // Draw red triangle enemy (larger)
            ctx.fillStyle = '#FF4444'; // Red color for enemies

            if (this.direction === 1) {
                // Facing right - draw triangle pointing right
                ctx.beginPath();
                ctx.moveTo(-22, -18);  // Top left
                ctx.lineTo(-22, 18);   // Bottom left
                ctx.lineTo(22, 0);     // Right point
                ctx.closePath();
                ctx.fill();

                // Add eye
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(8, -4, 3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Facing left - draw triangle pointing left
                ctx.beginPath();
                ctx.moveTo(22, -18);   // Top right
                ctx.lineTo(22, 18);    // Bottom right
                ctx.lineTo(-22, 0);    // Left point
                ctx.closePath();
                ctx.fillStyle = '#FF4444';
                ctx.fill();

                // Add eye
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-8, -4, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    class Egg {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 30;
            this.height = 30;
            this.velocityY = 0;
            this.collected = false;
            this.hatchTimer = 300; // Hatches into enemy after 5 seconds
        }

        update() {
            this.velocityY += GRAVITY;
            this.y += this.velocityY;

            // Check platform collisions
            gameState.platforms.forEach(platform => {
                if (this.velocityY > 0 &&
                    this.y + this.height >= platform.y &&
                    this.y + this.height <= platform.y + 15 &&
                    this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                }
            });

            // Eggs land on top of lava
            if (this.y + this.height > CANVAS_HEIGHT - 50) {
                this.y = CANVAS_HEIGHT - 50 - this.height;
                this.velocityY = 0;
            }

            // Hatch timer
            this.hatchTimer--;
            if (this.hatchTimer <= 0) {
                return 'hatch';
            }

            return null;
        }

        draw(ctx) {
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🥚', this.x + this.width / 2, this.y + this.height / 2);
        }
    }

    function initGame() {
        gameState = {
            player: new Player(),
            enemies: [],
            eggs: [],
            platforms: [],
            score: 0,
            wave: 1,
            lives: 3,
            gameOver: false,
            gameStarted: false,
            keys: {},
            canvas: null,
            ctx: null,
            animationId: null
        };

        loadPlatformsForWave(1);
        spawnWave();
    }

    function loadPlatformsForWave(wave) {
        // Clear existing platforms
        gameState.platforms = [];

        // Get platform layout for this wave (or use wave 4 layout for waves 5+)
        const platformData = WAVE_PLATFORMS[wave] || WAVE_PLATFORMS[4];

        // Create platforms
        platformData.forEach(data => {
            gameState.platforms.push({
                x: data.x || 0,
                y: data.y,
                width: data.width
            });
        });
    }

    function spawnWave() {
        const enemyCount = 2 + gameState.wave;

        // Waves 1-2: Spawn enemies in horizontal line on bottom platform
        if (gameState.wave === 1 || gameState.wave === 2) {
            const bottomPlatform = gameState.platforms[0]; // Bottom platform is always first
            const spacing = bottomPlatform.width / (enemyCount + 1);
            for (let i = 0; i < enemyCount; i++) {
                const x = bottomPlatform.x + spacing * (i + 1);
                const y = bottomPlatform.y - 45; // Standing on bottom platform
                gameState.enemies.push(new Enemy(gameState.wave, x, y));
            }
        } else {
            // Other waves: Random spawning
            for (let i = 0; i < enemyCount; i++) {
                gameState.enemies.push(new Enemy(gameState.wave));
            }
        }
    }

    function checkCollisions() {
        const player = gameState.player;

        // Check enemy collisions - using proper AABB collision detection
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];

            // Proper bounding box collision detection
            if (player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y) {

                // Check who is higher
                if (player.y < enemy.y - 10) {
                    // Player wins - enemy becomes egg
                    gameState.eggs.push(new Egg(enemy.x, enemy.y));
                    gameState.enemies.splice(i, 1);
                    gameState.score += 100;

                    // Bounce player upward
                    player.velocityY = FLAP_POWER * 0.7; // Bounce effect
                } else if (enemy.y < player.y - 10) {
                    // Enemy wins - lose a life (unless invincible)
                    if (!player.invincible) {
                        player.loseLife();
                    }
                }
            }
        }

        // Check egg collisions - using proper AABB collision detection
        for (let i = gameState.eggs.length - 1; i >= 0; i--) {
            const egg = gameState.eggs[i];

            // Proper bounding box collision detection
            if (player.x < egg.x + egg.width &&
                player.x + player.width > egg.x &&
                player.y < egg.y + egg.height &&
                player.y + player.height > egg.y) {
                egg.collected = true;
                gameState.eggs.splice(i, 1);
                gameState.score += 250;
            }
        }

        // Check if wave is complete
        if (gameState.enemies.length === 0 && gameState.eggs.length === 0) {
            gameState.wave++;
            gameState.score += 500; // Bonus for completing wave
            loadPlatformsForWave(gameState.wave); // Load new platforms for next wave
            spawnWave();
        }
    }

    function update() {
        if (!gameState.gameStarted || gameState.gameOver) return;

        // Update player - add momentum instead of instant movement
        if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
            gameState.player.velocityX -= 0.5; // Accelerate left
            if (gameState.player.velocityX < -MOVE_SPEED) {
                gameState.player.velocityX = -MOVE_SPEED; // Cap speed
            }
            gameState.player.direction = -1; // Face left when moving left
        }
        if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
            gameState.player.velocityX += 0.5; // Accelerate right
            if (gameState.player.velocityX > MOVE_SPEED) {
                gameState.player.velocityX = MOVE_SPEED; // Cap speed
            }
            gameState.player.direction = 1; // Face right when moving right
        }

        gameState.player.update();

        // Update enemies
        gameState.enemies.forEach(enemy => enemy.update());

        // Update eggs
        for (let i = gameState.eggs.length - 1; i >= 0; i--) {
            const result = gameState.eggs[i].update();
            if (result === 'hatch') {
                // Egg hatches into new enemy
                const egg = gameState.eggs[i];
                gameState.enemies.push(new Enemy(gameState.wave));
                gameState.enemies[gameState.enemies.length - 1].x = egg.x;
                gameState.enemies[gameState.enemies.length - 1].y = egg.y;
                gameState.eggs.splice(i, 1);
            }
        }

        checkCollisions();
    }

    function draw() {
        const ctx = gameState.ctx;

        // Draw stone/rock background
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Add stone texture pattern
        ctx.fillStyle = 'rgba(40, 40, 40, 0.5)';
        for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
            for (let x = 0; x < CANVAS_WIDTH; x += 40) {
                const offset = (y / 40) % 2 === 0 ? 20 : 0;
                ctx.fillRect(x + offset, y, 38, 38);
            }
        }

        // Add darker stone lines
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.8)';
        ctx.lineWidth = 2;
        for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }
        for (let x = 0; x < CANVAS_WIDTH; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }

        // Draw lava at bottom
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

        // Draw lava bubbles effect
        ctx.fillStyle = '#ff6600';
        for (let i = 0; i < 10; i++) {
            const x = (i * 80 + Date.now() / 10) % CANVAS_WIDTH;
            ctx.fillRect(x, CANVAS_HEIGHT - 45, 20, 10);
        }

        // Draw platforms - orange/tan color like classic Joust
        ctx.fillStyle = '#D2691E';
        gameState.platforms.forEach(platform => {
            // Main platform
            ctx.fillRect(platform.x, platform.y, platform.width, 15);

            // Jagged top edge effect
            ctx.fillStyle = '#CD853F';
            for (let i = 0; i < platform.width; i += 20) {
                ctx.fillRect(platform.x + i, platform.y - 3, 10, 3);
            }
            ctx.fillStyle = '#D2691E';
        });

        // Draw eggs
        gameState.eggs.forEach(egg => egg.draw(ctx));

        // Draw enemies
        gameState.enemies.forEach(enemy => enemy.draw(ctx));

        // Draw player
        gameState.player.draw(ctx);

        // Draw UI
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${gameState.score}`, 20, 40);
        ctx.fillText(`Wave: ${gameState.wave}`, 20, 70);
        ctx.fillText(`Lives: ${gameState.lives}`, 20, 100);

        if (gameState.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = 'white';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
            ctx.font = '32px Arial';
            ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
            ctx.font = '24px Arial';
            ctx.fillText('Click "Play Again" to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
        }

        if (!gameState.gameStarted && !gameState.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = 'white';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Press SPACE or tap to flap!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.font = '24px Arial';
            ctx.fillText('Arrow keys or buttons to move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        }
    }

    function gameLoop() {
        update();
        draw();
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    function handleKeyDown(e) {
        gameState.keys[e.key] = true;

        if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && gameState.gameStarted) {
            e.preventDefault();
            gameState.player.flap();
        }

        if ((e.key === ' ' || e.key === 'Enter') && !gameState.gameStarted && !gameState.gameOver) {
            gameState.gameStarted = true;
        }
    }

    function handleKeyUp(e) {
        gameState.keys[e.key] = false;
    }

    window.launchJoust = function() {
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('joustGame').style.display = 'block';

        showJoustGame();
    };

    function showJoustGame() {
        const content = document.getElementById('joustContent');
        content.innerHTML = `
            <div style="text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="exitJoust()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        ← Back
                    </button>
                    <h2 style="margin: 0; font-size: 1.5rem;">🦤 Joust</h2>
                    <button onclick="restartJoust()" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        🔄 Play Again
                    </button>
                </div>

                <div style="position: relative; max-width: 800px; margin: 0 auto;">
                    <canvas id="joustCanvas" width="800" height="600" style="border: 4px solid #333; border-radius: 10px; background: #000; max-width: 100%; height: auto; display: block;"></canvas>

                    <!-- Mobile Controls -->
                    <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
                        <button id="joustFlapBtn" style="background: #28a745; color: white; border: none; padding: 1.5rem 3rem; border-radius: 12px; cursor: pointer; font-size: 1.5rem; font-weight: bold; touch-action: manipulation;">
                            ⬆️ FLAP
                        </button>
                        <div style="display: flex; gap: 0.5rem;">
                            <button id="joustLeftBtn" style="background: #667eea; color: white; border: none; padding: 1.5rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.5rem; font-weight: bold; touch-action: manipulation;">
                                ⬅️
                            </button>
                            <button id="joustRightBtn" style="background: #667eea; color: white; border: none; padding: 1.5rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.5rem; font-weight: bold; touch-action: manipulation;">
                                ➡️
                            </button>
                        </div>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem; max-width: 800px; margin-left: auto; margin-right: auto;">
                    <h4 style="color: #333; margin-bottom: 1rem;">How to Play:</h4>
                    <ul style="color: #666; text-align: left; line-height: 1.8;">
                        <li>🦤 Ride your ostrich and joust enemy riders!</li>
                        <li>⚔️ Defeat enemies by hitting them from ABOVE</li>
                        <li>🥚 Collect eggs before they hatch into new enemies</li>
                        <li>🌋 Don't touch the lava at the bottom!</li>
                        <li>📈 Survive waves to increase your score</li>
                        <li>💀 Get hit from below = Game Over!</li>
                    </ul>
                </div>
            </div>
        `;

        initGame();

        gameState.canvas = document.getElementById('joustCanvas');
        gameState.ctx = gameState.canvas.getContext('2d');

        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Mobile button controls
        const flapBtn = document.getElementById('joustFlapBtn');
        const leftBtn = document.getElementById('joustLeftBtn');
        const rightBtn = document.getElementById('joustRightBtn');

        flapBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            if (gameState.gameStarted) {
                gameState.player.flap();
            }
        });

        flapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            if (gameState.gameStarted) {
                gameState.player.flap();
            }
        });

        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            gameState.keys['ArrowLeft'] = true;
        });
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            gameState.keys['ArrowLeft'] = false;
        });
        leftBtn.addEventListener('mousedown', () => {
            gameState.keys['ArrowLeft'] = true;
        });
        leftBtn.addEventListener('mouseup', () => {
            gameState.keys['ArrowLeft'] = false;
        });

        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            gameState.keys['ArrowRight'] = true;
        });
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            gameState.keys['ArrowRight'] = false;
        });
        rightBtn.addEventListener('mousedown', () => {
            gameState.keys['ArrowRight'] = true;
        });
        rightBtn.addEventListener('mouseup', () => {
            gameState.keys['ArrowRight'] = false;
        });

        // Start game loop
        gameLoop();
    }

    window.exitJoust = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        document.getElementById('joustGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

    window.restartJoust = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        showJoustGame();
    };

})();
