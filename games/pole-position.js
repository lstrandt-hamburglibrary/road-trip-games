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
        cameraHeight: 1500,
        cameraDepth: 1 / CAMERA_DEPTH,

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

            // Add curves (gentler)
            if (i > 20 && i < 50) segment.curve = 0.8;
            if (i > 80 && i < 100) segment.curve = -1.0;
            if (i > 150 && i < 180) segment.curve = 1.0;
            if (i > 230 && i < 270) segment.curve = -0.9;
            if (i > 320 && i < 360) segment.curve = 0.6;
            if (i > 400 && i < 430) segment.curve = -0.8;

            // Add hills (very gentle, far down the track)
            if (i > 200 && i < 250) segment.hill = Math.sin((i - 200) / 50 * Math.PI) * 400;
            if (i > 350 && i < 400) segment.hill = Math.sin((i - 350) / 50 * Math.PI) * 300;

            gameState.segments.push(segment);
        }

        gameState.trackLength = totalSegments * SEGMENT_LENGTH;
    }

    function spawnCars() {
        gameState.cars = [];
        const carCount = gameState.phase === 'qualifying' ? 8 : 15;

        for (let i = 0; i < carCount; i++) {
            // Spawn cars ahead of player, spread out across track
            gameState.cars.push({
                offset: (Math.random() * 1.6 - 0.8), // -0.8 to 0.8 (within road bounds)
                z: gameState.position + 2000 + (i * 3000), // Spread cars far ahead
                speed: 80 + Math.random() * 40, // Slower than player for passing
                color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)],
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
        p.screen.scale = gameState.cameraDepth / p.camera.z;
        p.screen.x = Math.round((CANVAS_WIDTH / 2) + (p.screen.scale * p.camera.x * CANVAS_WIDTH / 2));
        p.screen.y = Math.round((CANVAS_HEIGHT / 2) - (p.screen.scale * p.camera.y * CANVAS_HEIGHT / 2));
        p.screen.w = Math.round(p.screen.scale * ROAD_WIDTH * CANVAS_WIDTH / 2);
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

        // Handle crash timer (disabled - causing freezing issues)
        // if (gameState.crashed) {
        //     gameState.crashTimer--;
        //     if (gameState.crashTimer <= 0) {
        //         gameState.crashed = false;
        //     }
        //     return;
        // }
        gameState.crashed = false; // Always reset crash state

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

            // Check collision with player (disabled - was causing car to freeze)
            // const relativeZ = car.z - gameState.position;
            // if (Math.abs(relativeZ) < 80 && relativeZ > 0 && gameState.speed > 50) {
            //     if (Math.abs(car.offset - gameState.playerX) < 0.25) {
            //         // Collision!
            //         gameState.crashed = true;
            //         gameState.crashTimer = 20;
            //         gameState.speed = Math.max(gameState.speed * 0.7, 50);
            //     }
            // }

            const relativeZ = car.z - gameState.position;

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

        // Clear sky
        ctx.fillStyle = '#72d7ee';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw horizon
        ctx.fillStyle = '#5cb85c';
        ctx.fillRect(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2);

        const baseSegment = findSegment(gameState.position);
        const basePercent = (gameState.position % SEGMENT_LENGTH) / SEGMENT_LENGTH;
        const playerSegment = findSegment(gameState.position + gameState.playerZ);
        const playerY = playerSegment.p1.world.y + (playerSegment.p2.world.y - playerSegment.p1.world.y) * basePercent;

        const maxY = CANVAS_HEIGHT;

        let x = 0;
        let dx = 0;

        // Render road segments
        const drawDistance = 300;
        for (let n = 0; n < drawDistance; n++) {
            const segment = gameState.segments[(baseSegment.index + n) % gameState.segments.length];

            segment.p1.world.y = segment.hill;
            segment.p2.world.y = gameState.segments[(segment.index + 1) % gameState.segments.length].hill;

            project(segment.p1, gameState.playerX * ROAD_WIDTH, playerY + gameState.cameraHeight, gameState.position);
            project(segment.p2, gameState.playerX * ROAD_WIDTH, playerY + gameState.cameraHeight, gameState.position);

            x += dx;
            dx += segment.curve;

            if (segment.p1.camera.z <= gameState.cameraDepth) continue;
            if (segment.p2.screen.y >= segment.p1.screen.y) continue;
            if (segment.p2.screen.y >= maxY) continue;

            // Draw road
            const rumble = segment.color === 'dark';
            const roadColor = rumble ? '#555' : '#777';
            const grassColor = rumble ? '#10aa10' : '#16bf16';
            const lineColor = rumble ? '#fff' : '#fff';

            // Grass
            ctx.fillStyle = grassColor;
            ctx.fillRect(0, segment.p2.screen.y, CANVAS_WIDTH, segment.p1.screen.y - segment.p2.screen.y);

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

            // Side lines
            drawTrapezoid(ctx,
                segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y, lineW1 * 3,
                segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y, lineW2 * 3,
                '#ff0000'
            );
            drawTrapezoid(ctx,
                segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y, lineW1 * 3,
                segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y, lineW2 * 3,
                '#ff0000'
            );

            // Store cars that are on this segment for later rendering
            segment.carsOnSegment = [];
        }

        // After all segments are drawn, draw cars on top
        gameState.cars.forEach(car => {
            const carSprite = {
                world: { x: car.offset * ROAD_WIDTH, y: 0, z: car.z },
                camera: {},
                screen: {}
            };
            project(carSprite, gameState.playerX * ROAD_WIDTH, playerY + gameState.cameraHeight, gameState.position);

            // Only draw if car is in front of camera and visible
            if (carSprite.camera.z > gameState.cameraDepth && carSprite.camera.z < gameState.position + drawDistance * SEGMENT_LENGTH) {
                const carW = Math.max(carSprite.screen.scale * 100, 2);
                const carH = Math.max(carSprite.screen.scale * 60, 2);

                // Draw car body
                ctx.fillStyle = car.color;
                ctx.fillRect(
                    carSprite.screen.x - carW / 2,
                    carSprite.screen.y - carH,
                    carW,
                    carH
                );

                // Draw car windows (for visibility)
                ctx.fillStyle = '#333';
                ctx.fillRect(
                    carSprite.screen.x - carW / 3,
                    carSprite.screen.y - carH + carH * 0.2,
                    carW * 0.66,
                    carH * 0.4
                );
            }
        });

        // Draw player car
        const playerCarY = CANVAS_HEIGHT - 100;
        const playerCarX = CANVAS_WIDTH / 2;

        ctx.fillStyle = gameState.crashed ? '#666' : '#ff0000';
        ctx.fillRect(playerCarX - 30, playerCarY - 40, 60, 40);
        ctx.fillStyle = '#fff';
        ctx.fillRect(playerCarX - 20, playerCarY - 35, 15, 15);
        ctx.fillRect(playerCarX + 5, playerCarY - 35, 15, 15);

        // Draw HUD
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 80);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';

        if (gameState.phase === 'qualifying') {
            ctx.fillText(`QUALIFYING LAP`, 20, 30);
            ctx.fillText(`TIME: ${Math.ceil(gameState.time)}s`, 20, 60);
        } else {
            ctx.fillText(`RACE - Lap ${gameState.checkpointsPassed + 1}`, 20, 30);
            ctx.fillText(`TIME: ${Math.ceil(gameState.time)}s`, 20, 60);
        }

        ctx.textAlign = 'right';
        ctx.fillText(`SPEED: ${Math.round(gameState.speed)} km/h`, CANVAS_WIDTH - 20, 30);
        ctx.fillText(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 60);

        // Gear indicator
        ctx.textAlign = 'center';
        ctx.fillText(`GEAR: ${gameState.gear.toUpperCase()}`, CANVAS_WIDTH / 2, 60);

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
