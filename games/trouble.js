// Trouble Board Game
(function() {
    'use strict';

    const COLORS = ['yellow', 'blue', 'red', 'green'];
    const COLOR_NAMES = { yellow: 'Yellow', blue: 'Blue', red: 'Red', green: 'Green' };
    const BOARD_SPACES = 28; // Main square track around edge
    const FINISH_SPACES = 3; // Spaces in finish zone (1, 2, 3)

    let troubleState = {
        numPlayers: 2,
        mode: 'passAndPlay', // 'passAndPlay' or 'vsComputer'
        currentPlayer: 0,
        players: [],
        dieValue: null,
        selectedPeg: null,
        gameOver: false,
        winner: null,
        extraRoll: false,
        message: ''
    };

    // Initialize player data
    function initializePlayers(numPlayers, mode) {
        const players = [];
        for (let i = 0; i < numPlayers; i++) {
            players.push({
                color: COLORS[i],
                name: COLOR_NAMES[COLORS[i]],
                isAI: mode === 'vsComputer' && i > 0,
                pegs: [
                    { location: 'home', position: 0 }, // home, track, finish, done
                    { location: 'home', position: 0 },
                    { location: 'home', position: 0 },
                    { location: 'home', position: 0 }
                ]
            });
        }
        return players;
    }

    // Get start position on track for each player
    // Yellow=21, Blue=14, Red=7, Green=0
    function getStartPosition(playerIndex) {
        const starts = [21, 14, 7, 0]; // Yellow, Blue, Red, Green
        return starts[playerIndex];
    }

    // Get finish entry position for each player (one space before start, going around the board)
    // Yellow=27, Blue=20, Red=13, Green=6
    function getFinishEntry(playerIndex) {
        const entries = [27, 20, 13, 6]; // Yellow, Blue, Red, Green
        return entries[playerIndex];
    }

    function launchTrouble() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('troubleGame').style.display = 'block';
        showTroubleSetup();
    }

    function exitTrouble() {
        document.getElementById('troubleGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    }

    function showTroubleSetup() {
        const content = document.getElementById('troubleContent');
        content.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h2 style="margin-bottom: 1.5rem; font-size: 2rem;">🎲 Trouble!</h2>
                <p style="margin-bottom: 2rem; color: #666;">Pop the bubble and race your pegs home!</p>

                <div style="background: rgba(0,0,0,0.05); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto;">
                    <h3 style="margin-bottom: 1rem;">Number of Players:</h3>
                    <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1.5rem;">
                        ${[2, 3, 4].map(num => `
                            <button onclick="setPlayerCount(${num})" style="background: ${troubleState.numPlayers === num ? '#4CAF50' : '#e0e0e0'}; color: ${troubleState.numPlayers === num ? 'white' : '#333'}; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                                ${num} Players
                            </button>
                        `).join('')}
                    </div>

                    <h3 style="margin-bottom: 1rem;">Game Mode:</h3>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-direction: column; max-width: 300px; margin: 0 auto;">
                        <button onclick="setGameMode('passAndPlay')" style="background: ${troubleState.mode === 'passAndPlay' ? '#2196F3' : '#e0e0e0'}; color: ${troubleState.mode === 'passAndPlay' ? 'white' : '#333'}; border: none; padding: 1rem; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                            👥 Pass & Play
                        </button>
                        <button onclick="setGameMode('vsComputer')" style="background: ${troubleState.mode === 'vsComputer' ? '#2196F3' : '#e0e0e0'}; color: ${troubleState.mode === 'vsComputer' ? 'white' : '#333'}; border: none; padding: 1rem; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                            🤖 vs Computer
                        </button>
                    </div>
                </div>

                <button onclick="startTroubleGame()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold; margin-bottom: 1rem;">
                    Start Game
                </button>

                <button onclick="exitTrouble()" style="background: #6c757d; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                    ← Back to Games
                </button>
            </div>
        `;
    }

    function setPlayerCount(count) {
        troubleState.numPlayers = count;
        showTroubleSetup();
    }

    function setGameMode(mode) {
        troubleState.mode = mode;
        showTroubleSetup();
    }

    function startTroubleGame() {
        troubleState.players = initializePlayers(troubleState.numPlayers, troubleState.mode);
        troubleState.currentPlayer = 0;
        troubleState.dieValue = null;
        troubleState.selectedPeg = null;
        troubleState.gameOver = false;
        troubleState.winner = null;
        troubleState.extraRoll = false;
        troubleState.message = `${troubleState.players[0].name}'s turn - Pop the die!`;

        showGameBoard();
    }

    function showGameBoard() {
        const content = document.getElementById('troubleContent');
        const player = troubleState.players[troubleState.currentPlayer];

        content.innerHTML = `
            <div style="padding: 1rem; text-align: center;">
                <h2 style="margin-bottom: 0.5rem; font-size: 1.5rem;">🎲 Trouble</h2>

                <div style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="font-weight: bold; color: ${player.color}; font-size: 1.1rem;">
                        ${player.name}'s Turn ${player.isAI ? '(AI)' : ''}
                    </div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 0.25rem;">
                        ${troubleState.message}
                    </div>
                </div>

                ${renderBoard()}

                <div style="margin: 1rem 0; font-size: 0.85rem; color: #666;">
                    ${troubleState.dieValue ? `Rolled: ${troubleState.dieValue}` : 'Click the center to roll!'}
                </div>

                <button onclick="exitTrouble()" style="background: #6c757d; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem; margin-top: 0.5rem;">
                    ← Back
                </button>
            </div>
        `;

        if (troubleState.gameOver) {
            showWinScreen();
        }
    }

    function showWinScreen() {
        const winner = troubleState.players[troubleState.winner];
        const content = document.getElementById('troubleContent');

        content.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h2 style="margin-bottom: 1rem; font-size: 2rem;">🎉 Game Over!</h2>

                <div style="background: linear-gradient(135deg, ${winner.color} 0%, ${winner.color}dd 100%); padding: 2rem; border-radius: 16px; margin-bottom: 2rem; color: white;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">👑</div>
                    <div style="font-size: 1.5rem; font-weight: bold;">${winner.name} Wins!</div>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="startTroubleGame()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        Play Again
                    </button>
                    <button onclick="showTroubleSetup()" style="background: #2196F3; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        New Setup
                    </button>
                    <button onclick="exitTrouble()" style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        Exit
                    </button>
                </div>
            </div>
        `;
    }

    function getTrackPosition(spaceIndex, centerX, centerY, radius) {
        // Track goes around a square path: bottom (green) -> right -> top (blue) -> left (yellow)
        // 28 spaces total = 7 per side
        const margin = radius * 0.85; // Distance from center to track
        const spacesPerSide = 7;
        const spacing = (margin * 2) / (spacesPerSide - 1);

        let x, y;

        if (spaceIndex < 7) {
            // Bottom side (spaces 0-6) - Green's start is at 0
            x = centerX - margin + (spaceIndex * spacing);
            y = centerY + margin;
        } else if (spaceIndex < 14) {
            // Right side (spaces 7-13) - Red's start is at 7
            const pos = spaceIndex - 7;
            x = centerX + margin;
            y = centerY + margin - (pos * spacing);
        } else if (spaceIndex < 21) {
            // Top side (spaces 14-20) - Blue's start is at 14
            const pos = spaceIndex - 14;
            x = centerX + margin - (pos * spacing);
            y = centerY - margin;
        } else {
            // Left side (spaces 21-27) - Yellow's start is at 21
            const pos = spaceIndex - 21;
            x = centerX - margin;
            y = centerY - margin + (pos * spacing);
        }

        return { x, y };
    }

    function renderBoardBackground(boardSize, centerX, centerY) {
        const size = boardSize;
        const colors = {
            yellow: '#FFD700',
            blue: '#4169E1',
            green: '#32CD32',
            red: '#DC143C'
        };

        return `
            <!-- Background -->
            <rect width="${size}" height="${size}" fill="#f5f5f5" rx="12"/>

            <!-- Yellow quadrant (left) -->
            <path d="M 0 0 L 0 ${size} L ${size/2} ${size/2} Z"
                fill="${colors.yellow}" opacity="0.3"/>

            <!-- Blue quadrant (top) -->
            <path d="M 0 0 L ${size} 0 L ${size/2} ${size/2} Z"
                fill="${colors.blue}" opacity="0.3"/>

            <!-- Red quadrant (right) -->
            <path d="M ${size} 0 L ${size} ${size} L ${size/2} ${size/2} Z"
                fill="${colors.red}" opacity="0.3"/>

            <!-- Green quadrant (bottom) -->
            <path d="M 0 ${size} L ${size} ${size} L ${size/2} ${size/2} Z"
                fill="${colors.green}" opacity="0.3"/>
        `;
    }

    function renderTrack(boardSize, centerX, centerY, radius) {
        const colors = ['#FFD700', '#4169E1', '#DC143C', '#32CD32']; // Yellow, Blue, Red, Green
        let svg = '';

        for (let i = 0; i < BOARD_SPACES; i++) {
            const pos = getTrackPosition(i, centerX, centerY, radius);

            // Start positions: Green=0, Red=7, Blue=14, Yellow=21
            const startIndex = [0, 7, 14, 21].indexOf(i);
            const isStartSpace = startIndex !== -1;

            if (isStartSpace) {
                // Draw double-ring start space
                const colorIdx = startIndex === 0 ? 3 : startIndex === 1 ? 2 : startIndex === 2 ? 1 : 0; // Map to color array
                svg += `
                    <circle cx="${pos.x}" cy="${pos.y}" r="14" fill="${colors[colorIdx]}" stroke="#fff" stroke-width="3" opacity="0.9"/>
                    <circle cx="${pos.x}" cy="${pos.y}" r="10" fill="none" stroke="#fff" stroke-width="2"/>
                    <circle cx="${pos.x}" cy="${pos.y}" r="6" fill="${colors[colorIdx]}"/>
                `;
            } else {
                // Regular track space
                svg += `
                    <circle cx="${pos.x}" cy="${pos.y}" r="10" fill="#e0e0e0" stroke="#999" stroke-width="2"
                        class="track-space" data-space="${i}"/>
                `;
            }
        }
        return svg;
    }

    function renderHomeAreas(boardSize, centerX, centerY, homeRadius) {
        const colors = ['#FFD700', '#4169E1', '#DC143C', '#32CD32']; // Yellow, Blue, Red, Green
        const labels = ['H', 'O', 'M', 'E'];
        const cornerOffset = boardSize * 0.08; // Closer to actual corners

        // Home areas in the 4 corners - positioned away from track
        const positions = [
            { x: cornerOffset, y: centerY, label: 'Yellow' },           // Yellow - far left edge
            { x: centerX, y: cornerOffset, label: 'Blue' },             // Blue - top edge
            { x: boardSize - cornerOffset, y: centerY, label: 'Red' },  // Red - far right edge
            { x: centerX, y: boardSize - cornerOffset, label: 'Green' } // Green - bottom edge
        ];

        let svg = '';
        positions.forEach((pos, idx) => {
            const size = homeRadius * 1.8;

            // Home area background box
            svg += `<rect x="${pos.x - size/2}" y="${pos.y - size/2}" width="${size}" height="${size}"
                fill="${colors[idx]}" opacity="0.6" stroke="${colors[idx]}" stroke-width="3" rx="6"/>`;

            // 4 peg spots in 2x2 grid showing H O M E
            const spacing = size * 0.3;
            const pegSpots = [
                { x: pos.x - spacing, y: pos.y - spacing, letter: labels[0] },
                { x: pos.x + spacing, y: pos.y - spacing, letter: labels[1] },
                { x: pos.x - spacing, y: pos.y + spacing, letter: labels[2] },
                { x: pos.x + spacing, y: pos.y + spacing, letter: labels[3] }
            ];

            pegSpots.forEach((spot, spotIdx) => {
                svg += `
                    <circle cx="${spot.x}" cy="${spot.y}" r="10" fill="#fff" stroke="#333" stroke-width="2"
                        class="home-spot" data-player="${idx}" data-spot="${spotIdx}"/>
                    <text x="${spot.x}" y="${spot.y + 4}" text-anchor="middle" fill="#333" font-size="10" font-weight="bold">${spot.letter}</text>
                `;
            });
        });

        return svg;
    }

    function renderFinishZones(boardSize, centerX, centerY, trackRadius, homeRadius) {
        const colors = ['#FFD700', '#4169E1', '#DC143C', '#32CD32']; // Yellow, Blue, Red, Green
        let svg = '';

        // Finish zones: Green=entry at 6, Red=entry at 13, Blue=entry at 20, Yellow=entry at 27
        const finishEntries = [
            { entry: 27, dir: 'horizontal', sign: 1 },  // Yellow - goes right toward center
            { entry: 20, dir: 'vertical', sign: 1 },    // Blue - goes down toward center
            { entry: 13, dir: 'horizontal', sign: -1 }, // Red - goes left toward center
            { entry: 6, dir: 'vertical', sign: -1 }     // Green - goes up toward center
        ];

        finishEntries.forEach((finish, i) => {
            const entryPos = getTrackPosition(finish.entry, centerX, centerY, trackRadius);
            const spacing = 25;

            // Draw 3 numbered finish spaces going toward center
            for (let j = 0; j < 3; j++) {
                const distance = (j + 1) * spacing;
                const x = finish.dir === 'horizontal' ? entryPos.x + (finish.sign * distance) : entryPos.x;
                const y = finish.dir === 'vertical' ? entryPos.y + (finish.sign * distance) : entryPos.y;

                svg += `
                    <circle cx="${x}" cy="${y}" r="12" fill="${colors[i]}" stroke="#fff" stroke-width="3" opacity="0.9"
                        class="finish-space" data-player="${i}" data-position="${j}"/>
                    <text x="${x}" y="${y + 5}" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">${j + 1}</text>
                `;
            }
        });

        return svg;
    }

    function renderPegs(boardSize, centerX, centerY, trackRadius, homeRadius) {
        let svg = '';
        const colors = ['#FFD700', '#4169E1', '#DC143C', '#32CD32']; // Yellow, Blue, Red, Green

        troubleState.players.forEach((player, playerIdx) => {
            const playerColor = colors[playerIdx];

            player.pegs.forEach((peg, pegIdx) => {
                let pos = getPegVisualPosition(peg, playerIdx, pegIdx, boardSize, centerX, centerY, trackRadius, homeRadius);
                const isValidMove = troubleState.currentPlayer === playerIdx &&
                                   troubleState.dieValue !== null &&
                                   getValidMoves(playerIdx).includes(pegIdx);

                const pegSize = isValidMove ? 14 : 12;
                const strokeWidth = isValidMove ? 4 : 3;
                const pulse = isValidMove ? 'peg-pulse' : '';

                // Draw peg with a highlight to make it pop
                svg += `
                    <circle cx="${pos.x}" cy="${pos.y}" r="${pegSize}" fill="${playerColor}"
                        stroke="#fff" stroke-width="${strokeWidth}"
                        class="game-peg ${pulse}" data-player="${playerIdx}" data-peg="${pegIdx}"
                        onclick="selectPeg(${pegIdx})" style="cursor: ${isValidMove ? 'pointer' : 'default'}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));"/>
                    <circle cx="${pos.x - 2}" cy="${pos.y - 2}" r="${pegSize * 0.3}" fill="rgba(255,255,255,0.5)"/>
                `;
            });
        });

        return svg;
    }

    function getPegVisualPosition(peg, playerIdx, pegIdx, boardSize, centerX, centerY, trackRadius, homeRadius) {
        const cornerOffset = boardSize * 0.12;

        if (peg.location === 'home') {
            // Home areas: Yellow=left, Blue=top, Red=right, Green=bottom
            const homePositions = [
                { x: cornerOffset, y: centerY },           // Yellow - left
                { x: centerX, y: cornerOffset },           // Blue - top
                { x: boardSize - cornerOffset, y: centerY }, // Red - right
                { x: centerX, y: boardSize - cornerOffset }  // Green - bottom
            ];
            const homePos = homePositions[playerIdx];
            const size = homeRadius * 1.8;
            const spacing = size * 0.3;

            const spots = [
                { x: homePos.x - spacing, y: homePos.y - spacing },
                { x: homePos.x + spacing, y: homePos.y - spacing },
                { x: homePos.x - spacing, y: homePos.y + spacing },
                { x: homePos.x + spacing, y: homePos.y + spacing }
            ];
            return spots[pegIdx];
        } else if (peg.location === 'track') {
            return getTrackPosition(peg.position, centerX, centerY, trackRadius);
        } else if (peg.location === 'finish') {
            // Straight finish lanes toward center
            const finishEntries = [
                { entry: 27, dir: 'horizontal', sign: 1 },  // Yellow
                { entry: 20, dir: 'vertical', sign: 1 },    // Blue
                { entry: 13, dir: 'horizontal', sign: -1 }, // Red
                { entry: 6, dir: 'vertical', sign: -1 }     // Green
            ];

            const finish = finishEntries[playerIdx];
            const entryPos = getTrackPosition(finish.entry, centerX, centerY, trackRadius);
            const spacing = 25;
            const distance = (peg.position + 1) * spacing;

            return {
                x: finish.dir === 'horizontal' ? entryPos.x + (finish.sign * distance) : entryPos.x,
                y: finish.dir === 'vertical' ? entryPos.y + (finish.sign * distance) : entryPos.y
            };
        } else if (peg.location === 'done') {
            // Stack in center of board when done
            return { x: centerX, y: centerY };
        }

        return { x: centerX, y: centerY };
    }

    function renderCenterDie(centerX, centerY) {
        const dieSize = 45;
        return `
            <g class="center-die" onclick="rollDie()" style="cursor: pointer;">
                <!-- Outer ring -->
                <circle cx="${centerX}" cy="${centerY}" r="${dieSize}" fill="#e74c3c" stroke="#c0392b" stroke-width="4"/>
                <!-- Inner circle -->
                <circle cx="${centerX}" cy="${centerY}" r="${dieSize - 8}" fill="#fff" stroke="#c0392b" stroke-width="2"/>
                ${troubleState.dieValue ? `
                    <text x="${centerX}" y="${centerY + 3}" text-anchor="middle" dominant-baseline="middle"
                        fill="#e74c3c" font-size="32" font-weight="bold">${troubleState.dieValue}</text>
                ` : `
                    <text x="${centerX}" y="${centerY - 3}" text-anchor="middle" dominant-baseline="middle"
                        fill="#e74c3c" font-size="24">🎲</text>
                    <text x="${centerX}" y="${centerY + 15}" text-anchor="middle" dominant-baseline="middle"
                        fill="#e74c3c" font-size="11" font-weight="bold">CLICK</text>
                `}
            </g>
        `;
    }

    function renderBoard() {
        const size = Math.min(400, window.innerWidth - 40);
        return `
            <style>
                @keyframes peg-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .peg-pulse {
                    animation: peg-pulse 0.8s ease-in-out infinite;
                }
            </style>
            <div style="max-width: ${size}px; margin: 0 auto;">
                <svg width="${size}" height="${size}" viewBox="0 0 100 100" style="background: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    ${renderSimpleVisualBoard()}
                </svg>

                <!-- Die Button Below Board -->
                <div style="text-align: center; margin-top: 1rem;">
                    ${troubleState.dieValue === null ? `
                        <button onclick="rollDie()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; padding: 1.5rem 2rem; border-radius: 50%; cursor: pointer; font-size: 1.5rem; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.3); width: 80px; height: 80px;">
                            🎲<br><span style="font-size: 0.8rem;">POP!</span>
                        </button>
                    ` : `
                        <div style="display: inline-block; background: white; border: 4px solid #e74c3c; padding: 1rem 1.5rem; border-radius: 12px; font-size: 2.5rem; font-weight: bold; color: #e74c3c; min-width: 80px;">
                            ${troubleState.dieValue}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    function renderSimpleVisualBoard() {
        const colors = ['#FFD700', '#4169E1', '#DC143C', '#32CD32'];
        let svg = '';

        // Draw 4 colored triangular quadrants
        svg += `
            <path d="M 0,0 L 0,50 L 50,50 Z" fill="${colors[0]}" opacity="0.2"/>
            <path d="M 50,0 L 100,0 L 50,50 Z" fill="${colors[1]}" opacity="0.2"/>
            <path d="M 100,50 L 100,100 L 50,50 Z" fill="${colors[2]}" opacity="0.2"/>
            <path d="M 50,100 L 0,100 L 50,50 Z" fill="${colors[3]}" opacity="0.2"/>
        `;

        // Draw track squares around the edge
        const trackSpaces = [
            // Bottom row (Green side)
            {x: 10, y: 90}, {x: 20, y: 90}, {x: 30, y: 90}, {x: 40, y: 90}, {x: 50, y: 90}, {x: 60, y: 90}, {x: 70, y: 90},
            // Right column (Red side)
            {x: 90, y: 80}, {x: 90, y: 70}, {x: 90, y: 60}, {x: 90, y: 50}, {x: 90, y: 40}, {x: 90, y: 30}, {x: 90, y: 20},
            // Top row (Blue side)
            {x: 80, y: 10}, {x: 70, y: 10}, {x: 60, y: 10}, {x: 50, y: 10}, {x: 40, y: 10}, {x: 30, y: 10}, {x: 20, y: 10},
            // Left column (Yellow side)
            {x: 10, y: 20}, {x: 10, y: 30}, {x: 10, y: 40}, {x: 10, y: 50}, {x: 10, y: 60}, {x: 10, y: 70}, {x: 10, y: 80}
        ];

        trackSpaces.forEach((pos, idx) => {
            // Start spaces: Green=0, Red=7, Blue=14, Yellow=21
            const isStart = [0, 7, 14, 21].includes(idx);
            svg += `<rect x="${pos.x - 3}" y="${pos.y - 3}" width="6" height="6"
                fill="${isStart ? colors[[3,2,1,0][[0, 7, 14, 21].indexOf(idx)]] : '#ddd'}"
                stroke="#666" stroke-width="0.5" rx="1"/>`;
        });

        // Draw finish lanes (3 spaces each going toward center)
        const finishLanes = [
            // Yellow (left side, going right)
            [{x: 20, y: 50}, {x: 30, y: 50}, {x: 40, y: 50}],
            // Blue (top, going down)
            [{x: 50, y: 20}, {x: 50, y: 30}, {x: 50, y: 40}],
            // Red (right, going left)
            [{x: 80, y: 50}, {x: 70, y: 50}, {x: 60, y: 50}],
            // Green (bottom, going up)
            [{x: 50, y: 80}, {x: 50, y: 70}, {x: 50, y: 60}]
        ];

        finishLanes.forEach((lane, playerIdx) => {
            lane.forEach(pos => {
                svg += `<rect x="${pos.x - 2.5}" y="${pos.y - 2.5}" width="5" height="5"
                    fill="${colors[playerIdx]}" opacity="0.6" stroke="${colors[playerIdx]}" stroke-width="0.5" rx="1"/>`;
            });
        });

        // Draw home areas in corners
        const homes = [
            {x: 5, y: 5, color: colors[0]},    // Yellow top-left
            {x: 95, y: 5, color: colors[1]},   // Blue top-right
            {x: 95, y: 95, color: colors[2]},  // Red bottom-right
            {x: 5, y: 95, color: colors[3]}    // Green bottom-left
        ];

        homes.forEach(home => {
            svg += `<rect x="${home.x - 8}" y="${home.y - 8}" width="16" height="16"
                fill="${home.color}" opacity="0.4" stroke="${home.color}" stroke-width="1" rx="2"/>`;
            // 4 peg spots
            [-3, 3].forEach(dx => {
                [-3, 3].forEach(dy => {
                    svg += `<circle cx="${home.x + dx}" cy="${home.y + dy}" r="1.5"
                        fill="white" stroke="${home.color}" stroke-width="0.5"/>`;
                });
            });
        });

        // Draw pegs
        svg += renderSimplePegs();

        return svg;
    }

    function renderSimplePegs() {
        const colors = ['#FFD700', '#4169E1', '#DC143C', '#32CD32'];
        let svg = '';

        troubleState.players.forEach((player, pIdx) => {
            player.pegs.forEach((peg, pegIdx) => {
                const pos = getSimplePegPosition(peg, pIdx, pegIdx);
                const canMove = troubleState.currentPlayer === pIdx &&
                               troubleState.dieValue !== null &&
                               getValidMoves(pIdx).includes(pegIdx);

                svg += `
                    <circle cx="${pos.x}" cy="${pos.y}" r="${canMove ? 2.5 : 2}"
                        fill="${colors[pIdx]}" stroke="white" stroke-width="0.8"
                        ${canMove ? 'class="peg-pulse"' : ''}
                        onclick="selectPeg(${pegIdx})"
                        style="cursor: ${canMove ? 'pointer' : 'default'};">
                        <title>Player ${pIdx + 1}, Peg ${pegIdx + 1}</title>
                    </circle>
                `;
            });
        });

        return svg;
    }

    function getSimplePegPosition(peg, playerIdx, pegIdx) {
        if (peg.location === 'home') {
            const homes = [
                {x: 5, y: 5},    // Yellow
                {x: 95, y: 5},   // Blue
                {x: 95, y: 95},  // Red
                {x: 5, y: 95}    // Green
            ];
            const home = homes[playerIdx];
            const offsets = [{x: -3, y: -3}, {x: 3, y: -3}, {x: -3, y: 3}, {x: 3, y: 3}];
            return {x: home.x + offsets[pegIdx].x, y: home.y + offsets[pegIdx].y};
        } else if (peg.location === 'track') {
            const trackSpaces = [
                {x: 10, y: 90}, {x: 20, y: 90}, {x: 30, y: 90}, {x: 40, y: 90}, {x: 50, y: 90}, {x: 60, y: 90}, {x: 70, y: 90},
                {x: 90, y: 80}, {x: 90, y: 70}, {x: 90, y: 60}, {x: 90, y: 50}, {x: 90, y: 40}, {x: 90, y: 30}, {x: 90, y: 20},
                {x: 80, y: 10}, {x: 70, y: 10}, {x: 60, y: 10}, {x: 50, y: 10}, {x: 40, y: 10}, {x: 30, y: 10}, {x: 20, y: 10},
                {x: 10, y: 20}, {x: 10, y: 30}, {x: 10, y: 40}, {x: 10, y: 50}, {x: 10, y: 60}, {x: 10, y: 70}, {x: 10, y: 80}
            ];
            return trackSpaces[peg.position];
        } else if (peg.location === 'finish') {
            const finishLanes = [
                [{x: 20, y: 50}, {x: 30, y: 50}, {x: 40, y: 50}],
                [{x: 50, y: 20}, {x: 50, y: 30}, {x: 50, y: 40}],
                [{x: 80, y: 50}, {x: 70, y: 50}, {x: 60, y: 50}],
                [{x: 50, y: 80}, {x: 50, y: 70}, {x: 50, y: 60}]
            ];
            return finishLanes[playerIdx][peg.position];
        } else {
            return {x: 50, y: 50}; // Done - at center
        }
    }


    function rollDie() {
        if (troubleState.dieValue !== null || troubleState.gameOver) return;

        // Animate the die roll
        troubleState.message = 'Rolling...';
        showGameBoard();

        // Simulate rolling animation
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            troubleState.dieValue = Math.floor(Math.random() * 6) + 1;
            showGameBoard();
            rollCount++;

            if (rollCount >= 8) {
                clearInterval(rollInterval);
                finalizeRoll();
            }
        }, 100);
    }

    function finalizeRoll() {
        const validMoves = getValidMoves(troubleState.currentPlayer);

        if (validMoves.length === 0) {
            troubleState.message = `Rolled ${troubleState.dieValue} - No valid moves!`;
            showGameBoard();
            setTimeout(() => {
                endTurn();
            }, 1500);
        } else {
            troubleState.message = `Rolled ${troubleState.dieValue} - Click a glowing peg to move`;
            showGameBoard();

            // Auto-move if AI
            const player = troubleState.players[troubleState.currentPlayer];
            if (player.isAI && !troubleState.gameOver) {
                setTimeout(() => makeAIMove(), 1000);
            }
        }
    }

    function getValidMoves(playerIndex) {
        const player = troubleState.players[playerIndex];
        const dieValue = troubleState.dieValue;
        const validMoves = [];

        player.pegs.forEach((peg, idx) => {
            if (peg.location === 'home' && dieValue === 6) {
                // Can move from home to start with a 6
                const startPos = getStartPosition(playerIndex);
                if (!isPegAtPosition(playerIndex, 'track', startPos)) {
                    validMoves.push(idx);
                }
            } else if (peg.location === 'track') {
                // Can move on track
                const newPos = (peg.position + dieValue) % BOARD_SPACES;
                const finishEntry = getFinishEntry(playerIndex);

                // Check if this move would enter finish zone
                const willEnterFinish = isMoveCrossingFinish(peg.position, dieValue, finishEntry);

                if (willEnterFinish) {
                    const spacesAfterEntry = getSpacesAfterFinishEntry(peg.position, dieValue, finishEntry);
                    if (spacesAfterEntry <= FINISH_SPACES) {
                        validMoves.push(idx);
                    }
                } else if (!isPegAtPosition(playerIndex, 'track', newPos)) {
                    validMoves.push(idx);
                }
            } else if (peg.location === 'finish') {
                // Can move in finish zone
                const newFinishPos = peg.position + dieValue;
                if (newFinishPos === FINISH_SPACES) {
                    validMoves.push(idx); // Exact roll to finish
                } else if (newFinishPos < FINISH_SPACES && !isPegAtPosition(playerIndex, 'finish', newFinishPos)) {
                    validMoves.push(idx);
                }
            }
        });

        return validMoves;
    }

    function isMoveCrossingFinish(currentPos, dieValue, finishEntry) {
        for (let i = 1; i <= dieValue; i++) {
            if ((currentPos + i) % BOARD_SPACES === finishEntry) {
                return true;
            }
        }
        return false;
    }

    function getSpacesAfterFinishEntry(currentPos, dieValue, finishEntry) {
        let spaces = 0;
        for (let i = 1; i <= dieValue; i++) {
            if ((currentPos + i) % BOARD_SPACES === finishEntry) {
                spaces = dieValue - i;
                break;
            }
        }
        return spaces;
    }

    function isPegAtPosition(playerIndex, location, position) {
        const player = troubleState.players[playerIndex];
        return player.pegs.some(peg => peg.location === location && peg.position === position);
    }

    function selectPeg(pegIndex) {
        if (!troubleState.dieValue || troubleState.gameOver) return;

        const validMoves = getValidMoves(troubleState.currentPlayer);
        if (!validMoves.includes(pegIndex)) return;

        const player = troubleState.players[troubleState.currentPlayer];
        const peg = player.pegs[pegIndex];
        const dieValue = troubleState.dieValue;
        let capturedSomeone = false;

        if (peg.location === 'home' && dieValue === 6) {
            // Move to start
            peg.location = 'track';
            peg.position = getStartPosition(troubleState.currentPlayer);
            capturedSomeone = checkForCapture(troubleState.currentPlayer, peg.position);
            troubleState.message = `${player.name} moved a peg to START!`;
            troubleState.extraRoll = true;
        } else if (peg.location === 'track') {
            const finishEntry = getFinishEntry(troubleState.currentPlayer);
            const willEnterFinish = isMoveCrossingFinish(peg.position, dieValue, finishEntry);

            if (willEnterFinish) {
                const spacesAfterEntry = getSpacesAfterFinishEntry(peg.position, dieValue, finishEntry);
                peg.location = 'finish';
                peg.position = spacesAfterEntry;
                troubleState.message = `${player.name} entered the FINISH zone!`;
            } else {
                peg.position = (peg.position + dieValue) % BOARD_SPACES;
                capturedSomeone = checkForCapture(troubleState.currentPlayer, peg.position);
                troubleState.message = `${player.name} moved forward ${dieValue} spaces`;
            }
        } else if (peg.location === 'finish') {
            const newFinishPos = peg.position + dieValue;
            if (newFinishPos === FINISH_SPACES) {
                peg.location = 'done';
                peg.position = 0;
                troubleState.message = `${player.name} got a peg HOME! 🏠`;

                // Check for win
                if (player.pegs.every(p => p.location === 'done')) {
                    troubleState.gameOver = true;
                    troubleState.winner = troubleState.currentPlayer;
                    troubleState.message = `🎉 ${player.name} WINS!`;
                }
            } else {
                peg.position = newFinishPos;
                troubleState.message = `${player.name} moved in FINISH zone`;
            }
        }

        // Show the move immediately
        showGameBoard();

        if (!troubleState.gameOver) {
            if (troubleState.extraRoll) {
                troubleState.dieValue = null;
                troubleState.extraRoll = false;
                troubleState.message += ' - Roll again! 🎲';
                showGameBoard();
            } else {
                setTimeout(() => endTurn(), capturedSomeone ? 1500 : 800);
            }
        }
    }

    function checkForCapture(playerIndex, position) {
        let captured = false;
        troubleState.players.forEach((opponent, oppIdx) => {
            if (oppIdx !== playerIndex) {
                opponent.pegs.forEach(peg => {
                    if (peg.location === 'track' && peg.position === position) {
                        peg.location = 'home';
                        peg.position = 0;
                        troubleState.message += ` 💥 Captured ${opponent.name}'s peg!`;
                        captured = true;
                    }
                });
            }
        });
        return captured;
    }

    function endTurn() {
        troubleState.dieValue = null;
        troubleState.selectedPeg = null;

        // Move to next player
        troubleState.currentPlayer = (troubleState.currentPlayer + 1) % troubleState.players.length;
        const nextPlayer = troubleState.players[troubleState.currentPlayer];
        troubleState.message = `${nextPlayer.name}'s turn - ${nextPlayer.isAI ? 'Thinking...' : 'Pop the die!'}`;

        showGameBoard();

        // If AI turn, roll after a delay
        if (nextPlayer.isAI && !troubleState.gameOver) {
            setTimeout(() => {
                rollDie();
            }, 800);
        }
    }

    function makeAIMove() {
        const validMoves = getValidMoves(troubleState.currentPlayer);
        if (validMoves.length > 0) {
            // Simple AI: prioritize pegs closest to finish
            const player = troubleState.players[troubleState.currentPlayer];
            let bestPeg = validMoves[0];
            let bestScore = -1;

            validMoves.forEach(pegIdx => {
                const peg = player.pegs[pegIdx];
                let score = 0;
                if (peg.location === 'finish') score = 1000 + peg.position;
                else if (peg.location === 'track') score = 500 + peg.position;
                else if (peg.location === 'home') score = 0;

                if (score > bestScore) {
                    bestScore = score;
                    bestPeg = pegIdx;
                }
            });

            selectPeg(bestPeg);
        }
    }

    // Expose functions to global scope
    window.launchTrouble = launchTrouble;
    window.exitTrouble = exitTrouble;
    window.setPlayerCount = setPlayerCount;
    window.setGameMode = setGameMode;
    window.startTroubleGame = startTroubleGame;
    window.rollDie = rollDie;
    window.selectPeg = selectPeg;

})();
