// Tunnel Runner Game - Side-scrolling rocket game with smooth tunnel generation
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
    const MIN_TUNNEL_WIDTH = 120;
    const MAX_TUNNEL_WIDTH = 240;
    const SEGMENT_WIDTH = 20;
    const OBSTACLE_CHANCE = 0.05; // 5% chance per segment
    const SPLIT_CHANCE = 0.008; // 0.8% chance to start a tunnel split
    const MIN_PATH_WIDTH = 100; // Minimum width for each path during a split
    const PATH_DEVIATION = 30; // How much paths deviate from center during split

    // Smooth motion parameters
    let targetTopHeight = GAME_HEIGHT / 2 - BASE_TUNNEL_WIDTH / 2;
    let targetTunnelWidth = BASE_TUNNEL_WIDTH;
    let smoothingFactor = 0.15; // Lower = smoother (0-1)
    let noiseOffset = 0; // For continuous noise-like movement

    // Color palette for tunnel variations
    const TUNNEL_COLORS = [
        { wall: '#6c5ce7', edge: '#a29bfe', name: 'purple' },
        { wall: '#00b894', edge: '#55efc4', name: 'green' },
        { wall: '#0984e3', edge: '#74b9ff', name: 'blue' },
        { wall: '#d63031', edge: '#ff7675', name: 'red' },
        { wall: '#fdcb6e', edge: '#ffeaa7', name: 'yellow' },
        { wall: '#e17055', edge: '#fab1a0', name: 'orange' }
    ];

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
    function createTunnelSegment(x, topHeight, bottomHeight, tunnelWidth, colorIndex, obstacles = [], splitInfo = null) {
        return {
            x: x,
            topHeight: topHeight,
            bottomHeight: bottomHeight,
            tunnelWidth: tunnelWidth,
            colorIndex: colorIndex,
            obstacles: obstacles,
            splitInfo: splitInfo // { state: 'splitting'|'split'|'merging', progress: 0-1, dividerY: number }
        };
    }

    // Simple noise function for smooth variation
    function smoothNoise(x, amplitude) {
        return Math.sin(x * 0.1) * amplitude + Math.sin(x * 0.23) * (amplitude * 0.5);
    }

    // Create random obstacles for a segment
    function createObstacles(topHeight, bottomHeight, tunnelWidth, canSpawn) {
        const obstacles = [];

        // Only spawn obstacles if:
        // 1. Enough segments have passed since last obstacle
        // 2. Tunnel is wide enough (at least 160 pixels)
        // 3. Not during a split
        // 4. Random chance triggers
        if (canSpawn &&
            segmentsSinceLastObstacle >= MIN_OBSTACLE_SPACING &&
            tunnelWidth >= 160 &&
            Math.random() < OBSTACLE_CHANCE) {

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

            segmentsSinceLastObstacle = 0; // Reset counter
        } else {
            segmentsSinceLastObstacle++;
        }

        return obstacles;
    }

    // Initialize game
    function initGame() {
        rocket = createRocket();
        tunnelSegments = [];
        score = 0;
        noiseOffset = 0;

        // Reset smooth motion targets
        targetTopHeight = GAME_HEIGHT / 2 - BASE_TUNNEL_WIDTH / 2;
        targetTunnelWidth = BASE_TUNNEL_WIDTH;

        // Create initial tunnel segments with smooth interpolation
        let currentTopHeight = targetTopHeight;
        let currentTunnelWidth = targetTunnelWidth;
        let currentColorIndex = 0;

        for (let i = 0; i < Math.ceil(GAME_WIDTH / SEGMENT_WIDTH) + 5; i++) {
            // Smooth noise-based variation
            const heightNoise = smoothNoise(noiseOffset + i, 3);
            targetTopHeight = GAME_HEIGHT / 2 - currentTunnelWidth / 2 + heightNoise;

            // Interpolate smoothly toward target
            currentTopHeight += (targetTopHeight - currentTopHeight) * smoothingFactor;
            currentTopHeight = Math.max(50, Math.min(GAME_HEIGHT - currentTunnelWidth - 50, currentTopHeight));

            const currentBottomHeight = currentTopHeight + currentTunnelWidth;

            const obstacles = i > 10 ? createObstacles(currentTopHeight, currentBottomHeight, currentTunnelWidth, true) : [];

            tunnelSegments.push(createTunnelSegment(i * SEGMENT_WIDTH, currentTopHeight, currentBottomHeight, currentTunnelWidth, currentColorIndex, obstacles));
        }

        gameState = 'playing';
        gameLoop();
    }

    // Track color changes
    let segmentsSinceColorChange = 0;
    let currentColorIndex = 0;

    // Track tunnel splits
    let splitState = null; // null, 'splitting', 'split', 'merging'
    let splitSegmentsRemaining = 0;
    let splitDividerY = 0;
    let splitTopTarget = 0;
    let splitBottomTarget = 0;
    const SPLIT_DURATION = 30; // segments to split
    const FULL_SPLIT_DURATION = 50; // segments fully split
    const MERGE_DURATION = 30; // segments to merge

    // Track obstacle spacing
    let segmentsSinceLastObstacle = 0;
    const MIN_OBSTACLE_SPACING = 15; // minimum segments between obstacles

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
            noiseOffset += 0.5; // Increment for continuous noise

            // Smooth width variation
            const widthNoise = smoothNoise(noiseOffset * 0.5, 4);
            targetTunnelWidth += widthNoise;
            targetTunnelWidth = Math.max(MIN_TUNNEL_WIDTH, Math.min(MAX_TUNNEL_WIDTH, targetTunnelWidth));

            // Smooth interpolation towards target
            let newTunnelWidth = lastSegment.tunnelWidth + (targetTunnelWidth - lastSegment.tunnelWidth) * smoothingFactor;

            // Smooth height variation using noise
            const heightNoise = smoothNoise(noiseOffset, 5);
            targetTopHeight = GAME_HEIGHT / 2 - newTunnelWidth / 2 + heightNoise;

            // Interpolate smoothly
            let newTopHeight = lastSegment.topHeight + (targetTopHeight - lastSegment.topHeight) * smoothingFactor;
            newTopHeight = Math.max(50, Math.min(GAME_HEIGHT - newTunnelWidth - 50, newTopHeight));
            let newBottomHeight = newTopHeight + newTunnelWidth;

            // Change color every 50-100 segments
            segmentsSinceColorChange++;
            if (segmentsSinceColorChange > 50 + Math.random() * 50) {
                currentColorIndex = (currentColorIndex + 1) % TUNNEL_COLORS.length;
                segmentsSinceColorChange = 0;
            }

            // Handle tunnel splits with smooth transitions
            let splitInfo = null;

            if (splitState === null && Math.random() < SPLIT_CHANCE && score > 50) {
                // Start a new split
                splitState = 'splitting';
                splitSegmentsRemaining = SPLIT_DURATION;
                splitDividerY = newTopHeight + newTunnelWidth / 2;

                // Set split targets
                const dividerThickness = 15;
                const requiredWidth = (MIN_PATH_WIDTH * 2) + dividerThickness + (PATH_DEVIATION * 2);
                const expansionNeeded = Math.max(0, requiredWidth - newTunnelWidth);

                splitTopTarget = newTopHeight - (expansionNeeded / 2) - PATH_DEVIATION;
                splitBottomTarget = newBottomHeight + (expansionNeeded / 2) + PATH_DEVIATION;
            }

            if (splitState === 'splitting') {
                const progress = 1 - (splitSegmentsRemaining / SPLIT_DURATION);

                // Smoothly interpolate to split targets
                newTopHeight = lastSegment.topHeight + (splitTopTarget - lastSegment.topHeight) * 0.1;
                newBottomHeight = lastSegment.bottomHeight + (splitBottomTarget - lastSegment.bottomHeight) * 0.1;
                newTopHeight = Math.max(30, newTopHeight);
                newBottomHeight = Math.min(GAME_HEIGHT - 30, newBottomHeight);
                newTunnelWidth = newBottomHeight - newTopHeight;

                // Position divider smoothly
                const dividerThickness = 15;
                splitDividerY = newTopHeight + MIN_PATH_WIDTH + (dividerThickness / 2) + (PATH_DEVIATION * progress);
                splitInfo = { state: 'splitting', progress: progress, dividerY: splitDividerY };

                splitSegmentsRemaining--;
                if (splitSegmentsRemaining <= 0) {
                    splitState = 'split';
                    splitSegmentsRemaining = FULL_SPLIT_DURATION;
                }
            } else if (splitState === 'split') {
                // Maintain split with small smooth variations
                const dividerThickness = 15;
                const smallVariation = smoothNoise(noiseOffset * 2, 2);

                newTopHeight = lastSegment.topHeight + smallVariation * 0.3;
                newBottomHeight = lastSegment.bottomHeight + smallVariation * 0.3;
                newTopHeight = Math.max(30, newTopHeight);
                newBottomHeight = Math.min(GAME_HEIGHT - 30, newBottomHeight);
                newTunnelWidth = newBottomHeight - newTopHeight;

                // Keep divider positioned
                splitDividerY = newTopHeight + MIN_PATH_WIDTH + (dividerThickness / 2) + PATH_DEVIATION;
                splitInfo = { state: 'split', progress: 1, dividerY: splitDividerY };

                splitSegmentsRemaining--;
                if (splitSegmentsRemaining <= 0) {
                    splitState = 'merging';
                    splitSegmentsRemaining = MERGE_DURATION;

                    // Set merge target (back to normal tunnel)
                    targetTopHeight = GAME_HEIGHT / 2 - BASE_TUNNEL_WIDTH / 2;
                    targetTunnelWidth = BASE_TUNNEL_WIDTH;
                }
            } else if (splitState === 'merging') {
                const progress = splitSegmentsRemaining / MERGE_DURATION;

                // Smoothly merge back to normal tunnel
                newTopHeight = lastSegment.topHeight + (targetTopHeight - lastSegment.topHeight) * 0.08;
                newBottomHeight = newTopHeight + lastSegment.tunnelWidth + (targetTunnelWidth - lastSegment.tunnelWidth) * 0.08;
                newTopHeight = Math.max(30, newTopHeight);
                newBottomHeight = Math.min(GAME_HEIGHT - 30, newBottomHeight);
                newTunnelWidth = newBottomHeight - newTopHeight;

                // Bring divider back to center smoothly
                const dividerThickness = 15;
                splitDividerY = newTopHeight + (newTunnelWidth / 2);
                splitInfo = { state: 'merging', progress: progress, dividerY: splitDividerY };

                splitSegmentsRemaining--;
                if (splitSegmentsRemaining <= 0) {
                    splitState = null;
                }
            }

            // Create obstacles (but not during splits)
            const canSpawnObstacle = splitState === null;
            const obstacles = createObstacles(newTopHeight, newBottomHeight, newTunnelWidth, canSpawnObstacle);

            tunnelSegments.push(createTunnelSegment(
                lastSegment.x + SEGMENT_WIDTH,
                newTopHeight,
                newBottomHeight,
                newTunnelWidth,
                currentColorIndex,
                obstacles,
                splitInfo
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

            // Check tunnel split divider
            if (rocketSegment.splitInfo && rocketSegment.splitInfo.progress > 0) {
                const dividerThickness = 15;
                const dividerHalfThickness = dividerThickness / 2;
                const dividerTop = rocketSegment.splitInfo.dividerY - (dividerHalfThickness * rocketSegment.splitInfo.progress);
                const dividerBottom = rocketSegment.splitInfo.dividerY + (dividerHalfThickness * rocketSegment.splitInfo.progress);

                // Check if rocket hits the divider
                if (rocket.y + ROCKET_SIZE > dividerTop && rocket.y < dividerBottom) {
                    gameOver();
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

    // Draw tunnel with smooth curves
    function drawTunnel() {
        const color = TUNNEL_COLORS[currentColorIndex];

        // Draw top wall as smooth path
        ctx.fillStyle = color.wall;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let i = 0; i < tunnelSegments.length; i++) {
            const segment = tunnelSegments[i];
            ctx.lineTo(segment.x, segment.topHeight);
        }
        ctx.lineTo(GAME_WIDTH, 0);
        ctx.closePath();
        ctx.fill();

        // Draw top edge line
        ctx.strokeStyle = color.edge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < tunnelSegments.length; i++) {
            const segment = tunnelSegments[i];
            if (i === 0) {
                ctx.moveTo(segment.x, segment.topHeight);
            } else {
                ctx.lineTo(segment.x, segment.topHeight);
            }
        }
        ctx.stroke();

        // Draw bottom wall as smooth path
        ctx.fillStyle = color.wall;
        ctx.beginPath();
        ctx.moveTo(0, GAME_HEIGHT);
        for (let i = 0; i < tunnelSegments.length; i++) {
            const segment = tunnelSegments[i];
            ctx.lineTo(segment.x, segment.bottomHeight);
        }
        ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
        ctx.closePath();
        ctx.fill();

        // Draw bottom edge line
        ctx.strokeStyle = color.edge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < tunnelSegments.length; i++) {
            const segment = tunnelSegments[i];
            if (i === 0) {
                ctx.moveTo(segment.x, segment.bottomHeight);
            } else {
                ctx.lineTo(segment.x, segment.bottomHeight);
            }
        }
        ctx.stroke();

        // Draw split dividers as smooth paths
        for (let segment of tunnelSegments) {
            if (segment.splitInfo && segment.splitInfo.progress > 0) {
                const dividerThickness = 15;
                const dividerHalfThickness = dividerThickness / 2;
                const dividerTop = segment.splitInfo.dividerY - (dividerHalfThickness * segment.splitInfo.progress);
                const dividerBottom = segment.splitInfo.dividerY + (dividerHalfThickness * segment.splitInfo.progress);

                // Draw the divider segment
                ctx.fillStyle = color.wall;
                ctx.fillRect(segment.x, dividerTop, SEGMENT_WIDTH + 1, dividerBottom - dividerTop);
            }
        }

        // Draw divider edges
        let inSplit = false;
        ctx.strokeStyle = color.edge;
        ctx.lineWidth = 3;

        // Top edge of divider
        ctx.beginPath();
        for (let segment of tunnelSegments) {
            if (segment.splitInfo && segment.splitInfo.progress > 0) {
                const dividerThickness = 15;
                const dividerHalfThickness = dividerThickness / 2;
                const dividerTop = segment.splitInfo.dividerY - (dividerHalfThickness * segment.splitInfo.progress);

                if (!inSplit) {
                    ctx.moveTo(segment.x, dividerTop);
                    inSplit = true;
                } else {
                    ctx.lineTo(segment.x, dividerTop);
                }
            } else if (inSplit) {
                inSplit = false;
            }
        }
        ctx.stroke();

        // Bottom edge of divider
        inSplit = false;
        ctx.beginPath();
        for (let segment of tunnelSegments) {
            if (segment.splitInfo && segment.splitInfo.progress > 0) {
                const dividerThickness = 15;
                const dividerHalfThickness = dividerThickness / 2;
                const dividerBottom = segment.splitInfo.dividerY + (dividerHalfThickness * segment.splitInfo.progress);

                if (!inSplit) {
                    ctx.moveTo(segment.x, dividerBottom);
                    inSplit = true;
                } else {
                    ctx.lineTo(segment.x, dividerBottom);
                }
            } else if (inSplit) {
                inSplit = false;
            }
        }
        ctx.stroke();

        // Draw obstacles
        for (let segment of tunnelSegments) {
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

        ctx.font = '20px Arial';
        ctx.fillText('Navigate through the changing tunnel!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
        ctx.fillText('Avoid walls, obstacles, and narrow passages!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25);
        ctx.fillText('Choose your path when the tunnel splits!', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.fillText('Tap or hold to fly up', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);
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
