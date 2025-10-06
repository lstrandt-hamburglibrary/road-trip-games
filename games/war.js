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
        message: ''
    };

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
        warState.message = 'Tap "Flip Card" to play!';

        showWarBoard();
    }

    function showWarBoard() {
        const content = document.getElementById('warContent');

        const playerCardHTML = warState.playerCard
            ? `<div style="width: 120px; height: 160px; background: white; border: 2px solid #333; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 3rem; color: ${warState.playerCard.suit === '♥' || warState.playerCard.suit === '♦' ? 'red' : 'black'};">
                <div>${warState.playerCard.rank}</div>
                <div style="font-size: 2rem;">${warState.playerCard.suit}</div>
            </div>`
            : `<div style="width: 120px; height: 160px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">Your Card</div>`;

        const computerCardHTML = warState.computerCard
            ? `<div style="width: 120px; height: 160px; background: white; border: 2px solid #333; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 3rem; color: ${warState.computerCard.suit === '♥' || warState.computerCard.suit === '♦' ? 'red' : 'black'};">
                <div>${warState.computerCard.rank}</div>
                <div style="font-size: 2rem;">${warState.computerCard.suit}</div>
            </div>`
            : `<div style="width: 120px; height: 160px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">Computer</div>`;

        content.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h2 style="margin-bottom: 1rem;">🎴 War Card Game</h2>

                <div style="display: flex; justify-content: space-around; margin-bottom: 2rem; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 10px;">
                    <div>
                        <div style="font-size: 0.9rem; color: #666;">You</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${warState.playerScore} cards</div>
                    </div>
                    <div>
                        <div style="font-size: 0.9rem; color: #666;">Computer</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${warState.computerScore} cards</div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-around; align-items: center; margin: 2rem 0;">
                    ${playerCardHTML}
                    <div style="font-size: 2rem;">VS</div>
                    ${computerCardHTML}
                </div>

                <div style="min-height: 60px; margin: 1.5rem 0; padding: 1rem; background: ${warState.message.includes('Win') ? '#d4edda' : warState.message.includes('Lose') ? '#f8d7da' : '#d1ecf1'}; border-radius: 10px; font-size: 1.1rem; font-weight: bold;">
                    ${warState.message}
                </div>

                ${!warState.gameOver ? `
                    <button onclick="flipCard()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1rem 3rem; border-radius: 10px; font-size: 1.2rem; font-weight: bold; cursor: pointer; margin: 0.5rem;">
                        🎴 Flip Card
                    </button>
                ` : `
                    <button onclick="initializeGame()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1rem 3rem; border-radius: 10px; font-size: 1.2rem; font-weight: bold; cursor: pointer; margin: 0.5rem;">
                        🔄 Play Again
                    </button>
                `}

                <button onclick="exitWar()" style="background: #6c757d; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1rem; margin: 0.5rem;">
                    ← Back to Games
                </button>
            </div>
        `;
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

        // Compare cards
        if (warState.playerCard.value > warState.computerCard.value) {
            // Player wins
            warState.playerDeck.push(...warState.warPile);
            warState.playerScore = warState.playerDeck.length;
            warState.computerScore = warState.computerDeck.length;
            warState.message = `You Win! ${warState.playerCard.rank}${warState.playerCard.suit} beats ${warState.computerCard.rank}${warState.computerCard.suit}`;
            warState.warPile = [];
        } else if (warState.computerCard.value > warState.playerCard.value) {
            // Computer wins
            warState.computerDeck.push(...warState.warPile);
            warState.playerScore = warState.playerDeck.length;
            warState.computerScore = warState.computerDeck.length;
            warState.message = `You Lose! ${warState.computerCard.rank}${warState.computerCard.suit} beats ${warState.playerCard.rank}${warState.playerCard.suit}`;
            warState.warPile = [];
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

})();
