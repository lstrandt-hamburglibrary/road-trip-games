// War Card Game
(function() {
    'use strict';
    console.log('War game loaded!');

    let warState = {
        playerDeck: [],
        computerDeck: [],
        playerScore: 0,
        computerScore: 0,
        playerCard: null,
        computerCard: null,
        warPile: [],
        gameOver: false,
        message: '',
        riskLevel: 0 // 0 = no risk, 1-3 = extra cards at stake
    };

    let swipeStartY = 0;
    let isSwiping = false;

    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

    function launchWar() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('warGame').style.display = 'block';
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
        warState.message = 'Choose your risk level, then swipe up to flip!';

        showWarBoard();
    }

    function showWarBoard() {
        const content = document.getElementById('warContent');

        const playerCardHTML = warState.playerCard
            ? `<div style="width: 90px; height: 120px; background: white; border: 2px solid #333; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 2rem; color: ${warState.playerCard.suit === '♥' || warState.playerCard.suit === '♦' ? 'red' : 'black'};">
                <div>${warState.playerCard.rank}</div>
                <div style="font-size: 1.5rem;">${warState.playerCard.suit}</div>
            </div>`
            : `<div style="width: 90px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem;">You</div>`;

        const computerCardHTML = warState.computerCard
            ? `<div style="width: 90px; height: 120px; background: white; border: 2px solid #333; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 2rem; color: ${warState.computerCard.suit === '♥' || warState.computerCard.suit === '♦' ? 'red' : 'black'};">
                <div>${warState.computerCard.rank}</div>
                <div style="font-size: 1.5rem;">${warState.computerCard.suit}</div>
            </div>`
            : `<div style="width: 90px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem;">CPU</div>`;

        content.innerHTML = `
            <div style="padding: 1rem; text-align: center;">
                <h2 style="margin-bottom: 0.5rem; font-size: 1.5rem;">🎴 War Card Game</h2>

                <div style="display: flex; justify-content: space-around; margin-bottom: 1rem; padding: 0.5rem; background: rgba(0,0,0,0.1); border-radius: 8px;">
                    <div>
                        <div style="font-size: 0.75rem; color: #666;">You</div>
                        <div style="font-size: 1.1rem; font-weight: bold;">${warState.playerScore}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: #666;">Computer</div>
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

                    <div id="deckSwipeArea" ontouchstart="handleSwipeStart(event)" ontouchmove="handleSwipeMove(event)" ontouchend="handleSwipeEnd(event)" style="margin: 1rem auto; width: 120px; height: 150px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 3px solid #333; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-size: 0.9rem; text-align: center; cursor: pointer; touch-action: none; position: relative; transform: translateY(0); transition: transform 0.2s;">
                        <div style="font-size: 2rem; margin-bottom: 0.3rem;">👆</div>
                        <div style="font-weight: bold; font-size: 0.95rem;">Swipe Up</div>
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

    function setRiskLevel(level) {
        warState.riskLevel = level;
        showWarBoard();
    }

    function handleSwipeStart(e) {
        swipeStartY = e.touches[0].clientY;
        isSwiping = true;
    }

    function handleSwipeMove(e) {
        if (!isSwiping) return;

        const currentY = e.touches[0].clientY;
        const deltaY = swipeStartY - currentY;

        // Visual feedback - move card up as user swipes
        const deckArea = document.getElementById('deckSwipeArea');
        if (deckArea && deltaY > 0) {
            deckArea.style.transform = `translateY(-${Math.min(deltaY, 50)}px)`;
        }
    }

    function handleSwipeEnd(e) {
        if (!isSwiping) return;

        const endY = e.changedTouches[0].clientY;
        const deltaY = swipeStartY - endY;

        // Reset deck position
        const deckArea = document.getElementById('deckSwipeArea');
        if (deckArea) {
            deckArea.style.transform = 'translateY(0)';
        }

        // If swiped up more than 50px, flip card
        if (deltaY > 50) {
            flipCard();
        }

        isSwiping = false;
    }

    function flipCard() {
        if (warState.playerDeck.length === 0 || warState.computerDeck.length === 0) {
            endGame();
            return;
        }

        // Draw cards
        warState.playerCard = warState.playerDeck.shift();
        warState.computerCard = warState.computerDeck.shift();

        // Add to war pile
        warState.warPile.push(warState.playerCard, warState.computerCard);

        // Add risk cards to pile
        for (let i = 0; i < warState.riskLevel; i++) {
            if (warState.playerDeck.length > 0) {
                warState.warPile.push(warState.playerDeck.shift());
            }
            if (warState.computerDeck.length > 0) {
                warState.warPile.push(warState.computerDeck.shift());
            }
        }

        // Compare cards
        if (warState.playerCard.value > warState.computerCard.value) {
            // Player wins
            const cardsWon = warState.warPile.length;
            warState.playerDeck.push(...warState.warPile);
            warState.playerScore = warState.playerDeck.length;
            warState.computerScore = warState.computerDeck.length;

            const riskBonus = warState.riskLevel > 0 ? ` (+${warState.riskLevel * 2} risk cards!)` : '';
            warState.message = `You Win ${cardsWon} cards! ${warState.playerCard.rank}${warState.playerCard.suit} beats ${warState.computerCard.rank}${warState.computerCard.suit}${riskBonus}`;
            warState.warPile = [];
            warState.riskLevel = 0; // Reset risk
        } else if (warState.computerCard.value > warState.playerCard.value) {
            // Computer wins
            const cardsLost = warState.warPile.length;
            warState.computerDeck.push(...warState.warPile);
            warState.playerScore = warState.playerDeck.length;
            warState.computerScore = warState.computerDeck.length;

            const riskPenalty = warState.riskLevel > 0 ? ` (lost ${warState.riskLevel * 2} risk cards!)` : '';
            warState.message = `You Lose ${cardsLost} cards! ${warState.computerCard.rank}${warState.computerCard.suit} beats ${warState.playerCard.rank}${warState.playerCard.suit}${riskPenalty}`;
            warState.warPile = [];
            warState.riskLevel = 0; // Reset risk
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
            warState.riskLevel = 0; // Reset risk for war
        }

        // Check for game over
        if (warState.playerDeck.length === 0 || warState.computerDeck.length === 0) {
            endGame();
        }

        showWarBoard();
    }

    function endGame() {
        warState.gameOver = true;
        if (warState.playerDeck.length > warState.computerDeck.length) {
            warState.message = '🎉 You Win the Game!';
        } else if (warState.computerDeck.length > warState.playerDeck.length) {
            warState.message = '😢 Computer Wins the Game!';
        } else {
            warState.message = '🤝 It\'s a Tie!';
        }
        showWarBoard();
    }

    // Expose functions to global scope
    window.launchWar = launchWar;
    window.exitWar = exitWar;
    window.flipCard = flipCard;
    window.initializeGame = initializeGame;
    window.setRiskLevel = setRiskLevel;
    window.handleSwipeStart = handleSwipeStart;
    window.handleSwipeMove = handleSwipeMove;
    window.handleSwipeEnd = handleSwipeEnd;

})();
