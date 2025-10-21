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
    const BALL_SPEED = 2;
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
        { rows: 8, ballSpeed: 2, name: 'Level 1' },
        { rows: 8, ballSpeed: 2.25, name: 'Level 2' },
        { rows: 8, ballSpeed: 2.5, name: 'Level 3' },
        { rows: 8, ballSpeed: 2.75, name: 'Level 4' },
        { rows: 8, ballSpeed: 3, name: 'Level 5' },
        { rows: 8, ballSpeed: 3.25, name: 'Level 6' },
        { rows: 8, ballSpeed: 3.5, name: 'Level 7' }
    ];

    // Game state
    let gameState = {
        canvas: null,
        ctx: null,
        paddle: { x: 0, y: 0, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, dx: 0 },
        ball: { x: 0, y: 0, dx: 0, dy: 0, radius: BALL_RADIUS, launched: false, lastX: 0, lastY: 0 },
        bricks: [],
        score: 0,
        lives: STARTING_LIVES,
        level: 1,
        gameOver: false,
        won: false,
        paused: false,
        keys: { left: false, right: false },
        mouseX: 0,
        useMouseControl: false,
        animationId: null
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
        gameState.ball.lastX = gameState.ball.x;
        gameState.ball.lastY = gameState.ball.y;

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
                    visible: true
                });
            }
        }
    }

    function setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
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
            gameState.ball.lastX = gameState.ball.x;
            gameState.ball.lastY = gameState.ball.y;
            return;
        }

        // Store last position before moving
        gameState.ball.lastX = gameState.ball.x;
        gameState.ball.lastY = gameState.ball.y;

        // Update ball position
        gameState.ball.x += gameState.ball.dx;
        gameState.ball.y += gameState.ball.dy;

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
            gameState.lives--;
            if (gameState.lives > 0) {
                resetBall();
            } else {
                gameOver();
            }
        }

        // Brick collision - find CLOSEST brick hit along ball's path
        let closestBrick = null;
        let closestDistance = Infinity;

        for (let brick of gameState.bricks) {
            if (!brick.visible) continue;

            // Check if ball overlaps this brick
            if (gameState.ball.x + BALL_RADIUS > brick.x &&
                gameState.ball.x - BALL_RADIUS < brick.x + brick.width &&
                gameState.ball.y + BALL_RADIUS > brick.y &&
                gameState.ball.y - BALL_RADIUS < brick.y + brick.height) {

                // Calculate distance from last position to brick
                const brickCenterX = brick.x + brick.width / 2;
                const brickCenterY = brick.y + brick.height / 2;
                const distance = Math.sqrt(
                    Math.pow(gameState.ball.lastX - brickCenterX, 2) +
                    Math.pow(gameState.ball.lastY - brickCenterY, 2)
                );

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestBrick = brick;
                }
            }
        }

        // Only destroy the closest brick if one was found
        if (closestBrick) {
            closestBrick.visible = false;
            gameState.score += closestBrick.points;

            // Determine bounce direction
            const ballCenterX = gameState.ball.x;
            const ballCenterY = gameState.ball.y;
            const brickCenterX = closestBrick.x + closestBrick.width / 2;
            const brickCenterY = closestBrick.y + closestBrick.height / 2;

            const diffX = Math.abs(ballCenterX - brickCenterX);
            const diffY = Math.abs(ballCenterY - brickCenterY);

            if (diffX > diffY) {
                // Hit from side
                gameState.ball.dx *= -1;
                // Push ball outside the brick
                if (ballCenterX < brickCenterX) {
                    gameState.ball.x = closestBrick.x - BALL_RADIUS - 1;
                } else {
                    gameState.ball.x = closestBrick.x + closestBrick.width + BALL_RADIUS + 1;
                }
            } else {
                // Hit from top/bottom
                gameState.ball.dy *= -1;
                // Push ball outside the brick
                if (ballCenterY < brickCenterY) {
                    gameState.ball.y = closestBrick.y - BALL_RADIUS - 1;
                } else {
                    gameState.ball.y = closestBrick.y + closestBrick.height + BALL_RADIUS + 1;
                }
            }

            // Check if level complete
            if (gameState.bricks.every(b => !b.visible)) {
                levelComplete();
            }
        }

        updateDisplay();
    }

    function resetBall() {
        gameState.ball.x = CANVAS_WIDTH / 2;
        gameState.ball.y = gameState.paddle.y - BALL_RADIUS - 5;
        gameState.ball.dx = 0;
        gameState.ball.dy = 0;
        gameState.ball.launched = false;
        gameState.ball.lastX = gameState.ball.x;
        gameState.ball.lastY = gameState.ball.y;
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
        }

        // Draw paddle
        ctx.fillStyle = '#3498db';
        ctx.fillRect(gameState.paddle.x, gameState.paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.strokeRect(gameState.paddle.x, gameState.paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);

        // Draw ball
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 2;
        ctx.stroke();

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
