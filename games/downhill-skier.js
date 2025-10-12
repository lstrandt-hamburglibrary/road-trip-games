// Downhill Skier Game - Vertical scrolling skiing game
(function() {
    let gameCanvas, ctx;
    let gameState = 'menu'; // menu, playing, gameOver
    let skier;
    let slopeSegments = [];
    let trees = [];
    let score = 0;
    let highScore = parseInt(localStorage.getItem('downhillSkierHighScore') || '0');
    let animationId;
    let keys = {};

    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 600;
    const SKIER_WIDTH = 30;
    const SKIER_HEIGHT = 35;
    const SCROLL_SPEED = 4;
    const SKIER_SPEED = 5;
    const SLOPE_WIDTH = 400;
    const SEGMENT_HEIGHT = 20;
    const TREE_SPAWN_CHANCE = 0.08; // 8% chance per segment
    const MIN_TREE_SPACING = 60; // Minimum pixels between trees horizontally

    // Skier object
    function createSkier() {
        return {
            x: GAME_WIDTH / 2 - SKIER_WIDTH / 2,
            y: 100,
            velocityX: 0,
            direction: 0 // -1 left, 0 none, 1 right
        };
    }

    // Create a slope segment
    function createSlopeSegment(y, leftEdge, rightEdge) {
        return {
            y: y,
            leftEdge: leftEdge,
            rightEdge: rightEdge
        };
    }

    // Create a tree obstacle
    function createTree(x, y) {
        return {
            x: x,
            y: y,
            size: 25 + Math.random() * 15, // 25-40 pixels
            hit: false
        };
    }

    // Initialize game
    function initGame() {
        skier = createSkier();
        slopeSegments = [];
        trees = [];
        score = 0;
        keys = {};

        // Create initial slope segments
        let slopeLeft = (GAME_WIDTH - SLOPE_WIDTH) / 2;
        let slopeRight = slopeLeft + SLOPE_WIDTH;

        for (let i = 0; i < Math.ceil(GAME_HEIGHT / SEGMENT_HEIGHT) + 5; i++) {
            // Add some gentle variation to slope edges
            const variation = (Math.random() - 0.5) * 4;
            slopeLeft = Math.max(100, Math.min(GAME_WIDTH - SLOPE_WIDTH - 100, slopeLeft + variation));
            slopeRight = slopeLeft + SLOPE_WIDTH;

            slopeSegments.push(createSlopeSegment(-i * SEGMENT_HEIGHT, slopeLeft, slopeRight));
        }

        gameState = 'playing';
        gameLoop();
    }

    // Track tree spawning
    let segmentsSinceLastTree = 0;
    const MIN_TREE_SEGMENT_SPACING = 3; // Minimum segments between tree spawns

    // Spawn trees randomly
    function spawnTreesForSegment(segment, isInitial = false) {
        // Only spawn after minimum spacing and on random chance
        if (!isInitial &&
            segmentsSinceLastTree >= MIN_TREE_SEGMENT_SPACING &&
            Math.random() < TREE_SPAWN_CHANCE) {

            // Calculate available space for trees
            const slopeWidth = segment.rightEdge - segment.leftEdge;
            const numTrees = Math.floor(Math.random() * 3) + 1; // 1-3 trees

            // Try to place trees with spacing
            const positions = [];
            for (let i = 0; i < numTrees; i++) {
                let attempts = 0;
                let validPosition = false;
                let treeX;

                while (!validPosition && attempts < 10) {
                    // Random position within slope, with some padding from edges
                    treeX = segment.leftEdge + 40 + Math.random() * (slopeWidth - 80);

                    // Check spacing from other trees in this segment
                    validPosition = positions.every(pos => Math.abs(pos - treeX) >= MIN_TREE_SPACING);
                    attempts++;
                }

                if (validPosition) {
                    positions.push(treeX);
                    trees.push(createTree(treeX, segment.y));
                }
            }

            segmentsSinceLastTree = 0;
        } else {
            segmentsSinceLastTree++;
        }
    }

    // Update game state
    function update() {
        if (gameState !== 'playing') return;

        // Update skier movement based on arrow keys
        if (keys['ArrowLeft']) {
            skier.velocityX = -SKIER_SPEED;
            skier.direction = -1;
        } else if (keys['ArrowRight']) {
            skier.velocityX = SKIER_SPEED;
            skier.direction = 1;
        } else {
            skier.velocityX = 0;
            skier.direction = 0;
        }

        skier.x += skier.velocityX;

        // Update slope segments (scroll down)
        for (let segment of slopeSegments) {
            segment.y += SCROLL_SPEED;
        }

        // Update trees (scroll down)
        for (let tree of trees) {
            tree.y += SCROLL_SPEED;
        }

        // Remove off-screen segments and add new ones at top
        if (slopeSegments[0].y > GAME_HEIGHT) {
            slopeSegments.shift();

            // Add new segment at the top
            const lastSegment = slopeSegments[slopeSegments.length - 1];
            const variation = (Math.random() - 0.5) * 6;
            let newSlopeLeft = Math.max(100, Math.min(GAME_WIDTH - SLOPE_WIDTH - 100, lastSegment.leftEdge + variation));
            let newSlopeRight = newSlopeLeft + SLOPE_WIDTH;

            const newSegment = createSlopeSegment(lastSegment.y - SEGMENT_HEIGHT, newSlopeLeft, newSlopeRight);
            slopeSegments.push(newSegment);

            // Spawn trees for new segment
            spawnTreesForSegment(newSegment);

            score++;
        }

        // Remove off-screen trees
        trees = trees.filter(tree => tree.y < GAME_HEIGHT + 50);

        // Check collisions with slope edges
        const currentSegment = slopeSegments.find(seg =>
            skier.y + SKIER_HEIGHT > seg.y && skier.y < seg.y + SEGMENT_HEIGHT
        );

        if (currentSegment) {
            // Check if skier hit slope boundaries
            if (skier.x < currentSegment.leftEdge || skier.x + SKIER_WIDTH > currentSegment.rightEdge) {
                gameOver();
            }
        }

        // Check collisions with trees
        for (let tree of trees) {
            if (tree.hit) continue;

            // Simple circle collision detection
            const skierCenterX = skier.x + SKIER_WIDTH / 2;
            const skierCenterY = skier.y + SKIER_HEIGHT / 2;
            const treeCenterX = tree.x;
            const treeCenterY = tree.y;

            const distance = Math.sqrt(
                Math.pow(skierCenterX - treeCenterX, 2) +
                Math.pow(skierCenterY - treeCenterY, 2)
            );

            if (distance < (tree.size / 2 + SKIER_WIDTH / 2)) {
                gameOver();
            }
        }
    }

    // Draw game
    function draw() {
        // Clear canvas with sky blue background
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (gameState === 'menu') {
            drawMenu();
        } else if (gameState === 'playing') {
            drawSlope();
            drawTrees();
            drawSkier();
            drawScore();
        } else if (gameState === 'gameOver') {
            drawSlope();
            drawTrees();
            drawSkier();
            drawGameOver();
        }
    }

    // Draw slope
    function drawSlope() {
        // Draw snow slope
        for (let i = 0; i < slopeSegments.length - 1; i++) {
            const segment = slopeSegments[i];
            const nextSegment = slopeSegments[i + 1];

            // Draw white snow slope
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(segment.leftEdge, segment.y);
            ctx.lineTo(segment.rightEdge, segment.y);
            ctx.lineTo(nextSegment.rightEdge, nextSegment.y);
            ctx.lineTo(nextSegment.leftEdge, nextSegment.y);
            ctx.closePath();
            ctx.fill();

            // Draw slope edges (dark areas outside slope)
            ctx.fillStyle = '#2d4a2e';
            ctx.fillRect(0, segment.y, segment.leftEdge, SEGMENT_HEIGHT);
            ctx.fillRect(segment.rightEdge, segment.y, GAME_WIDTH - segment.rightEdge, SEGMENT_HEIGHT);

            // Draw edge lines
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(segment.leftEdge, segment.y);
            ctx.lineTo(nextSegment.leftEdge, nextSegment.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(segment.rightEdge, segment.y);
            ctx.lineTo(nextSegment.rightEdge, nextSegment.y);
            ctx.stroke();
        }
    }

    // Draw trees
    function drawTrees() {
        for (let tree of trees) {
            // Draw tree as a triangle
            const treeHeight = tree.size * 1.2;

            // Tree shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(tree.x + 2, tree.y + 5, tree.size * 0.4, tree.size * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tree trunk
            ctx.fillStyle = '#654321';
            ctx.fillRect(tree.x - 4, tree.y - 10, 8, 15);

            // Tree foliage (triangles)
            ctx.fillStyle = '#2d5016';
            ctx.strokeStyle = '#1a3010';
            ctx.lineWidth = 2;

            // Bottom triangle
            ctx.beginPath();
            ctx.moveTo(tree.x, tree.y - treeHeight);
            ctx.lineTo(tree.x - tree.size / 2, tree.y - 10);
            ctx.lineTo(tree.x + tree.size / 2, tree.y - 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Middle triangle
            ctx.beginPath();
            ctx.moveTo(tree.x, tree.y - treeHeight * 1.1);
            ctx.lineTo(tree.x - tree.size / 2.5, tree.y - treeHeight * 0.4);
            ctx.lineTo(tree.x + tree.size / 2.5, tree.y - treeHeight * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Top triangle
            ctx.beginPath();
            ctx.moveTo(tree.x, tree.y - treeHeight * 1.3);
            ctx.lineTo(tree.x - tree.size / 3, tree.y - treeHeight * 0.7);
            ctx.lineTo(tree.x + tree.size / 3, tree.y - treeHeight * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    // Draw skier
    function drawSkier() {
        ctx.save();
        ctx.translate(skier.x + SKIER_WIDTH / 2, skier.y + SKIER_HEIGHT / 2);

        // Tilt skier based on direction
        const tilt = skier.direction * 0.15;
        ctx.rotate(tilt);

        // Skier body (simple triangle shape)
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(0, -SKIER_HEIGHT / 2);
        ctx.lineTo(-SKIER_WIDTH / 2, SKIER_HEIGHT / 2);
        ctx.lineTo(SKIER_WIDTH / 2, SKIER_HEIGHT / 2);
        ctx.closePath();
        ctx.fill();

        // Skier head
        ctx.fillStyle = '#ffd93d';
        ctx.beginPath();
        ctx.arc(0, -SKIER_HEIGHT / 2 - 5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Skis
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-SKIER_WIDTH / 3, SKIER_HEIGHT / 2);
        ctx.lineTo(-SKIER_WIDTH / 3, SKIER_HEIGHT / 2 + 15);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(SKIER_WIDTH / 3, SKIER_HEIGHT / 2);
        ctx.lineTo(SKIER_WIDTH / 3, SKIER_HEIGHT / 2 + 15);
        ctx.stroke();

        ctx.restore();
    }

    // Draw score
    function drawScore() {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Distance: ${score}`, 20, 40);
        ctx.fillText(`High: ${highScore}`, 20, 70);
    }

    // Draw menu
    function drawMenu() {
        // Draw background slope
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(200, 0, 400, GAME_HEIGHT);

        // Draw some decorative trees
        const menuTrees = [
            { x: 250, y: 150 },
            { x: 550, y: 200 },
            { x: 350, y: 350 },
            { x: 500, y: 450 }
        ];
        for (let tree of menuTrees) {
            const size = 30;
            const treeHeight = size * 1.2;

            ctx.fillStyle = '#654321';
            ctx.fillRect(tree.x - 4, tree.y - 10, 8, 15);

            ctx.fillStyle = '#2d5016';
            ctx.beginPath();
            ctx.moveTo(tree.x, tree.y - treeHeight);
            ctx.lineTo(tree.x - size / 2, tree.y - 10);
            ctx.lineTo(tree.x + size / 2, tree.y - 10);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(tree.x, tree.y - treeHeight * 1.1);
            ctx.lineTo(tree.x - size / 2.5, tree.y - treeHeight * 0.4);
            ctx.lineTo(tree.x + size / 2.5, tree.y - treeHeight * 0.4);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(tree.x, tree.y - treeHeight * 1.3);
            ctx.lineTo(tree.x - size / 3, tree.y - treeHeight * 0.7);
            ctx.lineTo(tree.x + size / 3, tree.y - treeHeight * 0.7);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = '#333';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛷️ DOWNHILL SKIER', GAME_WIDTH / 2, 100);

        ctx.font = '20px Arial';
        ctx.fillText('Ski down the mountain!', GAME_WIDTH / 2, 180);
        ctx.fillText('Avoid the trees and stay on the slope!', GAME_WIDTH / 2, 210);

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('← → Arrow Keys to Move', GAME_WIDTH / 2, 270);

        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#2d5016';
        ctx.fillText('CLICK TO START', GAME_WIDTH / 2, 350);

        if (highScore > 0) {
            ctx.font = '20px Arial';
            ctx.fillStyle = '#333';
            ctx.fillText(`Best Distance: ${highScore}`, GAME_WIDTH / 2, 400);
        }
    }

    // Draw game over
    function drawGameOver() {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#d63031';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CRASHED!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

        ctx.fillStyle = '#333';
        ctx.font = '32px Arial';
        ctx.fillText(`Distance: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

        if (score > highScore) {
            ctx.fillStyle = '#00b894';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('🎉 NEW RECORD! 🎉', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        } else {
            ctx.fillStyle = '#333';
            ctx.font = '24px Arial';
            ctx.fillText(`Best Distance: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        }

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#2d5016';
        ctx.fillText('CLICK TO PLAY AGAIN', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
    }

    // Game over
    function gameOver() {
        gameState = 'gameOver';

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('downhillSkierHighScore', highScore.toString());
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
    function handleClick() {
        if (gameState === 'menu' || gameState === 'gameOver') {
            initGame();
        }
    }

    // Handle key presses
    function handleKeyDown(e) {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            e.preventDefault();
            keys[e.code] = true;
        }
    }

    function handleKeyUp(e) {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            e.preventDefault();
            keys[e.code] = false;
        }
    }

    // Launch Downhill Skier
    window.launchDownhillSkier = function() {
        const content = document.getElementById('downhillSkierContent');

        content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <canvas id="skierCanvas" width="${GAME_WIDTH}" height="${GAME_HEIGHT}" style="
                    border: 4px solid #2d5016;
                    border-radius: 10px;
                    max-width: 100%;
                    height: auto;
                    background: #87ceeb;
                    cursor: pointer;
                    touch-action: none;
                "></canvas>

                <div style="text-align: center; color: #666;">
                    <p style="margin: 0.5rem 0;">💡 <strong>Controls:</strong> Use ← → arrow keys to ski left and right</p>
                    <p style="margin: 0.5rem 0;">🎯 <strong>Goal:</strong> Avoid trees and stay on the slope!</p>
                </div>
            </div>
        `;

        // Show game section
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('downhillSkierGame').style.display = 'block';

        // Initialize canvas
        gameCanvas = document.getElementById('skierCanvas');
        ctx = gameCanvas.getContext('2d');

        gameState = 'menu';
        draw();

        // Event listeners
        gameCanvas.addEventListener('click', handleClick);
        gameCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleClick();
        });

        // Keyboard support
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    };

    // Exit to menu
    window.exitDownhillSkierToMenu = function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        // Remove keyboard listeners
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        document.getElementById('downhillSkierGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };
})();
