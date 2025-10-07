// Trash (Garbage) Card Game
(function() {
    'use strict';
    console.log('Trash game loaded!');

    let trashState = {
        mode: null, // 'vsComputer' or 'twoPlayer'
        deck: [],
        discardPile: [],
        player1Cards: [], // 10 cards, index 0-9 for positions Ace-10
        player2Cards: [],
        currentPlayer: 1,
        drawnCard: null,
        gameOver: false,
        message: '',
        currentTurnActive: false
    };

    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    function getCardValue(rank) {
        if (rank === 'A') return 1;
        if (rank === 'J') return 11; // Wild
        if (rank === 'Q' || rank === 'K') return 0; // Unplayable
        return parseInt(rank);
    }

    function launchTrash() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('trashGame').style.display = 'block';
        showModeSelection();
    }

    function showTrashRules() {
        const content = document.getElementById('trashContent');
        content.innerHTML = `
            <div style="padding: 2rem; max-width: 600px; margin: 0 auto;">
                <h2 style="margin-bottom: 1.5rem;">📖 How to Play Trash</h2>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">🎯 Objective</h3>
                    <p>Be the first player to fill all 10 spots (Ace through 10) with the correct cards, face-up.</p>
                </div>

                <div style="background: #e3f2fd; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">🎴 Setup</h3>
                    <ul style="margin-left: 1.5rem; line-height: 1.8;">
                        <li>Each player gets 10 cards arranged face-down in 2 rows of 5</li>
                        <li>Positions are numbered 1-10 (Ace = 1, 2-10 = face value)</li>
                    </ul>
                </div>

                <div style="background: #fff3cd; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">▶️ How to Play</h3>
                    <ol style="margin-left: 1.5rem; line-height: 1.8;">
                        <li><strong>Draw a card</strong> from the deck or discard pile</li>
                        <li><strong>If it's Ace-10:</strong> Place it in the correct spot and flip the card that was there</li>
                        <li><strong>If it's a Jack:</strong> Wild card! Place it in any empty spot</li>
                        <li><strong>If it's a Queen or King:</strong> Unplayable - your turn ends</li>
                        <li><strong>Chain placement:</strong> Keep placing revealed cards in their spots</li>
                        <li><strong>Turn ends when:</strong>
                            <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
                                <li>You draw/reveal a Queen or King</li>
                                <li>You reveal a card whose spot is already filled</li>
                            </ul>
                        </li>
                    </ol>
                </div>

                <div style="background: #d4edda; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">🏆 Winning</h3>
                    <p>First player to get all 10 spots filled with correct face-up cards wins!</p>
                </div>

                <div style="text-align: center;">
                    <button onclick="showTrashBoard()" style="background: #17a2b8; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; margin-right: 0.5rem;">
                        ← Back to Game
                    </button>
                    <button onclick="showModeSelection()" style="background: #6c757d; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer;">
                        New Game
                    </button>
                </div>
            </div>
        `;
    }

    function showModeSelection() {
        const content = document.getElementById('trashContent');
        content.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h2 style="margin-bottom: 1.5rem; font-size: 2rem;">🗑️ Trash Card Game</h2>
                <p style="margin-bottom: 2rem; color: #666;">Choose your game mode:</p>

                <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px; margin: 0 auto;">
                    <button onclick="startTrashMode('vsComputer')" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 1rem;">
                        <span style="font-size: 2rem;">🤖</span>
                        <div style="text-align: left;">
                            <div>vs Computer</div>
                            <div style="font-size: 0.85rem; font-weight: normal; opacity: 0.9;">Play against AI opponent</div>
                        </div>
                    </button>

                    <button onclick="startTrashMode('twoPlayer')" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; padding: 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 1rem;">
                        <span style="font-size: 2rem;">👥</span>
                        <div style="text-align: left;">
                            <div>2 Player Pass-and-Play</div>
                            <div style="font-size: 0.85rem; font-weight: normal; opacity: 0.9;">Take turns on same device</div>
                        </div>
                    </button>
                </div>

                <button onclick="exitTrash()" style="background: #6c757d; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1rem; margin-top: 2rem;">
                    ← Back to Games
                </button>
            </div>
        `;
    }

    function startTrashMode(mode) {
        trashState.mode = mode;
        initializeGame();
    }

    function exitTrash() {
        document.getElementById('trashGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    }

    function initializeGame() {
        // Create and shuffle deck
        trashState.deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                trashState.deck.push({ rank, suit });
            }
        }
        shuffleDeck();

        // Deal 10 cards to each player (face down)
        trashState.player1Cards = [];
        trashState.player2Cards = [];
        for (let i = 0; i < 10; i++) {
            trashState.player1Cards.push({ ...trashState.deck.pop(), faceUp: false });
            trashState.player2Cards.push({ ...trashState.deck.pop(), faceUp: false });
        }

        // Start discard pile with one card
        trashState.discardPile = [trashState.deck.pop()];

        trashState.currentPlayer = 1;
        trashState.drawnCard = null;
        trashState.gameOver = false;
        trashState.currentTurnActive = false;
        trashState.message = trashState.mode === 'twoPlayer' ? 'Player 1: Draw a card to start!' : 'Your turn! Draw a card to start!';

        showTrashBoard();
    }

    function shuffleDeck() {
        for (let i = trashState.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [trashState.deck[i], trashState.deck[j]] = [trashState.deck[j], trashState.deck[i]];
        }
    }

    function showTrashBoard() {
        const content = document.getElementById('trashContent');
        const isTwoPlayer = trashState.mode === 'twoPlayer';
        const canDraw = !trashState.drawnCard && !trashState.gameOver && (trashState.mode === 'vsComputer' ? trashState.currentPlayer === 1 : true);

        content.innerHTML = `
            <div style="padding: 1rem; min-height: 100vh;">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h2 style="font-size: 1.5rem; margin: 0;">🗑️ Trash</h2>
                        <button onclick="showTrashRules()" style="background: #17a2b8; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                            📖 How to Play
                        </button>
                    </div>
                    <div style="padding: 0.5rem; background: ${trashState.message.includes('wins') || trashState.message.includes('Win') ? '#d4edda' : '#d1ecf1'}; border-radius: 8px; font-size: 0.9rem; font-weight: bold; margin-bottom: 1rem;">
                        ${trashState.message}
                    </div>
                </div>

                <!-- Opponent's Board (Computer or Player 2) -->
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: ${trashState.currentPlayer === 2 && isTwoPlayer ? '#e3f2fd' : '#f8f9fa'}; border-radius: 10px;">
                    <div style="font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem; color: ${trashState.currentPlayer === 2 && isTwoPlayer ? '#1976d2' : '#666'};">
                        ${isTwoPlayer ? 'Player 2' : 'Computer'}
                    </div>
                    ${renderPlayerCards(trashState.player2Cards, trashState.currentPlayer === 2, 2)}
                </div>

                <!-- Draw and Discard Piles -->
                <div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.3rem;">Deck</div>
                        ${trashState.deck.length > 0 && canDraw
                            ? `<button onclick="drawFromDeck()" style="width: 70px; height: 95px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 8px; color: white; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">🎴</button>`
                            : `<div style="width: 70px; height: 95px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 8px; color: white; font-size: 1.5rem; display: flex; align-items: center; justify-content: center;">🎴</div>`
                        }
                        <div style="font-size: 0.7rem; color: #666; margin-top: 0.2rem;">${trashState.deck.length} cards</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.3rem;">Discard</div>
                        ${trashState.discardPile.length > 0 && canDraw
                            ? `<button onclick="drawFromDiscard()" style="width: 70px; height: 95px; background: white; border: 2px solid #333; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 1.5rem; color: ${(trashState.discardPile[trashState.discardPile.length - 1].suit === '♥' || trashState.discardPile[trashState.discardPile.length - 1].suit === '♦') ? 'red' : 'black'};">
                                <div>${trashState.discardPile[trashState.discardPile.length - 1].rank}</div>
                                <div style="font-size: 1.2rem;">${trashState.discardPile[trashState.discardPile.length - 1].suit}</div>
                            </button>`
                            : `<div style="width: 70px; height: 95px; background: white; border: 2px solid #333; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 1.5rem; color: ${trashState.discardPile.length > 0 ? ((trashState.discardPile[trashState.discardPile.length - 1].suit === '♥' || trashState.discardPile[trashState.discardPile.length - 1].suit === '♦') ? 'red' : 'black') : 'black'};">
                                ${trashState.discardPile.length > 0 ? `<div>${trashState.discardPile[trashState.discardPile.length - 1].rank}</div><div style="font-size: 1.2rem;">${trashState.discardPile[trashState.discardPile.length - 1].suit}</div>` : ''}
                            </div>`
                        }
                    </div>
                    ${trashState.drawnCard ? `
                        <div style="text-align: center;">
                            <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.3rem;">Drawn Card</div>
                            <div style="width: 70px; height: 95px; background: white; border: 2px solid #f39c12; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 1.5rem; color: ${(trashState.drawnCard.suit === '♥' || trashState.drawnCard.suit === '♦') ? 'red' : 'black'};">
                                <div>${trashState.drawnCard.rank}</div>
                                <div style="font-size: 1.2rem;">${trashState.drawnCard.suit}</div>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Player's Board (You or Player 1) -->
                <div style="padding: 1rem; background: ${trashState.currentPlayer === 1 ? '#e3f2fd' : '#f8f9fa'}; border-radius: 10px;">
                    <div style="font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem; color: ${trashState.currentPlayer === 1 ? '#1976d2' : '#666'};">
                        ${isTwoPlayer ? 'Player 1' : 'You'}
                    </div>
                    ${renderPlayerCards(trashState.player1Cards, trashState.currentPlayer === 1, 1)}
                </div>

                ${trashState.gameOver ? `
                    <div style="text-align: center; margin-top: 1rem;">
                        <button onclick="initializeGame()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; margin-right: 0.5rem;">
                            🔄 Play Again
                        </button>
                        <button onclick="exitTrash()" style="background: #6c757d; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                            ← Back
                        </button>
                    </div>
                ` : `
                    <div style="text-align: center; margin-top: 1rem;">
                        <button onclick="exitTrash()" style="background: #6c757d; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                            ← Back
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    function renderPlayerCards(cards, isCurrentPlayer, playerNum) {
        let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';

        // Row 1 (positions 0-4 = Ace-5)
        html += '<div style="display: flex; gap: 0.5rem; justify-content: center;">';
        for (let i = 0; i < 5; i++) {
            html += renderCard(cards[i], i, isCurrentPlayer, playerNum);
        }
        html += '</div>';

        // Row 2 (positions 5-9 = 6-10)
        html += '<div style="display: flex; gap: 0.5rem; justify-content: center;">';
        for (let i = 5; i < 10; i++) {
            html += renderCard(cards[i], i, isCurrentPlayer, playerNum);
        }
        html += '</div>';

        html += '</div>';
        return html;
    }

    function renderCard(card, position, isCurrentPlayer, playerNum) {
        const positionLabel = position + 1; // 1-10
        const canPlace = isCurrentPlayer && trashState.drawnCard && !trashState.gameOver && trashState.currentPlayer === playerNum;

        if (card.faceUp) {
            // Show face up card
            return `<div style="width: 60px; height: 80px; background: white; border: 2px solid #333; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 1.2rem; color: ${(card.suit === '♥' || card.suit === '♦') ? 'red' : 'black'};">
                <div>${card.rank}</div>
                <div style="font-size: 0.9rem;">${card.suit}</div>
            </div>`;
        } else {
            // Show face down card with position number and click handler if applicable
            const drawnValue = trashState.drawnCard ? getCardValue(trashState.drawnCard.rank) : 0;
            const isWild = drawnValue === 11;
            const canPlaceHere = canPlace && (drawnValue === positionLabel || isWild);

            if (canPlaceHere) {
                return `<button onclick="placeCard(${position})" style="width: 60px; height: 80px; background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); border: 2px solid #f39c12; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.8rem; color: #333; font-weight: bold;">
                    <div style="font-size: 1.5rem;">📍</div>
                    <div>${positionLabel}</div>
                </button>`;
            } else {
                return `<div style="width: 60px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #333; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.8rem; color: white;">
                    <div style="font-size: 1.2rem;">🎴</div>
                    <div>${positionLabel}</div>
                </div>`;
            }
        }
    }

    function drawFromDeck() {
        if (trashState.deck.length === 0) return;
        trashState.drawnCard = trashState.deck.pop();
        trashState.currentTurnActive = true;

        const value = getCardValue(trashState.drawnCard.rank);
        if (value === 0) {
            // Queen or King - unplayable, turn ends
            trashState.message = `Drew ${trashState.drawnCard.rank}${trashState.drawnCard.suit} - Unplayable! Turn ends.`;
            setTimeout(() => {
                trashState.discardPile.push(trashState.drawnCard);
                endTurn();
            }, 1500);
        } else {
            trashState.message = value === 11
                ? `Drew a Jack (Wild)! Click any face-down spot.`
                : `Drew ${trashState.drawnCard.rank}${trashState.drawnCard.suit} - Click spot ${value} to place it.`;
        }

        showTrashBoard();
    }

    function drawFromDiscard() {
        if (trashState.discardPile.length === 0) return;
        trashState.drawnCard = trashState.discardPile.pop();
        trashState.currentTurnActive = true;

        const value = getCardValue(trashState.drawnCard.rank);
        trashState.message = value === 11
            ? `Drew a Jack (Wild)! Click any face-down spot.`
            : `Drew ${trashState.drawnCard.rank}${trashState.drawnCard.suit} - Click spot ${value} to place it.`;

        showTrashBoard();
    }

    function placeCard(position) {
        if (!trashState.drawnCard || !trashState.currentTurnActive) return;

        const playerCards = trashState.currentPlayer === 1 ? trashState.player1Cards : trashState.player2Cards;

        // Place the drawn card
        const oldCard = playerCards[position];
        playerCards[position] = { ...trashState.drawnCard, faceUp: true };
        trashState.drawnCard = null;

        // Flip up the card that was there
        if (oldCard && !oldCard.faceUp) {
            oldCard.faceUp = true;
            const oldValue = getCardValue(oldCard.rank);

            if (oldValue === 0) {
                // Queen or King - turn ends
                trashState.message = `Revealed ${oldCard.rank}${oldCard.suit} - Turn ends!`;
                trashState.discardPile.push(oldCard);
                setTimeout(endTurn, 1500);
            } else if (oldValue === 11) {
                // Jack (wild) - can place anywhere
                trashState.drawnCard = oldCard;
                trashState.message = `Revealed a Jack (Wild)! Click any face-down spot.`;
            } else {
                // Check if spot is available
                const targetPosition = oldValue - 1;
                if (playerCards[targetPosition].faceUp) {
                    // Spot already filled - turn ends
                    trashState.message = `Revealed ${oldCard.rank}${oldCard.suit} - Spot ${oldValue} already filled! Turn ends.`;
                    trashState.discardPile.push(oldCard);
                    setTimeout(endTurn, 1500);
                } else {
                    // Continue placing
                    trashState.drawnCard = oldCard;
                    trashState.message = `Revealed ${oldCard.rank}${oldCard.suit} - Click spot ${oldValue} to place it.`;
                }
            }
        }

        // Check for win
        if (playerCards.every(c => c.faceUp)) {
            trashState.gameOver = true;
            trashState.message = trashState.currentPlayer === 1
                ? (trashState.mode === 'twoPlayer' ? '🎉 Player 1 wins!' : '🎉 You win!')
                : (trashState.mode === 'twoPlayer' ? '🎉 Player 2 wins!' : '😢 Computer wins!');
        }

        showTrashBoard();
    }

    function endTurn() {
        trashState.currentTurnActive = false;
        trashState.drawnCard = null;
        trashState.currentPlayer = trashState.currentPlayer === 1 ? 2 : 1;

        if (trashState.mode === 'vsComputer' && trashState.currentPlayer === 2) {
            trashState.message = "Computer's turn...";
            showTrashBoard();
            setTimeout(computerTurn, 1000);
        } else {
            trashState.message = trashState.mode === 'twoPlayer'
                ? `Player ${trashState.currentPlayer}: Draw a card!`
                : 'Your turn! Draw a card!';
            showTrashBoard();
        }
    }

    function computerTurn() {
        // Simple AI: draw from deck, place cards automatically
        if (trashState.deck.length === 0) {
            endTurn();
            return;
        }

        trashState.drawnCard = trashState.deck.pop();
        const value = getCardValue(trashState.drawnCard.rank);

        if (value === 0) {
            // Queen/King - discard and end turn
            trashState.discardPile.push(trashState.drawnCard);
            trashState.drawnCard = null;
            setTimeout(endTurn, 800);
            return;
        }

        // Try to place the card
        setTimeout(() => placeComputerCard(), 800);
    }

    function placeComputerCard() {
        if (!trashState.drawnCard) {
            endTurn();
            return;
        }

        const value = getCardValue(trashState.drawnCard.rank);
        const playerCards = trashState.player2Cards;

        // Find a valid position
        let targetPosition = -1;
        if (value === 11) {
            // Jack - place in first available spot
            targetPosition = playerCards.findIndex(c => !c.faceUp);
        } else {
            // Place in correct position if available
            const pos = value - 1;
            if (!playerCards[pos].faceUp) {
                targetPosition = pos;
            }
        }

        if (targetPosition === -1) {
            // No valid position - discard and end turn
            trashState.discardPile.push(trashState.drawnCard);
            trashState.drawnCard = null;
            setTimeout(endTurn, 500);
            return;
        }

        // Place the card
        const oldCard = playerCards[targetPosition];
        playerCards[targetPosition] = { ...trashState.drawnCard, faceUp: true };
        trashState.drawnCard = oldCard.faceUp ? null : oldCard;

        if (trashState.drawnCard) {
            trashState.drawnCard.faceUp = true;
        }

        showTrashBoard();

        // Check for win
        if (playerCards.every(c => c.faceUp)) {
            trashState.gameOver = true;
            trashState.message = '😢 Computer wins!';
            showTrashBoard();
            return;
        }

        // Continue or end turn
        if (trashState.drawnCard) {
            const newValue = getCardValue(trashState.drawnCard.rank);
            if (newValue === 0 || (newValue !== 11 && playerCards[newValue - 1].faceUp)) {
                // Can't place - end turn
                trashState.discardPile.push(trashState.drawnCard);
                trashState.drawnCard = null;
                setTimeout(endTurn, 800);
            } else {
                // Continue placing
                setTimeout(() => placeComputerCard(), 800);
            }
        } else {
            setTimeout(endTurn, 800);
        }
    }

    // Expose to global scope
    window.launchTrash = launchTrash;
    window.exitTrash = exitTrash;
    window.startTrashMode = startTrashMode;
    window.initializeGame = initializeGame;
    window.drawFromDeck = drawFromDeck;
    window.drawFromDiscard = drawFromDiscard;
    window.placeCard = placeCard;
    window.showTrashRules = showTrashRules;
    window.showTrashBoard = showTrashBoard;

})();
