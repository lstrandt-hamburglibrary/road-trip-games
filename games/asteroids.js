// Asteroids - Classic 1979 Atari Arcade Game
(function() {
    'use strict';

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const SHIP_SIZE = 15;
    const BULLET_SPEED = 8;
    const MAX_BULLETS = 4;
    const ASTEROID_SPEED_BASE = 1;
    const UFO_SPEED = 2;

    let gameState = {
        canvas: null,
        ctx: null,
        animationId: null,
        gameStarted: false,
        gameOver: false,
        paused: false,

        // Player ship
        ship: {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            vx: 0,
            vy: 0,
            angle: -Math.PI / 2, // Start pointing up
            thrusting: false,
            rotating: 0, // -1 left, 0 none, 1 right
            invulnerable: 0, // Invulnerability frames after spawn
        },

        // Game objects
        bullets: [],
        asteroids: [],
        ufos: [],
        particles: [],

        // Game state
        score: 0,
        lives: 3,
        level: 1,

        // Controls
        keys: {},
        firing: false,

        // Timers
        ufoTimer: 0,
        hyperspaceCooldown: 0,
        fireTimer: 0, // Cooldown between shots
    };

    // Initialize game
    function initGame() {
        gameState.gameStarted = false;
        gameState.gameOver = false;
        gameState.paused = false;
        gameState.score = 0;
        gameState.lives = 3;
        gameState.level = 1;
        gameState.bullets = [];
        gameState.asteroids = [];
        gameState.ufos = [];
        gameState.particles = [];
        gameState.ufoTimer = 0;
        gameState.hyperspaceCooldown = 0;
        gameState.fireTimer = 0;
        gameState.firing = false;

        resetShip();
        spawnAsteroids(4); // Start with 4 asteroids
    }

    function resetShip() {
        gameState.ship = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            vx: 0,
            vy: 0,
            angle: -Math.PI / 2,
            thrusting: false,
            rotating: 0,
            invulnerable: 120, // 2 seconds of invulnerability
        };
    }

    function spawnAsteroids(count) {
        for (let i = 0; i < count; i++) {
            let x, y;
            // Spawn away from center to avoid hitting player
            do {
                x = Math.random() * CANVAS_WIDTH;
                y = Math.random() * CANVAS_HEIGHT;
            } while (distance(x, y, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2) < 150);

            const angle = Math.random() * Math.PI * 2;
            const speed = ASTEROID_SPEED_BASE + Math.random() * 1;

            gameState.asteroids.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                size: 'large', // large, medium, small
                radius: 40,
                points: generateAsteroidPoints(40, 8)
            });
        }
    }

    function generateAsteroidPoints(radius, numPoints) {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const r = radius * (0.7 + Math.random() * 0.3); // Irregular shape
            points.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
        return points;
    }

    function spawnUFO() {
        const side = Math.random() < 0.5 ? -50 : CANVAS_WIDTH + 50;
        const size = Math.random() < 0.3 ? 'small' : 'large'; // 30% small, 70% large

        gameState.ufos.push({
            x: side,
            y: Math.random() * CANVAS_HEIGHT,
            vx: side < 0 ? UFO_SPEED : -UFO_SPEED,
            vy: (Math.random() - 0.5) * 2,
            size: size,
            radius: size === 'small' ? 15 : 25,
            shootTimer: 0
        });
    }

    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    function wrap(value, max) {
        if (value < 0) return max;
        if (value > max) return 0;
        return value;
    }

    function shootBullet() {
        if (gameState.bullets.length >= MAX_BULLETS) return;

        const bullet = {
            x: gameState.ship.x + Math.cos(gameState.ship.angle) * SHIP_SIZE,
            y: gameState.ship.y + Math.sin(gameState.ship.angle) * SHIP_SIZE,
            vx: Math.cos(gameState.ship.angle) * BULLET_SPEED + gameState.ship.vx,
            vy: Math.sin(gameState.ship.angle) * BULLET_SPEED + gameState.ship.vy,
            life: 60 // Bullets last 1 second
        };

        gameState.bullets.push(bullet);
    }

    function hyperspace() {
        if (gameState.hyperspaceCooldown > 0) return;

        // 10% chance of self-destruct
        if (Math.random() < 0.1) {
            destroyShip();
            return;
        }

        // Teleport to random location
        gameState.ship.x = Math.random() * CANVAS_WIDTH;
        gameState.ship.y = Math.random() * CANVAS_HEIGHT;
        gameState.ship.vx = 0;
        gameState.ship.vy = 0;
        gameState.ship.invulnerable = 60;
        gameState.hyperspaceCooldown = 180; // 3 second cooldown
    }

    function createExplosion(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            gameState.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 30
            });
        }
    }

    function destroyShip() {
        createExplosion(gameState.ship.x, gameState.ship.y, 30);
        gameState.lives--;

        if (gameState.lives > 0) {
            // Respawn after delay
            setTimeout(() => {
                if (!gameState.gameOver) {
                    resetShip();
                }
            }, 2000);
        } else {
            gameState.gameOver = true;
        }
    }

    function breakAsteroid(asteroid, index) {
        gameState.asteroids.splice(index, 1);
        createExplosion(asteroid.x, asteroid.y, 10);

        let points = 0;
        let newSize = null;
        let newRadius = 0;

        if (asteroid.size === 'large') {
            points = 20;
            newSize = 'medium';
            newRadius = 25;
        } else if (asteroid.size === 'medium') {
            points = 50;
            newSize = 'small';
            newRadius = 12;
        } else {
            points = 100;
        }

        gameState.score += points;

        // Create smaller asteroids
        if (newSize) {
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = ASTEROID_SPEED_BASE + Math.random() * 2;

                gameState.asteroids.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.1,
                    size: newSize,
                    radius: newRadius,
                    points: generateAsteroidPoints(newRadius, 6)
                });
            }
        }

        // Check if level complete
        if (gameState.asteroids.length === 0) {
            gameState.level++;
            setTimeout(() => {
                spawnAsteroids(4 + gameState.level);
            }, 2000);
        }
    }

    function update(dt) {
        if (!gameState.gameStarted || gameState.gameOver || gameState.paused) return;

        const ship = gameState.ship;

        // Update ship rotation
        if (ship.rotating !== 0) {
            ship.angle += ship.rotating * 0.1;
        }

        // Update ship thrust
        if (ship.thrusting) {
            const thrustPower = 0.2;
            ship.vx += Math.cos(ship.angle) * thrustPower;
            ship.vy += Math.sin(ship.angle) * thrustPower;

            // Speed limit
            const speed = Math.sqrt(ship.vx ** 2 + ship.vy ** 2);
            if (speed > 8) {
                ship.vx = (ship.vx / speed) * 8;
                ship.vy = (ship.vy / speed) * 8;
            }
        }

        // Apply drag
        ship.vx *= 0.99;
        ship.vy *= 0.99;

        // Update ship position
        ship.x += ship.vx;
        ship.y += ship.vy;

        // Wrap ship
        ship.x = wrap(ship.x, CANVAS_WIDTH);
        ship.y = wrap(ship.y, CANVAS_HEIGHT);

        // Update invulnerability
        if (ship.invulnerable > 0) {
            ship.invulnerable--;
        }

        // Update hyperspace cooldown
        if (gameState.hyperspaceCooldown > 0) {
            gameState.hyperspaceCooldown--;
        }

        // Update fire timer
        if (gameState.fireTimer > 0) {
            gameState.fireTimer--;
        }

        // Automatic firing when fire button held
        if (gameState.firing && gameState.fireTimer === 0) {
            shootBullet();
            gameState.fireTimer = 10; // Fire rate: every 10 frames (~6 shots/sec)
        }

        // Update bullets
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = gameState.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.x = wrap(bullet.x, CANVAS_WIDTH);
            bullet.y = wrap(bullet.y, CANVAS_HEIGHT);
            bullet.life--;

            if (bullet.life <= 0) {
                gameState.bullets.splice(i, 1);
            }
        }

        // Update asteroids
        for (let i = 0; i < gameState.asteroids.length; i++) {
            const asteroid = gameState.asteroids[i];
            asteroid.x += asteroid.vx;
            asteroid.y += asteroid.vy;
            asteroid.x = wrap(asteroid.x, CANVAS_WIDTH);
            asteroid.y = wrap(asteroid.y, CANVAS_HEIGHT);
            asteroid.rotation += asteroid.rotationSpeed;
        }

        // Update UFOs
        for (let i = gameState.ufos.length - 1; i >= 0; i--) {
            const ufo = gameState.ufos[i];
            ufo.x += ufo.vx;
            ufo.y += ufo.vy;

            // UFO AI - shoot at player
            ufo.shootTimer++;
            if (ufo.shootTimer > 90) {
                ufo.shootTimer = 0;
                const angle = Math.atan2(ship.y - ufo.y, ship.x - ufo.x) + (Math.random() - 0.5) * (ufo.size === 'small' ? 0.2 : 0.8);
                gameState.bullets.push({
                    x: ufo.x,
                    y: ufo.y,
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5,
                    life: 120,
                    enemy: true
                });
            }

            // Remove UFOs that go off screen
            if (ufo.x < -100 || ufo.x > CANVAS_WIDTH + 100) {
                gameState.ufos.splice(i, 1);
            }
        }

        // Spawn UFOs
        gameState.ufoTimer++;
        if (gameState.ufoTimer > 600 && gameState.ufos.length === 0) {
            gameState.ufoTimer = 0;
            spawnUFO();
        }

        // Update particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const particle = gameState.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;

            if (particle.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }

        // Collision detection - bullets vs asteroids
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = gameState.bullets[i];
            if (bullet.enemy) continue;

            for (let j = gameState.asteroids.length - 1; j >= 0; j--) {
                const asteroid = gameState.asteroids[j];
                if (distance(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.radius) {
                    breakAsteroid(asteroid, j);
                    gameState.bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Collision detection - bullets vs UFOs
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = gameState.bullets[i];
            if (bullet.enemy) continue;

            for (let j = gameState.ufos.length - 1; j >= 0; j--) {
                const ufo = gameState.ufos[j];
                if (distance(bullet.x, bullet.y, ufo.x, ufo.y) < ufo.radius) {
                    const points = ufo.size === 'small' ? 1000 : 200;
                    gameState.score += points;
                    createExplosion(ufo.x, ufo.y, 15);
                    gameState.ufos.splice(j, 1);
                    gameState.bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Collision detection - ship vs asteroids
        if (ship.invulnerable === 0) {
            for (let i = 0; i < gameState.asteroids.length; i++) {
                const asteroid = gameState.asteroids[i];
                if (distance(ship.x, ship.y, asteroid.x, asteroid.y) < asteroid.radius + 10) {
                    destroyShip();
                    break;
                }
            }

            // Ship vs UFOs
            for (let i = 0; i < gameState.ufos.length; i++) {
                const ufo = gameState.ufos[i];
                if (distance(ship.x, ship.y, ufo.x, ufo.y) < ufo.radius + 10) {
                    destroyShip();
                    break;
                }
            }

            // Ship vs enemy bullets
            for (let i = gameState.bullets.length - 1; i >= 0; i--) {
                const bullet = gameState.bullets[i];
                if (bullet.enemy && distance(ship.x, ship.y, bullet.x, bullet.y) < 10) {
                    destroyShip();
                    gameState.bullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    function render() {
        const ctx = gameState.ctx;

        // Clear screen - black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw asteroids
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (const asteroid of gameState.asteroids) {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            ctx.beginPath();
            for (let i = 0; i < asteroid.points.length; i++) {
                const point = asteroid.points[i];
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        // Draw UFOs
        for (const ufo of gameState.ufos) {
            ctx.save();
            ctx.translate(ufo.x, ufo.y);

            const size = ufo.radius;

            // Top dome
            ctx.beginPath();
            ctx.arc(0, -size * 0.3, size * 0.4, 0, Math.PI, true);
            ctx.stroke();

            // Body
            ctx.beginPath();
            ctx.moveTo(-size, 0);
            ctx.lineTo(-size * 0.5, size * 0.3);
            ctx.lineTo(size * 0.5, size * 0.3);
            ctx.lineTo(size, 0);
            ctx.closePath();
            ctx.stroke();

            // Top line
            ctx.beginPath();
            ctx.moveTo(-size, 0);
            ctx.lineTo(size, 0);
            ctx.stroke();

            ctx.restore();
        }

        // Draw ship (if alive and not respawning)
        if (gameState.lives > 0 && (gameState.ship.invulnerable === 0 || Math.floor(gameState.ship.invulnerable / 5) % 2 === 0)) {
            const ship = gameState.ship;
            ctx.save();
            ctx.translate(ship.x, ship.y);
            ctx.rotate(ship.angle + Math.PI / 2);

            // Draw ship triangle
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -SHIP_SIZE);
            ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE);
            ctx.lineTo(SHIP_SIZE * 0.7, SHIP_SIZE);
            ctx.closePath();
            ctx.stroke();

            // Draw thrust flame
            if (ship.thrusting && Math.floor(Date.now() / 50) % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(-SHIP_SIZE * 0.4, SHIP_SIZE);
                ctx.lineTo(0, SHIP_SIZE + 10);
                ctx.lineTo(SHIP_SIZE * 0.4, SHIP_SIZE);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Draw bullets
        ctx.fillStyle = '#fff';
        for (const bullet of gameState.bullets) {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw particles
        for (const particle of gameState.particles) {
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.life / 60})`;
            ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
        }

        // Draw HUD
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);

        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${gameState.level}`, CANVAS_WIDTH / 2, 30);

        // Draw lives
        ctx.textAlign = 'right';
        ctx.fillText(`LIVES: `, CANVAS_WIDTH - 100, 30);
        for (let i = 0; i < gameState.lives; i++) {
            const x = CANVAS_WIDTH - 80 + i * 20;
            const y = 20;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(-4, 6);
            ctx.lineTo(4, 6);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        // Start screen
        if (!gameState.gameStarted) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ASTEROIDS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

            ctx.font = '24px monospace';
            ctx.fillText('Press SPACE or tap to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

            ctx.font = '18px monospace';
            ctx.fillText('Arrow Keys / WASD to rotate and thrust', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
            ctx.fillText('Hold SPACE for continuous fire', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
            ctx.fillText('SHIFT for Hyperspace', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
        }

        // Game over screen
        if (gameState.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

            ctx.font = '32px monospace';
            ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
            ctx.fillText(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

            ctx.font = '24px monospace';
            ctx.fillText('Click "Play Again" to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
        }
    }

    let lastTime = 0;
    function gameLoop(time) {
        const dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

        update(dt);
        render();

        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    function handleKeyDown(e) {
        // Prevent default for arrow keys and space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift'].includes(e.key)) {
            e.preventDefault();
        }

        gameState.keys[e.key] = true;

        if (e.key === ' ' && !gameState.gameStarted && !gameState.gameOver) {
            gameState.gameStarted = true;
        }

        // Rotation
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            gameState.ship.rotating = -1;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            gameState.ship.rotating = 1;
        }

        // Thrust
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            gameState.ship.thrusting = true;
        }

        // Shoot - start continuous fire
        if (e.key === ' ') {
            if (gameState.gameStarted && !gameState.gameOver) {
                gameState.firing = true;
            }
        }

        // Hyperspace
        if (e.key === 'Shift' && gameState.gameStarted && !gameState.gameOver) {
            hyperspace();
        }
    }

    function handleKeyUp(e) {
        gameState.keys[e.key] = false;

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            if (gameState.ship.rotating === -1) gameState.ship.rotating = 0;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            if (gameState.ship.rotating === 1) gameState.ship.rotating = 0;
        }
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            gameState.ship.thrusting = false;
        }
        if (e.key === ' ') {
            gameState.firing = false;
        }
    }

    window.launchAsteroids = function() {
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('asteroidsGame').style.display = 'block';

        showAsteroidsGame();
    };

    function showAsteroidsGame() {
        const content = document.getElementById('asteroidsContent');
        content.innerHTML = `
            <div style="text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="exitAsteroids()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        ← Back
                    </button>
                    <h2 style="margin: 0; font-size: 1.5rem;">🚀 Asteroids</h2>
                    <button onclick="restartAsteroids()" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        🔄 Play Again
                    </button>
                </div>

                <canvas id="asteroidsCanvas" width="800" height="600" style="border: 4px solid #333; border-radius: 10px; background: #000; max-width: 100%; height: auto; display: block; margin: 0 auto;"></canvas>

                <!-- Mobile Controls - Standardized Layout -->
                <div style="display: flex; gap: 0.5rem; justify-content: center; align-items: flex-end; margin-top: 1rem; max-width: 100%; flex-wrap: wrap;">
                    <!-- Left side: Fire and Thrust stacked -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button id="astFireBtn" style="width: 80px; height: 80px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; border-radius: 50%; font-size: 1.1rem; cursor: pointer; touch-action: manipulation; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">FIRE</button>
                        <button id="astThrustBtn" style="width: 80px; height: 80px; background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: white; border: none; border-radius: 50%; font-size: 1.5rem; cursor: pointer; touch-action: manipulation; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">🚀</button>
                    </div>

                    <!-- Center: Hyperspace -->
                    <div style="display: flex; align-items: flex-end;">
                        <button id="astHyperspaceBtn" style="width: 80px; height: 80px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; border: none; border-radius: 50%; font-size: 0.8rem; cursor: pointer; touch-action: manipulation; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.3); line-height: 1.2;">HYPER<br>SPACE</button>
                    </div>

                    <!-- Right side: Directional controls -->
                    <div style="display: flex; gap: 0.5rem;">
                        <button id="astLeftBtn" style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 15px; font-size: 2rem; cursor: pointer; touch-action: manipulation; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">◀</button>
                        <button id="astRightBtn" style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 15px; font-size: 2rem; cursor: pointer; touch-action: manipulation; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">▶</button>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem;">
                    <h4 style="color: #333; margin-bottom: 1rem;">How to Play:</h4>
                    <ul style="color: #666; text-align: left; line-height: 1.8;">
                        <li>🎯 <strong>Objective:</strong> Destroy all asteroids to advance to the next level</li>
                        <li>🪨 Large asteroids break into medium (20 pts), medium into small (50 pts), small destroyed (100 pts)</li>
                        <li>🛸 UFOs appear and shoot at you - destroy them for bonus points!</li>
                        <li>⚡ <strong>Hyperspace:</strong> Emergency teleport (risky - 10% chance of self-destruct!)</li>
                        <li>🚀 Your ship has realistic inertia - you keep drifting unless you counter-thrust</li>
                        <li>🔫 Hold fire button for continuous automatic shooting!</li>
                        <li>💡 Screen wraps - everything that goes off one edge appears on the opposite side</li>
                    </ul>
                </div>
            </div>
        `;

        initGame();

        gameState.canvas = document.getElementById('asteroidsCanvas');
        gameState.ctx = gameState.canvas.getContext('2d');

        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Mobile button controls
        const leftBtn = document.getElementById('astLeftBtn');
        const rightBtn = document.getElementById('astRightBtn');
        const thrustBtn = document.getElementById('astThrustBtn');
        const fireBtn = document.getElementById('astFireBtn');
        const hyperspaceBtn = document.getElementById('astHyperspaceBtn');

        leftBtn.addEventListener('touchstart', () => gameState.ship.rotating = -1);
        leftBtn.addEventListener('touchend', () => gameState.ship.rotating = 0);
        leftBtn.addEventListener('mousedown', () => gameState.ship.rotating = -1);
        leftBtn.addEventListener('mouseup', () => gameState.ship.rotating = 0);

        rightBtn.addEventListener('touchstart', () => gameState.ship.rotating = 1);
        rightBtn.addEventListener('touchend', () => gameState.ship.rotating = 0);
        rightBtn.addEventListener('mousedown', () => gameState.ship.rotating = 1);
        rightBtn.addEventListener('mouseup', () => gameState.ship.rotating = 0);

        thrustBtn.addEventListener('touchstart', () => gameState.ship.thrusting = true);
        thrustBtn.addEventListener('touchend', () => gameState.ship.thrusting = false);
        thrustBtn.addEventListener('mousedown', () => gameState.ship.thrusting = true);
        thrustBtn.addEventListener('mouseup', () => gameState.ship.thrusting = false);

        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.firing = true;
        });
        fireBtn.addEventListener('touchend', () => {
            gameState.firing = false;
        });
        fireBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.firing = true;
        });
        fireBtn.addEventListener('mouseup', () => {
            gameState.firing = false;
        });

        hyperspaceBtn.addEventListener('click', () => {
            if (gameState.gameStarted && !gameState.gameOver) {
                hyperspace();
            }
        });

        // Start game loop
        lastTime = 0;
        gameLoop(0);
    }

    window.exitAsteroids = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        document.getElementById('asteroidsGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

    window.restartAsteroids = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        showAsteroidsGame();
    };

})();
