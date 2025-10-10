// Trouble Board Game
(function() {
    'use strict';

    const COLORS = ['red', 'blue', 'yellow', 'green'];
    const COLOR_NAMES = { red: 'Red', blue: 'Blue', yellow: 'Yellow', green: 'Green' };
    const BOARD_SPACES = 28; // Main circular track
    const FINISH_SPACES = 4; // Spaces in finish zone

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
    function getStartPosition(playerIndex) {
        return playerIndex * 7; // Each player starts 7 spaces apart
    }

    // Get finish entry position for each player
    function getFinishEntry(playerIndex) {
        return (getStartPosition(playerIndex) - 1 + BOARD_SPACES) % BOARD_SPACES;
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
        // Convert space index to angle (counter-clockwise starting from right)
        const angle = (spaceIndex / BOARD_SPACES) * 2 * Math.PI - Math.PI / 2;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    }

    function renderBoardBackground(boardSize, centerX, centerY) {
        const quadrantSize = boardSize * 0.28;
        const offset = boardSize * 0.12;

        return `
            <!-- Yellow quadrant (top-left) -->
            <rect x="${offset}" y="${offset}" width="${quadrantSize}" height="${quadrantSize}" fill="#FFD700" opacity="0.3" rx="8"/>
            <!-- Blue quadrant (top-right) -->
            <rect x="${boardSize - offset - quadrantSize}" y="${offset}" width="${quadrantSize}" height="${quadrantSize}" fill="#4169E1" opacity="0.3" rx="8"/>
            <!-- Green quadrant (bottom-left) -->
            <rect x="${offset}" y="${boardSize - offset - quadrantSize}" width="${quadrantSize}" height="${quadrantSize}" fill="#32CD32" opacity="0.3" rx="8"/>
            <!-- Red quadrant (bottom-right) -->
            <rect x="${boardSize - offset - quadrantSize}" y="${boardSize - offset - quadrantSize}" width="${quadrantSize}" height="${quadrantSize}" fill="#DC143C" opacity="0.3" rx="8"/>
        `;
    }

    function renderTrack(boardSize, centerX, centerY, radius) {
        const colors = ['#FFD700', '#4169E1', '#32CD32', '#DC143C'];
        let svg = '';

        for (let i = 0; i < BOARD_SPACES; i++) {
            const pos = getTrackPosition(i, centerX, centerY, radius);
            const startIndex = [0, 7, 14, 21].indexOf(i);
            const isStartSpace = startIndex !== -1;
            const fill = isStartSpace ? colors[startIndex] : '#1a1a1a';
            const stroke = isStartSpace ? colors[startIndex] : '#444';
            const strokeWidth = isStartSpace ? 3 : 2;

            svg += `
                <circle cx="${pos.x}" cy="${pos.y}" r="8" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"
                    class="track-space" data-space="${i}" opacity="${isStartSpace ? 0.8 : 1}"/>
            `;
        }
        return svg;
    }

    function renderHomeAreas(boardSize, centerX, centerY, homeRadius) {
        const colors = ['#FFD700', '#4169E1', '#32CD32', '#DC143C'];
        const positions = [
            { x: centerX - boardSize * 0.25, y: centerY - boardSize * 0.25 }, // Yellow
            { x: centerX + boardSize * 0.25, y: centerY - boardSize * 0.25 }, // Blue
            { x: centerX - boardSize * 0.25, y: centerY + boardSize * 0.25 }, // Green
            { x: centerX + boardSize * 0.25, y: centerY + boardSize * 0.25 }  // Red
        ];

        let svg = '';
        positions.forEach((pos, idx) => {
            // Home area background
            svg += `<circle cx="${pos.x}" cy="${pos.y}" r="${homeRadius}" fill="${colors[idx]}" opacity="0.2" stroke="${colors[idx]}" stroke-width="2"/>`;

            // 4 peg spots in home area
            const spotRadius = homeRadius * 0.35;
            const pegSpots = [
                { x: pos.x - spotRadius, y: pos.y - spotRadius },
                { x: pos.x + spotRadius, y: pos.y - spotRadius },
                { x: pos.x - spotRadius, y: pos.y + spotRadius },
                { x: pos.x + spotRadius, y: pos.y + spotRadius }
            ];

            pegSpots.forEach((spot, spotIdx) => {
                svg += `<circle cx="${spot.x}" cy="${spot.y}" r="6" fill="#1a1a1a" stroke="${colors[idx]}" stroke-width="1"
                    class="home-spot" data-player="${idx}" data-spot="${spotIdx}"/>`;
            });
        });

        return svg;
    }

    function renderFinishZones(boardSize, centerX, centerY, trackRadius, homeRadius) {
        const colors = ['#FFD700', '#4169E1', '#32CD32', '#DC143C'];
        let svg = '';

        for (let i = 0; i < 4; i++) {
            const homePos = [
                { x: centerX - boardSize * 0.25, y: centerY - boardSize * 0.25 },
                { x: centerX + boardSize * 0.25, y: centerY - boardSize * 0.25 },
                { x: centerX - boardSize * 0.25, y: centerY + boardSize * 0.25 },
                { x: centerX + boardSize * 0.25, y: centerY + boardSize * 0.25 }
            ][i];

            const finishEntry = getFinishEntry(i);
            const entryPos = getTrackPosition(finishEntry, centerX, centerY, trackRadius);

            // Draw finish zone path (4 spaces)
            for (let j = 0; j < FINISH_SPACES; j++) {
                const t = (j + 1) / (FINISH_SPACES + 1);
                const x = entryPos.x + (homePos.x - entryPos.x) * t;
                const y = entryPos.y + (homePos.y - entryPos.y) * t;

                svg += `<circle cx="${x}" cy="${y}" r="6" fill="${colors[i]}" stroke="${colors[i]}" stroke-width="2" opacity="0.5"
                    class="finish-space" data-player="${i}" data-position="${j}"/>`;
            }
        }

        return svg;
    }

    function renderPegs(boardSize, centerX, centerY, trackRadius, homeRadius) {
        let svg = '';
        const colors = ['#FFD700', '#4169E1', '#32CD32', '#DC143C'];

        troubleState.players.forEach((player, playerIdx) => {
            const playerColor = colors[playerIdx];

            player.pegs.forEach((peg, pegIdx) => {
                let pos = getPegVisualPosition(peg, playerIdx, pegIdx, boardSize, centerX, centerY, trackRadius, homeRadius);
                const isValidMove = troubleState.currentPlayer === playerIdx &&
                                   troubleState.dieValue !== null &&
                                   getValidMoves(playerIdx).includes(pegIdx);

                const pegSize = isValidMove ? 10 : 8;
                const strokeWidth = isValidMove ? 3 : 2;
                const opacity = isValidMove ? 1 : 0.9;
                const pulse = isValidMove ? 'peg-pulse' : '';

                svg += `
                    <circle cx="${pos.x}" cy="${pos.y}" r="${pegSize}" fill="${playerColor}"
                        stroke="white" stroke-width="${strokeWidth}" opacity="${opacity}"
                        class="game-peg ${pulse}" data-player="${playerIdx}" data-peg="${pegIdx}"
                        onclick="selectPeg(${pegIdx})" style="cursor: ${isValidMove ? 'pointer' : 'default'}; transition: all 0.3s ease;"/>
                `;
            });
        });

        return svg;
    }

    function getPegVisualPosition(peg, playerIdx, pegIdx, boardSize, centerX, centerY, trackRadius, homeRadius) {
        if (peg.location === 'home') {
            // Position in home area
            const homePositions = [
                { x: centerX - boardSize * 0.25, y: centerY - boardSize * 0.25 },
                { x: centerX + boardSize * 0.25, y: centerY - boardSize * 0.25 },
                { x: centerX - boardSize * 0.25, y: centerY + boardSize * 0.25 },
                { x: centerX + boardSize * 0.25, y: centerY + boardSize * 0.25 }
            ];
            const homePos = homePositions[playerIdx];
            const spotRadius = homeRadius * 0.35;
            const spots = [
                { x: homePos.x - spotRadius, y: homePos.y - spotRadius },
                { x: homePos.x + spotRadius, y: homePos.y - spotRadius },
                { x: homePos.x - spotRadius, y: homePos.y + spotRadius },
                { x: homePos.x + spotRadius, y: homePos.y + spotRadius }
            ];
            return spots[pegIdx];
        } else if (peg.location === 'track') {
            return getTrackPosition(peg.position, centerX, centerY, trackRadius);
        } else if (peg.location === 'finish') {
            const homePos = [
                { x: centerX - boardSize * 0.25, y: centerY - boardSize * 0.25 },
                { x: centerX + boardSize * 0.25, y: centerY - boardSize * 0.25 },
                { x: centerX - boardSize * 0.25, y: centerY + boardSize * 0.25 },
                { x: centerX + boardSize * 0.25, y: centerY + boardSize * 0.25 }
            ][playerIdx];

            const finishEntry = getFinishEntry(playerIdx);
            const entryPos = getTrackPosition(finishEntry, centerX, centerY, trackRadius);

            const t = (peg.position + 1) / (FINISH_SPACES + 1);
            return {
                x: entryPos.x + (homePos.x - entryPos.x) * t,
                y: entryPos.y + (homePos.y - entryPos.y) * t
            };
        } else if (peg.location === 'done') {
            // Position in center of home area
            const homePositions = [
                { x: centerX - boardSize * 0.25, y: centerY - boardSize * 0.25 },
                { x: centerX + boardSize * 0.25, y: centerY - boardSize * 0.25 },
                { x: centerX - boardSize * 0.25, y: centerY + boardSize * 0.25 },
                { x: centerX + boardSize * 0.25, y: centerY + boardSize * 0.25 }
            ];
            return homePositions[playerIdx];
        }

        return { x: centerX, y: centerY };
    }

    function renderCenterDie(centerX, centerY) {
        const dieSize = 40;
        return `
            <g class="center-die" onclick="rollDie()" style="cursor: pointer;">
                <circle cx="${centerX}" cy="${centerY}" r="${dieSize}" fill="#333" stroke="#666" stroke-width="3" opacity="0.9"/>
                <circle cx="${centerX}" cy="${centerY}" r="${dieSize - 5}" fill="#444" opacity="0.8"/>
                ${troubleState.dieValue ? `
                    <text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle"
                        fill="white" font-size="24" font-weight="bold">${troubleState.dieValue}</text>
                ` : `
                    <text x="${centerX}" y="${centerY - 5}" text-anchor="middle" dominant-baseline="middle"
                        fill="white" font-size="20">🎲</text>
                    <text x="${centerX}" y="${centerY + 12}" text-anchor="middle" dominant-baseline="middle"
                        fill="white" font-size="10">POP</text>
                `}
            </g>
        `;
    }

    function renderBoard() {
        const boardSize = Math.min(400, window.innerWidth - 40);
        const centerX = boardSize / 2;
        const centerY = boardSize / 2;
        const trackRadius = boardSize * 0.35;
        const homeRadius = boardSize * 0.15;

        return `
            <style>
                @keyframes peg-pulse {
                    0%, 100% {
                        transform: scale(1);
                        filter: drop-shadow(0 0 3px rgba(255,255,255,0.5));
                    }
                    50% {
                        transform: scale(1.2);
                        filter: drop-shadow(0 0 8px rgba(255,255,255,0.9));
                    }
                }
                .peg-pulse {
                    animation: peg-pulse 0.8s ease-in-out infinite;
                    transform-origin: center;
                }
                @keyframes die-pop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                }
                .die-popping {
                    animation: die-pop 0.3s ease-out;
                }
                .game-peg {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .track-space:hover, .center-die:hover {
                    opacity: 0.8;
                }
            </style>
            <div style="position: relative; max-width: ${boardSize}px; margin: 0 auto;">
                <svg width="${boardSize}" height="${boardSize}" viewBox="0 0 ${boardSize} ${boardSize}" style="background: #2a2a2a; border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.3);">
                    ${renderBoardBackground(boardSize, centerX, centerY)}
                    ${renderTrack(boardSize, centerX, centerY, trackRadius)}
                    ${renderHomeAreas(boardSize, centerX, centerY, homeRadius)}
                    ${renderFinishZones(boardSize, centerX, centerY, trackRadius, homeRadius)}
                    ${renderPegs(boardSize, centerX, centerY, trackRadius, homeRadius)}
                    ${renderCenterDie(centerX, centerY)}
                </svg>
            </div>
        `;
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
