// Downhill Skier Game - Vertical scrolling skiing game
(function() {
    let gameCanvas, ctx;
    let gameState = 'menu'; // menu, modeSelect, playing, gameOver
    let gameMode = 'downhill'; // downhill, slalom
    let skier;
    let slopeSegments = [];
    let trees = [];
    let gates = []; // Slalom gates
    let score = 0;
    let highScore = parseInt(localStorage.getItem('downhillSkierHighScore') || '0');
    let bestSlalomTime = parseFloat(localStorage.getItem('downhillSkierBestSlalom') || '999.9');
    let gameTime = 0; // Time in seconds
    let gatesPassed = 0;
    let gatesMissed = 0;
    let totalGates = 0;
    let animationId;
    let keys = {};

    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 600;
    const SKIER_WIDTH = 30;
    const SKIER_HEIGHT = 35;
    const BASE_SCROLL_SPEED = 4;
    const SKIER_SPEED = 5;
    const SLOPE_WIDTH = 400;
    const SEGMENT_HEIGHT = 20;
    const TREE_SPAWN_CHANCE = 0.08; // 8% chance per segment
    const ROCK_SPAWN_CHANCE = 0.05; // 5% chance per segment
    const MIN_TREE_SPACING = 60; // Minimum pixels between trees horizontally
    const MIN_ROCK_SPACING = 80; // Minimum pixels between rocks horizontally
    const GATE_SPACING = 200; // Vertical spacing between slalom gates
    const GATE_WIDTH = 120; // Distance between left and right poles
    const POLE_HEIGHT = 50; // Height of flagpoles
    const GATE_PENALTY_TIME = 5.0; // 5 seconds penalty for missing gate

    let currentScrollSpeed = BASE_SCROLL_SPEED;
    let lastGateY = 0; // Track last gate position

    // Skier object
    function createSkier() {
        return {
            x: GAME_WIDTH / 2 - SKIER_WIDTH / 2,
            y: GAME_HEIGHT / 2 - SKIER_HEIGHT / 2, // Middle of screen
            velocityX: 0,
            direction: 0, // -1 left, 0 none, 1 right
            crashed: false,
            crashRecoveryTime: 0,
            crashCount: 0 // Track number of crashes
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
            type: 'tree',
            x: x,
            y: y,
            size: 25 + Math.random() * 15, // 25-40 pixels
            hit: false
        };
    }

    // Create a rock obstacle
    function createRock(x, y) {
        return {
            type: 'rock',
            x: x,
            y: y,
            size: 20 + Math.random() * 20, // 20-40 pixels
            hit: false
        };
    }

    // Create a slalom gate (pair of poles)
    function createGate(centerX, y) {
        return {
            leftPoleX: centerX - GATE_WIDTH / 2,
            rightPoleX: centerX + GATE_WIDTH / 2,
            y: y,
            passed: false,
            missed: false
        };
    }

    // Create a mogul (bump)
    function createMogul(x, y) {
        return {
            type: 'mogul',
            x: x,
            y: y,
            size: 15 + Math.random() * 10, // 15-25 pixels
            hit: false
        };
    }

    // Initialize game
    function initGame() {
        skier = createSkier();
        slopeSegments = [];
        trees = [];
        gates = [];
        score = 0;
        gameTime = 0;
        gatesPassed = 0;
        gatesMissed = 0;
        totalGates = 0;
        keys = {};
        currentScrollSpeed = BASE_SCROLL_SPEED;
        lastGateY = GAME_HEIGHT + 100; // Start gates below screen

        // Create initial slope segments
        let slopeLeft = (GAME_WIDTH - SLOPE_WIDTH) / 2;
        let slopeRight = slopeLeft + SLOPE_WIDTH;

        for (let i = 0; i < Math.ceil(GAME_HEIGHT / SEGMENT_HEIGHT) + 5; i++) {
            // Add some gentle variation to slope edges
            const variation = (Math.random() - 0.5) * 4;
            slopeLeft = Math.max(100, Math.min(GAME_WIDTH - SLOPE_WIDTH - 100, slopeLeft + variation));
            slopeRight = slopeLeft + SLOPE_WIDTH;

            slopeSegments.push(createSlopeSegment(GAME_HEIGHT + i * SEGMENT_HEIGHT, slopeLeft, slopeRight));
        }

        // Create initial gates for slalom mode
        if (gameMode === 'slalom') {
            const centerX = GAME_WIDTH / 2;
            for (let i = 0; i < 10; i++) {
                const gateY = GAME_HEIGHT + 200 + i * GATE_SPACING;
                const offset = (Math.random() - 0.5) * 100; // Vary gate positions
                gates.push(createGate(centerX + offset, gateY));
                totalGates++;
                lastGateY = gateY;
            }
        }

        gameState = 'playing';
        gameLoop();
    }

    // Track tree and rock spawning
    let segmentsSinceLastTree = 0;
    let segmentsSinceLastRock = 0;
    const MIN_TREE_SEGMENT_SPACING = 3; // Minimum segments between tree spawns
    const MIN_ROCK_SEGMENT_SPACING = 2; // Minimum segments between rock spawns

    // Spawn obstacles randomly
    function spawnTreesForSegment(segment, isInitial = false) {
        const slopeWidth = segment.rightEdge - segment.leftEdge;

        // Check if there's a gate near this segment in slalom mode
        const nearGate = gameMode === 'slalom' && gates.some(gate =>
            Math.abs(gate.y - segment.y) < 100
        );

        // Spawn trees (reduced in slalom mode, avoid near gates)
        const treeChance = gameMode === 'slalom' ? TREE_SPAWN_CHANCE * 0.5 : TREE_SPAWN_CHANCE;
        if (!isInitial &&
            !nearGate &&
            segmentsSinceLastTree >= MIN_TREE_SEGMENT_SPACING &&
            Math.random() < treeChance) {

            const numTrees = Math.floor(Math.random() * 3) + 1; // 1-3 trees
            const positions = [];

            for (let i = 0; i < numTrees; i++) {
                let attempts = 0;
                let validPosition = false;
                let treeX;

                while (!validPosition && attempts < 10) {
                    treeX = segment.leftEdge + 40 + Math.random() * (slopeWidth - 80);
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

        // Spawn rocks (only after score >= 300)
        if (!isInitial &&
            score >= 300 &&
            segmentsSinceLastRock >= MIN_ROCK_SEGMENT_SPACING &&
            Math.random() < ROCK_SPAWN_CHANCE) {

            const numRocks = Math.floor(Math.random() * 2) + 1; // 1-2 rocks

            for (let i = 0; i < numRocks; i++) {
                let attempts = 0;
                let validPosition = false;
                let rockX;

                while (!validPosition && attempts < 10) {
                    rockX = segment.leftEdge + 30 + Math.random() * (slopeWidth - 60);

                    // Check spacing from trees and other rocks
                    const nearTree = trees.some(tree =>
                        Math.abs(tree.y - segment.y) < 50 && Math.abs(tree.x - rockX) < MIN_ROCK_SPACING
                    );
                    validPosition = !nearTree;
                    attempts++;
                }

                if (validPosition) {
                    trees.push(createRock(rockX, segment.y));
                }
            }

            segmentsSinceLastRock = 0;
        } else {
            segmentsSinceLastRock++;
        }

        // Spawn moguls (after score >= 100)
        if (!isInitial &&
            !nearGate &&
            score >= 100 &&
            Math.random() < 0.04) {  // 4% chance

            const numMoguls = Math.floor(Math.random() * 2) + 1; // 1-2 moguls

            for (let i = 0; i < numMoguls; i++) {
                const mogulX = segment.leftEdge + 40 + Math.random() * (slopeWidth - 80);
                trees.push(createMogul(mogulX, segment.y));
            }
        }
    }

    // Update game state
    function update() {
        if (gameState !== 'playing') return;

        // Update game time (roughly 60fps, so add 1/60 seconds)
        gameTime += 1/60;

        // Handle crash recovery
        if (skier.crashed) {
            skier.crashRecoveryTime -= 1/60;
            if (skier.crashRecoveryTime <= 0) {
                skier.crashed = false;
            }
        }

        // Update skier movement based on arrow keys (disabled during crash)
        if (!skier.crashed) {
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
        }

        // Calculate base scroll speed with score progression
        let baseSpeed = BASE_SCROLL_SPEED + Math.floor(score / 100) * 0.5;

        // Reduce speed when turning (Atari Ski mechanic)
        if (skier.direction !== 0) {
            baseSpeed *= 0.75; // 25% slower when turning
        }

        // Further reduce speed during crash recovery
        if (skier.crashed) {
            baseSpeed *= 0.3; // 70% slower when recovering
        }

        currentScrollSpeed = baseSpeed;

        // Update slope segments (scroll up - terrain moves up as skier goes down)
        for (let segment of slopeSegments) {
            segment.y -= currentScrollSpeed;
        }

        // Update trees and rocks (scroll up)
        for (let tree of trees) {
            tree.y -= currentScrollSpeed;
        }

        // Update gates (scroll up) in slalom mode
        if (gameMode === 'slalom') {
            for (let gate of gates) {
                gate.y -= currentScrollSpeed;
            }

            // Check if we need to spawn a new gate
            if (lastGateY - gates[gates.length - 1].y < GATE_SPACING * 5) {
                const centerX = GAME_WIDTH / 2;
                const offset = (Math.random() - 0.5) * 120; // Vary gate positions
                const newGateY = lastGateY + GATE_SPACING;
                gates.push(createGate(centerX + offset, newGateY));
                totalGates++;
                lastGateY = newGateY;
            }
        }

        // Remove off-screen segments and add new ones at bottom
        if (slopeSegments[0].y < -SEGMENT_HEIGHT) {
            slopeSegments.shift();

            // Add new segment at the bottom
            const lastSegment = slopeSegments[slopeSegments.length - 1];
            const variation = (Math.random() - 0.5) * 6;
            let newSlopeLeft = Math.max(100, Math.min(GAME_WIDTH - SLOPE_WIDTH - 100, lastSegment.leftEdge + variation));
            let newSlopeRight = newSlopeLeft + SLOPE_WIDTH;

            const newSegment = createSlopeSegment(lastSegment.y + SEGMENT_HEIGHT, newSlopeLeft, newSlopeRight);
            slopeSegments.push(newSegment);

            // Spawn trees for new segment
            spawnTreesForSegment(newSegment);

            score++;
        }

        // Remove off-screen trees
        trees = trees.filter(tree => tree.y > -50);

        // Remove off-screen gates and check for gate pass/miss
        if (gameMode === 'slalom') {
            gates = gates.filter(gate => {
                if (gate.y < -50) {
                    return false; // Remove off-screen gate
                }

                // Check if skier is passing through gate zone
                const skierCenterY = skier.y + SKIER_HEIGHT / 2;
                const skierCenterX = skier.x + SKIER_WIDTH / 2;

                if (!gate.passed && !gate.missed && skierCenterY > gate.y - 20 && skierCenterY < gate.y + 20) {
                    // Skier is at gate level - check if passed through
                    if (skierCenterX > gate.leftPoleX && skierCenterX < gate.rightPoleX) {
                        // Passed through successfully!
                        gate.passed = true;
                        gatesPassed++;
                    } else if (skierCenterY > gate.y) {
                        // Missed the gate
                        gate.missed = true;
                        gatesMissed++;
                        gameTime += GATE_PENALTY_TIME; // Add penalty time
                    }
                }

                return true; // Keep gate
            });
        }

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

        // Check collisions with trees, rocks, and moguls
        for (let obstacle of trees) {
            if (obstacle.hit || skier.crashed) continue;

            // Simple circle collision detection
            const skierCenterX = skier.x + SKIER_WIDTH / 2;
            const skierCenterY = skier.y + SKIER_HEIGHT / 2;
            const obstacleCenterX = obstacle.x;
            const obstacleCenterY = obstacle.y;

            const distance = Math.sqrt(
                Math.pow(skierCenterX - obstacleCenterX, 2) +
                Math.pow(skierCenterY - obstacleCenterY, 2)
            );

            let collisionRadius;
            if (obstacle.type === 'tree') {
                collisionRadius = obstacle.size / 2;
            } else if (obstacle.type === 'rock') {
                collisionRadius = obstacle.size / 2.5;
            } else if (obstacle.type === 'mogul') {
                collisionRadius = obstacle.size / 2;
            }

            if (distance < (collisionRadius + SKIER_WIDTH / 2)) {
                obstacle.hit = true;
                skier.crashCount++;

                // Check if game over (3 crashes)
                if (skier.crashCount >= 3) {
                    gameOver();
                } else {
                    // Slow down and recover
                    skier.crashed = true;
                    skier.crashRecoveryTime = 1.5; // 1.5 seconds recovery
                }
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
            if (gameMode === 'slalom') {
                drawGates();
            }
            drawSkier();
            drawScore();
        } else if (gameState === 'gameOver') {
            drawSlope();
            drawTrees();
            if (gameMode === 'slalom') {
                drawGates();
            }
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

    // Draw trees, rocks, and moguls
    function drawTrees() {
        for (let obstacle of trees) {
            if (obstacle.type === 'mogul') {
                // Draw mogul as a white bump
                const mogulSize = obstacle.size;

                // Mogul shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.beginPath();
                ctx.ellipse(obstacle.x, obstacle.y + 3, mogulSize * 0.8, mogulSize * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();

                // Mogul body (rounded bump)
                ctx.fillStyle = obstacle.hit ? '#e0e0e0' : '#f5f5f5';
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(obstacle.x, obstacle.y, mogulSize, mogulSize * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Highlight on top
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.ellipse(obstacle.x - mogulSize * 0.2, obstacle.y - mogulSize * 0.2, mogulSize * 0.4, mogulSize * 0.2, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (obstacle.type === 'tree') {
                // Draw tree as a triangle
                const treeHeight = obstacle.size * 1.2;

                // Tree shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.beginPath();
                ctx.ellipse(obstacle.x + 2, obstacle.y + 5, obstacle.size * 0.4, obstacle.size * 0.15, 0, 0, Math.PI * 2);
                ctx.fill();

                // Tree trunk
                ctx.fillStyle = '#654321';
                ctx.fillRect(obstacle.x - 4, obstacle.y - 10, 8, 15);

                // Tree foliage (triangles)
                ctx.fillStyle = '#2d5016';
                ctx.strokeStyle = '#1a3010';
                ctx.lineWidth = 2;

                // Bottom triangle
                ctx.beginPath();
                ctx.moveTo(obstacle.x, obstacle.y - treeHeight);
                ctx.lineTo(obstacle.x - obstacle.size / 2, obstacle.y - 10);
                ctx.lineTo(obstacle.x + obstacle.size / 2, obstacle.y - 10);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Middle triangle
                ctx.beginPath();
                ctx.moveTo(obstacle.x, obstacle.y - treeHeight * 1.1);
                ctx.lineTo(obstacle.x - obstacle.size / 2.5, obstacle.y - treeHeight * 0.4);
                ctx.lineTo(obstacle.x + obstacle.size / 2.5, obstacle.y - treeHeight * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Top triangle
                ctx.beginPath();
                ctx.moveTo(obstacle.x, obstacle.y - treeHeight * 1.3);
                ctx.lineTo(obstacle.x - obstacle.size / 3, obstacle.y - treeHeight * 0.7);
                ctx.lineTo(obstacle.x + obstacle.size / 3, obstacle.y - treeHeight * 0.7);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (obstacle.type === 'rock') {
                // Draw rock as an irregular polygon
                const rockSize = obstacle.size;

                // Rock shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(obstacle.x + 2, obstacle.y + 5, rockSize * 0.5, rockSize * 0.2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Rock body (irregular shape)
                ctx.fillStyle = '#666666';
                ctx.strokeStyle = '#444444';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(obstacle.x, obstacle.y - rockSize);
                ctx.lineTo(obstacle.x + rockSize * 0.6, obstacle.y - rockSize * 0.3);
                ctx.lineTo(obstacle.x + rockSize * 0.4, obstacle.y);
                ctx.lineTo(obstacle.x - rockSize * 0.5, obstacle.y);
                ctx.lineTo(obstacle.x - rockSize * 0.7, obstacle.y - rockSize * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Rock highlights
                ctx.fillStyle = '#888888';
                ctx.beginPath();
                ctx.moveTo(obstacle.x - rockSize * 0.2, obstacle.y - rockSize * 0.7);
                ctx.lineTo(obstacle.x + rockSize * 0.3, obstacle.y - rockSize * 0.5);
                ctx.lineTo(obstacle.x, obstacle.y - rockSize * 0.3);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    // Draw slalom gates
    function drawGates() {
        for (let gate of gates) {
            // Draw left pole (red)
            ctx.fillStyle = '#DC143C';
            ctx.fillRect(gate.leftPoleX - 3, gate.y - POLE_HEIGHT, 6, POLE_HEIGHT);

            // Left flag
            ctx.fillStyle = gate.passed ? '#90EE90' : gate.missed ? '#FFB6C1' : '#FF6B6B';
            ctx.beginPath();
            ctx.moveTo(gate.leftPoleX + 3, gate.y - POLE_HEIGHT);
            ctx.lineTo(gate.leftPoleX + 20, gate.y - POLE_HEIGHT + 8);
            ctx.lineTo(gate.leftPoleX + 3, gate.y - POLE_HEIGHT + 16);
            ctx.closePath();
            ctx.fill();

            // Draw right pole (blue)
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(gate.rightPoleX - 3, gate.y - POLE_HEIGHT, 6, POLE_HEIGHT);

            // Right flag
            ctx.fillStyle = gate.passed ? '#90EE90' : gate.missed ? '#FFB6C1' : '#6B9BFF';
            ctx.beginPath();
            ctx.moveTo(gate.rightPoleX - 3, gate.y - POLE_HEIGHT);
            ctx.lineTo(gate.rightPoleX - 20, gate.y - POLE_HEIGHT + 8);
            ctx.lineTo(gate.rightPoleX - 3, gate.y - POLE_HEIGHT + 16);
            ctx.closePath();
            ctx.fill();

            // Draw dotted line between poles to show gate
            if (!gate.passed && !gate.missed) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(gate.leftPoleX, gate.y - POLE_HEIGHT / 2);
                ctx.lineTo(gate.rightPoleX, gate.y - POLE_HEIGHT / 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    // Draw skier
    function drawSkier() {
        ctx.save();
        ctx.translate(skier.x + SKIER_WIDTH / 2, skier.y + SKIER_HEIGHT / 2);

        // Flash effect when crashed
        if (skier.crashed && Math.floor(skier.crashRecoveryTime * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Tilt skier based on direction (or tumble if crashed)
        let tilt = skier.direction * 0.15;
        if (skier.crashed) {
            tilt = Math.sin(skier.crashRecoveryTime * 10) * 0.5; // Tumbling effect
        }
        ctx.rotate(tilt);

        // Skier body (simple triangle shape)
        ctx.fillStyle = skier.crashed ? '#ff3333' : '#ff6b6b';
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

        // Show "OUCH!" text when crashed
        if (skier.crashed) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('OUCH!', skier.x + SKIER_WIDTH / 2, skier.y - 30);
        }
    }

    // Draw score
    function drawScore() {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';

        if (gameMode === 'downhill') {
            ctx.fillText(`Distance: ${score}`, 20, 40);
            ctx.fillText(`High: ${highScore}`, 20, 70);
        } else if (gameMode === 'slalom') {
            const displayTime = gameTime.toFixed(1);
            ctx.fillText(`Time: ${displayTime}s`, 20, 40);
            ctx.fillText(`Gates: ${gatesPassed}/${totalGates}`, 20, 70);
            ctx.fillText(`Missed: ${gatesMissed}`, 20, 100);
            if (bestSlalomTime < 999) {
                ctx.fillText(`Best: ${bestSlalomTime.toFixed(1)}s`, 20, 130);
            }
        }

        // Show crash counter (hearts/lives)
        const crashesLeft = 3 - skier.crashCount;
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#ff0000';
        const heartsY = gameMode === 'slalom' ? 160 : 100;
        ctx.fillText('Lives: ' + '❤️'.repeat(crashesLeft) + '🖤'.repeat(skier.crashCount), 20, heartsY);
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

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('← → Arrow Keys to Move', GAME_WIDTH / 2, 220);

        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#2d5016';
        ctx.fillText('Choose a mode below!', GAME_WIDTH / 2, 300);

        if (highScore > 0 || bestSlalomTime < 999) {
            ctx.font = 'bold 22px Arial';
            ctx.fillStyle = '#333';
            ctx.fillText('Best Scores:', GAME_WIDTH / 2, 370);
            if (highScore > 0) {
                ctx.font = '18px Arial';
                ctx.fillText(`Downhill Distance: ${highScore}`, GAME_WIDTH / 2, 400);
            }
            if (bestSlalomTime < 999) {
                ctx.font = '18px Arial';
                ctx.fillText(`Slalom Time: ${bestSlalomTime.toFixed(1)}s`, GAME_WIDTH / 2, 425);
            }
        }
    }

    // Draw mode selection
    function drawModeSelect() {
        // Draw background slope
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(200, 0, 400, GAME_HEIGHT);

        ctx.fillStyle = '#333';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT MODE', GAME_WIDTH / 2, 80);

        // Downhill mode box
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(150, 150, 220, 180);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('DOWNHILL', 260, 195);
        ctx.font = '16px Arial';
        ctx.fillText('Pure speed!', 260, 225);
        ctx.fillText('Avoid obstacles', 260, 250);
        ctx.fillText('Go for distance', 260, 275);
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('CLICK HERE', 260, 310);

        // Slalom mode box
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(430, 150, 220, 180);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('SLALOM', 540, 195);
        ctx.font = '16px Arial';
        ctx.fillText('Pass the gates!', 540, 225);
        ctx.fillText('Time-based race', 540, 250);
        ctx.fillText('Avoid penalties', 540, 275);
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('CLICK HERE', 540, 310);

        // Instructions
        ctx.fillStyle = '#333';
        ctx.font = '18px Arial';
        ctx.fillText('Click a mode to begin your run!', GAME_WIDTH / 2, 400);

        // Best scores
        if (highScore > 0 || bestSlalomTime < 999) {
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#2d5016';
            ctx.fillText('Your Best Times:', GAME_WIDTH / 2, 470);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#333';
            if (highScore > 0) {
                ctx.fillText(`Downhill: ${highScore}m`, GAME_WIDTH / 2 - 100, 500);
            }
            if (bestSlalomTime < 999) {
                ctx.fillText(`Slalom: ${bestSlalomTime.toFixed(1)}s`, GAME_WIDTH / 2 + 100, 500);
            }
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
        ctx.fillText('CRASHED!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);

        ctx.fillStyle = '#333';
        ctx.font = '32px Arial';

        if (gameMode === 'downhill') {
            ctx.fillText(`Distance: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

            if (score > highScore) {
                ctx.fillStyle = '#00b894';
                ctx.font = 'bold 28px Arial';
                ctx.fillText('🎉 NEW RECORD! 🎉', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
            } else {
                ctx.fillStyle = '#333';
                ctx.font = '24px Arial';
                ctx.fillText(`Best Distance: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
            }
        } else if (gameMode === 'slalom') {
            const finalTime = gameTime.toFixed(1);
            ctx.fillText(`Time: ${finalTime}s`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
            ctx.font = '24px Arial';
            ctx.fillText(`Gates: ${gatesPassed}/${totalGates} (Missed: ${gatesMissed})`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 5);

            if (gatesPassed === totalGates && gameTime < bestSlalomTime) {
                ctx.fillStyle = '#00b894';
                ctx.font = 'bold 28px Arial';
                ctx.fillText('🎉 NEW BEST TIME! 🎉', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
            } else if (bestSlalomTime < 999) {
                ctx.fillStyle = '#333';
                ctx.font = '22px Arial';
                ctx.fillText(`Best Time: ${bestSlalomTime.toFixed(1)}s`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
            }
        }

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#2d5016';
        ctx.fillText('CLICK TO PLAY AGAIN', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
    }

    // Game over
    function gameOver() {
        gameState = 'gameOver';

        if (gameMode === 'downhill') {
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('downhillSkierHighScore', highScore.toString());
            }
        } else if (gameMode === 'slalom') {
            // Only count as best time if all gates were passed
            if (gatesPassed === totalGates && gameTime < bestSlalomTime) {
                bestSlalomTime = gameTime;
                localStorage.setItem('downhillSkierBestSlalom', bestSlalomTime.toFixed(1));
            }
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
    function handleClick(event) {
        if (gameState === 'gameOver') {
            // Show mode selection buttons again
            document.getElementById('modeButtons').style.display = 'flex';
            document.getElementById('gameInfo').style.display = 'none';
            document.getElementById('controlButtons').style.display = 'none';
            gameState = 'menu';
            draw();
        }
        // Menu state is handled by HTML buttons now
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

    // Touch control variables
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchMoving = false;

    // Handle touch start
    function handleTouchStart(e) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        // Handle tap on canvas for game over screen
        if (gameState === 'gameOver') {
            e.preventDefault();
            handleClick();
        } else if (gameState === 'playing') {
            isTouchMoving = false;
        }
        // Menu state is handled by HTML buttons
    }

    // Handle touch move (for continuous swipe control)
    function handleTouchMove(e) {
        if (gameState !== 'playing') return;
        e.preventDefault();

        const touch = e.touches[0];
        const touchCurrentX = touch.clientX;
        const deltaX = touchCurrentX - touchStartX;

        // If swipe distance is significant, set direction
        if (Math.abs(deltaX) > 20) {
            isTouchMoving = true;
            if (deltaX < 0) {
                keys['ArrowLeft'] = true;
                keys['ArrowRight'] = false;
            } else {
                keys['ArrowRight'] = true;
                keys['ArrowLeft'] = false;
            }
        }
    }

    // Handle touch end
    function handleTouchEnd(e) {
        if (gameState === 'playing') {
            // Stop movement when touch ends
            keys['ArrowLeft'] = false;
            keys['ArrowRight'] = false;
            isTouchMoving = false;
        }
    }

    // Handle button press (for on-screen buttons)
    function handleButtonDown(direction) {
        if (gameState === 'playing') {
            keys[direction] = true;
        }
    }

    function handleButtonUp(direction) {
        if (gameState === 'playing') {
            keys[direction] = false;
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

                <!-- Mode Selection Buttons (shown initially) -->
                <div id="modeButtons" style="display: flex; gap: 1.5rem; margin-top: 1rem;">
                    <button id="btnDownhill" style="
                        width: 200px;
                        padding: 1.5rem;
                        background: linear-gradient(135deg, #4169E1 0%, #2c4d9e 100%);
                        border: none;
                        border-radius: 15px;
                        color: white;
                        font-size: 1.1rem;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        transition: transform 0.2s;
                    ">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏔️</div>
                        <div>DOWNHILL</div>
                        <div style="font-size: 0.8rem; font-weight: normal; margin-top: 0.5rem; opacity: 0.9;">Go for distance!</div>
                    </button>
                    <button id="btnSlalom" style="
                        width: 200px;
                        padding: 1.5rem;
                        background: linear-gradient(135deg, #DC143C 0%, #a01028 100%);
                        border: none;
                        border-radius: 15px;
                        color: white;
                        font-size: 1.1rem;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        transition: transform 0.2s;
                    ">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">⛳</div>
                        <div>SLALOM</div>
                        <div style="font-size: 0.8rem; font-weight: normal; margin-top: 0.5rem; opacity: 0.9;">Race the clock!</div>
                    </button>
                </div>

                <div id="gameInfo" style="text-align: center; color: #666; display: none;">
                    <p style="margin: 0.5rem 0;">💡 <strong>Controls:</strong> Arrow keys, swipe, or use buttons below</p>
                    <p style="margin: 0.5rem 0;">🎯 <strong>Goal:</strong> <span id="goalText"></span></p>
                </div>

                <!-- Left/Right Control Buttons (hidden initially) -->
                <div id="controlButtons" style="display: none; gap: 20px; margin-top: 1rem;">
                    <button id="btnSkiLeft" style="
                        width: 100px;
                        height: 80px;
                        background: linear-gradient(145deg, #4a4a4a, #2a2a2a);
                        border: 3px solid #666;
                        border-radius: 15px;
                        color: white;
                        font-size: 32px;
                        cursor: pointer;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                        user-select: none;
                        -webkit-tap-highlight-color: transparent;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">◀</button>
                    <button id="btnSkiRight" style="
                        width: 100px;
                        height: 80px;
                        background: linear-gradient(145deg, #4a4a4a, #2a2a2a);
                        border: 3px solid #666;
                        border-radius: 15px;
                        color: white;
                        font-size: 32px;
                        cursor: pointer;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                        user-select: none;
                        -webkit-tap-highlight-color: transparent;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">▶</button>
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

        // Mode selection button handlers
        document.getElementById('btnDownhill').addEventListener('click', () => {
            gameMode = 'downhill';
            document.getElementById('modeButtons').style.display = 'none';
            document.getElementById('gameInfo').style.display = 'block';
            document.getElementById('controlButtons').style.display = 'flex';
            document.getElementById('goalText').textContent = 'Avoid trees and stay on the slope!';
            initGame();
        });

        document.getElementById('btnSlalom').addEventListener('click', () => {
            gameMode = 'slalom';
            document.getElementById('modeButtons').style.display = 'none';
            document.getElementById('gameInfo').style.display = 'block';
            document.getElementById('controlButtons').style.display = 'flex';
            document.getElementById('goalText').textContent = 'Pass through all gates!';
            initGame();
        });

        // Event listeners for canvas - click to restart after game over
        gameCanvas.addEventListener('click', handleClick);

        // Touch event listeners for canvas (swipe control during gameplay)
        gameCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Keyboard support
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // On-screen button controls
        const btnLeft = document.getElementById('btnSkiLeft');
        const btnRight = document.getElementById('btnSkiRight');

        // Mouse events
        btnLeft.addEventListener('mousedown', () => handleButtonDown('ArrowLeft'));
        btnLeft.addEventListener('mouseup', () => handleButtonUp('ArrowLeft'));
        btnLeft.addEventListener('mouseleave', () => handleButtonUp('ArrowLeft'));

        btnRight.addEventListener('mousedown', () => handleButtonDown('ArrowRight'));
        btnRight.addEventListener('mouseup', () => handleButtonUp('ArrowRight'));
        btnRight.addEventListener('mouseleave', () => handleButtonUp('ArrowRight'));

        // Touch events for buttons
        btnLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleButtonDown('ArrowLeft');
        });
        btnLeft.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleButtonUp('ArrowLeft');
        });

        btnRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleButtonDown('ArrowRight');
        });
        btnRight.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleButtonUp('ArrowRight');
        });
    };

    // Exit to menu
    window.exitDownhillSkierToMenu = function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        // Remove keyboard listeners
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        // Remove touch event listeners
        if (gameCanvas) {
            gameCanvas.removeEventListener('touchstart', handleTouchStart);
            gameCanvas.removeEventListener('touchmove', handleTouchMove);
            gameCanvas.removeEventListener('touchend', handleTouchEnd);
        }

        document.getElementById('downhillSkierGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };
})();
