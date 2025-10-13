// Trouble Board Game - Research-based implementation
(function() {
    'use strict';

    // Based on official Trouble rules research:
    // - 16 space circular track
    // - 4 players max (Red, Blue, Yellow, Green)
    // - 4 pegs per player
    // - 4-space finish lane per player
    // - Must roll 6 to start
    // - Rolling 6 gives extra turn

    const COLORS = ['red', 'blue', 'yellow', 'green'];
    const COLOR_CODES = {
        red: '#DC143C',
        blue: '#4169E1',
        yellow: '#FFD700',
        green: '#32CD32'
    };
    const TRACK_SPACES = 16; // Standard Trouble board has 16 spaces
    const FINISH_SPACES = 4;  // 4 protected finish spaces per player

    let gameState = {
        numPlayers: 2,
        mode: 'passAndPlay',
        currentPlayer: 0,
        players: [],
        dieValue: null,
        gameOver: false,
        winner: null,
        hasExtraTurn: false,
        message: ''
    };

    // Player start positions on 16-space track
    // Red=0, Blue=4, Yellow=8, Green=12
    function getStartPosition(playerIndex) {
        return playerIndex * 4;
    }

    // Finish entry is 1 space before start (wrapping around)
    function getFinishEntry(playerIndex) {
        return (getStartPosition(playerIndex) - 1 + TRACK_SPACES) % TRACK_SPACES;
    }

    function initializePlayers(numPlayers, mode) {
        const players = [];
        for (let i = 0; i < numPlayers; i++) {
            players.push({
                color: COLORS[i],
                name: COLORS[i].charAt(0).toUpperCase() + COLORS[i].slice(1),
                isAI: mode === 'vsComputer' && i > 0,
                pegs: [
                    { location: 'home', position: 0 },
                    { location: 'home', position: 0 },
                    { location: 'home', position: 0 },
                    { location: 'home', position: 0 }
                ]
            });
        }
        return players;
    }

    // Main game launcher
    window.launchTrouble = function() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('troubleGame').style.display = 'block';
        showSetup();
    };

    window.exitTrouble = function() {
        document.getElementById('troubleGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

    function showSetup() {
        const content = document.getElementById('troubleContent');
        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <button onclick="exitTrouble()" style="position: absolute; top: 1rem; left: 1rem; background: #6c757d; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                    ← Back
                </button>

                <h2 style="margin-bottom: 1rem; font-size: 2rem;">🎲 Trouble!</h2>
                <p style="color: #666; margin-bottom: 2rem;">Pop the bubble and race your pegs home!</p>

                <div style="background: #f8f9fa; padding: 2rem; border-radius: 12px; max-width: 400px; margin: 0 auto 2rem;">
                    <h3 style="margin-bottom: 1rem;">Number of Players</h3>
                    <div style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2rem;">
                        ${[2, 3, 4].map(n => `
                            <button onclick="setPlayerCount(${n})"
                                style="background: ${gameState.numPlayers === n ? '#4CAF50' : '#e0e0e0'};
                                color: ${gameState.numPlayers === n ? 'white' : '#333'};
                                border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold;">
                                ${n}
                            </button>
                        `).join('')}
                    </div>

                    <h3 style="margin-bottom: 1rem;">Game Mode</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 300px; margin: 0 auto;">
                        <button onclick="setGameMode('passAndPlay')"
                            style="background: ${gameState.mode === 'passAndPlay' ? '#2196F3' : '#e0e0e0'};
                            color: ${gameState.mode === 'passAndPlay' ? 'white' : '#333'};
                            border: none; padding: 1rem; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            👥 Pass & Play
                        </button>
                        <button onclick="setGameMode('vsComputer')"
                            style="background: ${gameState.mode === 'vsComputer' ? '#2196F3' : '#e0e0e0'};
                            color: ${gameState.mode === 'vsComputer' ? 'white' : '#333'};
                            border: none; padding: 1rem; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            🤖 vs Computer
                        </button>
                    </div>
                </div>

                <button onclick="startGame()"
                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold;">
                    Start Game
                </button>

                <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 1rem; border-radius: 8px; margin-top: 2rem; max-width: 500px; margin-left: auto; margin-right: auto;">
                    <h4 style="margin-bottom: 0.5rem;">📜 Quick Rules</h4>
                    <ul style="text-align: left; font-size: 0.9rem; color: #666; line-height: 1.6;">
                        <li>Roll a <strong>6</strong> to move a peg from Home to Start</li>
                        <li>Rolling 6 gives you an <strong>extra turn</strong></li>
                        <li>Land on opponents to send them back to Home</li>
                        <li>First to get all 4 pegs to Finish wins!</li>
                    </ul>
                </div>
            </div>
        `;
    }

    window.setPlayerCount = function(count) {
        gameState.numPlayers = count;
        showSetup();
    };

    window.setGameMode = function(mode) {
        gameState.mode = mode;
        showSetup();
    };

    window.startGame = function() {
        gameState.players = initializePlayers(gameState.numPlayers, gameState.mode);
        gameState.currentPlayer = 0;
        gameState.dieValue = null;
        gameState.gameOver = false;
        gameState.winner = null;
        gameState.hasExtraTurn = false;
        gameState.message = 'Pop the die to start!';
        showBoard();
    };

    function showBoard() {
        const content = document.getElementById('troubleContent');
        const player = gameState.players[gameState.currentPlayer];

        content.innerHTML = `
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                }
                .peg-pulse {
                    animation: pulse 0.8s ease-in-out infinite;
                }
                @keyframes pop-animation {
                    0% { transform: scale(1); }
                    50% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }
                .pop-button:active {
                    animation: pop-animation 0.2s ease;
                }
            </style>

            <div style="text-align: center; padding: 1rem;">
                <button onclick="exitTrouble()" style="position: absolute; top: 1rem; left: 1rem; background: #6c757d; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                    ← Back
                </button>

                <h2 style="margin-bottom: 0.5rem;">🎲 Trouble</h2>

                <div style="background: linear-gradient(135deg, ${COLOR_CODES[player.color]}22 0%, ${COLOR_CODES[player.color]}44 100%); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; border: 2px solid ${COLOR_CODES[player.color]};">
                    <div style="font-weight: bold; color: ${COLOR_CODES[player.color]}; font-size: 1.2rem;">
                        ${player.name}'s Turn ${player.isAI ? '(AI)' : ''}
                    </div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 0.25rem;">
                        ${gameState.message}
                    </div>
                </div>

                ${renderBoard()}

                <div style="margin-top: 1.5rem;">
                    ${gameState.dieValue === null ? `
                        <button onclick="rollDie()" class="pop-button"
                            style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; padding: 1.5rem; border-radius: 50%; cursor: pointer; font-size: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.3); width: 100px; height: 100px; position: relative;">
                            <div style="font-size: 2.5rem;">🎲</div>
                            <div style="font-size: 0.7rem; font-weight: bold; margin-top: -5px;">POP!</div>
                        </button>
                    ` : `
                        <div style="display: inline-block; background: white; border: 4px solid #e74c3c; padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                            <div style="font-size: 3rem; font-weight: bold; color: #e74c3c;">${gameState.dieValue}</div>
                        </div>
                    `}
                </div>

                ${renderPlayerStatus()}
            </div>
        `;

        if (gameState.gameOver) {
            showWinScreen();
        }
    }

    function renderBoard() {
        const size = Math.min(400, window.innerWidth - 40);
        return `
            <div style="max-width: ${size}px; margin: 0 auto;">
                <svg width="${size}" height="${size}" viewBox="0 0 100 100"
                    style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                    ${renderBoardSVG()}
                </svg>
            </div>
        `;
    }

    function renderBoardSVG() {
        let svg = '';

        // Draw colored quadrants
        const quadrants = [
            { path: 'M 50,50 L 0,50 L 0,0 L 50,0 Z', color: COLOR_CODES.red },    // Top-left: Red
            { path: 'M 50,50 L 100,50 L 100,0 L 50,0 Z', color: COLOR_CODES.blue },  // Top-right: Blue
            { path: 'M 50,50 L 100,50 L 100,100 L 50,100 Z', color: COLOR_CODES.yellow }, // Bottom-right: Yellow
            { path: 'M 50,50 L 0,50 L 0,100 L 50,100 Z', color: COLOR_CODES.green }  // Bottom-left: Green
        ];

        quadrants.forEach(q => {
            svg += `<path d="${q.path}" fill="${q.color}" opacity="0.15"/>`;
        });

        // Draw 16-space circular track
        const radius = 35;
        const centerX = 50;
        const centerY = 50;

        for (let i = 0; i < TRACK_SPACES; i++) {
            const angle = (i / TRACK_SPACES) * Math.PI * 2 - Math.PI / 2; // Start at top
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            // Check if this is a start space
            const playerStarts = [0, 4, 8, 12]; // Red, Blue, Yellow, Green
            const startIndex = playerStarts.indexOf(i);
            const isStart = startIndex !== -1;

            if (isStart) {
                const color = COLOR_CODES[COLORS[startIndex]];
                svg += `
                    <circle cx="${x}" cy="${y}" r="4.5" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.9"/>
                    <circle cx="${x}" cy="${y}" r="2.5" fill="white" opacity="0.8"/>
                `;
            } else {
                svg += `<circle cx="${x}" cy="${y}" r="3.5" fill="#ddd" stroke="#999" stroke-width="1"/>`;
            }
        }

        // Draw finish lanes (4 spaces each, going toward center)
        const finishLanes = [
            { start: 0, angle: -Math.PI / 2, color: COLOR_CODES.red },    // Red: from top
            { start: 4, angle: 0, color: COLOR_CODES.blue },              // Blue: from right
            { start: 8, angle: Math.PI / 2, color: COLOR_CODES.yellow },  // Yellow: from bottom
            { start: 12, angle: Math.PI, color: COLOR_CODES.green }       // Green: from left
        ];

        finishLanes.forEach(lane => {
            const baseAngle = (lane.start / TRACK_SPACES) * Math.PI * 2 - Math.PI / 2;
            const baseX = centerX + radius * Math.cos(baseAngle);
            const baseY = centerY + radius * Math.sin(baseAngle);

            for (let i = 1; i <= FINISH_SPACES; i++) {
                const distance = 7 * i;
                const x = centerX + (radius - distance) * Math.cos(baseAngle);
                const y = centerY + (radius - distance) * Math.sin(baseAngle);

                svg += `
                    <circle cx="${x}" cy="${y}" r="3" fill="${lane.color}" stroke="white" stroke-width="1" opacity="0.7"/>
                `;
            }
        });

        // Draw home areas in corners
        const homeSize = 12;
        const homeCorners = [
            { x: 15, y: 15, color: COLOR_CODES.red },
            { x: 85, y: 15, color: COLOR_CODES.blue },
            { x: 85, y: 85, color: COLOR_CODES.yellow },
            { x: 15, y: 85, color: COLOR_CODES.green }
        ];

        homeCorners.forEach(home => {
            svg += `
                <rect x="${home.x - homeSize/2}" y="${home.y - homeSize/2}"
                    width="${homeSize}" height="${homeSize}" rx="2"
                    fill="${home.color}" opacity="0.3" stroke="${home.color}" stroke-width="1.5"/>
            `;

            // 4 peg spots
            const offset = 3;
            [
                {x: home.x - offset, y: home.y - offset},
                {x: home.x + offset, y: home.y - offset},
                {x: home.x - offset, y: home.y + offset},
                {x: home.x + offset, y: home.y + offset}
            ].forEach(spot => {
                svg += `<circle cx="${spot.x}" cy="${spot.y}" r="1.5" fill="white" stroke="${home.color}" stroke-width="0.5"/>`;
            });
        });

        // Draw center
        svg += `
            <circle cx="50" cy="50" r="8" fill="#f0f0f0" stroke="#666" stroke-width="1"/>
            <text x="50" y="52" text-anchor="middle" font-size="6" fill="#666" font-weight="bold">FINISH</text>
        `;

        // Draw pegs
        svg += renderPegs();

        return svg;
    }

    function renderPegs() {
        let svg = '';

        gameState.players.forEach((player, pIdx) => {
            const color = COLOR_CODES[player.color];
            const validMoves = getValidMoves(pIdx);

            player.pegs.forEach((peg, pegIdx) => {
                const pos = getPegPosition(peg, pIdx, pegIdx);
                const canMove = gameState.currentPlayer === pIdx &&
                              gameState.dieValue !== null &&
                              validMoves.includes(pegIdx);

                const pegRadius = canMove ? 2.5 : 2;
                const pulseClass = canMove ? 'class="peg-pulse"' : '';

                svg += `
                    <circle cx="${pos.x}" cy="${pos.y}" r="${pegRadius}"
                        fill="${color}" stroke="white" stroke-width="0.8"
                        ${pulseClass}
                        onclick="selectPeg(${pegIdx})"
                        style="cursor: ${canMove ? 'pointer' : 'default'}; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">
                        <title>${player.name} - Peg ${pegIdx + 1}</title>
                    </circle>
                    <circle cx="${pos.x - 0.5}" cy="${pos.y - 0.5}" r="${pegRadius * 0.3}" fill="rgba(255,255,255,0.6)"/>
                `;
            });
        });

        return svg;
    }

    function getPegPosition(peg, playerIdx, pegIdx) {
        const radius = 35;
        const centerX = 50;
        const centerY = 50;

        if (peg.location === 'home') {
            const homeCorners = [
                {x: 15, y: 15}, // Red
                {x: 85, y: 15}, // Blue
                {x: 85, y: 85}, // Yellow
                {x: 15, y: 85}  // Green
            ];
            const home = homeCorners[playerIdx];
            const offset = 3;
            const spots = [
                {x: home.x - offset, y: home.y - offset},
                {x: home.x + offset, y: home.y - offset},
                {x: home.x - offset, y: home.y + offset},
                {x: home.x + offset, y: home.y + offset}
            ];
            return spots[pegIdx];
        } else if (peg.location === 'track') {
            const angle = (peg.position / TRACK_SPACES) * Math.PI * 2 - Math.PI / 2;
            return {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        } else if (peg.location === 'finish') {
            const startPos = getStartPosition(playerIdx);
            const baseAngle = (startPos / TRACK_SPACES) * Math.PI * 2 - Math.PI / 2;
            const distance = 7 * (peg.position + 1);
            return {
                x: centerX + (radius - distance) * Math.cos(baseAngle),
                y: centerY + (radius - distance) * Math.sin(baseAngle)
            };
        } else {
            // Done - center
            return { x: centerX, y: centerY };
        }
    }

    function renderPlayerStatus() {
        let html = '<div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;">';

        gameState.players.forEach((player, idx) => {
            const pegsHome = player.pegs.filter(p => p.location === 'done').length;
            const pegsInPlay = player.pegs.filter(p => p.location === 'track' || p.location === 'finish').length;
            const pegsAtHome = player.pegs.filter(p => p.location === 'home').length;
            const isActive = idx === gameState.currentPlayer;

            html += `
                <div style="background: ${isActive ? COLOR_CODES[player.color] + '22' : '#f8f9fa'};
                    border: 2px solid ${isActive ? COLOR_CODES[player.color] : '#ddd'};
                    padding: 0.75rem; border-radius: 8px; min-width: 100px;">
                    <div style="font-weight: bold; color: ${COLOR_CODES[player.color]}; margin-bottom: 0.25rem;">
                        ${player.name}
                    </div>
                    <div style="font-size: 0.85rem; color: #666;">
                        🏠 ${pegsHome} | 🎯 ${pegsInPlay} | 🔒 ${pegsAtHome}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    window.rollDie = function() {
        if (gameState.dieValue !== null || gameState.gameOver) return;

        gameState.message = 'Rolling...';
        showBoard();

        // Animate roll
        let count = 0;
        const interval = setInterval(() => {
            gameState.dieValue = Math.floor(Math.random() * 6) + 1;
            showBoard();
            count++;

            if (count >= 10) {
                clearInterval(interval);
                handleRollResult();
            }
        }, 80);
    };

    function handleRollResult() {
        const player = gameState.players[gameState.currentPlayer];
        const validMoves = getValidMoves(gameState.currentPlayer);

        // Check for extra turn from rolling 6
        if (gameState.dieValue === 6) {
            gameState.hasExtraTurn = true;
        }

        if (validMoves.length === 0) {
            gameState.message = `Rolled ${gameState.dieValue} - No valid moves!`;
            showBoard();
            setTimeout(() => endTurn(), 1500);
        } else {
            gameState.message = `Rolled ${gameState.dieValue} - Click a glowing peg to move`;
            showBoard();

            if (player.isAI) {
                setTimeout(() => makeAIMove(), 1000);
            }
        }
    }

    function getValidMoves(playerIdx) {
        const player = gameState.players[playerIdx];
        const die = gameState.dieValue;
        const valid = [];

        player.pegs.forEach((peg, idx) => {
            if (peg.location === 'home') {
                // Can only move out with a 6
                if (die === 6) {
                    const startPos = getStartPosition(playerIdx);
                    // Check if start position is occupied by own peg
                    const blocked = player.pegs.some(p =>
                        p.location === 'track' && p.position === startPos
                    );
                    if (!blocked) valid.push(idx);
                }
            } else if (peg.location === 'track') {
                const finishEntry = getFinishEntry(playerIdx);
                const newPos = (peg.position + die) % TRACK_SPACES;

                // Check if move crosses finish entry
                let crossesEntry = false;
                for (let i = 1; i <= die; i++) {
                    if ((peg.position + i) % TRACK_SPACES === finishEntry) {
                        crossesEntry = true;
                        break;
                    }
                }

                if (crossesEntry) {
                    // Moving into finish lane
                    let spacesAfter = 0;
                    for (let i = 1; i <= die; i++) {
                        if ((peg.position + i) % TRACK_SPACES === finishEntry) {
                            spacesAfter = die - i;
                            break;
                        }
                    }

                    if (spacesAfter < FINISH_SPACES) {
                        // Check not blocked by own peg in finish
                        const blocked = player.pegs.some(p =>
                            p.location === 'finish' && p.position === spacesAfter
                        );
                        if (!blocked) valid.push(idx);
                    }
                } else {
                    // Normal track movement
                    const blocked = player.pegs.some(p =>
                        p.location === 'track' && p.position === newPos
                    );
                    if (!blocked) valid.push(idx);
                }
            } else if (peg.location === 'finish') {
                const newFinishPos = peg.position + die;
                if (newFinishPos < FINISH_SPACES) {
                    const blocked = player.pegs.some(p =>
                        p.location === 'finish' && p.position === newFinishPos
                    );
                    if (!blocked) valid.push(idx);
                } else if (newFinishPos === FINISH_SPACES) {
                    // Exact roll to complete
                    valid.push(idx);
                }
            }
        });

        return valid;
    }

    window.selectPeg = function(pegIdx) {
        if (!gameState.dieValue || gameState.gameOver) return;

        const validMoves = getValidMoves(gameState.currentPlayer);
        if (!validMoves.includes(pegIdx)) return;

        const player = gameState.players[gameState.currentPlayer];
        const peg = player.pegs[pegIdx];
        const die = gameState.dieValue;

        if (peg.location === 'home' && die === 6) {
            // Move to start
            peg.location = 'track';
            peg.position = getStartPosition(gameState.currentPlayer);
            checkCapture(gameState.currentPlayer, peg.position);
            gameState.message = `${player.name} moved a peg to START!`;
        } else if (peg.location === 'track') {
            const finishEntry = getFinishEntry(gameState.currentPlayer);
            let crossesEntry = false;
            let spacesAfter = 0;

            for (let i = 1; i <= die; i++) {
                if ((peg.position + i) % TRACK_SPACES === finishEntry) {
                    crossesEntry = true;
                    spacesAfter = die - i;
                    break;
                }
            }

            if (crossesEntry) {
                peg.location = 'finish';
                peg.position = spacesAfter;
                gameState.message = `${player.name} entered FINISH lane!`;
            } else {
                peg.position = (peg.position + die) % TRACK_SPACES;
                checkCapture(gameState.currentPlayer, peg.position);
                gameState.message = `${player.name} moved ${die} spaces`;
            }
        } else if (peg.location === 'finish') {
            const newPos = peg.position + die;
            if (newPos === FINISH_SPACES) {
                peg.location = 'done';
                peg.position = 0;
                gameState.message = `${player.name} got a peg HOME! 🏠`;

                // Check win condition
                if (player.pegs.every(p => p.location === 'done')) {
                    gameState.gameOver = true;
                    gameState.winner = gameState.currentPlayer;
                }
            } else {
                peg.position = newPos;
                gameState.message = `${player.name} moved in FINISH lane`;
            }
        }

        showBoard();

        if (!gameState.gameOver) {
            if (gameState.hasExtraTurn) {
                // Got a 6, roll again
                gameState.dieValue = null;
                gameState.hasExtraTurn = false;
                gameState.message += ' - Roll again! 🎲';
                showBoard();
            } else {
                setTimeout(() => endTurn(), 800);
            }
        }
    };

    function checkCapture(playerIdx, trackPos) {
        gameState.players.forEach((opponent, oppIdx) => {
            if (oppIdx !== playerIdx) {
                opponent.pegs.forEach(peg => {
                    if (peg.location === 'track' && peg.position === trackPos) {
                        peg.location = 'home';
                        peg.position = 0;
                        gameState.message += ` 💥 Captured ${opponent.name}!`;
                    }
                });
            }
        });
    }

    function endTurn() {
        gameState.dieValue = null;
        gameState.hasExtraTurn = false;
        gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;

        const nextPlayer = gameState.players[gameState.currentPlayer];
        gameState.message = nextPlayer.isAI ? 'AI thinking...' : 'Pop the die!';

        showBoard();

        if (nextPlayer.isAI && !gameState.gameOver) {
            setTimeout(() => rollDie(), 800);
        }
    }

    function makeAIMove() {
        const validMoves = getValidMoves(gameState.currentPlayer);
        if (validMoves.length === 0) return;

        const player = gameState.players[gameState.currentPlayer];

        // AI strategy: prioritize finishing pegs, then advancing furthest pegs
        let bestPeg = validMoves[0];
        let bestScore = -1;

        validMoves.forEach(pegIdx => {
            const peg = player.pegs[pegIdx];
            let score = 0;

            if (peg.location === 'finish') {
                score = 1000 + peg.position * 100;
            } else if (peg.location === 'track') {
                score = 500 + peg.position * 10;
            } else if (peg.location === 'home' && gameState.dieValue === 6) {
                score = 100;
            }

            if (score > bestScore) {
                bestScore = score;
                bestPeg = pegIdx;
            }
        });

        selectPeg(bestPeg);
    }

    function showWinScreen() {
        const winner = gameState.players[gameState.winner];
        const content = document.getElementById('troubleContent');

        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">🎉 Game Over!</h2>

                <div style="background: linear-gradient(135deg, ${COLOR_CODES[winner.color]} 0%, ${COLOR_CODES[winner.color]}cc 100%); padding: 3rem 2rem; border-radius: 16px; margin-bottom: 2rem; color: white; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
                    <div style="font-size: 4rem; margin-bottom: 0.5rem;">👑</div>
                    <div style="font-size: 2rem; font-weight: bold;">${winner.name} Wins!</div>
                    <div style="font-size: 1.1rem; margin-top: 0.5rem; opacity: 0.9;">All 4 pegs made it home!</div>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="startGame()"
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        Play Again
                    </button>
                    <button onclick="showSetup()"
                        style="background: #2196F3; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        New Setup
                    </button>
                    <button onclick="exitTrouble()"
                        style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        Exit
                    </button>
                </div>
            </div>
        `;
    }

    // Expose necessary functions
    window.showSetup = showSetup;
    window.startGame = startGame;

})();
