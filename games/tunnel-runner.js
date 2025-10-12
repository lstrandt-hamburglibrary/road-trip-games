// Tunnel Runner Game - Side-scrolling rocket game
(function() {
    let gameCanvas, ctx;
    let gameState = 'menu'; // menu, playing, gameOver
    let rocket;
    let tunnelSegments = [];
    let score = 0;
    let highScore = parseInt(localStorage.getItem('tunnelRunnerHighScore') || '0');
    let animationId;

    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 600;
    const ROCKET_SIZE = 30;
    const SCROLL_SPEED = 3;
    const BASE_TUNNEL_WIDTH = 200;
    const MIN_TUNNEL_WIDTH = 140;
    const MAX_TUNNEL_WIDTH = 220;
    const SEGMENT_WIDTH = 20;
    const OBSTACLE_CHANCE = 0.05; // 5% chance per segment

    // Rocket object
    function createRocket() {
        return {
            x: 150,
            y: GAME_HEIGHT / 2,
            velocity: 0,
            gravity: 0.25,
            lift: -4.5,
            maxVelocity: 6
        };
    }

    // Create a tunnel segment
    function createTunnelSegment(x, topHeight, bottomHeight, tunnelWidth, obstacles = []) {
        return {
            x: x,
            topHeight: topHeight,
            bottomHeight: bottomHeight,
            tunnelWidth: tunnelWidth,
            obstacles: obstacles
        };
    }

    // Create random obstacles for a segment
    function createObstacles(topHeight, bottomHeight) {
        const obstacles = [];

        if (Math.random() < OBSTACLE_CHANCE) {
            // Random obstacle type
            const type = Math.random() < 0.5 ? 'stalactite' : 'stalagmite';
            const obstacleLength = 30 + Math.random() * 40; // 30-70 pixels

            if (type === 'stalactite') {
                obstacles.push({
                    type: 'stalactite',
                    y: topHeight,
                    length: obstacleLength
                });
            } else {
                obstacles.push({
                    type: 'stalagmite',
                    y: bottomHeight,
                    length: obstacleLength
                });
            }
        }

        return obstacles;
    }

    // Initialize game
    function initGame() {
        rocket = createRocket();
        tunnelSegments = [];
        score = 0;

        // Create initial tunnel segments
        let currentTunnelWidth = BASE_TUNNEL_WIDTH;
        let currentTopHeight = GAME_HEIGHT / 2 - currentTunnelWidth / 2;
        let currentBottomHeight = GAME_HEIGHT / 2 + currentTunnelWidth / 2;

        for (let i = 0; i < Math.ceil(GAME_WIDTH / SEGMENT_WIDTH) + 5; i++) {
            // Add some random variation to tunnel height
            const variation = (Math.random() - 0.5) * 10;

            // Gradually vary tunnel width
            const widthVariation = (Math.random() - 0.5) * 3;
            currentTunnelWidth = Math.max(MIN_TUNNEL_WIDTH, Math.min(MAX_TUNNEL_WIDTH, currentTunnelWidth + widthVariation));

            currentTopHeight = Math.max(50, Math.min(GAME_HEIGHT - currentTunnelWidth - 50, currentTopHeight + variation));
            currentBottomHeight = currentTopHeight + currentTunnelWidth;

            const obstacles = i > 10 ? createObstacles(currentTopHeight, currentBottomHeight) : []; // No obstacles at start

            tunnelSegments.push(createTunnelSegment(i * SEGMENT_WIDTH, currentTopHeight, currentBottomHeight, currentTunnelWidth, obstacles));
        }

        gameState = 'playing';
        gameLoop();
    }

    // Update game state
    function update() {
        if (gameState !== 'playing') return;

        // Update rocket physics
        rocket.velocity += rocket.gravity;

        // Cap velocity to prevent going too fast
        rocket.velocity = Math.max(-rocket.maxVelocity, Math.min(rocket.maxVelocity, rocket.velocity));

        rocket.y += rocket.velocity;

        // Update tunnel segments (scroll left)
        for (let segment of tunnelSegments) {
            segment.x -= SCROLL_SPEED;
        }

        // Remove off-screen segments and add new ones
        if (tunnelSegments[0].x < -SEGMENT_WIDTH) {
            tunnelSegments.shift();

            // Add new segment at the end
            const lastSegment = tunnelSegments[tunnelSegments.length - 1];
            const variation = (Math.random() - 0.5) * 15;

            // Gradually vary tunnel width
            const widthVariation = (Math.random() - 0.5) * 3;
            let newTunnelWidth = Math.max(MIN_TUNNEL_WIDTH, Math.min(MAX_TUNNEL_WIDTH, lastSegment.tunnelWidth + widthVariation));

            let newTopHeight = Math.max(50, Math.min(GAME_HEIGHT - newTunnelWidth - 50, lastSegment.topHeight + variation));
            let newBottomHeight = newTopHeight + newTunnelWidth;

            const obstacles = createObstacles(newTopHeight, newBottomHeight);

            tunnelSegments.push(createTunnelSegment(
                lastSegment.x + SEGMENT_WIDTH,
                newTopHeight,
                newBottomHeight,
                newTunnelWidth,
                obstacles
            ));

            score++;
        }

        // Check collisions
        const rocketSegment = tunnelSegments.find(seg =>
            rocket.x + ROCKET_SIZE > seg.x && rocket.x < seg.x + SEGMENT_WIDTH
        );

        if (rocketSegment) {
            // Check tunnel walls
            if (rocket.y < rocketSegment.topHeight || rocket.y + ROCKET_SIZE > rocketSegment.bottomHeight) {
                gameOver();
            }

            // Check obstacles (stalactites and stalagmites)
            for (let obstacle of rocketSegment.obstacles) {
                if (obstacle.type === 'stalactite') {
                    // Stalactite hangs from top
                    if (rocket.y < obstacle.y + obstacle.length) {
                        gameOver();
                    }
                } else if (obstacle.type === 'stalagmite') {
                    // Stalagmite rises from bottom
                    if (rocket.y + ROCKET_SIZE > obstacle.y - obstacle.length) {
                        gameOver();
                    }
                }
            }
        }

        // Check if rocket went off screen
        if (rocket.y < 0 || rocket.y + ROCKET_SIZE > GAME_HEIGHT) {
            gameOver();
        }
    }

    // Draw game
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (gameState === 'menu') {
            drawMenu();
        } else if (gameState === 'playing') {
            drawTunnel();
            drawRocket();
            drawScore();
        } else if (gameState === 'gameOver') {
            drawTunnel();
            drawRocket();
            drawGameOver();
        }
    }

    // Draw tunnel
    function drawTunnel() {
        ctx.fillStyle = '#6c5ce7';

        for (let segment of tunnelSegments) {
            // Draw top wall
            ctx.fillRect(segment.x, 0, SEGMENT_WIDTH + 1, segment.topHeight);

            // Draw bottom wall
            ctx.fillRect(segment.x, segment.bottomHeight, SEGMENT_WIDTH + 1, GAME_HEIGHT - segment.bottomHeight);

            // Draw wall edges for visual effect
            ctx.strokeStyle = '#a29bfe';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(segment.x, segment.topHeight);
            ctx.lineTo(segment.x + SEGMENT_WIDTH, segment.topHeight);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(segment.x, segment.bottomHeight);
            ctx.lineTo(segment.x + SEGMENT_WIDTH, segment.bottomHeight);
            ctx.stroke();

            // Draw obstacles
            for (let obstacle of segment.obstacles) {
                ctx.fillStyle = '#9b59b6';

                if (obstacle.type === 'stalactite') {
                    // Draw stalactite (triangle pointing down)
                    ctx.beginPath();
                    ctx.moveTo(segment.x + SEGMENT_WIDTH / 2, obstacle.y);
                    ctx.lineTo(segment.x, obstacle.y + obstacle.length);
                    ctx.lineTo(segment.x + SEGMENT_WIDTH, obstacle.y + obstacle.length);
                    ctx.closePath();
                    ctx.fill();

                    // Add highlight
                    ctx.strokeStyle = '#bb8fce';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else if (obstacle.type === 'stalagmite') {
                    // Draw stalagmite (triangle pointing up)
                    ctx.beginPath();
                    ctx.moveTo(segment.x + SEGMENT_WIDTH / 2, obstacle.y);
                    ctx.lineTo(segment.x, obstacle.y - obstacle.length);
                    ctx.lineTo(segment.x + SEGMENT_WIDTH, obstacle.y - obstacle.length);
                    ctx.closePath();
                    ctx.fill();

                    // Add highlight
                    ctx.strokeStyle = '#bb8fce';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }
    }

    // Draw rocket
    function drawRocket() {
        ctx.save();
        ctx.translate(rocket.x + ROCKET_SIZE / 2, rocket.y + ROCKET_SIZE / 2);

        // Tilt rocket based on velocity
        const tilt = Math.min(Math.max(rocket.velocity * 0.05, -0.3), 0.3);
        ctx.rotate(tilt);

        // Rocket body
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(ROCKET_SIZE / 2, 0);
        ctx.lineTo(-ROCKET_SIZE / 2, -ROCKET_SIZE / 3);
        ctx.lineTo(-ROCKET_SIZE / 2, ROCKET_SIZE / 3);
        ctx.closePath();
        ctx.fill();

        // Rocket flame
        if (gameState === 'playing') {
            ctx.fillStyle = '#feca57';
            const flameSize = 10 + Math.random() * 5;
            ctx.beginPath();
            ctx.moveTo(-ROCKET_SIZE / 2, -5);
            ctx.lineTo(-ROCKET_SIZE / 2 - flameSize, 0);
            ctx.lineTo(-ROCKET_SIZE / 2, 5);
            ctx.closePath();
            ctx.fill();
        }

        // Rocket window
        ctx.fillStyle = '#74b9ff';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Draw score
    function drawScore() {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 20, 40);
        ctx.fillText(`High: ${highScore}`, 20, 70);
    }

    // Draw menu
    function drawMenu() {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🚀 TUNNEL RUNNER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);

        ctx.font = '24px Arial';
        ctx.fillText('Navigate your rocket through the tunnel!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
        ctx.fillText('Avoid the walls and obstacles!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
        ctx.fillText('Tap or hold to fly up', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
        ctx.fillText('Release to fall down', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);

        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#feca57';
        ctx.fillText('TAP TO START', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);

        if (highScore > 0) {
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(`High Score: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 170);
        }
    }

    // Draw game over
    function drawGameOver() {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

        ctx.font = '32px Arial';
        ctx.fillText(`Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

        if (score > highScore) {
            ctx.fillStyle = '#feca57';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('🎉 NEW HIGH SCORE! 🎉', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        } else {
            ctx.fillStyle = 'white';
            ctx.font = '24px Arial';
            ctx.fillText(`High Score: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        }

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#feca57';
        ctx.fillText('TAP TO PLAY AGAIN', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
    }

    // Game over
    function gameOver() {
        gameState = 'gameOver';

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('tunnelRunnerHighScore', highScore.toString());
        }

        cancelAnimationFrame(animationId);
    }

    // Game loop
    function gameLoop() {
        update();
        draw();

        if (gameState === 'playing') {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    // Handle input
    function handleTap() {
        if (gameState === 'menu' || gameState === 'gameOver') {
            initGame();
        } else if (gameState === 'playing') {
            rocket.velocity = rocket.lift;
        }
    }

    // Launch Tunnel Runner
    window.launchTunnelRunner = function() {
        const content = document.getElementById('tunnelRunnerContent');

        content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <canvas id="tunnelCanvas" width="${GAME_WIDTH}" height="${GAME_HEIGHT}" style="
                    border: 4px solid #6c5ce7;
                    border-radius: 10px;
                    max-width: 100%;
                    height: auto;
                    background: #1a1a2e;
                    cursor: pointer;
                    touch-action: none;
                "></canvas>

                <div style="text-align: center; color: #666;">
                    <p style="margin: 0.5rem 0;">💡 <strong>Desktop:</strong> Click or press Space to fly up</p>
                    <p style="margin: 0.5rem 0;">📱 <strong>Mobile:</strong> Tap screen to fly up</p>
                </div>
            </div>
        `;

        // Show game section
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('tunnelRunnerGame').style.display = 'block';

        // Initialize canvas
        gameCanvas = document.getElementById('tunnelCanvas');
        ctx = gameCanvas.getContext('2d');

        gameState = 'menu';
        draw();

        // Event listeners
        gameCanvas.addEventListener('click', handleTap);
        gameCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTap();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && document.getElementById('tunnelRunnerGame').style.display === 'block') {
                e.preventDefault();
                handleTap();
            }
        });
    };

    // Exit to menu
    window.exitTunnelRunnerToMenu = function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        document.getElementById('tunnelRunnerGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };
})();
