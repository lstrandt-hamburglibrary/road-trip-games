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
                        ${player.name}'s Turn
                    </div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 0.25rem;">
                        ${troubleState.message}
                    </div>
                </div>

                ${renderBoard()}

                <div style="margin: 1rem 0;">
                    ${renderDieButton()}
                </div>

                <button onclick="exitTrouble()" style="background: #6c757d; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                    ← Back
                </button>
            </div>
        `;
    }

    function renderBoard() {
        // Simplified board visualization for mobile
        return `
            <div style="max-width: 400px; margin: 0 auto; background: #f5f5f5; padding: 1rem; border-radius: 12px;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    ${troubleState.players.map((p, idx) => renderPlayerZone(p, idx)).join('')}
                </div>
                ${renderTrackSummary()}
            </div>
        `;
    }

    function renderPlayerZone(player, playerIndex) {
        const homeCount = player.pegs.filter(p => p.location === 'home').length;
        const trackCount = player.pegs.filter(p => p.location === 'track').length;
        const finishCount = player.pegs.filter(p => p.location === 'finish').length;
        const doneCount = player.pegs.filter(p => p.location === 'done').length;

        return `
            <div style="background: white; padding: 0.75rem; border-radius: 8px; border: 2px solid ${player.color};">
                <div style="font-weight: bold; color: ${player.color}; margin-bottom: 0.5rem;">
                    ${player.name}${player.isAI ? ' (AI)' : ''}
                </div>
                <div style="font-size: 0.85rem; line-height: 1.5;">
                    🏠 Home: ${homeCount}<br>
                    🔄 Track: ${trackCount}<br>
                    🎯 Finish: ${finishCount}<br>
                    ✅ Done: ${doneCount}
                </div>
                ${renderPegButtons(player, playerIndex)}
            </div>
        `;
    }

    function renderPegButtons(player, playerIndex) {
        if (troubleState.currentPlayer !== playerIndex || !troubleState.dieValue) {
            return '';
        }

        const validMoves = getValidMoves(playerIndex);
        if (validMoves.length === 0) {
            return '<div style="margin-top: 0.5rem; font-size: 0.75rem; color: #999;">No valid moves</div>';
        }

        return `
            <div style="margin-top: 0.5rem; display: flex; gap: 0.25rem; flex-wrap: wrap;">
                ${player.pegs.map((peg, pegIdx) => {
                    const isValid = validMoves.includes(pegIdx);
                    if (!isValid) return '';
                    return `
                        <button onclick="selectPeg(${pegIdx})" style="background: ${player.color}; color: white; border: none; padding: 0.4rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold;">
                            Peg ${pegIdx + 1}
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderTrackSummary() {
        // Show which pegs are on the track
        const pegsOnTrack = [];
        troubleState.players.forEach((player, pIdx) => {
            player.pegs.forEach((peg, pegIdx) => {
                if (peg.location === 'track') {
                    pegsOnTrack.push({
                        position: peg.position,
                        color: player.color,
                        playerIdx: pIdx,
                        pegIdx: pegIdx
                    });
                }
            });
        });

        if (pegsOnTrack.length === 0) {
            return '<div style="margin-top: 1rem; font-size: 0.9rem; color: #999;">No pegs on track yet</div>';
        }

        pegsOnTrack.sort((a, b) => a.position - b.position);

        return `
            <div style="margin-top: 1rem;">
                <div style="font-weight: bold; margin-bottom: 0.5rem; font-size: 0.9rem;">Track:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; justify-content: center;">
                    ${pegsOnTrack.map(peg => `
                        <div style="background: ${peg.color}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                            Pos ${peg.position}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderDieButton() {
        if (troubleState.dieValue === null) {
            return `
                <button onclick="rollDie()" style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); color: white; border: none; padding: 1.5rem; border-radius: 50%; width: 100px; height: 100px; cursor: pointer; font-size: 1rem; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <div style="font-size: 2rem;">🎲</div>
                    POP!
                </button>
            `;
        } else {
            return `
                <div style="display: inline-block; background: white; border: 3px solid #333; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <div style="font-size: 3rem; font-weight: bold;">${troubleState.dieValue}</div>
                </div>
            `;
        }
    }

    function rollDie() {
        troubleState.dieValue = Math.floor(Math.random() * 6) + 1;
        const validMoves = getValidMoves(troubleState.currentPlayer);

        if (validMoves.length === 0) {
            troubleState.message = `Rolled ${troubleState.dieValue} - No valid moves!`;
            setTimeout(() => {
                endTurn();
            }, 1500);
        } else {
            troubleState.message = `Rolled ${troubleState.dieValue} - Select a peg to move`;
        }

        showGameBoard();
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
        const player = troubleState.players[troubleState.currentPlayer];
        const peg = player.pegs[pegIndex];
        const dieValue = troubleState.dieValue;

        if (peg.location === 'home' && dieValue === 6) {
            // Move to start
            peg.location = 'track';
            peg.position = getStartPosition(troubleState.currentPlayer);
            checkForCapture(troubleState.currentPlayer, peg.position);
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
                checkForCapture(troubleState.currentPlayer, peg.position);
                troubleState.message = `${player.name} moved forward ${dieValue} spaces`;
            }
        } else if (peg.location === 'finish') {
            const newFinishPos = peg.position + dieValue;
            if (newFinishPos === FINISH_SPACES) {
                peg.location = 'done';
                peg.position = 0;
                troubleState.message = `${player.name} got a peg HOME!`;

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

        if (!troubleState.gameOver) {
            if (troubleState.extraRoll) {
                troubleState.dieValue = null;
                troubleState.extraRoll = false;
                troubleState.message += ' - Roll again!';
            } else {
                setTimeout(() => endTurn(), 1000);
            }
        }

        showGameBoard();
    }

    function checkForCapture(playerIndex, position) {
        troubleState.players.forEach((opponent, oppIdx) => {
            if (oppIdx !== playerIndex) {
                opponent.pegs.forEach(peg => {
                    if (peg.location === 'track' && peg.position === position) {
                        peg.location = 'home';
                        peg.position = 0;
                        troubleState.message += ` - Sent ${opponent.name}'s peg home!`;
                    }
                });
            }
        });
    }

    function endTurn() {
        troubleState.dieValue = null;
        troubleState.selectedPeg = null;

        // Move to next player
        troubleState.currentPlayer = (troubleState.currentPlayer + 1) % troubleState.players.length;
        const nextPlayer = troubleState.players[troubleState.currentPlayer];
        troubleState.message = `${nextPlayer.name}'s turn - Pop the die!`;

        showGameBoard();

        // If AI turn, roll after a delay
        if (nextPlayer.isAI && !troubleState.gameOver) {
            setTimeout(() => {
                rollDie();
                setTimeout(() => makeAIMove(), 1000);
            }, 1000);
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
