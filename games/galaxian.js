// Galaxian Game - Classic 1979 arcade space shooter
(function() {
    'use strict';

    // Game constants
    const CANVAS_WIDTH = 360;
    const CANVAS_HEIGHT = 480;
    const PLAYER_WIDTH = 24;
    const PLAYER_HEIGHT = 24;
    const PLAYER_SPEED = 4;
    const BULLET_WIDTH = 3;
    const BULLET_HEIGHT = 12;
    const BULLET_SPEED = 8;
    const ENEMY_WIDTH = 20;
    const ENEMY_HEIGHT = 20;
    const ENEMY_ROWS = 5;
    const ENEMY_COLS = 10;
    const ENEMY_SPACING_X = 32;
    const ENEMY_SPACING_Y = 32;
    const ENEMY_START_X = 40;
    const ENEMY_START_Y = 60;
    const DIVE_SPEED = 3;
    const ENEMY_BULLET_SPEED = 4;

    // Enemy types with colors and point values
    const ENEMY_TYPES = {
        FLAGSHIP: { color: '#FF0000', points: 150, row: 0 },
        RED: { color: '#FF6666', points: 80, row: 1 },
        PURPLE: { color: '#FF00FF', points: 60, rows: [2, 3] },
        BLUE: { color: '#00FFFF', points: 50, rows: [4] }
    };

    // Game state
    let gameState = {
        canvas: null,
        ctx: null,
        player: null,
        bullet: null,
        enemies: [],
        enemyBullets: [],
        stars: [],
        score: 0,
        lives: 3,
        level: 1,
        gameOver: false,
        paused: false,
        animationId: null,
        formationOffsetX: 0,
        formationDirection: 1,
        keys: {},
        shootCooldown: 0
    };

    // Player object
    class Player {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = PLAYER_WIDTH;
            this.height = PLAYER_HEIGHT;
            this.speed = PLAYER_SPEED;
        }

        draw(ctx) {
            // Draw simple spaceship shape
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height * 0.7);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }

        moveLeft() {
            this.x = Math.max(10, this.x - this.speed);
        }

        moveRight() {
            this.x = Math.min(CANVAS_WIDTH - this.width - 10, this.x + this.speed);
        }
    }

    // Bullet object
    class Bullet {
        constructor(x, y, speed) {
            this.x = x;
            this.y = y;
            this.width = BULLET_WIDTH;
            this.height = BULLET_HEIGHT;
            this.speed = speed;
        }

        draw(ctx) {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        update() {
            this.y -= this.speed;
        }

        isOffScreen() {
            return this.y + this.height < 0;
        }
    }

    // Enemy bullet object
    class EnemyBullet extends Bullet {
        update() {
            this.y += this.speed;
        }

        isOffScreen() {
            return this.y > CANVAS_HEIGHT;
        }
    }

    // Star object for background
    class Star {
        constructor() {
            this.x = Math.random() * CANVAS_WIDTH;
            this.y = Math.random() * CANVAS_HEIGHT;
            this.speed = Math.random() * 2 + 1;
            this.brightness = Math.random() * 0.5 + 0.5;
        }

        draw(ctx) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
            ctx.fillRect(this.x, this.y, 1, 1);
        }

        update() {
            this.y += this.speed;
            if (this.y > CANVAS_HEIGHT) {
                this.y = 0;
                this.x = Math.random() * CANVAS_WIDTH;
            }
        }
    }

    // Enemy object
    class Enemy {
        constructor(x, y, type, row, col) {
            this.homeX = x;
            this.homeY = y;
            this.x = x;
            this.y = y;
            this.width = ENEMY_WIDTH;
            this.height = ENEMY_HEIGHT;
            this.type = type;
            this.row = row;
            this.col = col;
            this.diving = false;
            this.divePhase = 0;
            this.diveStartX = 0;
            this.diveStartY = 0;
            this.diveTargetX = 0;
            this.shootTimer = 0;
            this.alive = true;
        }

        draw(ctx) {
            if (!this.alive) return;

            ctx.fillStyle = this.type.color;

            // Draw spaceship body - diamond/arrow shape
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y); // Top point
            ctx.lineTo(this.x + this.width, this.y + this.height * 0.6); // Right side
            ctx.lineTo(this.x + this.width / 2, this.y + this.height); // Bottom point
            ctx.lineTo(this.x, this.y + this.height * 0.6); // Left side
            ctx.closePath();
            ctx.fill();

            // Draw wings/fins extending out
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height * 0.6);
            ctx.lineTo(this.x - 4, this.y + this.height * 0.5);
            ctx.lineTo(this.x, this.y + this.height * 0.4);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(this.x + this.width, this.y + this.height * 0.6);
            ctx.lineTo(this.x + this.width + 4, this.y + this.height * 0.5);
            ctx.lineTo(this.x + this.width, this.y + this.height * 0.4);
            ctx.fill();

            // Add cockpit detail for flagships
            if (this.type === ENEMY_TYPES.FLAGSHIP) {
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height * 0.5, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        update(formationOffsetX) {
            if (!this.alive) return;

            if (this.diving) {
                this.updateDive();
            } else {
                // Follow formation
                this.x = this.homeX + formationOffsetX;
                this.y = this.homeY;

                // Random chance to start diving (limited by max diving enemies)
                const divingCount = gameState.enemies.filter(e => e.alive && e.diving).length;
                if (divingCount < 2 && Math.random() < 0.0002) {
                    this.startDive();
                }
            }

            // Shoot occasionally when diving
            if (this.diving && Math.random() < 0.02) {
                this.shoot();
            }
        }

        startDive() {
            this.diving = true;
            this.divePhase = 0;
            this.diveStartX = this.x;
            this.diveStartY = this.y;
            this.diveTargetX = gameState.player.x;
        }

        updateDive() {
            this.divePhase += 0.01;  // Slowed further: 0.05 → 0.02 → 0.01

            // S-curve dive pattern
            const progress = this.divePhase;
            const curveOffset = Math.sin(progress * Math.PI * 2) * 80;

            this.x = this.diveStartX + curveOffset;
            this.y = this.diveStartY + progress * 100;  // Slowed further: 300 → 180 → 100

            // Return to formation or die off screen
            if (this.y > CANVAS_HEIGHT + 50) {
                this.diving = false;
                this.x = this.homeX;
                this.y = this.homeY;
                this.divePhase = 0;
            }
        }

        shoot() {
            const bullet = new EnemyBullet(
                this.x + this.width / 2 - BULLET_WIDTH / 2,
                this.y + this.height,
                ENEMY_BULLET_SPEED
            );
            gameState.enemyBullets.push(bullet);
        }

        getPoints() {
            // Double points if diving
            return this.type.points * (this.diving ? 2 : 1);
        }
    }

    // Initialize game
    function initGame() {
        const canvas = document.getElementById('galaxianCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        gameState.canvas = canvas;
        gameState.ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        resetGame();
        setupControls();
        gameLoop();
    }

    function resetGame() {
        // Reset player
        gameState.player = new Player(
            CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
            CANVAS_HEIGHT - 60
        );

        // Reset game state
        gameState.bullet = null;
        gameState.enemies = [];
        gameState.enemyBullets = [];
        gameState.score = 0;
        gameState.lives = 3;
        gameState.level = 1;
        gameState.gameOver = false;
        gameState.formationOffsetX = 0;
        gameState.formationDirection = 1;
        gameState.shootCooldown = 0;

        // Create starfield
        gameState.stars = [];
        for (let i = 0; i < 50; i++) {
            gameState.stars.push(new Star());
        }

        createEnemyFormation();
    }

    function createEnemyFormation() {
        gameState.enemies = [];

        for (let row = 0; row < ENEMY_ROWS; row++) {
            for (let col = 0; col < ENEMY_COLS; col++) {
                const x = ENEMY_START_X + col * ENEMY_SPACING_X;
                const y = ENEMY_START_Y + row * ENEMY_SPACING_Y;

                let type;
                if (row === 0 && (col === 4 || col === 5)) {
                    type = ENEMY_TYPES.FLAGSHIP;
                } else if (row === 1) {
                    type = ENEMY_TYPES.RED;
                } else if (row === 2 || row === 3) {
                    type = ENEMY_TYPES.PURPLE;
                } else {
                    type = ENEMY_TYPES.BLUE;
                }

                gameState.enemies.push(new Enemy(x, y, type, row, col));
            }
        }
    }

    function setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            gameState.keys[e.key] = true;

            if (e.key === ' ') {
                e.preventDefault();
            }

            if (e.key === 'r' && gameState.gameOver) {
                resetGame();
            }
        });

        document.addEventListener('keyup', (e) => {
            gameState.keys[e.key] = false;
        });
    }

    function shoot() {
        if (!gameState.bullet) {
            gameState.bullet = new Bullet(
                gameState.player.x + gameState.player.width / 2 - BULLET_WIDTH / 2,
                gameState.player.y,
                BULLET_SPEED
            );
        }
    }

    function handleInput() {
        if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
            gameState.player.moveLeft();
        }
        if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
            gameState.player.moveRight();
        }

        // Auto-fire when holding space
        if (gameState.keys[' '] && !gameState.gameOver) {
            if (gameState.shootCooldown <= 0 && !gameState.bullet) {
                shoot();
                gameState.shootCooldown = 15; // Cooldown frames between shots
            }
        }
    }

    function updateFormation() {
        gameState.formationOffsetX += gameState.formationDirection * 0.5;

        if (gameState.formationOffsetX > 30 || gameState.formationOffsetX < -30) {
            gameState.formationDirection *= -1;
        }
    }

    function checkCollisions() {
        // Player bullet hits enemies
        if (gameState.bullet) {
            for (let enemy of gameState.enemies) {
                if (enemy.alive && checkRectCollision(gameState.bullet, enemy)) {
                    enemy.alive = false;
                    gameState.score += enemy.getPoints();
                    gameState.bullet = null;
                    break;
                }
            }
        }

        // Enemy bullets hit player
        for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = gameState.enemyBullets[i];
            if (checkRectCollision(bullet, gameState.player)) {
                gameState.enemyBullets.splice(i, 1);
                loseLife();
                break;
            }
        }

        // Enemy collision with player
        for (let enemy of gameState.enemies) {
            if (enemy.alive && checkRectCollision(enemy, gameState.player)) {
                enemy.alive = false;
                loseLife();
                break;
            }
        }
    }

    function checkRectCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    function loseLife() {
        gameState.lives--;
        if (gameState.lives <= 0) {
            gameState.gameOver = true;
        }
    }

    function checkLevelComplete() {
        const aliveEnemies = gameState.enemies.filter(e => e.alive).length;
        if (aliveEnemies === 0) {
            gameState.level++;
            createEnemyFormation();
        }
    }

    function update() {
        if (gameState.gameOver || gameState.paused) return;

        // Decrement shoot cooldown
        if (gameState.shootCooldown > 0) {
            gameState.shootCooldown--;
        }

        handleInput();
        updateFormation();

        // Update stars
        gameState.stars.forEach(star => star.update());

        // Update player bullet
        if (gameState.bullet) {
            gameState.bullet.update();
            if (gameState.bullet.isOffScreen()) {
                gameState.bullet = null;
            }
        }

        // Update enemies
        gameState.enemies.forEach(enemy => enemy.update(gameState.formationOffsetX));

        // Update enemy bullets
        for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
            gameState.enemyBullets[i].update();
            if (gameState.enemyBullets[i].isOffScreen()) {
                gameState.enemyBullets.splice(i, 1);
            }
        }

        checkCollisions();
        checkLevelComplete();
    }

    function draw() {
        const ctx = gameState.ctx;

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw stars
        gameState.stars.forEach(star => star.draw(ctx));

        // Draw player
        gameState.player.draw(ctx);

        // Draw player bullet
        if (gameState.bullet) {
            gameState.bullet.draw(ctx);
        }

        // Draw enemies
        gameState.enemies.forEach(enemy => enemy.draw(ctx));

        // Draw enemy bullets
        gameState.enemyBullets.forEach(bullet => bullet.draw(ctx));

        // Draw UI
        drawUI(ctx);

        if (gameState.gameOver) {
            drawGameOver(ctx);
        }
    }

    function drawUI(ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px monospace';
        ctx.fillText(`Score: ${gameState.score}`, 10, 20);
        ctx.fillText(`Lives: ${gameState.lives}`, 10, 40);
        ctx.fillText(`Level: ${gameState.level}`, CANVAS_WIDTH - 90, 20);
    }

    function drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, CANVAS_HEIGHT / 2 - 60, CANVAS_WIDTH, 120);

        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px monospace';
        ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

        ctx.textAlign = 'left';
    }

    function gameLoop() {
        update();
        draw();
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    // Launch Galaxian
    window.launchGalaxian = function() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('galaxianGame').style.display = 'block';
        initGame();
    };

    // Exit to menu
    window.exitGalaxian = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        document.getElementById('galaxianGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

})();
