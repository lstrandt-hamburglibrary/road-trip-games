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
        gameOver: false,
        gameStarted: false,
        keys: {},
        canvas: null,
        ctx: null,
        animationId: null
    };

    // Platform positions (y-coordinates)
    const PLATFORM_DATA = [
        { y: 550, width: 800 },    // Bottom platform
        { y: 450, width: 600, x: 100 }, // Lower middle
        { y: 350, width: 600, x: 100 }, // Upper middle
        { y: 250, width: 600, x: 100 }, // Upper
        { y: 150, width: 400, x: 200 }  // Top
    ];

    class Player {
        constructor() {
            this.x = CANVAS_WIDTH / 2;
            this.y = 300;
            this.width = 40;
            this.height = 40;
            this.velocityY = 0;
            this.velocityX = 0;
            this.direction = 1; // 1 for right, -1 for left
        }

        flap() {
            this.velocityY = FLAP_POWER;
        }

        update() {
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
                if (this.velocityY > 0 && // Falling
                    this.y + this.height >= platform.y &&
                    this.y + this.height <= platform.y + 10 &&
                    this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    onPlatform = true;
                }
            });

            // Bottom boundary
            if (this.y > CANVAS_HEIGHT - this.height) {
                this.y = CANVAS_HEIGHT - this.height;
                this.velocityY = 0;
            }

            // Top boundary
            if (this.y < 0) {
                this.y = 0;
                this.velocityY = 0;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            if (this.direction === -1) {
                ctx.scale(-1, 1);
            }
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🦅', 0, 0);
            ctx.restore();
        }
    }

    class Enemy {
        constructor(wave) {
            this.x = Math.random() < 0.5 ? 0 : CANVAS_WIDTH;
            this.y = Math.random() * 300 + 100;
            this.width = 40;
            this.height = 40;
            this.velocityY = 0;
            this.velocityX = (Math.random() < 0.5 ? -1 : 1) * (2 + wave * 0.3);
            this.direction = this.velocityX > 0 ? 1 : -1;
            this.flapTimer = 0;
            this.flapInterval = 30 + Math.random() * 30;
        }

        update() {
            // AI flapping
            this.flapTimer++;
            if (this.flapTimer >= this.flapInterval) {
                this.velocityY = FLAP_POWER * 0.7;
                this.flapTimer = 0;
                this.flapInterval = 30 + Math.random() * 30;
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
                if (this.velocityY > 0 &&
                    this.y + this.height >= platform.y &&
                    this.y + this.height <= platform.y + 10 &&
                    this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                }
            });

            // Bottom boundary
            if (this.y > CANVAS_HEIGHT - this.height) {
                this.y = CANVAS_HEIGHT - this.height;
                this.velocityY = 0;
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
            if (this.direction === -1) {
                ctx.scale(-1, 1);
            }
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🦇', 0, 0);
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
                    this.y + this.height <= platform.y + 10 &&
                    this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                }
            });

            // Bottom boundary
            if (this.y > CANVAS_HEIGHT - this.height) {
                this.y = CANVAS_HEIGHT - this.height;
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
            gameOver: false,
            gameStarted: false,
            keys: {},
            canvas: null,
            ctx: null,
            animationId: null
        };

        // Create platforms
        PLATFORM_DATA.forEach(data => {
            gameState.platforms.push({
                x: data.x || 0,
                y: data.y,
                width: data.width
            });
        });

        spawnWave();
    }

    function spawnWave() {
        const enemyCount = 2 + gameState.wave;
        for (let i = 0; i < enemyCount; i++) {
            gameState.enemies.push(new Enemy(gameState.wave));
        }
    }

    function checkCollisions() {
        const player = gameState.player;

        // Check enemy collisions
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];

            if (Math.abs(player.x - enemy.x) < 35 &&
                Math.abs(player.y - enemy.y) < 35) {

                // Check who is higher
                if (player.y < enemy.y - 10) {
                    // Player wins - enemy becomes egg
                    gameState.eggs.push(new Egg(enemy.x, enemy.y));
                    gameState.enemies.splice(i, 1);
                    gameState.score += 100;
                } else if (enemy.y < player.y - 10) {
                    // Enemy wins - game over
                    gameState.gameOver = true;
                    gameState.gameStarted = false;
                }
            }
        }

        // Check egg collisions
        for (let i = gameState.eggs.length - 1; i >= 0; i--) {
            const egg = gameState.eggs[i];

            if (Math.abs(player.x - egg.x) < 30 &&
                Math.abs(player.y - egg.y) < 30) {
                egg.collected = true;
                gameState.eggs.splice(i, 1);
                gameState.score += 250;
            }
        }

        // Check if wave is complete
        if (gameState.enemies.length === 0 && gameState.eggs.length === 0) {
            gameState.wave++;
            gameState.score += 500; // Bonus for completing wave
            spawnWave();
        }
    }

    function update() {
        if (!gameState.gameStarted || gameState.gameOver) return;

        // Update player
        gameState.player.velocityX = 0;
        if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
            gameState.player.velocityX = -MOVE_SPEED;
            gameState.player.direction = -1;
        }
        if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
            gameState.player.velocityX = MOVE_SPEED;
            gameState.player.direction = 1;
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

        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw platforms
        ctx.fillStyle = '#8B4513';
        gameState.platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, 10);
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
                    <h2 style="margin: 0; font-size: 1.5rem;">🦅 Joust</h2>
                    <button onclick="restartJoust()" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        🔄 Play Again
                    </button>
                </div>

                <div style="position: relative; max-width: 800px; margin: 0 auto;">
                    <canvas id="joustCanvas" width="800" height="600" style="border: 4px solid #667eea; border-radius: 10px; background: #1a1a2e; max-width: 100%; height: auto; display: block;"></canvas>

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
                        <li>🦅 Flap to fly and fight enemy riders!</li>
                        <li>⚔️ Defeat enemies by hitting them from ABOVE</li>
                        <li>🥚 Collect eggs before they hatch into new enemies</li>
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
