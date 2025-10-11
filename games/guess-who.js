// Guess Who Game
(function() {
    'use strict';

    // Character database
    const characters = [
        { id: 1, name: 'Alex', gender: 'male', hair: 'brown', hairLength: 'short', glasses: false, hat: false, facialHair: 'none', skinTone: '#f4c8a8' },
        { id: 2, name: 'Emma', gender: 'female', hair: 'blonde', hairLength: 'long', glasses: false, hat: false, facialHair: 'none', skinTone: '#fadcbc' },
        { id: 3, name: 'James', gender: 'male', hair: 'red', hairLength: 'short', glasses: true, hat: false, facialHair: 'beard', skinTone: '#f4c8a8' },
        { id: 4, name: 'Sophia', gender: 'female', hair: 'brown', hairLength: 'long', glasses: true, hat: false, facialHair: 'none', skinTone: '#c68642' },
        { id: 5, name: 'Michael', gender: 'male', hair: 'bald', hairLength: 'bald', glasses: false, hat: true, facialHair: 'none', skinTone: '#8d5524' },
        { id: 6, name: 'Olivia', gender: 'female', hair: 'gray', hairLength: 'short', glasses: true, hat: false, facialHair: 'none', skinTone: '#fadcbc' },
        { id: 7, name: 'William', gender: 'male', hair: 'black', hairLength: 'short', glasses: false, hat: false, facialHair: 'beard', skinTone: '#8d5524' },
        { id: 8, name: 'Ava', gender: 'female', hair: 'red', hairLength: 'long', glasses: false, hat: true, facialHair: 'none', skinTone: '#fadcbc' },
        { id: 9, name: 'Daniel', gender: 'male', hair: 'brown', hairLength: 'short', glasses: true, hat: false, facialHair: 'none', skinTone: '#fadcbc' },
        { id: 10, name: 'Isabella', gender: 'female', hair: 'blonde', hairLength: 'long', glasses: false, hat: false, facialHair: 'none', skinTone: '#f4c8a8' },
        { id: 11, name: 'Robert', gender: 'male', hair: 'gray', hairLength: 'short', glasses: true, hat: false, facialHair: 'mustache', skinTone: '#fadcbc' },
        { id: 12, name: 'Mia', gender: 'female', hair: 'black', hairLength: 'short', glasses: false, hat: true, facialHair: 'none', skinTone: '#c68642' },
        { id: 13, name: 'David', gender: 'male', hair: 'blonde', hairLength: 'short', glasses: false, hat: false, facialHair: 'none', skinTone: '#f4c8a8' },
        { id: 14, name: 'Charlotte', gender: 'female', hair: 'brown', hairLength: 'short', glasses: true, hat: false, facialHair: 'none', skinTone: '#fadcbc' },
        { id: 15, name: 'Joseph', gender: 'male', hair: 'bald', hairLength: 'bald', glasses: true, hat: false, facialHair: 'beard', skinTone: '#8d5524' },
        { id: 16, name: 'Amelia', gender: 'female', hair: 'black', hairLength: 'long', glasses: true, hat: false, facialHair: 'none', skinTone: '#8d5524' },
        { id: 17, name: 'Thomas', gender: 'male', hair: 'gray', hairLength: 'short', glasses: false, hat: true, facialHair: 'beard', skinTone: '#fadcbc' },
        { id: 18, name: 'Harper', gender: 'female', hair: 'blonde', hairLength: 'short', glasses: false, hat: false, facialHair: 'none', skinTone: '#c68642' },
        { id: 19, name: 'Christopher', gender: 'male', hair: 'black', hairLength: 'short', glasses: true, hat: false, facialHair: 'none', skinTone: '#c68642' },
        { id: 20, name: 'Evelyn', gender: 'female', hair: 'bald', hairLength: 'bald', glasses: false, hat: true, facialHair: 'none', skinTone: '#f4c8a8' }
    ];

    // Generate SVG avatar for character
    function generateAvatar(char, size = 80) {
        const hairColors = {
            'brown': '#6b4423',
            'blonde': '#ffd700',
            'black': '#1a1a1a',
            'red': '#d2691e',
            'gray': '#a9a9a9',
            'bald': 'none'
        };

        const hairColor = hairColors[char.hair];
        const isLongHair = char.hairLength === 'long';
        const isBald = char.hair === 'bald';

        // Build SVG
        let svg = `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">`;

        // Hat (behind head if present)
        if (char.hat) {
            svg += `<ellipse cx="50" cy="30" rx="38" ry="18" fill="#2c3e50"/>
                    <rect x="12" y="28" width="76" height="8" rx="4" fill="#34495e"/>`;
        }

        // Hair (behind for long hair)
        if (!isBald && isLongHair) {
            svg += `<ellipse cx="50" cy="55" rx="40" ry="48" fill="${hairColor}"/>`;
        }

        // Face
        svg += `<circle cx="50" cy="55" r="32" fill="${char.skinTone}"/>`;

        // Hair (top for short hair)
        if (!isBald && !isLongHair && !char.hat) {
            svg += `<ellipse cx="50" cy="30" rx="32" ry="20" fill="${hairColor}"/>`;
        }

        // Eyes
        svg += `<circle cx="40" cy="50" r="3" fill="#2c3e50"/>
                <circle cx="60" cy="50" r="3" fill="#2c3e50"/>`;

        // Glasses
        if (char.glasses) {
            svg += `<circle cx="40" cy="50" r="8" fill="none" stroke="#2c3e50" stroke-width="2"/>
                    <circle cx="60" cy="50" r="8" fill="none" stroke="#2c3e50" stroke-width="2"/>
                    <line x1="48" y1="50" x2="52" y2="50" stroke="#2c3e50" stroke-width="2"/>`;
        }

        // Nose
        svg += `<line x1="50" y1="55" x2="50" y2="62" stroke="#2c3e50" stroke-width="1"/>`;

        // Mouth
        svg += `<path d="M 42 68 Q 50 72 58 68" fill="none" stroke="#2c3e50" stroke-width="2" stroke-linecap="round"/>`;

        // Facial hair
        if (char.facialHair === 'beard') {
            svg += `<ellipse cx="50" cy="75" rx="18" ry="12" fill="${hairColor}"/>`;
        } else if (char.facialHair === 'mustache') {
            svg += `<ellipse cx="50" cy="65" rx="12" ry="4" fill="${hairColor}"/>`;
        }

        svg += `</svg>`;
        return svg;
    }

    // Common questions
    const questions = [
        { text: 'Is your person male?', attribute: 'gender', value: 'male' },
        { text: 'Is your person female?', attribute: 'gender', value: 'female' },
        { text: 'Does your person have brown hair?', attribute: 'hair', value: 'brown' },
        { text: 'Does your person have blonde hair?', attribute: 'hair', value: 'blonde' },
        { text: 'Does your person have black hair?', attribute: 'hair', value: 'black' },
        { text: 'Does your person have red hair?', attribute: 'hair', value: 'red' },
        { text: 'Does your person have gray hair?', attribute: 'hair', value: 'gray' },
        { text: 'Is your person bald?', attribute: 'hair', value: 'bald' },
        { text: 'Does your person have long hair?', attribute: 'hairLength', value: 'long' },
        { text: 'Does your person have short hair?', attribute: 'hairLength', value: 'short' },
        { text: 'Does your person wear glasses?', attribute: 'glasses', value: true },
        { text: 'Does your person wear a hat?', attribute: 'hat', value: true },
        { text: 'Does your person have a beard?', attribute: 'facialHair', value: 'beard' },
        { text: 'Does your person have a mustache?', attribute: 'facialHair', value: 'mustache' },
        { text: 'Does your person have no facial hair?', attribute: 'facialHair', value: 'none' }
    ];

    // Game state
    const guessWhoState = {
        gameMode: null, // 'pass-and-play' or 'vs-ai'
        mySecret: null, // Character I picked
        opponentSecret: null, // Character opponent picked (or AI picked)
        myEliminated: [], // Character IDs I've eliminated
        opponentEliminated: [], // Character IDs opponent eliminated (VS AI only)
        currentPlayer: 'player1', // 'player1' or 'player2'
        questionHistory: [], // { player, question, answer }
        gameOver: false,
        winner: null
    };

    // Launch game and show mode selection
    window.launchGuessWho = function() {
        // Hide all other sections
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('plateTracker').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';

        // Show Guess Who game
        document.getElementById('guessWhoGame').style.display = 'block';

        const app = document.getElementById('guessWhoContent');
        app.innerHTML = `
            <div style="padding: 1rem; max-width: 800px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="showGamesMenu()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        ← Back
                    </button>
                    <h2 style="margin: 0; font-size: 1.5rem;">🕵️ Guess Who</h2>
                    <div style="width: 80px;"></div>
                </div>

                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h3 style="text-align: center; margin-bottom: 1.5rem;">Select Game Mode</h3>

                    <button onclick="startGuessWho('pass-and-play')" style="width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; margin-bottom: 1rem; font-weight: bold;">
                        👥 Pass and Play
                    </button>

                    <button onclick="startGuessWho('vs-ai')" style="width: 100%; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; padding: 1.5rem; border-radius: 12px; cursor: pointer; font-size: 1.2rem; font-weight: bold;">
                        🤖 Play vs Computer
                    </button>

                    <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        <h4 style="margin-top: 0;">How to Play:</h4>
                        <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                            <li>Each player secretly picks a character</li>
                            <li>Take turns asking yes/no questions</li>
                            <li>Eliminate characters based on answers</li>
                            <li>Make a guess when you're ready to win!</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    };

    // Start game with selected mode
    window.startGuessWho = function(mode) {
        guessWhoState.gameMode = mode;
        guessWhoState.mySecret = null;
        guessWhoState.opponentSecret = null;
        guessWhoState.myEliminated = [];
        guessWhoState.opponentEliminated = [];
        guessWhoState.currentPlayer = 'player1';
        guessWhoState.questionHistory = [];
        guessWhoState.gameOver = false;
        guessWhoState.winner = null;

        if (mode === 'vs-ai') {
            // AI picks a random character
            guessWhoState.opponentSecret = characters[Math.floor(Math.random() * characters.length)];
        }

        showCharacterPicker();
    };

    // Show character picker
    function showCharacterPicker() {
        const app = document.getElementById('guessWhoContent');
        const isPlayer2Pick = guessWhoState.gameMode === 'pass-and-play' && guessWhoState.mySecret !== null;

        app.innerHTML = `
            <div style="padding: 1rem; max-width: 800px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="launchGuessWho()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        ← Menu
                    </button>
                    <h2 style="margin: 0; font-size: 1.5rem;">🕵️ Guess Who</h2>
                    <div style="width: 80px;"></div>
                </div>

                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                    <h3 style="text-align: center; margin-bottom: 1.5rem;">
                        ${isPlayer2Pick ? 'Player 2: Pick Your Secret Character' : 'Pick Your Secret Character'}
                    </h3>
                    ${isPlayer2Pick ? '<p style="text-align: center; color: #666; margin-bottom: 1rem;">Player 1: Look away! 🙈</p>' : ''}

                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem;">
                        ${characters.map(char => `
                            <div onclick="selectCharacter(${char.id})" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem; border-radius: 8px; cursor: pointer; text-align: center; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                <div style="margin-bottom: 0.5rem; display: flex; justify-content: center;">${generateAvatar(char, 60)}</div>
                                <div style="font-weight: bold;">${char.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Select character
    window.selectCharacter = function(characterId) {
        const character = characters.find(c => c.id === characterId);

        if (guessWhoState.gameMode === 'pass-and-play' && guessWhoState.mySecret === null) {
            // Player 1 picking
            guessWhoState.mySecret = character;
            showCharacterPicker(); // Now let Player 2 pick
        } else if (guessWhoState.gameMode === 'pass-and-play' && guessWhoState.opponentSecret === null) {
            // Player 2 picking
            guessWhoState.opponentSecret = character;
            renderGame();
        } else {
            // VS AI mode - player picking
            guessWhoState.mySecret = character;
            renderGame();
        }
    };

    // Render the game board
    function renderGame() {
        const app = document.getElementById('guessWhoContent');
        const activeEliminated = guessWhoState.currentPlayer === 'player1' ? guessWhoState.myEliminated : guessWhoState.opponentEliminated;

        app.innerHTML = `
            <div style="padding: 1rem; max-width: 1000px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <button onclick="launchGuessWho()" style="background: #e74c3c; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        ← Menu
                    </button>
                    <h2 style="margin: 0; font-size: 1.5rem;">🕵️ Guess Who</h2>
                    <button onclick="startGuessWho('${guessWhoState.gameMode}')" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        New Game
                    </button>
                </div>

                ${!guessWhoState.gameOver ? `
                    <div style="text-align: center; padding: 1rem; background: #43e97b; color: white; border-radius: 8px; margin-bottom: 1rem; font-size: 1.2rem; font-weight: bold;">
                        ${guessWhoState.gameMode === 'vs-ai' ? 'Your Turn' : guessWhoState.currentPlayer === 'player1' ? 'Player 1\'s Turn' : 'Player 2\'s Turn'}
                    </div>
                ` : ''}

                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                    <h3 style="margin-top: 0;">Your Secret Character:</h3>
                    <div style="display: flex; align-items: center; gap: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem; border-radius: 8px;">
                        <div>${generateAvatar(guessWhoState.currentPlayer === 'player1' ? guessWhoState.mySecret : guessWhoState.opponentSecret, 80)}</div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: bold;">${guessWhoState.currentPlayer === 'player1' ? guessWhoState.mySecret.name : guessWhoState.opponentSecret.name}</div>
                            <div style="opacity: 0.9;">Keep this secret!</div>
                        </div>
                    </div>
                </div>

                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                    <h3 style="margin-top: 0;">Ask a Question:</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
                        ${questions.map((q, idx) => `
                            <button onclick="askQuestion(${idx})" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; text-align: left; font-size: 0.9rem;">
                                ${q.text}
                            </button>
                        `).join('')}
                    </div>
                </div>

                ${guessWhoState.questionHistory.length > 0 ? `
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                        <h3 style="margin-top: 0;">Question History:</h3>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${guessWhoState.questionHistory.slice().reverse().map(h => `
                                <div style="padding: 0.5rem; margin-bottom: 0.5rem; background: #f8f9fa; border-radius: 4px; border-left: 4px solid ${h.answer ? '#28a745' : '#e74c3c'};">
                                    <strong>${h.player}:</strong> ${h.question}
                                    <span style="color: ${h.answer ? '#28a745' : '#e74c3c'}; font-weight: bold;">
                                        ${h.answer ? '✓ YES' : '✗ NO'}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                    <h3 style="margin-top: 0;">All Characters:</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem;">
                        ${characters.map(char => {
                            const isEliminated = activeEliminated.includes(char.id);
                            return `
                                <div onclick="toggleEliminate(${char.id})" style="background: ${isEliminated ? '#ddd' : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}; padding: 0.75rem; border-radius: 8px; cursor: pointer; text-align: center; ${isEliminated ? 'opacity: 0.3;' : ''} transition: all 0.2s;">
                                    <div style="margin-bottom: 0.25rem; ${isEliminated ? 'filter: grayscale(100%);' : ''} display: flex; justify-content: center;">${generateAvatar(char, 60)}</div>
                                    <div style="font-weight: bold; font-size: 0.9rem; ${isEliminated ? 'text-decoration: line-through;' : ''}">${char.name}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <p style="text-align: center; color: #666; margin-top: 1rem; font-size: 0.9rem;">Click to eliminate characters based on answers</p>
                </div>

                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h3 style="margin-top: 0;">Make Your Guess:</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem;">
                        ${characters.map(char => `
                            <button onclick="makeGuess(${char.id})" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                                <div style="display: inline-flex;">${generateAvatar(char, 30)}</div>
                                <span>${char.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                ${guessWhoState.gameOver ? `
                    <div style="text-align: center; padding: 1.5rem; background: ${guessWhoState.winner === 'player1' || guessWhoState.winner === 'player' ? '#43e97b' : '#f5576c'}; color: white; border-radius: 8px; margin-top: 1rem; font-size: 1.3rem; font-weight: bold;">
                        ${guessWhoState.winner === 'player' ? '🎉 You Win!' : guessWhoState.winner === 'ai' ? '🤖 Computer Wins!' : guessWhoState.winner === 'player1' ? '🎉 Player 1 Wins!' : '🎉 Player 2 Wins!'}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Ask a question
    window.askQuestion = function(questionIdx) {
        if (guessWhoState.gameOver) return;

        const question = questions[questionIdx];
        const secret = guessWhoState.currentPlayer === 'player1' ? guessWhoState.opponentSecret : guessWhoState.mySecret;
        const answer = secret[question.attribute] === question.value;

        const playerName = guessWhoState.gameMode === 'vs-ai' ?
            'You' :
            (guessWhoState.currentPlayer === 'player1' ? 'Player 1' : 'Player 2');

        guessWhoState.questionHistory.push({
            player: playerName,
            question: question.text,
            answer: answer
        });

        // In pass-and-play, switch players after question
        if (guessWhoState.gameMode === 'pass-and-play') {
            guessWhoState.currentPlayer = guessWhoState.currentPlayer === 'player1' ? 'player2' : 'player1';
            renderGame();
        } else {
            // In VS AI mode, AI takes a turn after player
            renderGame();
            setTimeout(() => {
                if (!guessWhoState.gameOver) {
                    aiTakeTurn();
                }
            }, 1000);
        }
    };

    // AI takes a turn
    function aiTakeTurn() {
        // AI asks a random question
        const availableQuestions = questions.filter((q, idx) => {
            // Don't ask questions we've already asked
            return !guessWhoState.questionHistory.some(h => h.question === q.text && h.player === 'Computer');
        });

        if (availableQuestions.length === 0) {
            // No more questions, make a guess
            aiMakeGuess();
            return;
        }

        const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        const answer = guessWhoState.mySecret[question.attribute] === question.value;

        guessWhoState.questionHistory.push({
            player: 'Computer',
            question: question.text,
            answer: answer
        });

        // AI eliminates characters based on answer
        characters.forEach(char => {
            if (answer) {
                // Answer was YES, eliminate characters that DON'T match
                if (char[question.attribute] !== question.value) {
                    if (!guessWhoState.opponentEliminated.includes(char.id)) {
                        guessWhoState.opponentEliminated.push(char.id);
                    }
                }
            } else {
                // Answer was NO, eliminate characters that DO match
                if (char[question.attribute] === question.value) {
                    if (!guessWhoState.opponentEliminated.includes(char.id)) {
                        guessWhoState.opponentEliminated.push(char.id);
                    }
                }
            }
        });

        renderGame();

        // AI might make a guess if it has narrowed it down
        const remaining = characters.filter(c => !guessWhoState.opponentEliminated.includes(c.id));
        if (remaining.length === 1) {
            setTimeout(() => {
                if (!guessWhoState.gameOver) {
                    makeGuess(remaining[0].id, true);
                }
            }, 1500);
        }
    }

    // AI makes a guess
    function aiMakeGuess() {
        const remaining = characters.filter(c => !guessWhoState.opponentEliminated.includes(c.id));
        const guess = remaining.length > 0 ? remaining[0] : characters[Math.floor(Math.random() * characters.length)];
        makeGuess(guess.id, true);
    }

    // Toggle eliminate character
    window.toggleEliminate = function(characterId) {
        if (guessWhoState.gameOver) return;

        const eliminated = guessWhoState.currentPlayer === 'player1' ? guessWhoState.myEliminated : guessWhoState.opponentEliminated;
        const index = eliminated.indexOf(characterId);

        if (index > -1) {
            eliminated.splice(index, 1);
        } else {
            eliminated.push(characterId);
        }

        renderGame();
    };

    // Make a guess
    window.makeGuess = function(characterId, isAI = false) {
        if (guessWhoState.gameOver) return;

        const character = characters.find(c => c.id === characterId);

        if (guessWhoState.gameMode === 'vs-ai') {
            if (isAI) {
                // AI is guessing
                if (character.id === guessWhoState.mySecret.id) {
                    alert(`🤖 The computer guessed ${character.name} - and it was correct! Computer wins! 🎉`);
                    guessWhoState.gameOver = true;
                    guessWhoState.winner = 'ai';
                } else {
                    alert(`🤖 The computer guessed ${character.name} - but it was wrong! It was ${guessWhoState.mySecret.name}. You win! 🎉`);
                    guessWhoState.gameOver = true;
                    guessWhoState.winner = 'player';
                }
            } else {
                // Player is guessing
                if (character.id === guessWhoState.opponentSecret.id) {
                    guessWhoState.gameOver = true;
                    guessWhoState.winner = 'player';
                } else {
                    alert(`❌ Wrong! It was ${guessWhoState.opponentSecret.name}. You lose!`);
                    guessWhoState.gameOver = true;
                    guessWhoState.winner = 'ai';
                }
            }
        } else {
            // Pass-and-play mode
            const secret = guessWhoState.currentPlayer === 'player1' ? guessWhoState.opponentSecret : guessWhoState.mySecret;

            if (character.id === secret.id) {
                guessWhoState.gameOver = true;
                guessWhoState.winner = guessWhoState.currentPlayer;
            } else {
                alert(`❌ Wrong! It was ${secret.name}. The other player wins!`);
                guessWhoState.gameOver = true;
                guessWhoState.winner = guessWhoState.currentPlayer === 'player1' ? 'player2' : 'player1';
            }
        }

        renderGame();
    };

})();
