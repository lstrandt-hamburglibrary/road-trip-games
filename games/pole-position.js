// Pole Position Racing Game
(function() {
    'use strict';

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const ROAD_WIDTH = 2000;
    const SEGMENT_LENGTH = 200;
    const RUMBLE_LENGTH = 3;
    const CAMERA_DEPTH = 0.84;

    let gameState = {
        canvas: null,
        ctx: null,
        animationId: null,
        gameStarted: false,
        gameOver: false,
        phase: 'qualifying', // 'qualifying' or 'race'

        // Player car
        playerX: 0, // -1 to 1, where 0 is center
        playerZ: 0,
        speed: 0,
        maxSpeed: 300,
        acceleration: 5.0,
        deceleration: 0.05,
        braking: 5.0,
        turning: 0.002,
        centrifugal: 0.15,
        gear: 'high', // 'low' or 'high'

        // Track position
        position: 0,
        trackLength: 0,

        // Opponent cars
        cars: [],

        // Time and scoring
        time: 60, // 60 seconds for qualifying
        qualifyingTime: null,
        position: 0,
        score: 0,
        checkpointsPassed: 0,

        // Controls
        keys: {},

        // Track segments
        segments: [],

        // Camera
        cameraHeight: 1000,
        cameraDepth: 1 / CAMERA_DEPTH,
        drawDistance: 400,

        // Crash state
        crashed: false,
        crashTimer: 0
    };

    // Track segment class
    class Segment {
        constructor(index, color) {
            this.index = index;
            this.p1 = { world: { x: 0, y: 0, z: index * SEGMENT_LENGTH }, camera: {}, screen: {} };
            this.p2 = { world: { x: 0, y: 0, z: (index + 1) * SEGMENT_LENGTH }, camera: {}, screen: {} };
            this.color = color;
            this.curve = 0;
            this.hill = 0;
            this.cars = [];
            this.billboard = null; // For roadside billboards/signs
        }
    }

    // Initialize game
    function initGame() {
        gameState.gameStarted = false;
        gameState.gameOver = false;
        gameState.phase = 'qualifying';
        gameState.playerX = 0;
        gameState.speed = 0;
        gameState.position = 0;
        gameState.time = 60;
        gameState.qualifyingTime = null;
        gameState.score = 0;
        gameState.checkpointsPassed = 0;
        gameState.crashed = false;
        gameState.crashTimer = 0;
        gameState.gear = 'high';

        // Build track
        buildTrack();

        // Spawn opponent cars
        spawnCars();
    }

    function buildTrack() {
        gameState.segments = [];
        const totalSegments = 500;

        for (let i = 0; i < totalSegments; i++) {
            const segment = new Segment(i,
                Math.floor(i / RUMBLE_LENGTH) % 2 ? 'dark' : 'light'
            );

            // Add more varied curves
            if (i > 20 && i < 60) segment.curve = 0.8;
            if (i > 80 && i < 110) segment.curve = -1.2;
            if (i > 130 && i < 170) segment.curve = 1.5;
            if (i > 190 && i < 220) segment.curve = -0.7;
            if (i > 250 && i < 290) segment.curve = -1.3;
            if (i > 310 && i < 350) segment.curve = 1.1;
            if (i > 370 && i < 410) segment.curve = -1.0;
            if (i > 430 && i < 470) segment.curve = 0.9;

            // Add hills (very gentle, far down the track)
            if (i > 200 && i < 250) segment.hill = Math.sin((i - 200) / 50 * Math.PI) * 400;
            if (i > 350 && i < 400) segment.hill = Math.sin((i - 350) / 50 * Math.PI) * 300;

            // Add billboards and signs (authentic 1982 style)
            if (i % 30 === 5) segment.billboard = { side: 'left', type: 'NAMCO', color: '#FF0000' };
            if (i % 35 === 10) segment.billboard = { side: 'right', type: 'POLE', color: '#0000FF' };
            if (i % 40 === 20) segment.billboard = { side: 'left', type: 'START', color: '#FFFF00' };

            gameState.segments.push(segment);
        }

        gameState.trackLength = totalSegments * SEGMENT_LENGTH;
    }

    function spawnCars() {
        gameState.cars = [];
        const carCount = gameState.phase === 'qualifying' ? 12 : 20;

        for (let i = 0; i < carCount; i++) {
            // Spawn cars ahead of player, spread out across track
            gameState.cars.push({
                offset: (Math.random() * 1.4 - 0.7), // -0.7 to 0.7 (within road bounds)
                z: gameState.position + 1000 + (i * 1500), // Start closer, spread evenly
                speed: 100 + Math.random() * 60, // Varied speeds for racing
                color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#ff6600', '#00ffff'][Math.floor(Math.random() * 7)],
                passed: false
            });
        }
    }

    function findSegment(z) {
        return gameState.segments[Math.floor(z / SEGMENT_LENGTH) % gameState.segments.length];
    }

    function project(p, cameraX, cameraY, cameraZ) {
        p.camera.x = p.world.x - cameraX;
        p.camera.y = p.world.y - cameraY;
        p.camera.z = p.world.z - cameraZ;

        if (p.camera.z > 0) {
            p.screen.scale = gameState.cameraDepth / p.camera.z;
            p.screen.x = Math.round((CANVAS_WIDTH / 2) + (p.screen.scale * p.camera.x * CANVAS_WIDTH / 2));
            p.screen.y = Math.round((CANVAS_HEIGHT / 2) - (p.screen.scale * p.camera.y * CANVAS_HEIGHT / 2));
            p.screen.w = Math.round(p.screen.scale * ROAD_WIDTH * CANVAS_WIDTH / 2);
        } else {
            p.screen.scale = 0;
            p.screen.x = 0;
            p.screen.y = 0;
            p.screen.w = 0;
        }
    }

    function update(dt) {
        if (!gameState.gameStarted || gameState.gameOver) return;

        // Update time
        if (gameState.phase === 'qualifying') {
            gameState.time -= dt;
            if (gameState.time <= 0) {
                endQualifying();
                return;
            }
        } else {
            gameState.time -= dt;
            if (gameState.time <= 0) {
                gameState.gameOver = true;
                return;
            }
        }

        // Handle crash timer (allow movement during crash, just visual effect)
        if (gameState.crashed) {
            gameState.crashTimer--;
            if (gameState.crashTimer <= 0) {
                gameState.crashed = false;
            }
            // Don't return - let car keep moving during crash
        }

        const segment = findSegment(gameState.position + gameState.playerZ);
        const speedPercent = gameState.speed / gameState.maxSpeed;
        const dx = dt * 2 * speedPercent;

        // Handle controls
        if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
            gameState.playerX -= dx;
        }
        if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
            gameState.playerX += dx;
        }

        // Acceleration
        if (gameState.keys['ArrowUp'] || gameState.keys['w'] || gameState.keys['gas']) {
            const maxSpeed = gameState.gear === 'low' ? gameState.maxSpeed * 0.6 : gameState.maxSpeed;
            gameState.speed = Math.min(gameState.speed + gameState.acceleration, maxSpeed);
        }
        // Braking
        else if (gameState.keys['ArrowDown'] || gameState.keys['s'] || gameState.keys['brake']) {
            gameState.speed = Math.max(gameState.speed - gameState.braking, 0);
        }
        // Natural deceleration
        else {
            gameState.speed = Math.max(gameState.speed - gameState.deceleration, 0);
        }

        // Apply curve centrifugal force (disabled - was causing auto-steering)
        // gameState.playerX -= (dx * speedPercent * segment.curve * gameState.centrifugal);

        // Keep player on track (no speed penalty, just clamp position)
        gameState.playerX = Math.max(-1, Math.min(1, gameState.playerX));

        // Update position
        gameState.position += gameState.speed;
        while (gameState.position >= gameState.trackLength) {
            gameState.position -= gameState.trackLength;

            // Passed checkpoint
            if (gameState.phase === 'race') {
                gameState.checkpointsPassed++;
                gameState.time = Math.min(gameState.time + 30, 99); // Add 30 seconds
                gameState.score += 1000;
            }
        }

        // Update opponent cars
        gameState.cars.forEach(car => {
            car.z += car.speed * dt;

            // Wrap around track
            while (car.z >= gameState.trackLength) {
                car.z -= gameState.trackLength;
                car.passed = false; // Reset when wrapping
            }
            while (car.z < 0) {
                car.z += gameState.trackLength;
            }

            // Check collision with player
            const relativeZ = car.z - gameState.position;
            if (Math.abs(relativeZ) < 100 && relativeZ > -50 && relativeZ < 200) {
                if (Math.abs(car.offset - gameState.playerX) < 0.2) {
                    // Collision! Slow down briefly
                    if (!gameState.crashed) {
                        gameState.crashed = true;
                        gameState.crashTimer = 15;
                        gameState.speed = Math.max(gameState.speed * 0.6, 80);
                    }
                }
            }

            // Pass car for points (check if car is behind us now)
            if (gameState.phase === 'race' && !car.passed) {
                if (relativeZ < -100) {
                    car.passed = true;
                    gameState.score += 200;
                }
            }
        });
    }

    function endQualifying() {
        gameState.qualifyingTime = 60 - gameState.time;

        // Check if qualified (under 50 seconds)
        if (gameState.qualifyingTime < 50) {
            // Start race
            gameState.phase = 'race';
            gameState.time = 90; // 90 seconds for race
            gameState.position = 0;
            gameState.speed = 0;
            gameState.checkpointsPassed = 0;
            spawnCars();
        } else {
            // Didn't qualify
            gameState.gameOver = true;
        }
    }

    function render() {
        const ctx = gameState.ctx;

        // Clear sky (authentic 1982 blue)
        ctx.fillStyle = '#5299FF';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw mountains in background (brown/gray)
        const horizonY = CANVAS_HEIGHT * 0.4;
        ctx.fillStyle = '#8B6F47';
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(100, horizonY - 40);
        ctx.lineTo(200, horizonY - 20);
        ctx.lineTo(300, horizonY - 60);
        ctx.lineTo(400, horizonY - 30);
        ctx.lineTo(500, horizonY - 70);
        ctx.lineTo(600, horizonY - 40);
        ctx.lineTo(700, horizonY - 20);
        ctx.lineTo(800, horizonY - 50);
        ctx.lineTo(CANVAS_WIDTH, horizonY);
        ctx.closePath();
        ctx.fill();

        // Draw clouds (simple white rectangles)
        ctx.fillStyle = '#FFFFFF';
        const cloudY = 40;
        ctx.fillRect(50, cloudY, 60, 15);
        ctx.fillRect(65, cloudY - 8, 30, 15);
        ctx.fillRect(350, cloudY + 20, 80, 18);
        ctx.fillRect(370, cloudY + 12, 40, 18);
        ctx.fillRect(600, cloudY + 5, 70, 16);
        ctx.fillRect(615, cloudY - 3, 40, 16);

        // Draw grass (authentic green)
        ctx.fillStyle = '#00AA00';
        ctx.fillRect(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2);

        const baseSegment = findSegment(gameState.position);
        const basePercent = (gameState.position % SEGMENT_LENGTH) / SEGMENT_LENGTH;
        const playerSegment = findSegment(gameState.position + gameState.playerZ);
        const playerY = playerSegment.p1.world.y + (playerSegment.p2.world.y - playerSegment.p1.world.y) * basePercent;

        const maxY = CANVAS_HEIGHT;

        let x = 0;
        let dx = 0;

        // Render road segments
        const drawDistance = gameState.drawDistance;
        for (let n = 0; n < drawDistance; n++) {
            const segment = gameState.segments[(baseSegment.index + n) % gameState.segments.length];

            segment.p1.world.y = segment.hill;
            segment.p2.world.y = gameState.segments[(segment.index + 1) % gameState.segments.length].hill;

            // Apply curve to make road bend visually
            segment.p1.world.x = x * ROAD_WIDTH;
            segment.p2.world.x = (x + dx) * ROAD_WIDTH;

            project(segment.p1, gameState.playerX * ROAD_WIDTH, playerY + gameState.cameraHeight, gameState.position);
            project(segment.p2, gameState.playerX * ROAD_WIDTH, playerY + gameState.cameraHeight, gameState.position);

            x += dx;
            dx += segment.curve;

            // Skip segments that are behind camera
            if (segment.p2.camera.z <= 0) continue;

            // Clip segment coordinates to screen bounds to prevent gaps
            const p1Y = Math.max(0, Math.min(CANVAS_HEIGHT, segment.p1.screen.y));
            const p2Y = Math.max(0, Math.min(CANVAS_HEIGHT, segment.p2.screen.y));

            // Skip if segment height is invalid
            if (p1Y <= p2Y) continue;

            // Draw road
            const rumble = segment.color === 'dark';
            const roadColor = rumble ? '#555' : '#777';
            const grassColor = rumble ? '#10aa10' : '#16bf16';
            const lineColor = rumble ? '#fff' : '#fff';

            // Grass
            ctx.fillStyle = grassColor;
            ctx.fillRect(0, p2Y, CANVAS_WIDTH, p1Y - p2Y);

            // Road
            drawTrapezoid(ctx,
                segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w,
                segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w,
                roadColor
            );

            // Road lines
            const lineW1 = segment.p1.screen.w / 40;
            const lineW2 = segment.p2.screen.w / 40;

            // Center line
            if (!rumble) {
                drawTrapezoid(ctx,
                    segment.p1.screen.x, segment.p1.screen.y, lineW1,
                    segment.p2.screen.x, segment.p2.screen.y, lineW2,
                    lineColor
                );
            }

            // Side lines (red/white curbs)
            const curbColor = rumble ? '#FFFFFF' : '#FF0000';
            drawTrapezoid(ctx,
                segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y, lineW1 * 3,
                segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y, lineW2 * 3,
                curbColor
            );
            drawTrapezoid(ctx,
                segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y, lineW1 * 3,
                segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y, lineW2 * 3,
                curbColor
            );

            // Draw billboards (authentic 1982 style)
            if (segment.billboard && segment.p1.camera.z > gameState.cameraDepth) {
                const billboardScale = segment.p1.screen.scale;
                const billboardW = Math.max(billboardScale * 120, 8);
                const billboardH = Math.max(billboardScale * 60, 4);
                const billboardX = segment.billboard.side === 'left' ?
                    segment.p1.screen.x - segment.p1.screen.w - billboardW - lineW1 * 10 :
                    segment.p1.screen.x + segment.p1.screen.w + lineW1 * 10;
                const billboardY = segment.p1.screen.y - billboardH;

                // Billboard background
                ctx.fillStyle = segment.billboard.color;
                ctx.fillRect(billboardX, billboardY, billboardW, billboardH);

                // Billboard text (if large enough)
                if (billboardW > 20) {
                    ctx.fillStyle = '#000';
                    ctx.font = `bold ${Math.max(billboardH * 0.4, 6)}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.fillText(segment.billboard.type, billboardX + billboardW / 2, billboardY + billboardH * 0.7);
                }

                // Billboard poles
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(billboardX + billboardW * 0.1, billboardY + billboardH, billboardW * 0.1, billboardH * 0.5);
                ctx.fillRect(billboardX + billboardW * 0.8, billboardY + billboardH, billboardW * 0.1, billboardH * 0.5);
            }

            // Store cars that are on this segment for later rendering
            segment.carsOnSegment = [];
        }

        // After all segments are drawn, draw cars on top
        // Sort cars by distance for proper depth rendering
        const sortedCars = [...gameState.cars].sort((a, b) => (b.z - gameState.position) - (a.z - gameState.position));

        sortedCars.forEach(car => {
            // Get the segment this car is on to apply curve offset
            const carSegmentIndex = Math.floor((car.z - gameState.position) / SEGMENT_LENGTH);
            if (carSegmentIndex < 0 || carSegmentIndex >= drawDistance) return;

            const carSegment = gameState.segments[(baseSegment.index + carSegmentIndex) % gameState.segments.length];

            // Calculate curve offset for this car
            let carCurveOffset = 0;
            for (let i = 0; i <= carSegmentIndex; i++) {
                const seg = gameState.segments[(baseSegment.index + i) % gameState.segments.length];
                carCurveOffset += seg.curve;
            }

            const carSprite = {
                world: { x: car.offset * ROAD_WIDTH + carCurveOffset * ROAD_WIDTH, y: 0, z: car.z },
                camera: {},
                screen: {}
            };
            project(carSprite, gameState.playerX * ROAD_WIDTH, playerY + gameState.cameraHeight, gameState.position);

            // Only draw if car is in front of camera and visible
            if (carSprite.camera.z > gameState.cameraDepth * 2) {
                const carW = Math.max(carSprite.screen.scale * 100, 2);
                const carH = Math.max(carSprite.screen.scale * 60, 2);

                // Draw shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(
                    carSprite.screen.x - carW / 2 + 1,
                    carSprite.screen.y - 1,
                    carW - 2,
                    3
                );

                // Draw opponent car (authentic pixelated F1 sprite)
                const opCarColor = car.color;

                // Simplified rear wing
                ctx.fillStyle = opCarColor;
                ctx.fillRect(carSprite.screen.x - carW / 2, carSprite.screen.y - carH, carW, carH * 0.12);

                // Engine cover
                ctx.fillStyle = opCarColor;
                ctx.fillRect(carSprite.screen.x - carW / 2 + carW * 0.2, carSprite.screen.y - carH * 0.85, carW * 0.6, carH * 0.4);

                // Cockpit (white)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(carSprite.screen.x - carW / 2 + carW * 0.25, carSprite.screen.y - carH * 0.8, carW * 0.5, carH * 0.2);

                // Helmet
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(carSprite.screen.x - carW / 2 + carW * 0.35, carSprite.screen.y - carH * 0.75, carW * 0.3, carH * 0.12);

                // Nose cone
                ctx.fillStyle = opCarColor;
                ctx.fillRect(carSprite.screen.x - carW / 2 + carW * 0.3, carSprite.screen.y - carH * 0.4, carW * 0.4, carH * 0.35);

                // Side pods
                ctx.fillStyle = opCarColor;
                ctx.fillRect(carSprite.screen.x - carW / 2, carSprite.screen.y - carH * 0.5, carW * 0.2, carH * 0.3);
                ctx.fillRect(carSprite.screen.x + carW / 2 - carW * 0.2, carSprite.screen.y - carH * 0.5, carW * 0.2, carH * 0.3);

                // Wheels (pixelated black blocks)
                ctx.fillStyle = '#000';
                const wheelW = Math.max(carW * 0.15, 2);
                const wheelH = Math.max(carH * 0.18, 2);
                // Front wheels
                ctx.fillRect(carSprite.screen.x - carW / 2 - wheelW / 2, carSprite.screen.y - carH * 0.15, wheelW, wheelH);
                ctx.fillRect(carSprite.screen.x + carW / 2 - wheelW / 2, carSprite.screen.y - carH * 0.15, wheelW, wheelH);
                // Rear wheels
                ctx.fillRect(carSprite.screen.x - carW / 2 - wheelW / 2, carSprite.screen.y - carH * 0.95, wheelW, wheelH);
                ctx.fillRect(carSprite.screen.x + carW / 2 - wheelW / 2, carSprite.screen.y - carH * 0.95, wheelW, wheelH);
            }
        });

        // Draw player car (authentic 1982 pixelated sprite - F1 style)
        const playerCarY = CANVAS_HEIGHT - 100;
        const playerCarX = CANVAS_WIDTH / 2;
        const pCarW = 48;
        const pCarH = 64;

        // Shadow (simple black oval)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(playerCarX - pCarW / 2 + 2, playerCarY + 2, pCarW - 4, 6);

        // Main car body (red/white F1 style)
        const carColor = gameState.crashed ? '#999' : '#FF0000';
        const accentColor = gameState.crashed ? '#CCC' : '#FFFFFF';

        // Rear wing
        ctx.fillStyle = carColor;
        ctx.fillRect(playerCarX - pCarW / 2, playerCarY - pCarH + 4, pCarW, 6);

        // Engine cover (red)
        ctx.fillStyle = carColor;
        ctx.fillRect(playerCarX - pCarW / 2 + 8, playerCarY - pCarH + 12, pCarW - 16, 24);

        // Cockpit (white stripe)
        ctx.fillStyle = accentColor;
        ctx.fillRect(playerCarX - pCarW / 2 + 10, playerCarY - pCarH + 18, pCarW - 20, 12);

        // Driver helmet (dark blue)
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(playerCarX - pCarW / 2 + 16, playerCarY - pCarH + 20, pCarW - 32, 8);

        // Nose cone (white with red tip)
        ctx.fillStyle = accentColor;
        ctx.fillRect(playerCarX - pCarW / 2 + 12, playerCarY - pCarH + 38, pCarW - 24, 16);
        ctx.fillStyle = carColor;
        ctx.fillRect(playerCarX - pCarW / 2 + 14, playerCarY - pCarH + 52, pCarW - 28, 8);

        // Side pods (wider sections)
        ctx.fillStyle = carColor;
        ctx.fillRect(playerCarX - pCarW / 2, playerCarY - pCarH + 30, 8, 20);
        ctx.fillRect(playerCarX + pCarW / 2 - 8, playerCarY - pCarH + 30, 8, 20);

        // Wheels (black rectangles - authentic pixelated)
        ctx.fillStyle = '#000';
        // Front left
        ctx.fillRect(playerCarX - pCarW / 2 - 4, playerCarY - pCarH + 54, 8, 10);
        // Front right
        ctx.fillRect(playerCarX + pCarW / 2 - 4, playerCarY - pCarH + 54, 8, 10);
        // Rear left
        ctx.fillRect(playerCarX - pCarW / 2 - 4, playerCarY - pCarH + 8, 8, 12);
        // Rear right
        ctx.fillRect(playerCarX + pCarW / 2 - 4, playerCarY - pCarH + 8, 8, 12);

        // Draw HUD (authentic 1982 style - bright colors on black)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 60);

        // Use authentic arcade font style
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';

        // TOP score (red text like original)
        ctx.fillStyle = '#FF0000';
        ctx.fillText(`TOP ${Math.round(gameState.score).toString().padStart(6, '0')}`, 20, 25);

        // SCORE (white text)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`SCORE ${Math.round(gameState.score).toString().padStart(6, '0')}`, 20, 50);

        // TIME (white text in center)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`TIME ${Math.ceil(gameState.time)}s`, CANVAS_WIDTH / 2 - 50, 25);

        // LAP indicator (white text)
        if (gameState.phase === 'race') {
            ctx.fillText(`LAP ${gameState.checkpointsPassed + 1}`, CANVAS_WIDTH / 2 + 50, 25);
        } else {
            ctx.fillStyle = '#FFFF00';
            ctx.fillText(`QUALIFYING`, CANVAS_WIDTH / 2 + 50, 25);
        }

        // SPEED (white text on right)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`SPEED ${Math.round(gameState.speed)}km`, CANVAS_WIDTH - 20, 25);

        // Gear (if shown)
        ctx.fillText(`${gameState.gear.toUpperCase()}`, CANVAS_WIDTH - 20, 50);

        // Game over / start screen
        if (!gameState.gameStarted) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('POLE POSITION', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

            ctx.font = '24px Arial';
            ctx.fillText('Qualify in under 50 seconds!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
            ctx.fillText('Press SPACE or tap to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
            ctx.font = '18px Arial';
            ctx.fillText('Arrow keys to steer | Up to gas | Down to brake', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
            ctx.fillText('G to shift gears (Low/High)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
        }

        if (gameState.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';

            if (gameState.phase === 'qualifying' && gameState.qualifyingTime >= 50) {
                ctx.fillText('DID NOT QUALIFY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
                ctx.font = '32px Arial';
                ctx.fillText(`Time: ${gameState.qualifyingTime.toFixed(2)}s`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            } else {
                ctx.fillText('RACE FINISHED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
                ctx.font = '32px Arial';
                ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                ctx.fillText(`Laps: ${gameState.checkpointsPassed}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
            }

            ctx.font = '24px Arial';
            ctx.fillText('Click "Play Again" to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
        }
    }

    function shadeColor(color, percent) {
        // Lighten or darken a hex color
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    function drawTrapezoid(ctx, x1, y1, w1, x2, y2, w2, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1 - w1, y1);
        ctx.lineTo(x1 + w1, y1);
        ctx.lineTo(x2 + w2, y2);
        ctx.lineTo(x2 - w2, y2);
        ctx.closePath();
        ctx.fill();
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
        // Prevent default for arrow keys and space to avoid page scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }

        gameState.keys[e.key] = true;

        if (e.key === ' ' && !gameState.gameStarted && !gameState.gameOver) {
            gameState.gameStarted = true;
        }

        if ((e.key === 'g' || e.key === 'G') && gameState.gameStarted) {
            gameState.gear = gameState.gear === 'low' ? 'high' : 'low';
        }
    }

    function handleKeyUp(e) {
        gameState.keys[e.key] = false;
    }

    window.launchPolePosition = function() {
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('polePositionGame').style.display = 'block';

        showPolePositionGame();
    };

    function showPolePositionGame() {
        const content = document.getElementById('polePositionContent');
        content.innerHTML = `
            <div style="text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="exitPolePosition()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        ← Back
                    </button>
                    <h2 style="margin: 0; font-size: 1.5rem;">🏎️ Pole Position</h2>
                    <button onclick="restartPolePosition()" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        🔄 Play Again
                    </button>
                </div>

                <canvas id="polePositionCanvas" width="800" height="600" style="border: 4px solid #333; border-radius: 10px; background: #000; max-width: 100%; height: auto; display: block; margin: 0 auto;"></canvas>

                <!-- Mobile Controls -->
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
                    <div style="display: flex; gap: 0.5rem;">
                        <button id="ppLeftBtn" style="background: #667eea; color: white; border: none; padding: 1rem 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; touch-action: manipulation;">
                            ⬅️
                        </button>
                        <button id="ppRightBtn" style="background: #667eea; color: white; border: none; padding: 1rem 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; touch-action: manipulation;">
                            ➡️
                        </button>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button id="ppGasBtn" style="background: #28a745; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; touch-action: manipulation;">
                            ⬆️ GAS
                        </button>
                        <button id="ppBrakeBtn" style="background: #dc3545; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; touch-action: manipulation;">
                            ⬇️ BRAKE
                        </button>
                    </div>
                    <button id="ppGearBtn" style="background: #ff9800; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; touch-action: manipulation;">
                        🔧 GEAR
                    </button>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem;">
                    <h4 style="color: #333; margin-bottom: 1rem;">How to Play:</h4>
                    <ul style="color: #666; text-align: left; line-height: 1.8;">
                        <li>🏁 <strong>Qualifying Lap:</strong> Complete track in under 50 seconds to qualify</li>
                        <li>🏎️ <strong>Grand Prix:</strong> Race against opponents, pass them for points</li>
                        <li>⏱️ Reach checkpoints to extend time (complete laps)</li>
                        <li>🚗 Avoid hitting other cars and signs - crashes slow you down!</li>
                        <li>🔧 Shift gears: Low gear for acceleration, High gear for top speed</li>
                        <li>🎯 Score points by passing opponents (200 pts) and completing laps (1000 pts)</li>
                    </ul>
                </div>
            </div>
        `;

        initGame();

        gameState.canvas = document.getElementById('polePositionCanvas');
        gameState.ctx = gameState.canvas.getContext('2d');

        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Mobile button controls
        const leftBtn = document.getElementById('ppLeftBtn');
        const rightBtn = document.getElementById('ppRightBtn');
        const gasBtn = document.getElementById('ppGasBtn');
        const brakeBtn = document.getElementById('ppBrakeBtn');
        const gearBtn = document.getElementById('ppGearBtn');

        leftBtn.addEventListener('touchstart', () => gameState.keys['ArrowLeft'] = true);
        leftBtn.addEventListener('touchend', () => gameState.keys['ArrowLeft'] = false);
        leftBtn.addEventListener('mousedown', () => gameState.keys['ArrowLeft'] = true);
        leftBtn.addEventListener('mouseup', () => gameState.keys['ArrowLeft'] = false);

        rightBtn.addEventListener('touchstart', () => gameState.keys['ArrowRight'] = true);
        rightBtn.addEventListener('touchend', () => gameState.keys['ArrowRight'] = false);
        rightBtn.addEventListener('mousedown', () => gameState.keys['ArrowRight'] = true);
        rightBtn.addEventListener('mouseup', () => gameState.keys['ArrowRight'] = false);

        gasBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.keys['gas'] = true;
        });
        gasBtn.addEventListener('touchend', () => gameState.keys['gas'] = false);
        gasBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (!gameState.gameStarted && !gameState.gameOver) {
                gameState.gameStarted = true;
            }
            gameState.keys['gas'] = true;
        });
        gasBtn.addEventListener('mouseup', () => gameState.keys['gas'] = false);

        brakeBtn.addEventListener('touchstart', () => gameState.keys['brake'] = true);
        brakeBtn.addEventListener('touchend', () => gameState.keys['brake'] = false);
        brakeBtn.addEventListener('mousedown', () => gameState.keys['brake'] = true);
        brakeBtn.addEventListener('mouseup', () => gameState.keys['brake'] = false);

        gearBtn.addEventListener('click', () => {
            if (gameState.gameStarted) {
                gameState.gear = gameState.gear === 'low' ? 'high' : 'low';
            }
        });

        // Start game loop
        lastTime = 0;
        gameLoop(0);
    }

    window.exitPolePosition = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        document.getElementById('polePositionGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

    window.restartPolePosition = function() {
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        showPolePositionGame();
    };

})();
