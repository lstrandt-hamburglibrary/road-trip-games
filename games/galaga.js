// Galaga Game - Classic 1981 Namco arcade space shooter
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
    const ENEMY_BULLET_SPEED = 4;
    const MAX_PLAYER_BULLETS = 2; // Key Galaga feature!

    // Enemy types with colors and point values
    const ENEMY_TYPES = {
        BOSS: { color: '#00FF00', points: 150, hits: 2, captureBeam: true },
        BUTTERFLY: { color: '#FF0066', points: 80, hits: 1, captureBeam: false },
        BEE: { color: '#FFFF00', points: 50, hits: 1, captureBeam: false }
    };

    // Game state
    let gameState = {
        canvas: null,
        ctx: null,
        player: null,
        bullets: [],
        enemies: [],
        enemyBullets: [],
        capturedShip: null,
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
        shootCooldown: 0,
        dualFighter: false,
        challengeStage: false,
        challengeTimer: 0,
        formingUp: true,
        formationComplete: false,
        enemiesEntering: [],
        respawning: false,
        respawnTimer: 0,
        invincible: false,
        invincibilityTimer: 0,
        blinkTimer: 0
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
            // Blink when invincible (skip drawing every 8 frames)
            if (gameState.invincible && Math.floor(gameState.blinkTimer / 8) % 2 === 0) {
                return;
            }

            // Draw main spaceship
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height * 0.7);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();

            // If dual fighter, draw second ship
            if (gameState.dualFighter) {
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2 - 8, this.y);
                ctx.lineTo(this.x + this.width - 8, this.y + this.height);
                ctx.lineTo(this.x + this.width / 2 - 8, this.y + this.height * 0.7);
                ctx.lineTo(this.x - 8, this.y + this.height);
                ctx.closePath();
                ctx.fill();
            }
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

    // Captured ship object
    class CapturedShip {
        constructor(x, y, captorEnemy) {
            this.x = x;
            this.y = y;
            this.width = PLAYER_WIDTH;
            this.height = PLAYER_HEIGHT;
            this.captor = captorEnemy;
        }

        draw(ctx) {
            // Draw captured ship (dimmed)
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height * 0.7);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }

        update() {
            if (this.captor && this.captor.alive) {
                this.x = this.captor.x;
                this.y = this.captor.y + this.captor.height;
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
            this.capturing = false;
            this.divePhase = 0;
            this.diveStartX = 0;
            this.diveStartY = 0;
            this.shootTimer = 0;
            this.alive = true;
            this.health = type.hits;
            this.maxHealth = type.hits;
            this.inFormation = false;
        }

        draw(ctx) {
            if (!this.alive) return;

            // Color changes for damaged boss
            let color = this.type.color;
            if (this.type === ENEMY_TYPES.BOSS && this.health < this.maxHealth) {
                color = '#0000FF'; // Changes to blue when hit once
            }

            ctx.fillStyle = color;

            // Different shapes for different enemy types
            if (this.type === ENEMY_TYPES.BOSS) {
                // Boss - larger bird shape
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y);
                ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.4);
                ctx.lineTo(this.x + this.width, this.y + this.height * 0.3);
                ctx.lineTo(this.x + this.width * 0.9, this.y + this.height * 0.7);
                ctx.lineTo(this.x + this.width * 0.6, this.y + this.height);
                ctx.lineTo(this.x + this.width / 2, this.y + this.height * 0.8);
                ctx.lineTo(this.x + this.width * 0.4, this.y + this.height);
                ctx.lineTo(this.x + this.width * 0.1, this.y + this.height * 0.7);
                ctx.lineTo(this.x, this.y + this.height * 0.3);
                ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.4);
                ctx.closePath();
                ctx.fill();
            } else if (this.type === ENEMY_TYPES.BUTTERFLY) {
                // Butterfly - wing shape
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
                ctx.lineTo(this.x, this.y);
                ctx.lineTo(this.x + this.width * 0.3, this.y + this.height / 2);
                ctx.lineTo(this.x, this.y + this.height);
                ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
                ctx.lineTo(this.x + this.width, this.y + this.height);
                ctx.lineTo(this.x + this.width * 0.7, this.y + this.height / 2);
                ctx.lineTo(this.x + this.width, this.y);
                ctx.closePath();
                ctx.fill();
            } else {
                // Bee - simpler insect shape
                ctx.beginPath();
                ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2,
                           this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Stripes
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + this.width * 0.3, this.y + this.height * 0.3,
                           this.width * 0.4, this.height * 0.15);
                ctx.fillRect(this.x + this.width * 0.3, this.y + this.height * 0.55,
                           this.width * 0.4, this.height * 0.15);
            }

            // Draw tractor beam if capturing
            if (this.capturing && this.diving) {
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y + this.height);
                ctx.lineTo(this.x + this.width / 2, this.y + this.height + 30);
                ctx.stroke();

                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y + this.height);
                ctx.lineTo(this.x + this.width / 2 - 15, this.y + this.height + 30);
                ctx.lineTo(this.x + this.width / 2 + 15, this.y + this.height + 30);
                ctx.closePath();
                ctx.fill();
            }
        }

        update(formationOffsetX) {
            if (!this.alive) return;

            if (this.diving) {
                this.updateDive();
            } else if (this.inFormation) {
                // Follow formation
                this.x = this.homeX + formationOffsetX;
                this.y = this.homeY;

                // Random chance to start diving (reduced frequency)
                const divingCount = gameState.enemies.filter(e => e.alive && e.diving).length;
                if (divingCount < 3 && Math.random() < 0.0003) {
                    this.startDive();
                }
            }

            // Shoot occasionally when diving (not in challenge stage)
            if (this.diving && !gameState.challengeStage && Math.random() < 0.02) {
                this.shoot();
            }
        }

        startDive() {
            this.diving = true;
            this.divePhase = 0;
            this.diveStartX = this.x;
            this.diveStartY = this.y;

            // Boss enemies might try to capture
            if (this.type === ENEMY_TYPES.BOSS && !gameState.capturedShip &&
                !gameState.dualFighter && Math.random() < 0.3) {
                this.capturing = true;
            }
        }

        updateDive() {
            this.divePhase += 0.015;

            const progress = this.divePhase;

            // More complex dive pattern for butterflies
            if (this.type === ENEMY_TYPES.BUTTERFLY) {
                const curveOffset = Math.sin(progress * Math.PI * 4) * 60;
                this.x = this.diveStartX + curveOffset;
            } else {
                const curveOffset = Math.sin(progress * Math.PI * 2) * 80;
                this.x = this.diveStartX + curveOffset;
            }

            this.y = this.diveStartY + progress * 120;

            // Check for player capture
            if (this.capturing && !gameState.capturedShip) {
                if (checkRectCollision(this, gameState.player)) {
                    // Capture the player!
                    gameState.capturedShip = new CapturedShip(
                        gameState.player.x,
                        gameState.player.y,
                        this
                    );
                    this.capturing = false;
                    this.diving = false;
                    this.x = this.homeX;
                    this.y = this.homeY;
                    loseLife();
                    return;
                }
            }

            // Return to formation or die off screen
            if (this.y > CANVAS_HEIGHT + 50) {
                this.diving = false;
                this.capturing = false;
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

        hit() {
            this.health--;
            if (this.health <= 0) {
                this.alive = false;

                // If this boss was holding captured ship, release it
                if (gameState.capturedShip && gameState.capturedShip.captor === this) {
                    if (!gameState.dualFighter) {
                        // Rescue the ship!
                        gameState.dualFighter = true;
                        gameState.capturedShip = null;
                    }
                }

                return true;
            }
            return false;
        }

        getPoints() {
            // Double points if diving
            return this.type.points * (this.diving ? 2 : 1);
        }
    }

    // Initialize game
    function initGame() {
        const canvas = document.getElementById('galagaCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        gameState.canvas = canvas;
        gameState.ctx = canvas.getContext('2d');

        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        resetGame();
        setupControls();
        gameLoop();
    }

    function resetGame() {
        gameState.player = new Player(
            CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
            CANVAS_HEIGHT - 60
        );

        gameState.bullets = [];
        gameState.enemies = [];
        gameState.enemyBullets = [];
        gameState.capturedShip = null;
        gameState.score = 0;
        gameState.lives = 3;
        gameState.level = 1;
        gameState.gameOver = false;
        gameState.formationOffsetX = 0;
        gameState.formationDirection = 1;
        gameState.shootCooldown = 0;
        gameState.dualFighter = false;
        gameState.challengeStage = false;
        gameState.formingUp = true;
        gameState.respawning = false;
        gameState.respawnTimer = 0;
        gameState.invincible = false;
        gameState.invincibilityTimer = 0;
        gameState.blinkTimer = 0;

        // Create starfield
        gameState.stars = [];
        for (let i = 0; i < 50; i++) {
            gameState.stars.push(new Star());
        }

        startStage();
    }

    function startStage() {
        // Every 3rd stage is a challenge stage
        if (gameState.level % 3 === 0) {
            gameState.challengeStage = true;
            gameState.challengeTimer = 300; // 5 seconds
        } else {
            gameState.challengeStage = false;
        }

        createEnemyFormation();
    }

    function createEnemyFormation() {
        gameState.enemies = [];
        gameState.formingUp = true;
        gameState.enemiesEntering = [];

        const cols = 10;
        const startX = 50;
        const startY = 80;
        const spacingX = 28;
        const spacingY = 28;

        let enemyIndex = 0;

        // Top row - 4 Boss Galaga
        for (let col = 3; col < 7; col++) {
            const x = startX + col * spacingX;
            const y = startY;
            const enemy = new Enemy(x, y, ENEMY_TYPES.BOSS, 0, col);
            enemy.x = -50;
            enemy.y = -50;
            gameState.enemies.push(enemy);
            gameState.enemiesEntering.push({
                enemy: enemy,
                delay: enemyIndex * 8,
                entered: false
            });
            enemyIndex++;
        }

        // Rows 1-2 - Butterflies
        for (let row = 1; row < 3; row++) {
            for (let col = 2; col < 8; col++) {
                const x = startX + col * spacingX;
                const y = startY + row * spacingY;
                const enemy = new Enemy(x, y, ENEMY_TYPES.BUTTERFLY, row, col);
                enemy.x = -50;
                enemy.y = -50;
                gameState.enemies.push(enemy);
                gameState.enemiesEntering.push({
                    enemy: enemy,
                    delay: enemyIndex * 8,
                    entered: false
                });
                enemyIndex++;
            }
        }

        // Rows 3-4 - Bees
        for (let row = 3; row < 5; row++) {
            for (let col = 1; col < 9; col++) {
                const x = startX + col * spacingX;
                const y = startY + row * spacingY;
                const enemy = new Enemy(x, y, ENEMY_TYPES.BEE, row, col);
                enemy.x = -50;
                enemy.y = -50;
                gameState.enemies.push(enemy);
                gameState.enemiesEntering.push({
                    enemy: enemy,
                    delay: enemyIndex * 8,
                    entered: false
                });
                enemyIndex++;
            }
        }
    }

    function updateFormation() {
        // Handle enemies entering formation
        if (gameState.formingUp) {
            let allEntered = true;

            for (let entry of gameState.enemiesEntering) {
                if (!entry.entered) {
                    if (entry.delay <= 0) {
                        // Animate enemy entering
                        const dx = entry.enemy.homeX - entry.enemy.x;
                        const dy = entry.enemy.homeY - entry.enemy.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 5) {
                            entry.enemy.x = entry.enemy.homeX;
                            entry.enemy.y = entry.enemy.homeY;
                            entry.enemy.inFormation = true;
                            entry.entered = true;
                        } else {
                            entry.enemy.x += dx * 0.1;
                            entry.enemy.y += dy * 0.1;
                        }
                    } else {
                        entry.delay--;
                        allEntered = false;
                    }

                    if (!entry.entered) {
                        allEntered = false;
                    }
                }
            }

            if (allEntered) {
                gameState.formingUp = false;
            }
        }

        // Formation sway
        if (!gameState.formingUp) {
            gameState.formationOffsetX += gameState.formationDirection * 0.5;

            if (gameState.formationOffsetX > 30 || gameState.formationOffsetX < -30) {
                gameState.formationDirection *= -1;
            }
        }
    }

    function setupControls() {
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
        if (gameState.bullets.length < MAX_PLAYER_BULLETS) {
            const bullet = new Bullet(
                gameState.player.x + gameState.player.width / 2 - BULLET_WIDTH / 2,
                gameState.player.y,
                BULLET_SPEED
            );
            gameState.bullets.push(bullet);

            // If dual fighter, shoot from second position too
            if (gameState.dualFighter) {
                const bullet2 = new Bullet(
                    gameState.player.x + gameState.player.width / 2 - 8 - BULLET_WIDTH / 2,
                    gameState.player.y,
                    BULLET_SPEED
                );
                gameState.bullets.push(bullet2);
            }
        }
    }

    function handleInput() {
        // Don't handle input if player doesn't exist
        if (!gameState.player) return;

        if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
            gameState.player.moveLeft();
        }
        if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
            gameState.player.moveRight();
        }

        // Auto-fire when holding space
        if (gameState.keys[' '] && !gameState.gameOver) {
            if (gameState.shootCooldown <= 0) {
                shoot();
                gameState.shootCooldown = 15;
            }
        }
    }

    function checkCollisions() {
        // Player bullets hit enemies
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = gameState.bullets[i];
            for (let enemy of gameState.enemies) {
                if (enemy.alive && checkRectCollision(bullet, enemy)) {
                    if (enemy.hit()) {
                        gameState.score += enemy.getPoints();
                    }
                    gameState.bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Enemy bullets hit player (not in challenge stage, not invincible, player exists)
        if (!gameState.challengeStage && !gameState.invincible && gameState.player) {
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
                if (enemy.alive && enemy.diving && checkRectCollision(enemy, gameState.player)) {
                    enemy.alive = false;
                    loseLife();
                    break;
                }
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
        // Only lose life if not already respawning
        if (gameState.respawning) return;

        gameState.lives--;
        gameState.dualFighter = false;

        if (gameState.lives <= 0) {
            gameState.gameOver = true;
        } else {
            // Set up respawn
            gameState.respawning = true;
            gameState.respawnTimer = 60; // 1 second at 60fps
            gameState.player = null; // Remove player temporarily
        }
    }

    function checkLevelComplete() {
        const aliveEnemies = gameState.enemies.filter(e => e.alive).length;

        if (gameState.challengeStage) {
            // Don't advance during formation, then check if all enemies dead or timer expired
            if (!gameState.formingUp && (aliveEnemies === 0 || gameState.challengeTimer <= 0)) {
                gameState.level++;
                startStage();
            }
        } else {
            if (aliveEnemies === 0 && !gameState.formingUp) {
                gameState.level++;
                startStage();
            }
        }
    }

    function update() {
        if (gameState.gameOver || gameState.paused) return;

        // Handle respawning
        if (gameState.respawning) {
            gameState.respawnTimer--;
            if (gameState.respawnTimer <= 0) {
                // Respawn player
                gameState.player = new Player(
                    CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
                    CANVAS_HEIGHT - 60
                );
                gameState.respawning = false;
                gameState.invincible = true;
                gameState.invincibilityTimer = 180; // 3 seconds at 60fps
                gameState.blinkTimer = 0;
            }
        }

        // Handle invincibility timer
        if (gameState.invincible) {
            gameState.invincibilityTimer--;
            gameState.blinkTimer++;
            if (gameState.invincibilityTimer <= 0) {
                gameState.invincible = false;
            }
        }

        if (gameState.shootCooldown > 0) {
            gameState.shootCooldown--;
        }

        handleInput();
        updateFormation();

        // Update challenge stage timer (only after enemies finish forming up)
        if (gameState.challengeStage && !gameState.formingUp) {
            gameState.challengeTimer--;
        }

        // Update stars
        gameState.stars.forEach(star => star.update());

        // Update player bullets
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
            gameState.bullets[i].update();
            if (gameState.bullets[i].isOffScreen()) {
                gameState.bullets.splice(i, 1);
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

        // Update captured ship
        if (gameState.capturedShip) {
            gameState.capturedShip.update();
        }

        checkCollisions();
        checkLevelComplete();
    }

    function draw() {
        const ctx = gameState.ctx;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw stars
        gameState.stars.forEach(star => star.draw(ctx));

        // Draw player (if exists)
        if (gameState.player) {
            gameState.player.draw(ctx);
        }

        // Draw player bullets
        gameState.bullets.forEach(bullet => bullet.draw(ctx));

        // Draw enemies
        gameState.enemies.forEach(enemy => enemy.draw(ctx));

        // Draw enemy bullets
        gameState.enemyBullets.forEach(bullet => bullet.draw(ctx));

        // Draw captured ship
        if (gameState.capturedShip) {
            gameState.capturedShip.draw(ctx);
        }

        // Draw UI
        drawUI(ctx);

        if (gameState.challengeStage && !gameState.formingUp) {
            drawChallengeStage(ctx);
        }

        if (gameState.gameOver) {
            drawGameOver(ctx);
        }
    }

    function drawUI(ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px monospace';
        ctx.fillText(`Score: ${gameState.score}`, 10, 20);
        ctx.fillText(`Lives: ${gameState.lives}`, 10, 40);
        ctx.fillText(`Stage: ${gameState.level}`, CANVAS_WIDTH - 100, 20);

        if (gameState.dualFighter) {
            ctx.fillText('DUAL FIGHTER!', CANVAS_WIDTH - 130, 40);
        }
    }

    function drawChallengeStage(ctx) {
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CHALLENGE STAGE', CANVAS_WIDTH / 2, 30);
        ctx.textAlign = 'left';
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

    // Setup mobile touch controls
    function setupMobileControls() {
        const btnLeft = document.getElementById('galagaBtnLeft');
        const btnRight = document.getElementById('galagaBtnRight');
        const btnFire = document.getElementById('galagaBtnFire');

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', (e) => {
                e.preventDefault();
                gameState.keys['ArrowLeft'] = true;
            });
            btnLeft.addEventListener('touchend', (e) => {
                e.preventDefault();
                gameState.keys['ArrowLeft'] = false;
            });
            btnLeft.addEventListener('mousedown', (e) => {
                e.preventDefault();
                gameState.keys['ArrowLeft'] = true;
            });
            btnLeft.addEventListener('mouseup', (e) => {
                e.preventDefault();
                gameState.keys['ArrowLeft'] = false;
            });
        }

        if (btnRight) {
            btnRight.addEventListener('touchstart', (e) => {
                e.preventDefault();
                gameState.keys['ArrowRight'] = true;
            });
            btnRight.addEventListener('touchend', (e) => {
                e.preventDefault();
                gameState.keys['ArrowRight'] = false;
            });
            btnRight.addEventListener('mousedown', (e) => {
                e.preventDefault();
                gameState.keys['ArrowRight'] = true;
            });
            btnRight.addEventListener('mouseup', (e) => {
                e.preventDefault();
                gameState.keys['ArrowRight'] = false;
            });
        }

        if (btnFire) {
            btnFire.addEventListener('touchstart', (e) => {
                e.preventDefault();
                gameState.keys[' '] = true;
            });
            btnFire.addEventListener('touchend', (e) => {
                e.preventDefault();
                gameState.keys[' '] = false;
            });
            btnFire.addEventListener('mousedown', (e) => {
                e.preventDefault();
                gameState.keys[' '] = true;
            });
            btnFire.addEventListener('mouseup', (e) => {
                e.preventDefault();
                gameState.keys[' '] = false;
            });
        }
    }

    // Launch Galaga
    window.launchGalaga = function() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('galagaGame').style.display = 'block';
        initGame();
        setupMobileControls();
    };

    // Exit to menu
    window.exitGalaga = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        document.getElementById('galagaGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

})();
