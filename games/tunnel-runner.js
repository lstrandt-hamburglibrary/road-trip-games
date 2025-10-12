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
    const TUNNEL_WIDTH = 200;
    const SEGMENT_WIDTH = 20;

    // Rocket object
    function createRocket() {
        return {
            x: 150,
            y: GAME_HEIGHT / 2,
            velocity: 0,
            gravity: 0.5,
            lift: -10
        };
    }

    // Create a tunnel segment
    function createTunnelSegment(x, topHeight, bottomHeight) {
        return {
            x: x,
            topHeight: topHeight,
            bottomHeight: bottomHeight
        };
    }

    // Initialize game
    function initGame() {
        rocket = createRocket();
        tunnelSegments = [];
        score = 0;

        // Create initial tunnel segments
        let currentTopHeight = GAME_HEIGHT / 2 - TUNNEL_WIDTH / 2;
        let currentBottomHeight = GAME_HEIGHT / 2 + TUNNEL_WIDTH / 2;

        for (let i = 0; i < Math.ceil(GAME_WIDTH / SEGMENT_WIDTH) + 5; i++) {
            // Add some random variation to tunnel height
            const variation = (Math.random() - 0.5) * 10;
            currentTopHeight = Math.max(50, Math.min(GAME_HEIGHT - TUNNEL_WIDTH - 50, currentTopHeight + variation));
            currentBottomHeight = currentTopHeight + TUNNEL_WIDTH;

            tunnelSegments.push(createTunnelSegment(i * SEGMENT_WIDTH, currentTopHeight, currentBottomHeight));
        }

        gameState = 'playing';
        gameLoop();
    }

    // Update game state
    function update() {
        if (gameState !== 'playing') return;

        // Update rocket physics
        rocket.velocity += rocket.gravity;
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
            let newTopHeight = Math.max(50, Math.min(GAME_HEIGHT - TUNNEL_WIDTH - 50, lastSegment.topHeight + variation));
            let newBottomHeight = newTopHeight + TUNNEL_WIDTH;

            tunnelSegments.push(createTunnelSegment(
                lastSegment.x + SEGMENT_WIDTH,
                newTopHeight,
                newBottomHeight
            ));

            score++;
        }

        // Check collisions
        const rocketSegment = tunnelSegments.find(seg =>
            rocket.x + ROCKET_SIZE > seg.x && rocket.x < seg.x + SEGMENT_WIDTH
        );

        if (rocketSegment) {
            if (rocket.y < rocketSegment.topHeight || rocket.y + ROCKET_SIZE > rocketSegment.bottomHeight) {
                gameOver();
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
        ctx.fillText('Tap or hold to fly up', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        ctx.fillText('Release to fall down', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

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
