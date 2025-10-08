// Battleship Game
(function() {
    'use strict';

    // Battleship Game State
    let battleshipState = {
        phase: 'setup', // setup, player1_place, player2_place, battle
        currentPlayer: 1,
        player1: {
            grid: Array(10).fill(null).map(() => Array(10).fill(null)),
            ships: [],
            hits: [],
            misses: []
        },
        player2: {
            grid: Array(10).fill(null).map(() => Array(10).fill(null)),
            ships: [],
            hits: [],
            misses: []
        },
        ships: [
            { name: 'Carrier', size: 5, placed: false },
            { name: 'Battleship', size: 4, placed: false },
            { name: 'Cruiser', size: 3, placed: false },
            { name: 'Submarine', size: 3, placed: false },
            { name: 'Destroyer', size: 2, placed: false }
        ],
        currentShipIndex: 0,
        orientation: 'horizontal'
    };

    // Game launcher functions
    function launchBattleship() {
        // Reset game state
        battleshipState = {
            phase: 'setup',
            currentPlayer: 1,
            player1Name: '',
            player2Name: '',
            player1: {
                grid: Array(10).fill(null).map(() => Array(10).fill(null)),
                ships: [],
                hits: [],
                misses: []
            },
            player2: {
                grid: Array(10).fill(null).map(() => Array(10).fill(null)),
                ships: [],
                hits: [],
                misses: []
            },
            ships: [
                { name: 'Carrier', size: 5, placed: false },
                { name: 'Battleship', size: 4, placed: false },
                { name: 'Cruiser', size: 3, placed: false },
                { name: 'Submarine', size: 3, placed: false },
                { name: 'Destroyer', size: 2, placed: false }
            ],
            currentShipIndex: 0,
            orientation: 'horizontal'
        };

        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('battleshipGame').style.display = 'block';
        showBattleshipSetup();
    }

    function exitBattleship() {
        document.getElementById('battleshipGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    }

    function showBattleshipSetup() {
        const content = document.getElementById('battleshipContent');
        content.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; color: white;">
                <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">⚓ Welcome to Battleship!</h2>
                <p style="font-size: 1.2rem; margin-bottom: 2rem;">Classic naval combat game</p>
                <div style="background: rgba(255,255,255,0.2); padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;">How to Play:</h3>
                    <p style="text-align: left; max-width: 500px; margin: 0 auto; line-height: 1.6;">
                        1. Place 5 ships on a 10x10 grid<br>
                        2. Take turns attacking enemy positions<br>
                        3. First to sink all opponent's ships wins!
                    </p>
                </div>
                <h3 style="margin-bottom: 1rem;">Choose Game Mode:</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; max-width: 600px; margin: 0 auto;">
                    <button onclick="selectPassAndPlay()" style="background: white; color: #667eea; border: none; padding: 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        👥 Pass & Play<br>
                        <span style="font-size: 0.9rem; font-weight: normal;">2 Players</span>
                    </button>
                    <button onclick="selectVsAI()" style="background: rgba(255,255,255,0.3); color: white; border: 2px solid white; padding: 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        🤖 vs Computer<br>
                        <span style="font-size: 0.9rem; font-weight: normal;">Single Player</span>
                    </button>
                </div>
            </div>
        `;
    }

    function selectPassAndPlay() {
        battleshipState.isAI = false;
        showPlayerNames();
    }

    function selectVsAI() {
        battleshipState.isAI = true;
        showPlayerNames();
    }

    function showPlayerNames() {
        const content = document.getElementById('battleshipContent');
        content.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; color: white;">
                <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">⚓ Player Names</h2>
                <div style="background: rgba(255,255,255,0.2); padding: 2rem; border-radius: 10px; max-width: 400px; margin: 0 auto;">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 1.1rem;">Player 1 Name:</label>
                        <input type="text" id="player1Name" placeholder="Enter name" value="${battleshipState.player1Name || ''}"
                               style="width: 100%; padding: 0.75rem; border: none; border-radius: 8px; font-size: 1rem;">
                    </div>
                    ${!battleshipState.isAI ? `
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 1.1rem;">Player 2 Name:</label>
                        <input type="text" id="player2Name" placeholder="Enter name" value="${battleshipState.player2Name || ''}"
                               style="width: 100%; padding: 0.75rem; border: none; border-radius: 8px; font-size: 1rem;">
                    </div>
                    ` : ''}
                    <button onclick="startWithNames()" style="background: white; color: #667eea; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold; width: 100%;">
                        Start Game
                    </button>
                </div>
            </div>
        `;
    }

    function startWithNames() {
        const player1Input = document.getElementById('player1Name').value.trim();
        const player2Input = battleshipState.isAI ? 'Computer' : document.getElementById('player2Name').value.trim();

        battleshipState.player1Name = player1Input || 'Player 1';
        battleshipState.player2Name = player2Input || 'Player 2';

        startPlayer1Setup();
    }

    function startPassAndPlay() {
        battleshipState.isAI = false;
        startPlayer1Setup();
    }

    function startVsAI() {
        battleshipState.isAI = true;
        startPlayer1Setup();
    }

    function startPlayer1Setup() {
        battleshipState.phase = 'player1_place';
        battleshipState.currentShipIndex = 0;
        showShipPlacement(1);
    }

    function showShipPlacement(player) {
        const ship = battleshipState.ships[battleshipState.currentShipIndex];
        const content = document.getElementById('battleshipContent');
        const playerName = player === 1 ? battleshipState.player1Name : battleshipState.player2Name;

        const canUndo = battleshipState.currentShipIndex > 0;

        content.innerHTML = `
            <div style="background: #f8f9fa; padding: 0.4rem; border-radius: 8px; margin-bottom: 0.4rem;">
                <h3 style="margin: 0 0 0.2rem 0; font-size: 0.95rem;">${playerName} - ${ship.name} (${ship.size}) - ${battleshipState.currentShipIndex + 1}/5</h3>
                <div style="display: flex; gap: 0.4rem; margin-top: 0.3rem; flex-wrap: wrap;">
                    <button onclick="toggleOrientation()" style="background: #667eea; color: white; border: none; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
                        ${battleshipState.orientation === 'horizontal' ? '→ Horiz' : '↓ Vert'}
                    </button>
                    <button onclick="undoLastShip()" style="background: ${canUndo ? '#e74c3c' : '#ccc'}; color: white; border: none; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: ${canUndo ? 'pointer' : 'not-allowed'}; font-size: 0.8rem;" ${!canUndo ? 'disabled' : ''}>
                        ↶ Undo
                    </button>
                </div>
            </div>
            ${renderPlacementGrid(player)}
        `;
    }

    function renderPlacementGrid(player) {
        const playerData = player === 1 ? battleshipState.player1 : battleshipState.player2;
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        // Calculate cell size: very compact to fit on screen
        const cellSize = 'calc((95vw - 3vw) / 10)';
        const headerSize = '3vw';

        let html = '<div>';

        // Column headers (1-10)
        html += `<div style="display: flex; margin-bottom: 1px; margin-left: ${headerSize};">`;
        for (let i = 1; i <= 10; i++) {
            html += `<div style="width: ${cellSize}; text-align: center; font-weight: bold; color: #667eea; font-size: clamp(0.45rem, 1.2vw, 0.65rem);">${i}</div>`;
        }
        html += '</div>';

        // Grid with row headers (A-J)
        for (let row = 0; row < 10; row++) {
            html += '<div style="display: flex; margin-bottom: 1px;">';
            html += `<div style="width: ${headerSize}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #667eea; font-size: clamp(0.45rem, 1.2vw, 0.65rem);">${letters[row]}</div>`;
            for (let col = 0; col < 10; col++) {
                const hasShip = playerData.grid[row][col] !== null;
                html += `
                    <div onclick="placeShipAt(${row}, ${col})"
                         style="width: ${cellSize}; height: ${cellSize}; border: 1px solid #ddd; background: ${hasShip ? '#667eea' : '#e9ecef'}; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: clamp(0.35rem, 0.9vw, 0.55rem); color: white; font-weight: bold; transition: all 0.2s; box-sizing: border-box;"
                         onmouseover="this.style.background='${hasShip ? '#764ba2' : '#d4d4d4'}'"
                         onmouseout="this.style.background='${hasShip ? '#667eea' : '#e9ecef'}'">
                        ${hasShip ? '🚢' : ''}
                    </div>
                `;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    function toggleOrientation() {
        battleshipState.orientation = battleshipState.orientation === 'horizontal' ? 'vertical' : 'horizontal';
        showShipPlacement(battleshipState.phase === 'player1_place' ? 1 : 2);
    }

    function undoLastShip() {
        if (battleshipState.currentShipIndex === 0) return;

        const player = battleshipState.phase === 'player1_place' ? 1 : 2;
        const playerData = player === 1 ? battleshipState.player1 : battleshipState.player2;

        // Remove the last ship from the ships array
        const lastShip = playerData.ships.pop();

        // Clear those positions from the grid
        lastShip.positions.forEach(([r, c]) => {
            playerData.grid[r][c] = null;
        });

        // Go back to placing the previous ship
        battleshipState.currentShipIndex--;
        showShipPlacement(player);
    }

    function placeShipAt(row, col) {
        const player = battleshipState.phase === 'player1_place' ? 1 : 2;
        const playerData = player === 1 ? battleshipState.player1 : battleshipState.player2;
        const ship = battleshipState.ships[battleshipState.currentShipIndex];

        // Check if placement is valid
        const positions = [];
        for (let i = 0; i < ship.size; i++) {
            const r = battleshipState.orientation === 'horizontal' ? row : row + i;
            const c = battleshipState.orientation === 'horizontal' ? col + i : col;

            if (r >= 10 || c >= 10 || playerData.grid[r][c] !== null) {
                alert('Invalid placement! Ship goes off grid or overlaps another ship.');
                return;
            }

            // Check adjacent squares for other ships (no touching allowed)
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const checkR = r + dr;
                    const checkC = c + dc;
                    if (checkR >= 0 && checkR < 10 && checkC >= 0 && checkC < 10) {
                        if (playerData.grid[checkR][checkC] !== null) {
                            alert('Invalid placement! Ships cannot touch each other (including diagonally).');
                            return;
                        }
                    }
                }
            }

            positions.push([r, c]);
        }

        // Place the ship
        positions.forEach(([r, c]) => {
            playerData.grid[r][c] = ship.name;
        });

        playerData.ships.push({
            name: ship.name,
            positions: positions,
            hits: []
        });

        battleshipState.currentShipIndex++;

        // Check if all ships placed
        if (battleshipState.currentShipIndex >= battleshipState.ships.length) {
            if (battleshipState.phase === 'player1_place') {
                showPassPhone(2);
            } else {
                startBattlePhase();
            }
        } else {
            showShipPlacement(player);
        }
    }

    function showPassPhone(toPlayer) {
        // If AI mode, skip pass phone and auto-place AI ships
        if (battleshipState.isAI && toPlayer === 2) {
            placeAIShips();
            startBattlePhase();
            return;
        }

        const fromPlayerName = toPlayer === 2 ? battleshipState.player1Name : battleshipState.player2Name;
        const toPlayerName = toPlayer === 2 ? battleshipState.player2Name : battleshipState.player1Name;

        const content = document.getElementById('battleshipContent');
        content.innerHTML = `
            <div style="text-align: center; padding: 4rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; color: white;">
                <h2 style="font-size: 3rem; margin-bottom: 2rem;">📱 Pass the Phone!</h2>
                <p style="font-size: 1.5rem; margin-bottom: 3rem;">${fromPlayerName} look away!<br>Give phone to ${toPlayerName}</p>
                <button onclick="${toPlayer === 2 ? 'startPlayer2Setup()' : 'startBattlePhase()'}" style="background: white; color: #f5576c; border: none; padding: 1.5rem 3rem; border-radius: 10px; cursor: pointer; font-size: 1.3rem; font-weight: bold;">${toPlayerName} Ready!</button>
            </div>
        `;
    }

    function placeAIShips() {
        battleshipState.ships.forEach(shipType => {
            let placed = false;
            while (!placed) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';

                // Check if valid placement
                const positions = [];
                let valid = true;

                for (let i = 0; i < shipType.size; i++) {
                    const r = orientation === 'horizontal' ? row : row + i;
                    const c = orientation === 'horizontal' ? col + i : col;

                    if (r >= 10 || c >= 10 || battleshipState.player2.grid[r][c] !== null) {
                        valid = false;
                        break;
                    }

                    // Check adjacent squares for other ships (no touching allowed)
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const checkR = r + dr;
                            const checkC = c + dc;
                            if (checkR >= 0 && checkR < 10 && checkC >= 0 && checkC < 10) {
                                if (battleshipState.player2.grid[checkR][checkC] !== null) {
                                    valid = false;
                                    break;
                                }
                            }
                        }
                        if (!valid) break;
                    }
                    if (!valid) break;

                    positions.push([r, c]);
                }

                if (valid) {
                    positions.forEach(([r, c]) => {
                        battleshipState.player2.grid[r][c] = shipType.name;
                    });

                    battleshipState.player2.ships.push({
                        name: shipType.name,
                        positions: positions,
                        hits: []
                    });

                    placed = true;
                }
            }
        });
    }

    function startPlayer2Setup() {
        battleshipState.phase = 'player2_place';
        battleshipState.currentShipIndex = 0;
        showShipPlacement(2);
    }

    function startBattlePhase() {
        battleshipState.phase = 'battle';
        battleshipState.currentPlayer = 1;
        showBattleTurn();
    }

    function showBattleTurn() {
        const content = document.getElementById('battleshipContent');
        const currentPlayer = battleshipState.currentPlayer;
        const opponent = currentPlayer === 1 ? 2 : 1;
        const opponentData = opponent === 1 ? battleshipState.player1 : battleshipState.player2;

        const playerName = currentPlayer === 1 ? battleshipState.player1Name : battleshipState.player2Name;
        const opponentName = opponent === 1 ? battleshipState.player1Name : battleshipState.player2Name;

        content.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.4rem; border-radius: 8px; margin-bottom: 0.4rem;">
                <h2 style="margin: 0; font-size: 1rem;">${playerName}'s Turn • ${opponentData.ships.filter(s => s.hits.length === s.positions.length).length}/5 Sunk</h2>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 0.3rem; max-width: 95vw; margin: 0 auto;">
                <!-- Attack Grid (opponent's grid - hidden ships) -->
                <div>
                    <h3 style="margin: 0 0 0.2rem 0; color: #e74c3c; font-size: 0.85rem;">🎯 Attack</h3>
                    ${renderAttackGrid(opponent)}
                </div>

                <!-- Your Grid (show your ships and where you've been hit) -->
                <div>
                    <h3 style="margin: 0 0 0.2rem 0; color: #667eea; font-size: 0.85rem;">🚢 Defense</h3>
                    ${renderDefenseGrid(currentPlayer)}
                </div>
            </div>
        `;
    }

    function renderAttackGrid(opponentPlayer) {
        const opponentData = opponentPlayer === 1 ? battleshipState.player1 : battleshipState.player2;
        const currentPlayerData = battleshipState.currentPlayer === 1 ? battleshipState.player1 : battleshipState.player2;
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        // Calculate cell size: very compact to fit on screen
        const cellSize = 'calc((95vw - 3vw) / 10)';
        const headerSize = '3vw';

        let html = '<div>';

        // Column headers (1-10)
        html += `<div style="display: flex; margin-bottom: 1px; margin-left: ${headerSize};">`;
        for (let i = 1; i <= 10; i++) {
            html += `<div style="width: ${cellSize}; text-align: center; font-weight: bold; color: #e74c3c; font-size: clamp(0.45rem, 1.2vw, 0.65rem);">${i}</div>`;
        }
        html += '</div>';

        // Grid with row headers (A-J)
        for (let row = 0; row < 10; row++) {
            html += '<div style="display: flex; margin-bottom: 1px;">';
            html += `<div style="width: ${headerSize}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #e74c3c; font-size: clamp(0.45rem, 1.2vw, 0.65rem);">${letters[row]}</div>`;
            for (let col = 0; col < 10; col++) {
                const coord = `${row},${col}`;
                const hasShip = opponentData.grid[row][col] !== null;
                const wasHit = currentPlayerData.hits && currentPlayerData.hits.some(h => h[0] === row && h[1] === col);
                const wasMiss = currentPlayerData.misses && currentPlayerData.misses.some(m => m[0] === row && m[1] === col);

                let bg = '#e9ecef';
                let content = '';
                let clickable = true;

                if (wasHit) {
                    bg = '#e74c3c';
                    content = '💥';
                    clickable = false;
                } else if (wasMiss) {
                    bg = '#3498db';
                    content = '💧';
                    clickable = false;
                }

                html += `
                    <div onclick="${clickable ? `makeAttack(${row}, ${col})` : ''}"
                         style="width: ${cellSize}; height: ${cellSize}; border: 1px solid #ddd; background: ${bg}; cursor: ${clickable ? 'pointer' : 'not-allowed'}; display: flex; align-items: center; justify-content: center; font-size: clamp(0.5rem, 1.3vw, 0.75rem); transition: all 0.2s; box-sizing: border-box;"
                         ${clickable ? `onmouseover="this.style.background='#d4d4d4'" onmouseout="this.style.background='${bg}'"` : ''}>
                        ${content}
                    </div>
                `;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    function renderDefenseGrid(player) {
        const playerData = player === 1 ? battleshipState.player1 : battleshipState.player2;
        const opponentData = player === 1 ? battleshipState.player2 : battleshipState.player1;
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        // Calculate cell size: very compact to fit on screen
        const cellSize = 'calc((95vw - 3vw) / 10)';
        const headerSize = '3vw';

        let html = '<div>';

        // Column headers (1-10)
        html += `<div style="display: flex; margin-bottom: 1px; margin-left: ${headerSize};">`;
        for (let i = 1; i <= 10; i++) {
            html += `<div style="width: ${cellSize}; text-align: center; font-weight: bold; color: #667eea; font-size: clamp(0.45rem, 1.2vw, 0.65rem);">${i}</div>`;
        }
        html += '</div>';

        // Grid with row headers (A-J)
        for (let row = 0; row < 10; row++) {
            html += '<div style="display: flex; margin-bottom: 1px;">';
            html += `<div style="width: ${headerSize}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #667eea; font-size: clamp(0.45rem, 1.2vw, 0.65rem);">${letters[row]}</div>`;
            for (let col = 0; col < 10; col++) {
                const hasShip = playerData.grid[row][col] !== null;
                const wasHitByOpponent = opponentData.hits && opponentData.hits.some(h => h[0] === row && h[1] === col);
                const wasMissedByOpponent = opponentData.misses && opponentData.misses.some(m => m[0] === row && m[1] === col);

                let bg = hasShip ? '#667eea' : '#e9ecef';
                let content = hasShip ? '🚢' : '';

                if (wasHitByOpponent) {
                    bg = '#e74c3c';
                    content = '💥';
                } else if (wasMissedByOpponent) {
                    bg = '#3498db';
                    content = '💧';
                }

                html += `
                    <div style="width: ${cellSize}; height: ${cellSize}; border: 1px solid #ddd; background: ${bg}; display: flex; align-items: center; justify-content: center; font-size: ${hasShip && !wasHitByOpponent ? 'clamp(0.35rem, 0.9vw, 0.55rem)' : 'clamp(0.5rem, 1.3vw, 0.75rem)'}; color: white; box-sizing: border-box;">
                        ${content}
                    </div>
                `;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    function makeAttack(row, col) {
        const currentPlayer = battleshipState.currentPlayer;
        const opponent = currentPlayer === 1 ? 2 : 1;
        const currentPlayerData = currentPlayer === 1 ? battleshipState.player1 : battleshipState.player2;
        const opponentData = opponent === 1 ? battleshipState.player1 : battleshipState.player2;

        // Check if already attacked
        const alreadyHit = currentPlayerData.hits && currentPlayerData.hits.some(h => h[0] === row && h[1] === col);
        const alreadyMiss = currentPlayerData.misses && currentPlayerData.misses.some(m => m[0] === row && m[1] === col);

        if (alreadyHit || alreadyMiss) {
            alert('You already attacked this spot!');
            return;
        }

        // Check if hit or miss
        const hasShip = opponentData.grid[row][col] !== null;

        if (hasShip) {
            // HIT!
            if (!currentPlayerData.hits) currentPlayerData.hits = [];
            currentPlayerData.hits.push([row, col]);

            // Find which ship was hit and mark it
            const shipName = opponentData.grid[row][col];
            const ship = opponentData.ships.find(s => s.name === shipName);
            if (ship && !ship.hits.some(h => h[0] === row && h[1] === col)) {
                ship.hits.push([row, col]);
            }

            // Check if ship is sunk
            if (ship && ship.hits.length === ship.positions.length) {
                setTimeout(() => {
                    alert(`💥 HIT! You sunk their ${ship.name}!`);
                    checkForWin();
                }, 100);
            } else {
                setTimeout(() => {
                    alert('💥 HIT!');
                    switchTurn();
                }, 100);
                return;
            }
        } else {
            // MISS!
            if (!currentPlayerData.misses) currentPlayerData.misses = [];
            currentPlayerData.misses.push([row, col]);

            setTimeout(() => {
                alert('💧 Miss!');
                switchTurn();
            }, 100);
            return;
        }
    }

    function checkForWin() {
        const opponent = battleshipState.currentPlayer === 1 ? 2 : 1;
        const opponentData = opponent === 1 ? battleshipState.player1 : battleshipState.player2;

        const allShipsSunk = opponentData.ships.every(ship => ship.hits.length === ship.positions.length);

        if (allShipsSunk) {
            showWinner();
        } else {
            switchTurn();
        }
    }

    function switchTurn() {
        const nextPlayer = battleshipState.currentPlayer === 1 ? 2 : 1;

        // If AI mode
        if (battleshipState.isAI) {
            if (nextPlayer === 2) {
                // AI's turn - make AI attack immediately
                battleshipState.currentPlayer = 2;
                setTimeout(() => makeAIAttack(), 800);
            } else {
                // Player 1's turn in AI mode - go straight to battle screen
                battleshipState.currentPlayer = 1;
                showBattleTurn();
            }
            return;
        }

        // Pass and play mode - show pass phone screen
        const currentPlayerName = battleshipState.currentPlayer === 1 ? battleshipState.player1Name : battleshipState.player2Name;
        const nextPlayerName = nextPlayer === 1 ? battleshipState.player1Name : battleshipState.player2Name;

        const content = document.getElementById('battleshipContent');
        content.innerHTML = `
            <div style="text-align: center; padding: 4rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; color: white;">
                <h2 style="font-size: 3rem; margin-bottom: 2rem;">📱 Pass the Phone!</h2>
                <p style="font-size: 1.5rem; margin-bottom: 3rem;">${currentPlayerName} look away!<br>Give phone to ${nextPlayerName}</p>
                <button onclick="continueToNextTurn()" style="background: white; color: #f5576c; border: none; padding: 1.5rem 3rem; border-radius: 10px; cursor: pointer; font-size: 1.3rem; font-weight: bold;">${nextPlayerName} Ready!</button>
            </div>
        `;
    }

    function continueToNextTurn() {
        battleshipState.currentPlayer = battleshipState.currentPlayer === 1 ? 2 : 1;
        showBattleTurn();
    }

    function makeAIAttack() {
        // Initialize AI state if needed
        if (!battleshipState.aiState) {
            battleshipState.aiState = {
                mode: 'hunt', // 'hunt' or 'target'
                lastHit: null,
                targetQueue: []
            };
        }

        let row, col;
        const aiData = battleshipState.player2;
        const playerData = battleshipState.player1;

        // Target mode: AI hit a ship and is trying to sink it
        if (battleshipState.aiState.mode === 'target' && battleshipState.aiState.targetQueue.length > 0) {
            [row, col] = battleshipState.aiState.targetQueue.shift();
        } else {
            // Hunt mode: Random attack
            let found = false;
            while (!found) {
                row = Math.floor(Math.random() * 10);
                col = Math.floor(Math.random() * 10);

                const alreadyHit = aiData.hits && aiData.hits.some(h => h[0] === row && h[1] === col);
                const alreadyMiss = aiData.misses && aiData.misses.some(m => m[0] === row && m[1] === col);

                if (!alreadyHit && !alreadyMiss) {
                    found = true;
                }
            }
            battleshipState.aiState.mode = 'hunt';
        }

        // Execute the attack
        const hasShip = playerData.grid[row][col] !== null;

        if (hasShip) {
            // HIT!
            if (!aiData.hits) aiData.hits = [];
            aiData.hits.push([row, col]);

            const shipName = playerData.grid[row][col];
            const ship = playerData.ships.find(s => s.name === shipName);
            if (ship && !ship.hits.some(h => h[0] === row && h[1] === col)) {
                ship.hits.push([row, col]);
            }

            // Add adjacent squares to target queue
            if (ship.hits.length < ship.positions.length) {
                battleshipState.aiState.mode = 'target';
                battleshipState.aiState.lastHit = [row, col];

                // Add adjacent squares to queue (up, down, left, right)
                [[row-1, col], [row+1, col], [row, col-1], [row, col+1]].forEach(([r, c]) => {
                    if (r >= 0 && r < 10 && c >= 0 && c < 10) {
                        const alreadyQueued = battleshipState.aiState.targetQueue.some(t => t[0] === r && t[1] === c);
                        const alreadyHit = aiData.hits && aiData.hits.some(h => h[0] === r && h[1] === c);
                        const alreadyMiss = aiData.misses && aiData.misses.some(m => m[0] === r && m[1] === c);

                        if (!alreadyQueued && !alreadyHit && !alreadyMiss) {
                            battleshipState.aiState.targetQueue.push([r, c]);
                        }
                    }
                });
            }

            // Check if ship sunk
            if (ship && ship.hits.length === ship.positions.length) {
                battleshipState.aiState.mode = 'hunt';
                battleshipState.aiState.targetQueue = [];

                setTimeout(() => {
                    alert(`💥 Computer HIT! Computer sunk your ${ship.name}!`);
                    checkForWinAI();
                }, 500);
            } else {
                setTimeout(() => {
                    alert('💥 Computer HIT!');
                    switchTurn();
                }, 500);
            }
        } else {
            // MISS!
            if (!aiData.misses) aiData.misses = [];
            aiData.misses.push([row, col]);

            setTimeout(() => {
                alert('💧 Computer missed!');
                switchTurn();
            }, 500);
        }
    }

    function checkForWinAI() {
        const allShipsSunk = battleshipState.player1.ships.every(ship => ship.hits.length === ship.positions.length);

        if (allShipsSunk) {
            showWinner();
        } else {
            switchTurn();
        }
    }

    function showWinner() {
        const winner = battleshipState.currentPlayer;
        const content = document.getElementById('battleshipContent');
        const winnerName = winner === 1 ? battleshipState.player1Name : battleshipState.player2Name;

        content.innerHTML = `
            <div style="text-align: center; padding: 4rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; color: white;">
                <h2 style="font-size: 4rem; margin-bottom: 1rem;">${winner === 2 && battleshipState.isAI ? '😔' : '🎉'} ${winner === 2 && battleshipState.isAI ? 'Game Over' : 'Victory!'}</h2>
                <p style="font-size: 2rem; margin-bottom: 3rem;">${winnerName} Wins!</p>
                <p style="font-size: 1.2rem; margin-bottom: 3rem;">All enemy ships have been sunk!</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="launchBattleship()" style="background: white; color: #667eea; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">🔄 Play Again</button>
                    <button onclick="exitBattleship()" style="background: rgba(255,255,255,0.3); color: white; border: 2px solid white; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">← Back to Games</button>
                </div>
            </div>
        `;
    }

    // Expose functions to global scope
    window.launchBattleship = launchBattleship;
    window.exitBattleship = exitBattleship;
    window.selectPassAndPlay = selectPassAndPlay;
    window.selectVsAI = selectVsAI;
    window.startWithNames = startWithNames;
    window.startPassAndPlay = startPassAndPlay;
    window.startVsAI = startVsAI;
    window.toggleOrientation = toggleOrientation;
    window.undoLastShip = undoLastShip;
    window.placeShipAt = placeShipAt;
    window.startPlayer2Setup = startPlayer2Setup;
    window.makeAttack = makeAttack;
    window.continueToNextTurn = continueToNextTurn;

})();
