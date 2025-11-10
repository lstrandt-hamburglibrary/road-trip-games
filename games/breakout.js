// Breakout - Classic 1976 Brick Breaking Game
(function() {
    'use strict';

    // Game constants
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const PADDLE_WIDTH = 100;
    const PADDLE_HEIGHT = 15;
    const PADDLE_SPEED = 8;
    const BALL_RADIUS = 8;
    const BALL_SPEED = 4;
    const BRICK_ROWS = 8;
    const BRICK_COLS = 14;
    const BRICK_WIDTH = 50;
    const BRICK_HEIGHT = 20;
    const BRICK_PADDING = 5;
    const BRICK_OFFSET_TOP = 80;
    const BRICK_OFFSET_LEFT = 35;
    const STARTING_LIVES = 3;

    // Brick colors and points
    const BRICK_COLORS = [
        { color: '#e74c3c', points: 7 },  // Red
        { color: '#e74c3c', points: 7 },  // Red
        { color: '#f39c12', points: 5 },  // Orange
        { color: '#f39c12', points: 5 },  // Orange
        { color: '#2ecc71', points: 3 },  // Green
        { color: '#2ecc71', points: 3 },  // Green
        { color: '#f1c40f', points: 1 },  // Yellow
        { color: '#f1c40f', points: 1 }   // Yellow
    ];

    // Level configurations
    const LEVELS = [
        { rows: 8, ballSpeed: 5, name: 'Level 1' },
        { rows: 8, ballSpeed: 5.4, name: 'Level 2' },
        { rows: 8, ballSpeed: 5.8, name: 'Level 3' },
        { rows: 8, ballSpeed: 6.2, name: 'Level 4' },
        { rows: 8, ballSpeed: 6.6, name: 'Level 5' },
        { rows: 8, ballSpeed: 7, name: 'Level 6' },
        { rows: 8, ballSpeed: 7.4, name: 'Level 7' }
    ];

    // Power-up types
    const POWERUPS = [
        { name: 'multiball', color: '#9b59b6', emoji: '⚡', text: 'Multi-Ball!' },
        { name: 'doublepoints', color: '#f1c40f', emoji: '💰', text: '2x Points!' },
        { name: 'widepaddle', color: '#3498db', emoji: '📏', text: 'Wide Paddle!' },
        { name: 'extralife', color: '#e74c3c', emoji: '❤️', text: 'Extra Life!' }
    ];

    // Game state
    let gameState = {
        canvas: null,
        ctx: null,
        paddle: { x: 0, y: 0, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, dx: 0, normalWidth: PADDLE_WIDTH, wideUntil: 0 },
        ball: { x: 0, y: 0, dx: 0, dy: 0, radius: BALL_RADIUS, launched: false, skipFrames: 0 },
        balls: [], // Additional balls for multi-ball
        bricks: [],
        powerups: [], // Falling power-ups
        score: 0,
        lives: STARTING_LIVES,
        level: 1,
        gameOver: false,
        won: false,
        paused: false,
        keys: { left: false, right: false },
        mouseX: 0,
        useMouseControl: false,
        animationId: null,
        doublePointsUntil: 0
    };

    // Initialize game
    function initGame() {
        const canvas = document.getElementById('breakoutCanvas');
        if (!canvas) return;

        gameState.canvas = canvas;
        gameState.ctx = canvas.getContext('2d');

        resetGame();
        setupEventListeners();
        gameLoop();
    }

    function resetGame() {
        gameState.score = 0;
        gameState.lives = STARTING_LIVES;
        gameState.level = 1;
        gameState.gameOver = false;
        gameState.won = false;
        resetLevel();
    }

    function resetLevel() {
        // Reset paddle
        gameState.paddle.x = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
        gameState.paddle.y = CANVAS_HEIGHT - 40;
        gameState.paddle.dx = 0;

        // Reset ball
        gameState.ball.x = CANVAS_WIDTH / 2;
        gameState.ball.y = gameState.paddle.y - BALL_RADIUS - 5;
        gameState.ball.dx = 0;
        gameState.ball.dy = 0;
        gameState.ball.launched = false;
        gameState.ball.skipFrames = 0;

        // Create bricks
        createBricks();

        gameState.paused = false;
    }

    function createBricks() {
        gameState.bricks = [];
        const levelConfig = LEVELS[gameState.level - 1];
        const rows = levelConfig.rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < BRICK_COLS; col++) {
                const brickInfo = BRICK_COLORS[row];
                gameState.bricks.push({
                    x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING),
                    y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
                    width: BRICK_WIDTH,
                    height: BRICK_HEIGHT,
                    color: brickInfo.color,
                    points: brickInfo.points,
                    visible: true,
                    powerup: null
                });
            }
        }

        // Add one random power-up brick per level
        if (gameState.bricks.length > 0) {
            const randomIndex = Math.floor(Math.random() * gameState.bricks.length);
            const randomPowerup = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
            gameState.bricks[randomIndex].powerup = randomPowerup;
            gameState.bricks[randomIndex].color = randomPowerup.color;
        }
    }

    function setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Prevent default scrolling for arrow keys and space
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === 'ArrowLeft') {
                gameState.keys.left = true;
                gameState.useMouseControl = false;
            }
            if (e.key === 'ArrowRight') {
                gameState.keys.right = true;
                gameState.useMouseControl = false;
            }
            if (e.key === ' ' && !gameState.ball.launched && !gameState.gameOver) {
                launchBall();
            }
            if (e.key === 'p' || e.key === 'P') {
                togglePause();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') gameState.keys.left = false;
            if (e.key === 'ArrowRight') gameState.keys.right = false;
        });

        // Mouse controls
        gameState.canvas.addEventListener('mousemove', (e) => {
            const rect = gameState.canvas.getBoundingClientRect();
            gameState.mouseX = e.clientX - rect.left;
            gameState.useMouseControl = true;
        });

        gameState.canvas.addEventListener('click', () => {
            if (!gameState.ball.launched && !gameState.gameOver) {
                launchBall();
            }
        });
    }

    // Setup mobile touch controls
    function setupMobileControls() {
        const btnLeft = document.getElementById('breakoutBtnLeft');
        const btnRight = document.getElementById('breakoutBtnRight');
        const btnLaunch = document.getElementById('breakoutBtnLaunch');

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', (e) => {
                e.preventDefault();
                gameState.keys.left = true;
                gameState.useMouseControl = false;
            });
            btnLeft.addEventListener('touchend', (e) => {
                e.preventDefault();
                gameState.keys.left = false;
            });
            btnLeft.addEventListener('mousedown', (e) => {
                e.preventDefault();
                gameState.keys.left = true;
                gameState.useMouseControl = false;
            });
            btnLeft.addEventListener('mouseup', (e) => {
                e.preventDefault();
                gameState.keys.left = false;
            });
        }

        if (btnRight) {
            btnRight.addEventListener('touchstart', (e) => {
                e.preventDefault();
                gameState.keys.right = true;
                gameState.useMouseControl = false;
            });
            btnRight.addEventListener('touchend', (e) => {
                e.preventDefault();
                gameState.keys.right = false;
            });
            btnRight.addEventListener('mousedown', (e) => {
                e.preventDefault();
                gameState.keys.right = true;
                gameState.useMouseControl = false;
            });
            btnRight.addEventListener('mouseup', (e) => {
                e.preventDefault();
                gameState.keys.right = false;
            });
        }

        if (btnLaunch) {
            btnLaunch.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!gameState.ball.launched && !gameState.gameOver) {
                    launchBall();
                }
            });
            btnLaunch.addEventListener('click', (e) => {
                e.preventDefault();
                if (!gameState.ball.launched && !gameState.gameOver) {
                    launchBall();
                }
            });
        }
    }

    function launchBall() {
        const levelConfig = LEVELS[gameState.level - 1];
        const speed = levelConfig.ballSpeed;

        // Random angle between -60 and 60 degrees
        const angle = (Math.random() * 120 - 60) * Math.PI / 180;
        gameState.ball.dx = speed * Math.sin(angle);
        gameState.ball.dy = -speed * Math.cos(angle);
        gameState.ball.launched = true;
    }

    function togglePause() {
        if (!gameState.gameOver && gameState.ball.launched) {
            gameState.paused = !gameState.paused;
        }
    }

    function updateGame() {
        if (gameState.gameOver || gameState.paused) return;

        // Update paddle
        if (gameState.useMouseControl) {
            gameState.paddle.x = gameState.mouseX - PADDLE_WIDTH / 2;
        } else {
            if (gameState.keys.left) gameState.paddle.dx = -PADDLE_SPEED;
            else if (gameState.keys.right) gameState.paddle.dx = PADDLE_SPEED;
            else gameState.paddle.dx = 0;
            gameState.paddle.x += gameState.paddle.dx;
        }

        // Paddle boundaries
        if (gameState.paddle.x < 0) gameState.paddle.x = 0;
        if (gameState.paddle.x + PADDLE_WIDTH > CANVAS_WIDTH) {
            gameState.paddle.x = CANVAS_WIDTH - PADDLE_WIDTH;
        }

        // Ball follows paddle if not launched
        if (!gameState.ball.launched) {
            gameState.ball.x = gameState.paddle.x + PADDLE_WIDTH / 2;
            return;
        }

        // Decrement skip frames
        if (gameState.ball.skipFrames > 0) {
            gameState.ball.skipFrames--;
        }

        // Sub-step movement - move ball in small increments to prevent tunneling
        const steps = 5; // Divide movement into 5 sub-steps
        const stepDx = gameState.ball.dx / steps;
        const stepDy = gameState.ball.dy / steps;

        for (let i = 0; i < steps; i++) {
            gameState.ball.x += stepDx;
            gameState.ball.y += stepDy;

            // Check for brick collision after each sub-step (only if not in skip frames)
            if (gameState.ball.skipFrames === 0 && checkBrickCollision()) {
                gameState.ball.skipFrames = 3; // Skip next 3 frames after hitting a brick
                break; // Stop moving if we hit a brick
            }
        }

        // Wall collision (left and right)
        if (gameState.ball.x - BALL_RADIUS < 0 || gameState.ball.x + BALL_RADIUS > CANVAS_WIDTH) {
            gameState.ball.dx *= -1;
            // Keep ball in bounds
            if (gameState.ball.x - BALL_RADIUS < 0) gameState.ball.x = BALL_RADIUS;
            if (gameState.ball.x + BALL_RADIUS > CANVAS_WIDTH) gameState.ball.x = CANVAS_WIDTH - BALL_RADIUS;
        }

        // Wall collision (top)
        if (gameState.ball.y - BALL_RADIUS < 0) {
            gameState.ball.dy *= -1;
            gameState.ball.y = BALL_RADIUS;
        }

        // Paddle collision
        if (gameState.ball.y + BALL_RADIUS > gameState.paddle.y &&
            gameState.ball.y - BALL_RADIUS < gameState.paddle.y + gameState.paddle.height &&
            gameState.ball.x > gameState.paddle.x &&
            gameState.ball.x < gameState.paddle.x + PADDLE_WIDTH) {

            // Bounce ball
            gameState.ball.dy = -Math.abs(gameState.ball.dy);

            // Add english based on where ball hits paddle
            const hitPos = (gameState.ball.x - gameState.paddle.x) / PADDLE_WIDTH;
            const angle = (hitPos - 0.5) * 120; // -60 to 60 degrees
            const speed = Math.sqrt(gameState.ball.dx ** 2 + gameState.ball.dy ** 2);
            gameState.ball.dx = speed * Math.sin(angle * Math.PI / 180);

            // Ensure ball doesn't get stuck
            gameState.ball.y = gameState.paddle.y - BALL_RADIUS;
        }

        // Ball falls below paddle
        if (gameState.ball.y - BALL_RADIUS > CANVAS_HEIGHT) {
            if (gameState.balls.length > 0) {
                // Multi-ball active - just remove this ball, promote one from balls array
                gameState.ball = gameState.balls.pop();
            } else {
                // No extra balls - lose a life
                gameState.lives--;
                if (gameState.lives > 0) {
                    resetBall();
                } else {
                    gameOver();
                }
            }
        }

        // Update extra balls (multi-ball)
        for (let i = gameState.balls.length - 1; i >= 0; i--) {
            const ball = gameState.balls[i];

            // Decrement skip frames
            if (ball.skipFrames > 0) {
                ball.skipFrames--;
            }

            // Sub-step movement
            const steps = 5;
            const stepDx = ball.dx / steps;
            const stepDy = ball.dy / steps;

            for (let j = 0; j < steps; j++) {
                ball.x += stepDx;
                ball.y += stepDy;

                if (ball.skipFrames === 0 && checkBrickCollisionForBall(ball)) {
                    ball.skipFrames = 3;
                    break;
                }
            }

            // Wall collision
            if (ball.x - BALL_RADIUS < 0 || ball.x + BALL_RADIUS > CANVAS_WIDTH) {
                ball.dx *= -1;
                if (ball.x - BALL_RADIUS < 0) ball.x = BALL_RADIUS;
                if (ball.x + BALL_RADIUS > CANVAS_WIDTH) ball.x = CANVAS_WIDTH - BALL_RADIUS;
            }
            if (ball.y - BALL_RADIUS < 0) {
                ball.dy *= -1;
                ball.y = BALL_RADIUS;
            }

            // Paddle collision
            if (ball.y + BALL_RADIUS > gameState.paddle.y &&
                ball.y - BALL_RADIUS < gameState.paddle.y + gameState.paddle.height &&
                ball.x > gameState.paddle.x &&
                ball.x < gameState.paddle.x + gameState.paddle.width) {

                ball.dy = -Math.abs(ball.dy);
                const hitPos = (ball.x - gameState.paddle.x) / gameState.paddle.width;
                const angle = (hitPos - 0.5) * 120;
                const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
                ball.dx = speed * Math.sin(angle * Math.PI / 180);
                ball.y = gameState.paddle.y - BALL_RADIUS;
            }

            // Remove ball if it falls below paddle
            if (ball.y - BALL_RADIUS > CANVAS_HEIGHT) {
                gameState.balls.splice(i, 1);
            }
        }

        // Update falling power-ups
        for (let i = gameState.powerups.length - 1; i >= 0; i--) {
            const powerup = gameState.powerups[i];
            powerup.y += 2; // Fall speed

            // Check if paddle caught it
            if (powerup.y + 10 > gameState.paddle.y &&
                powerup.y < gameState.paddle.y + gameState.paddle.height &&
                powerup.x + 20 > gameState.paddle.x &&
                powerup.x < gameState.paddle.x + gameState.paddle.width) {

                applyPowerup(powerup.type);
                gameState.powerups.splice(i, 1);
            }
            // Remove if fell off screen
            else if (powerup.y > CANVAS_HEIGHT) {
                gameState.powerups.splice(i, 1);
            }
        }

        // Update timed power-ups
        const now = Date.now();
        if (gameState.doublePointsUntil > 0 && now > gameState.doublePointsUntil) {
            gameState.doublePointsUntil = 0;
        }
        if (gameState.paddle.wideUntil > 0 && now > gameState.paddle.wideUntil) {
            gameState.paddle.wideUntil = 0;
            gameState.paddle.width = gameState.paddle.normalWidth;
        }

        updateDisplay();
    }

    // Check for brick collision and handle it - returns true if brick was hit
    function checkBrickCollision() {
        return checkBrickCollisionForBall(gameState.ball);
    }

    // Check brick collision for any ball object
    function checkBrickCollisionForBall(ball) {
        // First pass - find if we're colliding with ANY brick
        let hitBrick = null;

        for (let brick of gameState.bricks) {
            if (!brick.visible) continue;

            // Check if ball overlaps this brick
            if (ball.x + BALL_RADIUS > brick.x &&
                ball.x - BALL_RADIUS < brick.x + brick.width &&
                ball.y + BALL_RADIUS > brick.y &&
                ball.y - BALL_RADIUS < brick.y + brick.height) {

                hitBrick = brick;
                break; // Found ONE brick, stop looking
            }
        }

        // If we hit a brick, handle ONLY that one brick
        if (hitBrick) {
            // Destroy the brick
            hitBrick.visible = false;

            // Apply score multiplier if double points active
            const points = gameState.doublePointsUntil > 0 ? hitBrick.points * 2 : hitBrick.points;
            gameState.score += points;

            // Drop power-up if this brick had one
            if (hitBrick.powerup) {
                gameState.powerups.push({
                    x: hitBrick.x + hitBrick.width / 2 - 10,
                    y: hitBrick.y,
                    type: hitBrick.powerup
                });
            }

            // Determine bounce direction
            const ballCenterX = ball.x;
            const ballCenterY = ball.y;
            const brickCenterX = hitBrick.x + hitBrick.width / 2;
            const brickCenterY = hitBrick.y + hitBrick.height / 2;

            const diffX = Math.abs(ballCenterX - brickCenterX);
            const diffY = Math.abs(ballCenterY - brickCenterY);

            if (diffX > diffY) {
                // Hit from side
                ball.dx *= -1;
                // Push ball completely outside the brick
                if (ballCenterX < brickCenterX) {
                    ball.x = hitBrick.x - BALL_RADIUS - 2;
                } else {
                    ball.x = hitBrick.x + hitBrick.width + BALL_RADIUS + 2;
                }
            } else {
                // Hit from top/bottom
                ball.dy *= -1;
                // Push ball completely outside the brick
                if (ballCenterY < brickCenterY) {
                    ball.y = hitBrick.y - BALL_RADIUS - 2;
                } else {
                    ball.y = hitBrick.y + hitBrick.height + BALL_RADIUS + 2;
                }
            }

            // Check if level complete
            if (gameState.bricks.every(b => !b.visible)) {
                levelComplete();
            }

            return true; // Brick was hit, stop all movement this frame
        }

        return false; // No brick hit
    }

    // Apply power-up effect
    function applyPowerup(powerup) {
        showMessage(powerup.text, 2000);

        if (powerup.name === 'multiball') {
            // Spawn a second ball
            const levelConfig = LEVELS[gameState.level - 1];
            const speed = levelConfig.ballSpeed;
            const angle = (Math.random() * 120 - 60) * Math.PI / 180;

            gameState.balls.push({
                x: gameState.ball.x,
                y: gameState.ball.y,
                dx: speed * Math.sin(angle),
                dy: -speed * Math.cos(angle),
                radius: BALL_RADIUS,
                skipFrames: 0
            });
        } else if (powerup.name === 'doublepoints') {
            gameState.doublePointsUntil = Date.now() + 10000; // 10 seconds
        } else if (powerup.name === 'widepaddle') {
            gameState.paddle.width = PADDLE_WIDTH * 1.5;
            gameState.paddle.wideUntil = Date.now() + 10000; // 10 seconds
        } else if (powerup.name === 'extralife') {
            gameState.lives++;
        }
    }

    function resetBall() {
        gameState.ball.x = CANVAS_WIDTH / 2;
        gameState.ball.y = gameState.paddle.y - BALL_RADIUS - 5;
        gameState.ball.dx = 0;
        gameState.ball.dy = 0;
        gameState.ball.launched = false;
        gameState.ball.skipFrames = 0;
        gameState.balls = []; // Clear multi-balls
        gameState.powerups = []; // Clear falling powerups
    }

    function levelComplete() {
        if (gameState.level < LEVELS.length) {
            gameState.level++;
            setTimeout(() => {
                showMessage(`Level ${gameState.level}!`, 1500);
                resetLevel();
            }, 500);
        } else {
            winGame();
        }
    }

    function gameOver() {
        gameState.gameOver = true;
        gameState.won = false;
        document.getElementById('breakoutGameOverScreen').style.display = 'flex';
        document.getElementById('breakoutFinalScore').textContent = gameState.score;
        document.getElementById('breakoutGameOverTitle').textContent = 'GAME OVER';
        document.getElementById('breakoutGameOverMessage').textContent = 'Better luck next time!';
    }

    function winGame() {
        gameState.gameOver = true;
        gameState.won = true;
        document.getElementById('breakoutGameOverScreen').style.display = 'flex';
        document.getElementById('breakoutFinalScore').textContent = gameState.score;
        document.getElementById('breakoutGameOverTitle').textContent = 'YOU WIN!';
        document.getElementById('breakoutGameOverMessage').textContent = 'Congratulations! You beat all levels!';
    }

    function showMessage(text, duration) {
        const msgEl = document.getElementById('breakoutMessage');
        if (msgEl) {
            msgEl.textContent = text;
            msgEl.style.display = 'block';
            setTimeout(() => {
                msgEl.style.display = 'none';
            }, duration);
        }
    }

    function renderGame() {
        const ctx = gameState.ctx;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw bricks
        for (let brick of gameState.bricks) {
            if (!brick.visible) continue;

            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

            // Add 3D effect
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

            // Draw power-up emoji if this brick has one
            if (brick.powerup) {
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(brick.powerup.emoji, brick.x + brick.width / 2, brick.y + brick.height / 2);
            }
        }

        // Draw falling power-ups
        for (let powerup of gameState.powerups) {
            ctx.fillStyle = powerup.type.color;
            ctx.fillRect(powerup.x, powerup.y, 20, 20);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(powerup.x, powerup.y, 20, 20);
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(powerup.type.emoji, powerup.x + 10, powerup.y + 10);
        }

        // Draw paddle
        ctx.fillStyle = '#3498db';
        ctx.fillRect(gameState.paddle.x, gameState.paddle.y, gameState.paddle.width, PADDLE_HEIGHT);
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.strokeRect(gameState.paddle.x, gameState.paddle.y, gameState.paddle.width, PADDLE_HEIGHT);

        // Draw main ball
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw extra balls (multi-ball)
        for (let ball of gameState.balls) {
            ctx.fillStyle = '#ecf0f1';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#bdc3c7';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw launch hint
        if (!gameState.ball.launched && !gameState.gameOver) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SPACE or CLICK to launch!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }

        // Draw pause message
        if (gameState.paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.font = '20px Arial';
            ctx.fillText('Press P to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        }
    }

    function updateDisplay() {
        document.getElementById('breakoutScore').textContent = gameState.score;
        document.getElementById('breakoutLives').textContent = gameState.lives;
        document.getElementById('breakoutLevel').textContent = gameState.level;
    }

    function gameLoop() {
        updateGame();
        renderGame();
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    // Export functions to window
    window.launchBreakout = function() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('breakoutGame').style.display = 'block';
        initGame();
        setupMobileControls();
    };

    window.exitBreakout = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        document.getElementById('breakoutGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

    window.breakoutRestart = function() {
        document.getElementById('breakoutGameOverScreen').style.display = 'none';
        resetGame();
    };

    window.breakoutPause = function() {
        togglePause();
    };

})();
