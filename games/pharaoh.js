// Pharaoh's Curse - Classic 1983 platformer adventure
(function() {
    let gameCanvas, ctx;
    let gameState = 'menu'; // menu, playing, gameOver, victory
    let player;
    let currentRoom;
    let rooms = [];
    let enemies = [];
    let treasures = [];
    let lives = 3;
    let score = 0;
    let treasuresCollected = 0;
    let keysHeld = 0;
    let animationId;
    let level = 1;
    let password = '';

    const GAME_WIDTH = 640;
    const GAME_HEIGHT = 480;
    const PLAYER_WIDTH = 16;
    const PLAYER_HEIGHT = 24;
    const GRAVITY = 0.6;
    const WALK_SPEED = 2;
    const RUN_SPEED = 3.5;
    const JUMP_POWER = -10;
    const RUN_THRESHOLD = 15; // frames walking same direction to start running

    // Colors matching original
    const COLOR_BLACK = '#000000';
    const COLOR_GOLD = '#d4a76a';
    const COLOR_BLUE = '#4169e1';
    const COLOR_WHITE = '#ffffff';
    const COLOR_RED = '#ff0000';

    // Room grid layout (4x4)
    const ROOM_GRID_WIDTH = 4;
    const ROOM_GRID_HEIGHT = 4;

    // Player object
    function createPlayer() {
        return {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            onGround: false,
            facing: 'right',
            running: false,
            runFrames: 0,
            climbing: false,
            shooting: false,
            shootCooldown: 0
        };
    }

    // Create room with platforms and ladders
    function createRoom(gridX, gridY, hasTreasure, hasKey, hasDoor) {
        const platforms = [];
        const ladders = [];

        // Ground - irregular bottom
        platforms.push({ x: 0, y: 440, width: GAME_WIDTH, height: 40, irregular: true });

        // Generate cave-like platforms for this room
        if ((gridX + gridY) % 2 === 0) {
            // Pattern 1 - stepped platforms
            platforms.push({ x: 10, y: 360, width: 180, height: 80, irregular: true });
            platforms.push({ x: 450, y: 360, width: 180, height: 80, irregular: true });
            platforms.push({ x: 200, y: 240, width: 240, height: 60, irregular: true });
            platforms.push({ x: 60, y: 120, width: 160, height: 50, irregular: true });
            platforms.push({ x: 420, y: 120, width: 160, height: 50, irregular: true });

            ladders.push({ x: 120, y: 300, height: 60 });
            ladders.push({ x: 320, y: 180, height: 60 });
            ladders.push({ x: 500, y: 300, height: 60 });
        } else {
            // Pattern 2 - offset platforms
            platforms.push({ x: 40, y: 320, width: 140, height: 70, irregular: true });
            platforms.push({ x: 460, y: 320, width: 140, height: 70, irregular: true });
            platforms.push({ x: 250, y: 200, width: 140, height: 60, irregular: true });
            platforms.push({ x: 80, y: 80, width: 200, height: 50, irregular: true });
            platforms.push({ x: 360, y: 80, width: 200, height: 50, irregular: true });

            ladders.push({ x: 90, y: 260, height: 60 });
            ladders.push({ x: 310, y: 140, height: 60 });
            ladders.push({ x: 510, y: 260, height: 60 });
        }

        return {
            gridX,
            gridY,
            platforms,
            ladders,
            hasTreasure,
            hasKey,
            hasDoor,
            visited: false,
            treasureX: GAME_WIDTH / 2,
            treasureY: 100,
            keyX: 200,
            keyY: 250,
            doorX: 550,
            doorY: 400
        };
    }

    // Create all rooms
    function initRooms() {
        rooms = [];

        // Distribute 16 treasures across all rooms
        let treasureRooms = Array.from({length: 16}, (_, i) => i);

        // Distribute 5 keys across various rooms
        let keyRooms = [2, 5, 8, 11, 14];

        // Some rooms have locked doors
        let doorRooms = [3, 6, 9, 12, 15];

        for (let y = 0; y < ROOM_GRID_HEIGHT; y++) {
            for (let x = 0; x < ROOM_GRID_WIDTH; x++) {
                const roomIndex = y * ROOM_GRID_WIDTH + x;
                const hasTreasure = treasureRooms.includes(roomIndex);
                const hasKey = keyRooms.includes(roomIndex);
                const hasDoor = doorRooms.includes(roomIndex);

                rooms.push(createRoom(x, y, hasTreasure, hasKey, hasDoor));
            }
        }
    }

    // Get current room
    function getCurrentRoom() {
        return rooms.find(r => r.gridX === currentRoom.x && r.gridY === currentRoom.y);
    }

    // Initialize game
    function initGame(startLevel = 1) {
        level = startLevel;
        player = createPlayer();
        currentRoom = { x: 0, y: 3 }; // Start at bottom-left
        lives = 3;
        score = 0;
        treasuresCollected = 0;
        keysHeld = 0;

        initRooms();
        spawnEnemies();

        gameState = 'playing';
        gameLoop();
    }

    // Spawn enemies in current room
    function spawnEnemies() {
        enemies = [];

        // Add mummy
        if (Math.random() < 0.6) {
            enemies.push({
                type: 'mummy',
                x: 200 + Math.random() * 400,
                y: 520,
                vx: 2,
                vy: 0,
                shootCooldown: 0,
                onGround: false
            });
        }

        // Add pharaoh
        if (Math.random() < 0.4) {
            enemies.push({
                type: 'pharaoh',
                x: 300 + Math.random() * 300,
                y: 520,
                vx: -2,
                vy: 0,
                shootCooldown: 0,
                onGround: false
            });
        }

        // Add winged avenger
        if (Math.random() < 0.5) {
            enemies.push({
                type: 'winged',
                x: Math.random() * GAME_WIDTH,
                y: 100 + Math.random() * 200,
                angle: Math.random() * Math.PI * 2,
                speed: 2,
                grabbing: false,
                grabTimer: 0
            });
        }
    }

    // Update game state
    function update() {
        if (gameState !== 'playing') return;

        const room = getCurrentRoom();

        // Update player
        updatePlayer(room);

        // Update enemies
        updateEnemies(room);

        // Check room transitions
        checkRoomTransition();

        // Check collisions
        checkCollisions(room);

        // Update shooting cooldown
        if (player.shootCooldown > 0) player.shootCooldown--;
    }

    // Update player
    function updatePlayer(room) {
        // Apply gravity
        if (!player.climbing) {
            player.vy += GRAVITY;
        }

        // Update position
        player.x += player.vx;
        player.y += player.vy;

        // Check platform collisions
        player.onGround = false;
        for (let platform of room.platforms) {
            if (player.x + PLAYER_WIDTH > platform.x &&
                player.x < platform.x + platform.width &&
                player.y + PLAYER_HEIGHT > platform.y &&
                player.y + PLAYER_HEIGHT < platform.y + 20 &&
                player.vy >= 0) {

                player.y = platform.y - PLAYER_HEIGHT;
                player.vy = 0;
                player.onGround = true;
                player.climbing = false;
            }
        }

        // Check ladder collisions
        let onLadder = false;
        for (let ladder of room.ladders) {
            if (player.x + PLAYER_WIDTH / 2 > ladder.x - 10 &&
                player.x + PLAYER_WIDTH / 2 < ladder.x + 10 &&
                player.y + PLAYER_HEIGHT > ladder.y &&
                player.y < ladder.y + ladder.height) {

                onLadder = true;

                if (keys.up && player.y > ladder.y) {
                    player.climbing = true;
                    player.vy = -3;
                    player.vx = 0;
                } else if (keys.down && player.y + PLAYER_HEIGHT < ladder.y + ladder.height) {
                    player.climbing = true;
                    player.vy = 3;
                    player.vx = 0;
                } else if (player.climbing) {
                    // Stop vertical movement if climbing but not pressing up/down
                    player.vy = 0;
                }
                break;
            }
        }

        // If not on any ladder, stop climbing
        if (!onLadder && player.climbing) {
            player.climbing = false;
        }

        // Keep player in bounds
        if (player.x < 0) player.x = 0;
        if (player.x > GAME_WIDTH - PLAYER_WIDTH) player.x = GAME_WIDTH - PLAYER_WIDTH;
        if (player.y > GAME_HEIGHT) {
            loseLife();
        }
    }

    // Update enemies
    function updateEnemies(room) {
        for (let enemy of enemies) {
            if (enemy.type === 'mummy' || enemy.type === 'pharaoh') {
                // Apply gravity
                enemy.vy += GRAVITY;

                // Move
                enemy.x += enemy.vx;
                enemy.y += enemy.vy;

                // Platform collisions
                enemy.onGround = false;
                for (let platform of room.platforms) {
                    if (enemy.x + 30 > platform.x &&
                        enemy.x < platform.x + platform.width &&
                        enemy.y + 40 > platform.y &&
                        enemy.y + 40 < platform.y + 20 &&
                        enemy.vy >= 0) {

                        enemy.y = platform.y - 40;
                        enemy.vy = 0;
                        enemy.onGround = true;
                    }
                }

                // Reverse direction at edges or randomly
                if (enemy.x < 0 || enemy.x > GAME_WIDTH - 30 || Math.random() < 0.01) {
                    enemy.vx = -enemy.vx;
                }

                // Shoot at player occasionally
                if (enemy.shootCooldown > 0) {
                    enemy.shootCooldown--;
                } else if (Math.random() < 0.02) {
                    enemy.shootCooldown = 60;
                    // Would create bullet here
                }

            } else if (enemy.type === 'winged') {
                // Winged avenger flies in circular pattern
                enemy.angle += 0.03;
                enemy.x += Math.cos(enemy.angle) * enemy.speed;
                enemy.y += Math.sin(enemy.angle) * enemy.speed;

                // Keep in bounds
                if (enemy.x < 50) enemy.x = 50;
                if (enemy.x > GAME_WIDTH - 50) enemy.x = GAME_WIDTH - 50;
                if (enemy.y < 50) enemy.y = 50;
                if (enemy.y > 400) enemy.y = 400;

                // Check if grabbing player
                const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                if (dist < 50 && !enemy.grabbing) {
                    enemy.grabbing = true;
                    enemy.grabTimer = 60;
                }

                if (enemy.grabbing) {
                    // Move player toward winged avenger
                    player.x += (enemy.x - player.x) * 0.1;
                    player.y += (enemy.y - player.y) * 0.1;

                    enemy.grabTimer--;
                    if (enemy.grabTimer <= 0) {
                        // Teleport player to random room
                        currentRoom.x = Math.floor(Math.random() * ROOM_GRID_WIDTH);
                        currentRoom.y = Math.floor(Math.random() * ROOM_GRID_HEIGHT);
                        player.x = GAME_WIDTH / 2;
                        player.y = GAME_HEIGHT / 2;
                        keysHeld = 0; // Lose all keys!
                        spawnEnemies();
                        enemy.grabbing = false;
                    }
                }
            }
        }
    }

    // Check room transitions
    function checkRoomTransition() {
        let moved = false;

        if (player.x < 0 && currentRoom.x > 0) {
            currentRoom.x--;
            player.x = GAME_WIDTH - PLAYER_WIDTH;
            moved = true;
        } else if (player.x > GAME_WIDTH - PLAYER_WIDTH && currentRoom.x < ROOM_GRID_WIDTH - 1) {
            currentRoom.x++;
            player.x = 0;
            moved = true;
        }

        if (player.y < 0 && currentRoom.y > 0) {
            currentRoom.y--;
            player.y = GAME_HEIGHT - PLAYER_HEIGHT;
            moved = true;
        }

        if (moved) {
            spawnEnemies();
            const room = getCurrentRoom();
            room.visited = true;
        }
    }

    // Check collisions with treasures, keys, etc.
    function checkCollisions(room) {
        // Check treasure
        if (room.hasTreasure) {
            const dist = Math.hypot(player.x - room.treasureX, player.y - room.treasureY);
            if (dist < 40) {
                room.hasTreasure = false;
                treasuresCollected++;
                lives++; // Gain extra life
                score += 100;

                if (treasuresCollected >= 16) {
                    victory();
                }
            }
        }

        // Check key
        if (room.hasKey) {
            const dist = Math.hypot(player.x - room.keyX, player.y - room.keyY);
            if (dist < 40) {
                room.hasKey = false;
                keysHeld++;
                score += 50;
            }
        }

        // Check door
        if (room.hasDoor) {
            const dist = Math.hypot(player.x - room.doorX, player.y - room.doorY);
            if (dist < 40 && keysHeld > 0) {
                room.hasDoor = false;
                keysHeld--;
                score += 75;
            }
        }

        // Check enemy collisions
        for (let enemy of enemies) {
            if (enemy.type !== 'winged' || !enemy.grabbing) {
                const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
                if (dist < 40) {
                    loseLife();
                }
            }
        }
    }

    // Lose a life
    function loseLife() {
        lives--;
        keysHeld = 0; // Lose all keys

        if (lives <= 0) {
            gameOver();
        } else {
            // Respawn at start
            currentRoom.x = 0;
            currentRoom.y = 3;
            player.x = 100;
            player.y = 400;
            player.vx = 0;
            player.vy = 0;
            spawnEnemies();
        }
    }

    // Game over
    function gameOver() {
        gameState = 'gameOver';
        cancelAnimationFrame(animationId);
    }

    // Victory
    function victory() {
        gameState = 'victory';

        // Generate password for next level
        if (level === 1) {
            password = 'PYRAMID';
        } else if (level === 2) {
            password = 'SPHINX';
        }

        cancelAnimationFrame(animationId);
    }

    // Draw game
    function draw() {
        // Clear canvas - black background
        ctx.fillStyle = COLOR_BLACK;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (gameState === 'menu') {
            drawMenu();
        } else if (gameState === 'playing') {
            drawBorders();
            drawRoom();
            drawPlayer();
            drawEnemies();
            drawHUD();
        } else if (gameState === 'gameOver') {
            drawGameOver();
        } else if (gameState === 'victory') {
            drawVictory();
        }
    }

    // Draw side borders
    function drawBorders() {
        ctx.fillStyle = COLOR_BLUE;
        // Left border
        for (let y = 0; y < GAME_HEIGHT; y += 8) {
            ctx.fillRect(0, y, 8, 4);
        }
        // Right border
        for (let y = 0; y < GAME_HEIGHT; y += 8) {
            ctx.fillRect(GAME_WIDTH - 8, y, 8, 4);
        }
    }

    // Draw room with irregular cave-like platforms
    function drawRoom() {
        const room = getCurrentRoom();

        // Draw platforms with irregular edges
        ctx.fillStyle = COLOR_GOLD;
        for (let platform of room.platforms) {
            if (platform.irregular) {
                // Draw platform with jagged top edge
                ctx.beginPath();
                ctx.moveTo(platform.x, platform.y + platform.height);

                // Bottom edge (straight)
                ctx.lineTo(platform.x + platform.width, platform.y + platform.height);
                ctx.lineTo(platform.x + platform.width, platform.y);

                // Top edge (jagged)
                for (let x = platform.x + platform.width; x >= platform.x; x -= 8) {
                    const jag = Math.random() * 6 - 3;
                    ctx.lineTo(x, platform.y + jag);
                }

                ctx.closePath();
                ctx.fill();

                // Add dotted outline for depth
                ctx.strokeStyle = '#b8925a';
                ctx.setLineDash([2, 2]);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            }
        }

        // Draw ladders - simple pixel style
        ctx.fillStyle = COLOR_GOLD;
        for (let ladder of room.ladders) {
            // Draw as simple vertical bars with rungs
            for (let y = 0; y < ladder.height; y += 8) {
                // Left rail
                ctx.fillRect(ladder.x - 3, ladder.y + y, 2, 8);
                // Right rail
                ctx.fillRect(ladder.x + 1, ladder.y + y, 2, 8);
                // Rung
                if (y % 16 === 0) {
                    ctx.fillRect(ladder.x - 3, ladder.y + y + 3, 6, 2);
                }
            }
        }

        // Draw treasure - simple pixel square
        if (room.hasTreasure) {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(room.treasureX - 6, room.treasureY - 6, 12, 12);
            ctx.fillStyle = COLOR_GOLD;
            ctx.fillRect(room.treasureX - 4, room.treasureY - 4, 8, 8);
        }

        // Draw key - simple pixel key
        if (room.hasKey) {
            ctx.fillStyle = COLOR_WHITE;
            ctx.fillRect(room.keyX - 2, room.keyY - 6, 4, 12);
            ctx.fillRect(room.keyX - 6, room.keyY - 6, 8, 4);
        }

        // Draw door - simple pixel door
        if (room.hasDoor) {
            ctx.fillStyle = '#8b6914';
            ctx.fillRect(room.doorX - 12, room.doorY - 32, 24, 32);
            ctx.fillStyle = COLOR_BLACK;
            ctx.fillRect(room.doorX - 8, room.doorY - 28, 16, 24);
        }
    }

    // Draw player - simple pixel sprite
    function drawPlayer() {
        ctx.fillStyle = COLOR_WHITE;

        // Body (simple stick figure style)
        ctx.fillRect(player.x + 6, player.y, 4, 8); // Head
        ctx.fillRect(player.x + 6, player.y + 8, 4, 12); // Body
        ctx.fillRect(player.x + 2, player.y + 10, 12, 2); // Arms
        ctx.fillRect(player.x + 4, player.y + 20, 3, 4); // Left leg
        ctx.fillRect(player.x + 9, player.y + 20, 3, 4); // Right leg
    }

    // Draw enemies - simple pixel sprites
    function drawEnemies() {
        for (let enemy of enemies) {
            if (enemy.type === 'mummy') {
                // Simple white mummy sprite
                ctx.fillStyle = COLOR_WHITE;
                ctx.fillRect(enemy.x + 6, enemy.y, 4, 8); // Head
                ctx.fillRect(enemy.x + 4, enemy.y + 8, 8, 12); // Body
                ctx.fillRect(enemy.x + 4, enemy.y + 20, 3, 4); // Left leg
                ctx.fillRect(enemy.x + 9, enemy.y + 20, 3, 4); // Right leg

                // Red eyes
                ctx.fillStyle = COLOR_RED;
                ctx.fillRect(enemy.x + 6, enemy.y + 3, 1, 1);
                ctx.fillRect(enemy.x + 9, enemy.y + 3, 1, 1);

            } else if (enemy.type === 'pharaoh') {
                // Gold pharaoh sprite
                ctx.fillStyle = COLOR_GOLD;
                ctx.fillRect(enemy.x + 5, enemy.y - 4, 6, 4); // Crown
                ctx.fillRect(enemy.x + 6, enemy.y, 4, 8); // Head
                ctx.fillRect(enemy.x + 4, enemy.y + 8, 8, 12); // Body
                ctx.fillRect(enemy.x + 4, enemy.y + 20, 3, 4); // Left leg
                ctx.fillRect(enemy.x + 9, enemy.y + 20, 3, 4); // Right leg

            } else if (enemy.type === 'winged') {
                // Winged avenger - flying creature
                ctx.fillStyle = '#8b008b';
                ctx.fillRect(enemy.x - 4, enemy.y - 4, 8, 8); // Body

                // Wings (simple)
                const wingFlap = Math.sin(Date.now() / 100) > 0 ? 2 : 0;
                ctx.fillRect(enemy.x - 12, enemy.y - 2 + wingFlap, 6, 2); // Left wing
                ctx.fillRect(enemy.x + 6, enemy.y - 2 + wingFlap, 6, 2); // Right wing
            }
        }
    }

    // Draw HUD - matching original style
    function drawHUD() {
        ctx.fillStyle = COLOR_WHITE;
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';

        // Lives (hearts)
        for (let i = 0; i < lives && i < 5; i++) {
            ctx.fillRect(20 + (i * 12), 10, 8, 8);
        }

        // Score
        ctx.textAlign = 'right';
        ctx.fillText(String(score).padStart(4, '0'), GAME_WIDTH - 20, 20);

        // Treasures/Keys at bottom
        ctx.textAlign = 'left';
        ctx.fillText(`T:${treasuresCollected}`, 20, GAME_HEIGHT - 10);
        ctx.fillText(`K:${keysHeld}`, 80, GAME_HEIGHT - 10);
    }

    // Draw menu
    function drawMenu() {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("👑 PHARAOH'S CURSE", GAME_WIDTH / 2, 100);

        ctx.font = '20px Arial';
        ctx.fillText('Collect all 16 treasures from the pyramid!', GAME_WIDTH / 2, 180);
        ctx.fillText('Avoid the mummy, pharaoh, and winged avenger', GAME_WIDTH / 2, 210);
        ctx.fillText('Collect keys to unlock doors', GAME_WIDTH / 2, 240);
        ctx.fillText('Gain 1 life per treasure collected', GAME_WIDTH / 2, 270);

        ctx.font = '18px Arial';
        ctx.fillText('Arrow Keys: Move', GAME_WIDTH / 2, 330);
        ctx.fillText('Up/Down: Climb ladders', GAME_WIDTH / 2, 355);
        ctx.fillText('Space: Jump (requires running start!)', GAME_WIDTH / 2, 380);

        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('PRESS SPACE TO START', GAME_WIDTH / 2, 480);

        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Level 1 - The Entrance', GAME_WIDTH / 2, 530);
    }

    // Draw game over
    function drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

        ctx.font = '32px Arial';
        ctx.fillText(`Final Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
        ctx.fillText(`Treasures: ${treasuresCollected}/16`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('PRESS SPACE TO RETRY', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140);
    }

    // Draw victory
    function drawVictory() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);

        ctx.fillStyle = 'white';
        ctx.font = '32px Arial';
        ctx.fillText(`Level ${level} Complete!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
        ctx.fillText(`Final Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);

        if (level < 3) {
            ctx.font = '24px Arial';
            ctx.fillText(`Password for Level ${level + 1}: ${password}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);

            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('PRESS SPACE FOR NEXT LEVEL', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140);
        } else {
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('YOU ESCAPED THE CURSE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
        }
    }

    // Game loop
    function gameLoop() {
        update();
        draw();

        if (gameState === 'playing') {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    // Input handling
    const keys = {};

    function handleKeyDown(e) {
        keys[e.key.toLowerCase()] = true;
        keys.up = keys['arrowup'] || keys['w'];
        keys.down = keys['arrowdown'] || keys['s'];
        keys.left = keys['arrowleft'] || keys['a'];
        keys.right = keys['arrowright'] || keys['d'];

        if (gameState === 'menu' && e.code === 'Space') {
            initGame(1);
        } else if (gameState === 'gameOver' && e.code === 'Space') {
            initGame(level);
        } else if (gameState === 'victory' && e.code === 'Space') {
            if (level < 3) {
                initGame(level + 1);
            } else {
                gameState = 'menu';
                draw();
            }
        } else if (gameState === 'playing') {
            // Player movement
            if (keys.left) {
                player.vx = -WALK_SPEED;
                if (player.facing === 'left') {
                    player.runFrames++;
                } else {
                    player.runFrames = 0;
                }
                player.facing = 'left';
            } else if (keys.right) {
                player.vx = WALK_SPEED;
                if (player.facing === 'right') {
                    player.runFrames++;
                } else {
                    player.runFrames = 0;
                }
                player.facing = 'right';
            } else {
                player.vx = 0;
                player.runFrames = 0;
            }

            // Running
            if (player.runFrames > RUN_THRESHOLD) {
                player.running = true;
                player.vx = player.facing === 'left' ? -RUN_SPEED : RUN_SPEED;
            } else {
                player.running = false;
            }

            // Jumping (requires running)
            if (e.code === 'Space' && player.running && player.onGround) {
                player.vy = JUMP_POWER;
            }
        }
    }

    function handleKeyUp(e) {
        const key = e.key.toLowerCase();
        keys[key] = false;
        keys.up = keys['arrowup'] || keys['w'];
        keys.down = keys['arrowdown'] || keys['s'];
        keys.left = keys['arrowleft'] || keys['a'];
        keys.right = keys['arrowright'] || keys['d'];

        if (key === 'arrowleft' || key === 'a' || key === 'arrowright' || key === 'd') {
            if (!keys.left && !keys.right) {
                player.vx = 0;
                player.runFrames = 0;
                player.running = false;
            }
        }
    }

    // Launch game
    window.launchPharaoh = function() {
        const content = document.getElementById('pharaohContent');

        content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <canvas id="pharaohCanvas" width="${GAME_WIDTH}" height="${GAME_HEIGHT}" style="
                    border: 4px solid #8b4513;
                    border-radius: 10px;
                    max-width: 100%;
                    height: auto;
                    background: #1a0f0a;
                "></canvas>

                <div style="text-align: center; color: #666;">
                    <p style="margin: 0.5rem 0;">⚠️ Hold arrow keys to build momentum and run</p>
                    <p style="margin: 0.5rem 0;">🏃 Press Space while running to jump!</p>
                    <p style="margin: 0.5rem 0;">🪜 Use Up/Down arrows to climb ladders</p>
                </div>
            </div>
        `;

        // Show game section
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('pharaohGame').style.display = 'block';

        // Initialize canvas
        gameCanvas = document.getElementById('pharaohCanvas');
        ctx = gameCanvas.getContext('2d');

        gameState = 'menu';
        draw();

        // Event listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    };

    // Exit to menu
    window.exitPharaohToMenu = function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        document.getElementById('pharaohGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };
})();
