// Joust Game
(function() {
    'use strict';

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const GRAVITY = 0.5;
    const FLAP_POWER = -8; // Stronger flap for tap controls
    const MOVE_SPEED = 4;
    const FLAP_COOLDOWN = 8; // Cooldown to prevent spam-tapping

    let gameState = {
        player: null,
        enemies: [],
        eggs: [],
        platforms: [],
        pterodactyl: null,
        score: 0,
        wave: 1,
        lives: 3,
        gameOver: false,
        gameStarted: false,
        keys: {},
        canvas: null,
        ctx: null,
        animationId: null,
        waveTimer: 0, // Timer for pterodactyl spawn
        flapHeld: false // Track if flap button is held
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
            this.flapCooldown = 0; // Cooldown timer for continuous flapping
        }

        flap() {
            if (this.flapCooldown <= 0) {
                this.velocityY += FLAP_POWER;
                this.flapCooldown = FLAP_COOLDOWN;
            }
        }

        update() {
            // Update flap cooldown
            if (this.flapCooldown > 0) {
                this.flapCooldown--;
            }

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
        constructor(wave, x = null, y = null, type = null) {
            this.x = x !== null ? x : (Math.random() < 0.5 ? 0 : CANVAS_WIDTH);
            this.y = y !== null ? y : (Math.random() * 300 + 100);
            this.width = 40;
            this.height = 40;
            this.velocityY = 0;

            // Determine enemy type based on wave if not specified
            if (type === null) {
                if (wave >= 5 && Math.random() < 0.15) {
                    this.type = 'shadow'; // Rare, tough enemy
                } else if (wave >= 3 && Math.random() < 0.3) {
                    this.type = 'hunter'; // Aggressive enemy
                } else {
                    this.type = 'bounder'; // Basic enemy
                }
            } else {
                this.type = type;
            }

            // Set properties based on type
            switch(this.type) {
                case 'shadow':
                    this.color = '#800080'; // Purple
                    this.speed = 3 + wave * 0.4;
                    this.flapInterval = 15 + Math.random() * 15; // Faster flapping
                    this.pointValue = 300;
                    break;
                case 'hunter':
                    this.color = '#0000FF'; // Blue
                    this.speed = 2.5 + wave * 0.35;
                    this.flapInterval = 18 + Math.random() * 20;
                    this.pointValue = 200;
                    break;
                case 'bounder':
                default:
                    this.color = '#FF4444'; // Red
                    this.speed = 2 + wave * 0.3;
                    this.flapInterval = 20 + Math.random() * 25;
                    this.pointValue = 100;
                    break;
            }

            this.velocityX = (Math.random() < 0.5 ? -1 : 1) * this.speed;
            this.direction = this.velocityX > 0 ? 1 : -1;
            this.flapTimer = Math.random() * 20; // Random start time for varied flapping
            this.targetHeight = 150 + Math.random() * 300; // Target height to patrol around
            this.targetChangeTimer = Math.random() * 180; // Change target every 3 seconds
        }

        update() {
            // Hunter AI: Chase player more aggressively
            if (this.type === 'hunter' && gameState.player) {
                const player = gameState.player;

                // Try to get above player
                this.targetHeight = player.y - 30;

                // Move toward player horizontally
                if (Math.abs(player.x - this.x) > 50) {
                    const directionToPlayer = player.x > this.x ? 1 : -1;
                    this.velocityX = directionToPlayer * this.speed;
                    this.direction = directionToPlayer;
                }

                this.targetChangeTimer = 60; // Don't change target while chasing
            } else {
                // Change target height periodically (Bounder/Shadow behavior)
                this.targetChangeTimer--;
                if (this.targetChangeTimer <= 0) {
                    this.targetHeight = 150 + Math.random() * 300;
                    this.targetChangeTimer = 120 + Math.random() * 120; // 2-4 seconds
                }
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

            // Draw triangle enemy with type-specific color
            ctx.fillStyle = this.color;

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

    class Pterodactyl {
        constructor() {
            this.x = Math.random() < 0.5 ? -50 : CANVAS_WIDTH + 50;
            this.y = 100 + Math.random() * 200; // Random height in upper half
            this.width = 60;
            this.height = 50;
            this.velocityX = this.x < 0 ? 5 : -5; // Move across screen
            this.direction = this.velocityX > 0 ? 1 : -1;
        }

        update() {
            this.x += this.velocityX;

            // Remove pterodactyl when it flies off screen
            if ((this.velocityX > 0 && this.x > CANVAS_WIDTH + 100) ||
                (this.velocityX < 0 && this.x < -100)) {
                return 'remove';
            }

            return null;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

            // Draw pterodactyl (menacing gray/black flying dinosaur)
            ctx.fillStyle = '#4a4a4a';

            if (this.direction === 1) {
                // Facing right - larger, more menacing shape
                ctx.beginPath();
                ctx.moveTo(-30, 0);    // Body left
                ctx.lineTo(-25, -20);  // Wing up
                ctx.lineTo(-10, -10);  // Wing middle
                ctx.lineTo(30, -15);   // Wing tip
                ctx.lineTo(35, 0);     // Head point
                ctx.lineTo(30, 15);    // Wing tip down
                ctx.lineTo(-10, 10);   // Wing middle down
                ctx.lineTo(-25, 20);   // Wing down
                ctx.closePath();
                ctx.fill();

                // Eye (red, menacing)
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(25, -2, 4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Facing left
                ctx.beginPath();
                ctx.moveTo(30, 0);     // Body right
                ctx.lineTo(25, -20);   // Wing up
                ctx.lineTo(10, -10);   // Wing middle
                ctx.lineTo(-30, -15);  // Wing tip
                ctx.lineTo(-35, 0);    // Head point
                ctx.lineTo(-30, 15);   // Wing tip down
                ctx.lineTo(10, 10);    // Wing middle down
                ctx.lineTo(25, 20);    // Wing down
                ctx.closePath();
                ctx.fill();

                // Eye (red, menacing)
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(-25, -2, 4, 0, Math.PI * 2);
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
            pterodactyl: null,
            score: 0,
            wave: 1,
            lives: 3,
            gameOver: false,
            gameStarted: false,
            keys: {},
            canvas: null,
            ctx: null,
            animationId: null,
            waveTimer: 0,
            flapHeld: false
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

        // Reset wave timer and clear pterodactyl
        gameState.waveTimer = 0;
        gameState.pterodactyl = null;

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

        // Check pterodactyl collision (instant death, can't be defeated)
        if (gameState.pterodactyl) {
            const ptero = gameState.pterodactyl;
            if (player.x < ptero.x + ptero.width &&
                player.x + player.width > ptero.x &&
                player.y < ptero.y + ptero.height &&
                player.y + player.height > ptero.y) {
                // Pterodactyl kills player instantly (even if invincible)
                player.invincible = false;
                player.loseLife();
            }
        }

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
                    gameState.score += enemy.pointValue;

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

        // Update wave timer and spawn pterodactyl if needed
        gameState.waveTimer++;
        if (gameState.waveTimer > 2700 && !gameState.pterodactyl) { // 45 seconds at 60fps
            gameState.pterodactyl = new Pterodactyl();
        }

        // Update pterodactyl
        if (gameState.pterodactyl) {
            const result = gameState.pterodactyl.update();
            if (result === 'remove') {
                gameState.pterodactyl = null;
            }
        }

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

        // Draw pterodactyl (draw in front of everything for visibility)
        if (gameState.pterodactyl) {
            gameState.pterodactyl.draw(ctx);
        }

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
            ctx.fillText('TAP SPACE or button to flap!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.font = '24px Arial';
            ctx.fillText('Arrow keys or buttons to move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
            ctx.fillText('Defeat enemies from above!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
        }
    }

    function gameLoop() {
        update();
        draw();
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    function handleKeyDown(e) {
        // Prevent repeated flapping from holding key down
        if (e.repeat) return;

        gameState.keys[e.key] = true;

        if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')) {
            e.preventDefault();

            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }

            if (gameState.gameStarted) {
                gameState.player.flap(); // Single flap on key press
            }
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
                    <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: flex-end; margin-top: 1rem; max-width: 100%;">
                        <button id="joustFlapBtn" style="width: 80px; height: 80px; background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 1.1rem; font-weight: bold; touch-action: manipulation; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                            FLAP
                        </button>
                        <div style="display: flex; gap: 0.5rem;">
                            <button id="joustLeftBtn" style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 15px; cursor: pointer; font-size: 2rem; font-weight: bold; touch-action: manipulation; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                                ◀
                            </button>
                            <button id="joustRightBtn" style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 15px; cursor: pointer; font-size: 2rem; font-weight: bold; touch-action: manipulation; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                                ▶
                            </button>
                        </div>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem; max-width: 800px; margin-left: auto; margin-right: auto;">
                    <h4 style="color: #333; margin-bottom: 1rem;">How to Play:</h4>
                    <ul style="color: #666; text-align: left; line-height: 1.8;">
                        <li>🦤 Ride your ostrich and joust enemy riders!</li>
                        <li>🪽 TAP flap button or press spacebar to fly - tap repeatedly for height!</li>
                        <li>⚔️ Defeat enemies by hitting them from ABOVE</li>
                        <li>🥚 Collect eggs (250 pts) before they hatch into new enemies</li>
                        <li>🦖 PTERODACTYL spawns after 45 seconds - instant death!</li>
                        <li>🎨 Enemy types: Red Bounder (100), Blue Hunter (200), Purple Shadow (300)</li>
                        <li>🌋 Don't touch the lava at the bottom!</li>
                        <li>💀 Get hit from below = Lose a life!</li>
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
                gameState.player.flap(); // Single flap on tap
            }
        });

        flapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            if (gameState.gameStarted) {
                gameState.player.flap(); // Single flap on click
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
