// War Card Game
(function() {
    'use strict';
    console.log('War game loaded!');

    let warState = {
        mode: null, // 'vsComputer' or 'twoPlayer'
        playerDeck: [],
        computerDeck: [],
        playerScore: 0,
        computerScore: 0,
        playerCard: null,
        computerCard: null,
        warPile: [],
        gameOver: false,
        message: '',
        riskLevel: 0, // Player 1 risk in 2-player, or player risk vs computer
        riskLevel2: 0, // Player 2 risk in 2-player mode
        player1Ready: false, // Face-to-face: has P1 swiped?
        player2Ready: false // Face-to-face: has P2 swiped?
    };

    let swipeStartY = 0;
    let isSwiping = false;
    let swipeSource = null; // Track which element was swiped

    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

    function launchWar() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('warGame').style.display = 'block';
        showModeSelection();
    }

    function showModeSelection() {
        const content = document.getElementById('warContent');
        content.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h2 style="margin-bottom: 1.5rem; font-size: 2rem;">🎴 War Card Game</h2>
                <p style="margin-bottom: 2rem; color: #666;">Choose your game mode:</p>

                <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px; margin: 0 auto;">
                    <button onclick="startWarMode('vsComputer')" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 1rem;">
                        <span style="font-size: 2rem;">🤖</span>
                        <div style="text-align: left;">
                            <div>vs Computer</div>
                            <div style="font-size: 0.85rem; font-weight: normal; opacity: 0.9;">Play against AI opponent</div>
                        </div>
                    </button>

                    <button onclick="startWarMode('twoPlayer')" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; padding: 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 1rem;">
                        <span style="font-size: 2rem;">👥</span>
                        <div style="text-align: left;">
                            <div>2 Player (Same View)</div>
                            <div style="font-size: 0.85rem; font-weight: normal; opacity: 0.9;">Both see same screen</div>
                        </div>
                    </button>

                    <button onclick="startWarMode('faceToFace')" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; border: none; padding: 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 1rem;">
                        <span style="font-size: 2rem;">🔄</span>
                        <div style="text-align: left;">
                            <div>Face-to-Face</div>
                            <div style="font-size: 0.85rem; font-weight: normal; opacity: 0.9;">Device between players</div>
                        </div>
                    </button>
                </div>

                <button onclick="exitWar()" style="background: #6c757d; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1rem; margin-top: 2rem;">
                    ← Back to Games
                </button>
            </div>
        `;
    }

    function startWarMode(mode) {
        warState.mode = mode;
        initializeGame();
    }

    function exitWar() {
        document.getElementById('warGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    }

    function initializeGame() {
        // Create deck
        const deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push({ rank, suit, value: values[rank] });
            }
        }

        // Shuffle deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // Split deck
        warState.playerDeck = deck.slice(0, 26);
        warState.computerDeck = deck.slice(26);
        warState.playerScore = 26;
        warState.computerScore = 26;
        warState.playerCard = null;
        warState.computerCard = null;
        warState.warPile = [];
        warState.gameOver = false;
        warState.riskLevel = 0;
        warState.riskLevel2 = 0;
        warState.player1Ready = false;
        warState.player2Ready = false;

        if (warState.mode === 'twoPlayer' || warState.mode === 'faceToFace') {
            warState.message = 'Choose risk levels, then click or swipe to flip!';
        } else {
            warState.message = 'Choose your risk level, then click or swipe to flip!';
        }

        showWarBoard();
    }

    function showWarBoard() {
        if (warState.mode === 'faceToFace') {
            showFaceToFaceBoard();
            return;
        }

        const content = document.getElementById('warContent');

        const isTwoPlayer = warState.mode === 'twoPlayer';
        const player1Label = isTwoPlayer ? 'P1' : 'You';
        const player2Label = isTwoPlayer ? 'P2' : 'CPU';

        const playerCardHTML = warState.playerCard
            ? `<div style="width: 90px; height: 120px; background: white; border: 2px solid #333; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 2rem; color: ${warState.playerCard.suit === '♥' || warState.playerCard.suit === '♦' ? 'red' : 'black'};">
                <div>${warState.playerCard.rank}</div>
                <div style="font-size: 1.5rem;">${warState.playerCard.suit}</div>
            </div>`
            : `<div style="width: 90px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem;">${player1Label}</div>`;

        const computerCardHTML = warState.computerCard
            ? `<div style="width: 90px; height: 120px; background: white; border: 2px solid #333; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 2rem; color: ${warState.computerCard.suit === '♥' || warState.computerCard.suit === '♦' ? 'red' : 'black'};">
                <div>${warState.computerCard.rank}</div>
                <div style="font-size: 1.5rem;">${warState.computerCard.suit}</div>
            </div>`
            : `<div style="width: 90px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem;">${player2Label}</div>`;

        content.innerHTML = `
            <div style="padding: 1rem; text-align: center;">
                <h2 style="margin-bottom: 0.5rem; font-size: 1.5rem;">🎴 War Card Game</h2>

                <div style="display: flex; justify-content: space-around; margin-bottom: 1rem; padding: 0.5rem; background: rgba(0,0,0,0.1); border-radius: 8px;">
                    <div>
                        <div style="font-size: 0.75rem; color: #666;">${player1Label}</div>
                        <div style="font-size: 1.1rem; font-weight: bold;">${warState.playerScore}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: #666;">${player2Label}</div>
                        <div style="font-size: 1.1rem; font-weight: bold;">${warState.computerScore}</div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-around; align-items: center; margin: 1rem 0;">
                    ${playerCardHTML}
                    <div style="font-size: 1.5rem;">VS</div>
                    ${computerCardHTML}
                </div>

                <div style="min-height: 45px; margin: 0.75rem 0; padding: 0.75rem; background: ${warState.message.includes('Win') ? '#d4edda' : warState.message.includes('Lose') ? '#f8d7da' : '#d1ecf1'}; border-radius: 8px; font-size: 0.9rem; font-weight: bold;">
                    ${warState.message}
                </div>

                ${!warState.gameOver ? `
                    ${isTwoPlayer ? `
                        <div style="display: flex; gap: 1rem; justify-content: center; margin: 0.5rem 0;">
                            <div style="flex: 1; max-width: 180px;">
                                <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.3rem;">P1 Risk:</div>
                                <div style="display: flex; gap: 0.2rem; justify-content: center;">
                                    <button onclick="setRiskLevel(0)" style="background: ${warState.riskLevel === 0 ? '#667eea' : '#e0e0e0'}; color: ${warState.riskLevel === 0 ? 'white' : '#333'}; border: none; padding: 0.4rem; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.75rem; min-width: 35px;">0</button>
                                    <button onclick="setRiskLevel(1)" style="background: ${warState.riskLevel === 1 ? '#f39c12' : '#e0e0e0'}; color: ${warState.riskLevel === 1 ? 'white' : '#333'}; border: none; padding: 0.4rem; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.75rem; min-width: 35px;">+2</button>
                                    <button onclick="setRiskLevel(2)" style="background: ${warState.riskLevel === 2 ? '#e67e22' : '#e0e0e0'}; color: ${warState.riskLevel === 2 ? 'white' : '#333'}; border: none; padding: 0.4rem; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.75rem; min-width: 35px;">+4</button>
                                    <button onclick="setRiskLevel(3)" style="background: ${warState.riskLevel === 3 ? '#e74c3c' : '#e0e0e0'}; color: ${warState.riskLevel === 3 ? 'white' : '#333'}; border: none; padding: 0.4rem; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.75rem; min-width: 35px;">+6</button>
                                </div>
                            </div>
                            <div style="flex: 1; max-width: 180px;">
                                <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.3rem;">P2 Risk:</div>
                                <div style="display: flex; gap: 0.2rem; justify-content: center;">
                                    <button onclick="setRiskLevel2(0)" style="background: ${warState.riskLevel2 === 0 ? '#667eea' : '#e0e0e0'}; color: ${warState.riskLevel2 === 0 ? 'white' : '#333'}; border: none; padding: 0.4rem; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.75rem; min-width: 35px;">0</button>
                                    <button onclick="setRiskLevel2(1)" style="background: ${warState.riskLevel2 === 1 ? '#f39c12' : '#e0e0e0'}; color: ${warState.riskLevel2 === 1 ? 'white' : '#333'}; border: none; padding: 0.4rem; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.75rem; min-width: 35px;">+2</button>
                                    <button onclick="setRiskLevel2(2)" style="background: ${warState.riskLevel2 === 2 ? '#e67e22' : '#e0e0e0'}; color: ${warState.riskLevel2 === 2 ? 'white' : '#333'}; border: none; padding: 0.4rem; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.75rem; min-width: 35px;">+4</button>
                                    <button onclick="setRiskLevel2(3)" style="background: ${warState.riskLevel2 === 3 ? '#e74c3c' : '#e0e0e0'}; color: ${warState.riskLevel2 === 3 ? 'white' : '#333'}; border: none; padding: 0.4rem; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.75rem; min-width: 35px;">+6</button>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div style="margin: 0.5rem 0;">
                            <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.3rem;">Risk Extra Cards (win/lose more!):</div>
                            <div style="display: flex; gap: 0.3rem; justify-content: center; flex-wrap: wrap;">
                                <button onclick="setRiskLevel(0)" style="background: ${warState.riskLevel === 0 ? '#667eea' : '#e0e0e0'}; color: ${warState.riskLevel === 0 ? 'white' : '#333'}; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;">
                                    0<br><span style="font-size: 0.7rem;">Safe</span>
                                </button>
                                <button onclick="setRiskLevel(1)" style="background: ${warState.riskLevel === 1 ? '#f39c12' : '#e0e0e0'}; color: ${warState.riskLevel === 1 ? 'white' : '#333'}; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;">
                                    +2🔥<br><span style="font-size: 0.7rem;">cards</span>
                                </button>
                                <button onclick="setRiskLevel(2)" style="background: ${warState.riskLevel === 2 ? '#e67e22' : '#e0e0e0'}; color: ${warState.riskLevel === 2 ? 'white' : '#333'}; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;">
                                    +4🔥<br><span style="font-size: 0.7rem;">cards</span>
                                </button>
                                <button onclick="setRiskLevel(3)" style="background: ${warState.riskLevel === 3 ? '#e74c3c' : '#e0e0e0'}; color: ${warState.riskLevel === 3 ? 'white' : '#333'}; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;">
                                    +6🔥<br><span style="font-size: 0.7rem;">cards</span>
                                </button>
                            </div>
                        </div>
                    `}

                    <div id="deckSwipeArea" onclick="flipCard()" ontouchstart="handleSwipeStart(event)" ontouchmove="handleSwipeMove(event)" ontouchend="handleSwipeEnd(event)" style="margin: 1rem auto; width: 120px; height: 150px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 3px solid #333; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-size: 0.9rem; text-align: center; cursor: pointer; touch-action: none; position: relative; transform: translateY(0); transition: transform 0.2s;">
                        <div style="font-size: 2rem; margin-bottom: 0.3rem;">👆</div>
                        <div style="font-weight: bold; font-size: 0.95rem;">Click/Swipe</div>
                    </div>
                ` : `
                    <button onclick="initializeGame()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; margin: 0.5rem;">
                        🔄 Play Again
                    </button>
                `}

                <button onclick="exitWar()" style="background: #6c757d; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem; margin: 0.5rem;">
                    ← Back
                </button>
            </div>
        `;
    }

    function showFaceToFaceBoard() {
        const content = document.getElementById('warContent');

        // Show actual card if drawn, otherwise show card back
        const player1CardHTML = warState.playerCard
            ? `<div style="width: 70px; height: 95px; background: white; border: 2px solid #333; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 1.5rem; color: ${warState.playerCard.suit === '♥' || warState.playerCard.suit === '♦' ? 'red' : 'black'};">
                <div>${warState.playerCard.rank}</div>
                <div style="font-size: 1.2rem;">${warState.playerCard.suit}</div>
            </div>`
            : `<div style="width: 70px; height: 95px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 6px;"></div>`;

        const player2CardHTML = warState.computerCard
            ? `<div style="width: 70px; height: 95px; background: white; border: 2px solid #333; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 1.5rem; color: ${warState.computerCard.suit === '♥' || warState.computerCard.suit === '♦' ? 'red' : 'black'};">
                <div>${warState.computerCard.rank}</div>
                <div style="font-size: 1.2rem;">${warState.computerCard.suit}</div>
            </div>`
            : `<div style="width: 70px; height: 95px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 6px;"></div>`;

        content.innerHTML = `
            <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 1rem; position: relative; background: white; overflow: hidden; padding: 0.5rem 0;">
                <!-- Player 2 Section (Top, Rotated 180°) -->
                <div style="transform: rotate(180deg); padding: 0.3rem; background: linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%); border-radius: 8px; width: 90%;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.7rem; color: #666; margin-bottom: 0.2rem;">Player 2: ${warState.computerScore} cards</div>
                        <div style="font-size: 0.6rem; color: #888; margin-bottom: 0.2rem;">Risk extra cards:</div>
                        <div style="display: flex; gap: 0.15rem; justify-content: center; margin-bottom: 0.25rem;">
                            <button onclick="setRiskLevel2(0)" style="background: ${warState.riskLevel2 === 0 ? '#667eea' : '#ddd'}; color: ${warState.riskLevel2 === 0 ? 'white' : '#333'}; border: none; padding: 0.25rem 0.4rem; border-radius: 3px; cursor: pointer; font-size: 0.65rem; min-width: 28px;">0</button>
                            <button onclick="setRiskLevel2(1)" style="background: ${warState.riskLevel2 === 1 ? '#f39c12' : '#ddd'}; color: ${warState.riskLevel2 === 1 ? 'white' : '#333'}; border: none; padding: 0.25rem 0.4rem; border-radius: 3px; cursor: pointer; font-size: 0.65rem; min-width: 28px;">+2</button>
                            <button onclick="setRiskLevel2(2)" style="background: ${warState.riskLevel2 === 2 ? '#e67e22' : '#ddd'}; color: ${warState.riskLevel2 === 2 ? 'white' : '#333'}; border: none; padding: 0.25rem 0.4rem; border-radius: 3px; cursor: pointer; font-size: 0.65rem; min-width: 28px;">+4</button>
                            <button onclick="setRiskLevel2(3)" style="background: ${warState.riskLevel2 === 3 ? '#e74c3c' : '#ddd'}; color: ${warState.riskLevel2 === 3 ? 'white' : '#333'}; border: none; padding: 0.25rem 0.4rem; border-radius: 3px; cursor: pointer; font-size: 0.65rem; min-width: 28px;">+6</button>
                        </div>
                        <div id="swipeArea2" onclick="handlePlayer2Click()" ontouchstart="handleSwipeStart(event)" ontouchmove="handleSwipeMove(event)" ontouchend="handleSwipeEnd(event)" style="width: 80px; height: 100px; margin: 0 auto; background: ${warState.player2Ready ? '#4caf50' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; border: 2px solid #333; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; touch-action: none; transform: translateY(0); transition: transform 0.2s;">
                            <div style="font-size: 1.3rem;">${warState.player2Ready ? '✓' : '👆'}</div>
                            <div style="font-size: 0.7rem; font-weight: bold;">${warState.player2Ready ? 'Ready!' : 'Click'}</div>
                        </div>
                    </div>
                </div>

                <!-- Middle Section (Cards) -->
                <div style="padding: 0.5rem; text-align: center; border: 2px solid #333; border-radius: 8px; background: white; width: 90%;">
                    <div style="display: flex; justify-content: space-around; align-items: center;">
                        ${player1CardHTML}
                        <div style="font-size: 1rem; font-weight: bold;">VS</div>
                        ${player2CardHTML}
                    </div>
                    ${warState.message ? `<div style="margin-top: 0.4rem; padding: 0.4rem; background: ${warState.message.includes('Win') || warState.message.includes('Wins') ? '#d4edda' : warState.message.includes('Lose') ? '#f8d7da' : '#d1ecf1'}; border-radius: 5px; font-size: 0.7rem; font-weight: bold;">${warState.message}</div>` : ''}
                    ${warState.gameOver ? `<button onclick="initializeGame()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.4rem 1.2rem; border-radius: 6px; font-size: 0.85rem; font-weight: bold; cursor: pointer; margin-top: 0.4rem;">Play Again</button>` : ''}
                </div>

                <!-- Player 1 Section (Bottom) -->
                <div style="padding: 0.3rem; background: linear-gradient(0deg, #f5f5f5 0%, #e0e0e0 100%); border-radius: 8px; width: 90%;">
                    <div style="text-align: center;">
                        <div id="swipeArea1" onclick="handlePlayer1Click()" ontouchstart="handleSwipeStart(event)" ontouchmove="handleSwipeMove(event)" ontouchend="handleSwipeEnd(event)" style="width: 80px; height: 100px; margin: 0 auto; background: ${warState.player1Ready ? '#4caf50' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; border: 2px solid #333; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; touch-action: none; transform: translateY(0); transition: transform 0.2s;">
                            <div style="font-size: 1.3rem;">${warState.player1Ready ? '✓' : '👆'}</div>
                            <div style="font-size: 0.7rem; font-weight: bold;">${warState.player1Ready ? 'Ready!' : 'Click'}</div>
                        </div>
                        <div style="font-size: 0.6rem; color: #888; margin-top: 0.25rem; margin-bottom: 0.2rem;">Risk extra cards:</div>
                        <div style="display: flex; gap: 0.15rem; justify-content: center; margin-bottom: 0.2rem;">
                            <button onclick="setRiskLevel(0)" style="background: ${warState.riskLevel === 0 ? '#667eea' : '#ddd'}; color: ${warState.riskLevel === 0 ? 'white' : '#333'}; border: none; padding: 0.25rem 0.4rem; border-radius: 3px; cursor: pointer; font-size: 0.65rem; min-width: 28px;">0</button>
                            <button onclick="setRiskLevel(1)" style="background: ${warState.riskLevel === 1 ? '#f39c12' : '#ddd'}; color: ${warState.riskLevel === 1 ? 'white' : '#333'}; border: none; padding: 0.25rem 0.4rem; border-radius: 3px; cursor: pointer; font-size: 0.65rem; min-width: 28px;">+2</button>
                            <button onclick="setRiskLevel(2)" style="background: ${warState.riskLevel === 2 ? '#e67e22' : '#ddd'}; color: ${warState.riskLevel === 2 ? 'white' : '#333'}; border: none; padding: 0.25rem 0.4rem; border-radius: 3px; cursor: pointer; font-size: 0.65rem; min-width: 28px;">+4</button>
                            <button onclick="setRiskLevel(3)" style="background: ${warState.riskLevel === 3 ? '#e74c3c' : '#ddd'}; color: ${warState.riskLevel === 3 ? 'white' : '#333'}; border: none; padding: 0.25rem 0.4rem; border-radius: 3px; cursor: pointer; font-size: 0.65rem; min-width: 28px;">+6</button>
                        </div>
                        <div style="font-size: 0.7rem; color: #666;">Player 1: ${warState.playerScore} cards</div>
                    </div>
                </div>

                ${!warState.gameOver ? `
                    <button onclick="exitWar()" style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(108, 117, 125, 0.9); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; z-index: 10;">
                        ✕
                    </button>
                ` : ''}
            </div>
        `;
    }

    function setRiskLevel(level) {
        warState.riskLevel = level;
        showWarBoard();
    }

    function setRiskLevel2(level) {
        warState.riskLevel2 = level;
        showWarBoard();
    }

    function handleSwipeStart(e) {
        swipeStartY = e.touches[0].clientY;
        isSwiping = true;

        // Find which swipe area was touched
        let element = e.target;
        while (element && !element.id?.startsWith('swipeArea')) {
            element = element.parentElement;
        }
        swipeSource = element?.id;
        console.log('Swipe started on:', swipeSource, 'at Y:', swipeStartY);
    }

    function handleSwipeMove(e) {
        if (!isSwiping) return;

        const currentY = e.touches[0].clientY;
        const deltaY = swipeStartY - currentY;

        if (warState.mode === 'faceToFace') {
            // Move the specific area that was swiped
            if (swipeSource) {
                const area = document.getElementById(swipeSource);
                if (area) {
                    // Player 2 is rotated, so they swipe down (negative deltaY) from their perspective
                    if (swipeSource === 'swipeArea2' && deltaY < 0) {
                        area.style.transform = `translateY(${Math.min(Math.abs(deltaY), 50)}px)`;
                    } else if (swipeSource === 'swipeArea1' && deltaY > 0) {
                        area.style.transform = `translateY(-${Math.min(deltaY, 50)}px)`;
                    }
                }
            }
        } else {
            // Visual feedback - move card up as user swipes
            const deckArea = document.getElementById('deckSwipeArea');
            if (deckArea && deltaY > 0) {
                deckArea.style.transform = `translateY(-${Math.min(deltaY, 50)}px)`;
            }
        }
    }

    function handleSwipeEnd(e) {
        if (!isSwiping) return;

        const endY = e.changedTouches[0].clientY;
        const deltaY = swipeStartY - endY;

        console.log('Swipe ended. deltaY:', deltaY, 'source:', swipeSource);

        if (warState.mode === 'faceToFace') {
            // Reset both swipe areas
            const area1 = document.getElementById('swipeArea1');
            const area2 = document.getElementById('swipeArea2');
            if (area1) area1.style.transform = 'translateY(0)';
            if (area2) area2.style.transform = 'translateY(0)';

            // Check for valid swipe based on player
            let validSwipe = false;
            if (swipeSource === 'swipeArea1' && deltaY > 50) {
                // Player 1 swipes up (positive deltaY)
                validSwipe = true;
            } else if (swipeSource === 'swipeArea2' && deltaY < -50) {
                // Player 2 swipes down in screen coords (negative deltaY) which is up for them
                validSwipe = true;
            }

            if (validSwipe) {
                console.log('Valid swipe detected on', swipeSource);
                // Determine which player swiped and draw their card immediately
                if (swipeSource === 'swipeArea1' && !warState.player1Ready) {
                    // Player 1 (bottom) - draw their card
                    console.log('Setting player1Ready to true and drawing card');
                    warState.player1Ready = true;
                    if (warState.playerDeck.length > 0) {
                        warState.playerCard = warState.playerDeck.shift();
                    }
                } else if (swipeSource === 'swipeArea2' && !warState.player2Ready) {
                    // Player 2 (top) - draw their card
                    console.log('Setting player2Ready to true and drawing card');
                    warState.player2Ready = true;
                    if (warState.computerDeck.length > 0) {
                        warState.computerCard = warState.computerDeck.shift();
                    }
                }

                console.log('Ready status - P1:', warState.player1Ready, 'P2:', warState.player2Ready);

                // Update display to show card that was just drawn
                showWarBoard();

                // When both players are ready, wait a moment then resolve the round
                if (warState.player1Ready && warState.player2Ready) {
                    console.log('Both ready! Showing cards before resolving...');
                    setTimeout(() => {
                        resolveRound();
                        showWarBoard();
                    }, 1000); // 1 second delay to see both cards
                }
            } else {
                console.log('Swipe not valid. deltaY:', deltaY, 'swipeSource:', swipeSource);
            }
        } else {
            // Reset deck position
            const deckArea = document.getElementById('deckSwipeArea');
            if (deckArea) {
                deckArea.style.transform = 'translateY(0)';
            }

            // If swiped up more than 50px, flip card
            if (deltaY > 50) {
                flipCard();
            }
        }

        isSwiping = false;
        swipeSource = null;
    }

    function flipCard() {
        // For non-faceToFace modes, draw cards with staggered timing
        if (warState.playerDeck.length === 0 || warState.computerDeck.length === 0) {
            endGame();
            return;
        }

        // Draw player's card first
        warState.playerCard = warState.playerDeck.shift();
        showWarBoard();

        // Wait, then show computer's card
        setTimeout(() => {
            warState.computerCard = warState.computerDeck.shift();
            showWarBoard();

            // Wait longer to see both cards, then resolve
            setTimeout(() => {
                resolveRound();
            }, 1500); // 1.5 seconds to see both cards
        }, 800); // 0.8 seconds before showing computer's card
    }

    function resolveRound() {
        // Cards already drawn when players swiped (faceToFace) or by flipCard (other modes)
        if (!warState.playerCard || !warState.computerCard) {
            endGame();
            return;
        }

        // Add to war pile
        warState.warPile.push(warState.playerCard, warState.computerCard);

        // Add risk cards to pile
        const isTwoPlayer = warState.mode === 'twoPlayer' || warState.mode === 'faceToFace';

        // Player 1's risk
        for (let i = 0; i < warState.riskLevel; i++) {
            if (warState.playerDeck.length > 0) {
                warState.warPile.push(warState.playerDeck.shift());
            }
        }

        // Player 2's risk (uses own risk level in 2-player, or same as P1 in vs computer)
        const player2Risk = isTwoPlayer ? warState.riskLevel2 : warState.riskLevel;
        for (let i = 0; i < player2Risk; i++) {
            if (warState.computerDeck.length > 0) {
                warState.warPile.push(warState.computerDeck.shift());
            }
        }

        // Compare cards
        const player1Name = isTwoPlayer ? 'Player 1' : 'You';
        const player2Name = isTwoPlayer ? 'Player 2' : 'You';

        if (warState.playerCard.value > warState.computerCard.value) {
            // Player 1 wins
            const cardsWon = warState.warPile.length;
            warState.playerDeck.push(...warState.warPile);
            warState.playerScore = warState.playerDeck.length;
            warState.computerScore = warState.computerDeck.length;

            const totalRisk = warState.riskLevel + (isTwoPlayer ? warState.riskLevel2 : warState.riskLevel);
            const riskBonus = totalRisk > 0 ? ` (+${totalRisk * 2} risk cards!)` : '';
            warState.message = `${player1Name} Win${isTwoPlayer ? 's' : ''} ${cardsWon} cards! ${warState.playerCard.rank}${warState.playerCard.suit} beats ${warState.computerCard.rank}${warState.computerCard.suit}${riskBonus}`;
            warState.warPile = [];
            warState.riskLevel = 0;
            warState.riskLevel2 = 0;
            warState.player1Ready = false;
            warState.player2Ready = false;
            warState.playerCard = null;
            warState.computerCard = null;
        } else if (warState.computerCard.value > warState.playerCard.value) {
            // Player 2 wins
            const cardsWon = warState.warPile.length;
            warState.computerDeck.push(...warState.warPile);
            warState.playerScore = warState.playerDeck.length;
            warState.computerScore = warState.computerDeck.length;

            const totalRisk = warState.riskLevel + (isTwoPlayer ? warState.riskLevel2 : warState.riskLevel);
            const riskInfo = totalRisk > 0 ? ` (+${totalRisk * 2} risk cards!)` : '';
            warState.message = isTwoPlayer
                ? `${player2Name} Wins ${cardsWon} cards! ${warState.computerCard.rank}${warState.computerCard.suit} beats ${warState.playerCard.rank}${warState.playerCard.suit}${riskInfo}`
                : `You Lose ${cardsWon} cards! ${warState.computerCard.rank}${warState.computerCard.suit} beats ${warState.playerCard.rank}${warState.playerCard.suit}${riskInfo}`;
            warState.warPile = [];
            warState.riskLevel = 0;
            warState.riskLevel2 = 0;
            warState.player1Ready = false;
            warState.player2Ready = false;
            warState.playerCard = null;
            warState.computerCard = null;
        } else {
            // War!
            warState.message = `⚔️ WAR! Both played ${warState.playerCard.rank}${warState.playerCard.suit}! Flip again!`;

            // Add 3 cards from each to war pile (if available)
            for (let i = 0; i < 3; i++) {
                if (warState.playerDeck.length > 0) {
                    warState.warPile.push(warState.playerDeck.shift());
                }
                if (warState.computerDeck.length > 0) {
                    warState.warPile.push(warState.computerDeck.shift());
                }
            }
            warState.riskLevel = 0;
            warState.riskLevel2 = 0;
            warState.player1Ready = false;
            warState.player2Ready = false;
            warState.playerCard = null;
            warState.computerCard = null;
        }

        // Check for game over
        if (warState.playerDeck.length === 0 || warState.computerDeck.length === 0) {
            endGame();
        }

        showWarBoard();
    }

    function endGame() {
        warState.gameOver = true;
        const isTwoPlayer = warState.mode === 'twoPlayer' || warState.mode === 'faceToFace';

        if (warState.playerDeck.length > warState.computerDeck.length) {
            warState.message = isTwoPlayer ? '🎉 Player 1 Wins the Game!' : '🎉 You Win the Game!';
        } else if (warState.computerDeck.length > warState.playerDeck.length) {
            warState.message = isTwoPlayer ? '🎉 Player 2 Wins the Game!' : '😢 Computer Wins the Game!';
        } else {
            warState.message = '🤝 It\'s a Tie!';
        }
        showWarBoard();
    }

    // Click handlers for face-to-face mode on desktop
    function handlePlayer1Click() {
        if (warState.player1Ready || warState.gameOver) return;

        // Player 1 draws their card
        warState.player1Ready = true;
        if (warState.playerDeck.length > 0) {
            warState.playerCard = warState.playerDeck.shift();
        }

        // Update display to show card that was just drawn
        showWarBoard();

        // When both players are ready, wait a moment then resolve the round
        if (warState.player1Ready && warState.player2Ready) {
            setTimeout(() => {
                resolveRound();
                showWarBoard();
            }, 1000); // 1 second delay to see both cards
        }
    }

    function handlePlayer2Click() {
        if (warState.player2Ready || warState.gameOver) return;

        // Player 2 draws their card
        warState.player2Ready = true;
        if (warState.computerDeck.length > 0) {
            warState.computerCard = warState.computerDeck.shift();
        }

        // Update display to show card that was just drawn
        showWarBoard();

        // When both players are ready, wait a moment then resolve the round
        if (warState.player1Ready && warState.player2Ready) {
            setTimeout(() => {
                resolveRound();
                showWarBoard();
            }, 1000); // 1 second delay to see both cards
        }
    }

    // Expose functions to global scope
    window.launchWar = launchWar;
    window.exitWar = exitWar;
    window.flipCard = flipCard;
    window.initializeGame = initializeGame;
    window.setRiskLevel = setRiskLevel;
    window.setRiskLevel2 = setRiskLevel2;
    window.startWarMode = startWarMode;
    window.handleSwipeStart = handleSwipeStart;
    window.handleSwipeMove = handleSwipeMove;
    window.handleSwipeEnd = handleSwipeEnd;
    window.handlePlayer1Click = handlePlayer1Click;
    window.handlePlayer2Click = handlePlayer2Click;

})();
