// 20 Questions Game
(function() {
    'use strict';

    let gameMode = null;
    let questionsAsked = 0;
    let maxQuestions = 20;
    let currentAnswer = null;
    let questionHistory = [];
    let aiKnowledge = {}; // For AI asking questions mode

    // Database of things for AI to think of
    const THINGS_DATABASE = [
        // Animals
        { name: 'Dog', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: true, size: 'medium' },
        { name: 'Cat', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: true, size: 'small' },
        { name: 'Eagle', category: 'animal', isLiving: true, canFly: true, hasLegs: true, isMammal: false, isPet: false, size: 'medium' },
        { name: 'Elephant', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large' },
        { name: 'Dolphin', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: true, isPet: false, size: 'large' },
        { name: 'Butterfly', category: 'animal', isLiving: true, canFly: true, hasLegs: true, isMammal: false, isPet: false, size: 'small' },
        { name: 'Lion', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large' },
        { name: 'Penguin', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: false, size: 'medium' },
        { name: 'Goldfish', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: false, isPet: true, size: 'small' },

        // Objects
        { name: 'Car', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: true, size: 'large', usedDaily: true },
        { name: 'Phone', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: true },
        { name: 'Book', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false },
        { name: 'Bicycle', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: true, size: 'medium', usedDaily: false },
        { name: 'Piano', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: false },
        { name: 'Refrigerator', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'large', usedDaily: true },
        { name: 'Pencil', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true },
        { name: 'Airplane', category: 'object', isLiving: false, canMove: true, isElectronic: true, isVehicle: true, size: 'large', usedDaily: false },
        { name: 'Guitar', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'medium', usedDaily: false },
        { name: 'Computer', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'medium', usedDaily: true },

        // Places
        { name: 'Beach', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: true, isPublic: true },
        { name: 'Library', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Mountain', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: false, isPublic: true },
        { name: 'School', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Restaurant', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Park', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: false, isPublic: true },
        { name: 'Hospital', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },

        // Food
        { name: 'Pizza', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: false },
        { name: 'Apple', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true },
        { name: 'Ice Cream', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false },
        { name: 'Broccoli', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true },
        { name: 'Chocolate', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false },
        { name: 'Banana', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true },

        // People/Characters
        { name: 'Superhero', category: 'concept', isReal: false, isPerson: true, isFamous: true, isFictional: true },
        { name: 'Teacher', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false },
        { name: 'Astronaut', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false },
    ];

    // Common questions AI can ask when it's the guesser
    const AI_QUESTIONS = [
        { question: "Is it a living thing?", property: 'isLiving' },
        { question: "Is it an animal?", property: 'category', value: 'animal' },
        { question: "Is it an object?", property: 'category', value: 'object' },
        { question: "Is it a place?", property: 'category', value: 'place' },
        { question: "Is it food?", property: 'category', value: 'food' },
        { question: "Can it fly?", property: 'canFly' },
        { question: "Does it have legs?", property: 'hasLegs' },
        { question: "Is it electronic?", property: 'isElectronic' },
        { question: "Is it bigger than a person?", property: 'size', value: 'large' },
        { question: "Is it smaller than your hand?", property: 'size', value: 'small' },
        { question: "Do people use it every day?", property: 'usedDaily' },
        { question: "Is it a vehicle?", property: 'isVehicle' },
        { question: "Is it a pet?", property: 'isPet' },
        { question: "Is it indoors?", property: 'isIndoors' },
        { question: "Is it natural (not man-made)?", property: 'isNatural' },
        { question: "Is it sweet?", property: 'isSweet' },
        { question: "Is it a fruit?", property: 'isFruit' },
    ];

    function startPlayerVsPlayer() {
        gameMode = 'pvp';
        questionsAsked = 0;
        questionHistory = [];
        renderPvPGame();
    }

    function startPlayerVsAI() {
        gameMode = 'player-guessing';
        questionsAsked = 0;
        questionHistory = [];
        currentAnswer = THINGS_DATABASE[Math.floor(Math.random() * THINGS_DATABASE.length)];
        renderPlayerGuessingGame();
    }

    function startAIVsPlayer() {
        gameMode = 'ai-guessing';
        questionsAsked = 0;
        questionHistory = [];
        aiKnowledge = {};
        renderAIGuessingGame();
    }

    function renderPvPGame() {
        const content = document.getElementById('twentyQuestionsContent');
        content.innerHTML = `
            <div style="max-width: 700px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 15px; text-align: center; margin-bottom: 2rem;">
                    <h3 style="font-size: 2rem; margin-bottom: 1rem;">Questions: ${questionsAsked} / ${maxQuestions}</h3>
                    <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
                        <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">One player thinks of something...</p>
                        <p style="font-size: 1rem; opacity: 0.9;">The other player asks yes/no questions to guess it!</p>
                    </div>
                </div>

                <div id="questionsList" style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem; min-height: 200px;">
                    ${questionHistory.length === 0 ?
                        '<p style="text-align: center; color: #999; padding: 3rem;">Questions asked will appear here...</p>' :
                        questionHistory.map((q, i) => `
                            <div style="background: white; padding: 1rem; margin-bottom: 0.75rem; border-radius: 8px; border-left: 4px solid ${q.answer === 'yes' ? '#28a745' : q.answer === 'no' ? '#dc3545' : '#6c757d'};">
                                <div style="font-weight: bold; color: #333; margin-bottom: 0.25rem;">Q${i + 1}: ${q.question}</div>
                                <div style="color: #666; text-transform: capitalize;">Answer: ${q.answer}</div>
                            </div>
                        `).join('')
                    }
                </div>

                ${questionsAsked < maxQuestions ? `
                    <div style="background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <label style="display: block; color: #333; font-weight: bold; margin-bottom: 1rem; font-size: 1.1rem;">
                            Ask a Yes/No Question:
                        </label>
                        <input type="text" id="questionInput" placeholder="e.g., Is it an animal?"
                            style="width: 100%; padding: 1rem; border: 2px solid #e9ecef; border-radius: 8px; font-size: 1rem; margin-bottom: 1rem;"
                            onkeypress="if(event.key==='Enter') document.getElementById('yesBtn').click()">

                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button id="yesBtn" onclick="window.recordAnswer('yes')" style="flex: 1; background: #28a745; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                                ✓ Yes
                            </button>
                            <button onclick="window.recordAnswer('no')" style="flex: 1; background: #dc3545; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                                ✗ No
                            </button>
                            <button onclick="window.recordAnswer('maybe')" style="flex: 1; background: #ffc107; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                                ? Maybe
                            </button>
                        </div>
                    </div>
                ` : `
                    <div style="background: #fff3cd; padding: 2rem; border-radius: 10px; text-align: center; border: 2px solid #ffc107;">
                        <h3 style="color: #856404; margin-bottom: 1rem;">Out of Questions!</h3>
                        <p style="color: #856404;">Did the guesser figure it out?</p>
                    </div>
                `}

                <div style="text-align: center; margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="window.resetTwentyQuestions()" style="background: #3498db; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                        New Game
                    </button>
                    <button onclick="window.exitTwentyQuestions()" style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                        Change Mode
                    </button>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem;">
                    <h4 style="color: #333; margin-bottom: 1rem;">Tips:</h4>
                    <ul style="color: #666; line-height: 1.8; padding-left: 1.5rem;">
                        <li>Start with broad categories (animal, person, place, thing?)</li>
                        <li>Narrow down with specific questions</li>
                        <li>Think strategically to use your 20 questions wisely!</li>
                    </ul>
                </div>
            </div>
        `;

        setTimeout(() => {
            const input = document.getElementById('questionInput');
            if (input) input.focus();
        }, 100);
    }

    function renderPlayerGuessingGame() {
        const content = document.getElementById('twentyQuestionsContent');
        const questionsLeft = maxQuestions - questionsAsked;

        content.innerHTML = `
            <div style="max-width: 700px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 2rem; border-radius: 15px; text-align: center; margin-bottom: 2rem;">
                    <h3 style="font-size: 2rem; margin-bottom: 1rem;">Questions Left: ${questionsLeft}</h3>
                    <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
                        <p style="font-size: 1.2rem;">🤔 I'm thinking of something...</p>
                        <p style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.5rem;">Ask yes/no questions to figure out what it is!</p>
                    </div>
                </div>

                <div id="aiQuestionsList" style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem; min-height: 200px;">
                    ${questionHistory.length === 0 ?
                        '<p style="text-align: center; color: #999; padding: 3rem;">Your questions will appear here...</p>' :
                        questionHistory.map((q, i) => `
                            <div style="background: white; padding: 1rem; margin-bottom: 0.75rem; border-radius: 8px; border-left: 4px solid ${q.answer === 'Yes' ? '#28a745' : '#dc3545'};">
                                <div style="font-weight: bold; color: #333; margin-bottom: 0.25rem;">Q${i + 1}: ${q.question}</div>
                                <div style="color: ${q.answer === 'Yes' ? '#28a745' : '#dc3545'}; font-weight: bold;">→ ${q.answer}</div>
                            </div>
                        `).join('')
                    }
                </div>

                ${questionsAsked < maxQuestions ? `
                    <div style="background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                        <label style="display: block; color: #333; font-weight: bold; margin-bottom: 1rem; font-size: 1.1rem;">
                            Ask a Yes/No Question:
                        </label>
                        <input type="text" id="aiQuestionInput" placeholder="e.g., Is it alive?"
                            style="width: 100%; padding: 1rem; border: 2px solid #e9ecef; border-radius: 8px; font-size: 1rem; margin-bottom: 1rem;"
                            onkeypress="if(event.key==='Enter') window.askAIQuestion()">

                        <button onclick="window.askAIQuestion()" style="width: 100%; background: #667eea; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                            Ask Question
                        </button>
                    </div>

                    <div style="background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <label style="display: block; color: #333; font-weight: bold; margin-bottom: 1rem; font-size: 1.1rem;">
                            Think you know? Make a guess:
                        </label>
                        <input type="text" id="guessInput" placeholder="e.g., Dog"
                            style="width: 100%; padding: 1rem; border: 2px solid #e9ecef; border-radius: 8px; font-size: 1rem; margin-bottom: 1rem;"
                            onkeypress="if(event.key==='Enter') window.makeGuess()">

                        <button onclick="window.makeGuess()" style="width: 100%; background: #28a745; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                            Make Final Guess
                        </button>
                    </div>
                ` : `
                    <div style="background: #f8d7da; padding: 2rem; border-radius: 10px; text-align: center; border: 2px solid #dc3545; margin-bottom: 1rem;">
                        <h3 style="color: #721c24; margin-bottom: 1rem;">Out of Questions!</h3>
                        <p style="color: #721c24; margin-bottom: 1.5rem;">Make your final guess:</p>
                        <input type="text" id="finalGuessInput" placeholder="What is it?"
                            style="width: 100%; padding: 1rem; border: 2px solid #721c24; border-radius: 8px; font-size: 1rem; margin-bottom: 1rem;"
                            onkeypress="if(event.key==='Enter') window.makeGuess()">
                        <button onclick="window.makeGuess()" style="width: 100%; background: #dc3545; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                            Submit Guess
                        </button>
                    </div>
                `}

                <div style="text-align: center; margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="window.resetTwentyQuestions()" style="background: #3498db; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                        New Game
                    </button>
                    <button onclick="window.exitTwentyQuestions()" style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                        Change Mode
                    </button>
                </div>
            </div>
        `;

        setTimeout(() => {
            const input = document.getElementById('aiQuestionInput');
            if (input) input.focus();
        }, 100);
    }

    function renderAIGuessingGame() {
        const content = document.getElementById('twentyQuestionsContent');
        const questionsLeft = maxQuestions - questionsAsked;

        content.innerHTML = `
            <div style="max-width: 700px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 2rem; border-radius: 15px; text-align: center; margin-bottom: 2rem;">
                    <h3 style="font-size: 2rem; margin-bottom: 1rem;">AI's Questions Left: ${questionsLeft}</h3>
                    <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 10px;">
                        <p style="font-size: 1.2rem;">🤖 Think of something...</p>
                        <p style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.5rem;">I'll try to guess it by asking questions!</p>
                    </div>
                </div>

                <div id="aiAsksQuestionsList" style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem; min-height: 200px;">
                    ${questionHistory.length === 0 ?
                        '<p style="text-align: center; color: #999; padding: 3rem;">AI questions will appear here...</p>' :
                        questionHistory.map((q, i) => `
                            <div style="background: white; padding: 1rem; margin-bottom: 0.75rem; border-radius: 8px; border-left: 4px solid #38f9d7;">
                                <div style="font-weight: bold; color: #333; margin-bottom: 0.25rem;">🤖 Q${i + 1}: ${q.question}</div>
                                <div style="color: ${q.answer === 'yes' ? '#28a745' : '#dc3545'}; font-weight: bold;">→ You answered: ${q.answer}</div>
                            </div>
                        `).join('')
                    }
                </div>

                ${questionsAsked < maxQuestions ? `
                    <div id="aiCurrentQuestion" style="background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 2rem;">
                        <p style="text-align: center; color: #666; font-style: italic;">Click "Next Question" to start!</p>
                    </div>
                ` : ''}

                <div style="text-align: center; margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.resetTwentyQuestions()" style="background: #3498db; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                        New Game
                    </button>
                    <button onclick="window.exitTwentyQuestions()" style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                        Change Mode
                    </button>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem;">
                    <h4 style="color: #333; margin-bottom: 1rem;">How it works:</h4>
                    <p style="color: #666; line-height: 1.6;">
                        Think of any person, place, animal, or thing. The AI will ask you yes/no questions to try to guess what you're thinking of.
                        Answer honestly and see if the AI can figure it out!
                    </p>
                </div>
            </div>
        `;

        if (questionsAsked === 0) {
            askNextAIQuestion();
        }
    }

    function askNextAIQuestion() {
        if (questionsAsked >= maxQuestions) {
            makeAIGuess();
            return;
        }

        // Find the best question to ask based on what we know
        const question = selectBestAIQuestion();

        const questionDiv = document.getElementById('aiCurrentQuestion');
        if (questionDiv) {
            questionDiv.innerHTML = `
                <h3 style="color: #333; margin-bottom: 1.5rem; font-size: 1.3rem;">🤖 ${question.question}</h3>
                <div style="display: flex; gap: 1rem;">
                    <button onclick="window.answerAIQuestion('yes', '${question.question.replace(/'/g, "\\'")}', '${question.property}', '${question.value || ''}')"
                        style="flex: 1; background: #28a745; color: white; border: none; padding: 1.25rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        Yes
                    </button>
                    <button onclick="window.answerAIQuestion('no', '${question.question.replace(/'/g, "\\'")}', '${question.property}', '${question.value || ''}')"
                        style="flex: 1; background: #dc3545; color: white; border: none; padding: 1.25rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                        No
                    </button>
                </div>
            `;
        }
    }

    function selectBestAIQuestion() {
        // Filter out questions we've already asked
        const askedQuestions = questionHistory.map(q => q.question);
        const availableQuestions = AI_QUESTIONS.filter(q => !askedQuestions.includes(q.question));

        if (availableQuestions.length > 0) {
            // Prioritize category questions first if we don't know the category
            if (!aiKnowledge.category) {
                const categoryQuestions = availableQuestions.filter(q => q.property === 'category');
                if (categoryQuestions.length > 0) {
                    return categoryQuestions[0];
                }
            }

            return availableQuestions[0];
        }

        // If we've run out of predefined questions, ask a generic one
        return { question: "Am I getting close?", property: 'generic' };
    }

    function answerAIQuestion(answer, question, property, value) {
        questionsAsked++;
        questionHistory.push({ question, answer });

        // Update AI's knowledge
        if (answer === 'yes') {
            if (value) {
                aiKnowledge[property] = value;
            } else {
                aiKnowledge[property] = true;
            }
        } else {
            if (value) {
                aiKnowledge[property] = 'not-' + value;
            } else {
                aiKnowledge[property] = false;
            }
        }

        renderAIGuessingGame();

        // After a few questions, maybe make a guess
        if (questionsAsked >= 10 && questionsAsked < maxQuestions && Math.random() > 0.7) {
            setTimeout(() => makeAIGuess(), 500);
        } else {
            setTimeout(() => askNextAIQuestion(), 500);
        }
    }

    function makeAIGuess() {
        // Try to find a match in our database
        const possibleMatches = THINGS_DATABASE.filter(thing => {
            for (const [key, value] of Object.entries(aiKnowledge)) {
                if (thing[key] !== undefined) {
                    if (typeof value === 'string' && value.startsWith('not-')) {
                        if (thing[key] === value.substring(4)) return false;
                    } else if (thing[key] !== value) {
                        return false;
                    }
                }
            }
            return true;
        });

        const guess = possibleMatches.length > 0 ?
            possibleMatches[Math.floor(Math.random() * possibleMatches.length)].name :
            "something interesting";

        const questionDiv = document.getElementById('aiCurrentQuestion');
        if (questionDiv) {
            questionDiv.innerHTML = `
                <div style="text-align: center;">
                    <h3 style="color: #333; margin-bottom: 1.5rem; font-size: 1.3rem;">🤖 I think I know!</h3>
                    <p style="font-size: 1.5rem; color: #667eea; font-weight: bold; margin-bottom: 1.5rem;">Is it a ${guess}?</p>
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="window.aiGuessResult(true, '${guess.replace(/'/g, "\\'")}')"
                            style="flex: 1; background: #28a745; color: white; border: none; padding: 1.25rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                            ✓ Yes! You got it!
                        </button>
                        <button onclick="window.aiGuessResult(false, '${guess.replace(/'/g, "\\'")}')"
                            style="flex: 1; background: #dc3545; color: white; border: none; padding: 1.25rem; border-radius: 10px; cursor: pointer; font-size: 1.1rem; font-weight: bold;">
                            ✗ Nope, try again
                        </button>
                    </div>
                </div>
            `;
        }
    }

    function aiGuessResult(correct, guess) {
        const questionDiv = document.getElementById('aiCurrentQuestion');
        if (questionDiv) {
            if (correct) {
                questionDiv.innerHTML = `
                    <div style="text-align: center; background: #d4edda; padding: 2rem; border-radius: 10px; border: 2px solid #28a745;">
                        <h2 style="color: #155724; margin-bottom: 1rem;">🎉 I win!</h2>
                        <p style="color: #155724; font-size: 1.2rem;">It was ${guess}! I guessed it in ${questionsAsked} questions!</p>
                    </div>
                `;
            } else {
                if (questionsAsked < maxQuestions) {
                    questionDiv.innerHTML = `
                        <div style="text-align: center; background: #fff3cd; padding: 2rem; border-radius: 10px; border: 2px solid #ffc107;">
                            <p style="color: #856404; font-size: 1.1rem; margin-bottom: 1rem;">Hmm, not ${guess}...</p>
                            <button onclick="window.askNextAIQuestion()"
                                style="background: #667eea; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                                Let me ask another question
                            </button>
                        </div>
                    `;
                } else {
                    questionDiv.innerHTML = `
                        <div style="text-align: center; background: #f8d7da; padding: 2rem; border-radius: 10px; border: 2px solid #dc3545;">
                            <h2 style="color: #721c24; margin-bottom: 1rem;">😅 You win!</h2>
                            <p style="color: #721c24; font-size: 1.1rem;">I couldn't guess it! What were you thinking of?</p>
                            <input type="text" id="revealAnswer" placeholder="Tell me what it was!"
                                style="width: 100%; padding: 1rem; border: 2px solid #721c24; border-radius: 8px; font-size: 1rem; margin-top: 1rem;">
                        </div>
                    `;
                }
            }
        }
    }

    function recordAnswer(answer) {
        const input = document.getElementById('questionInput');
        const question = input ? input.value.trim() : '';

        if (!question) {
            alert('Please enter a question first!');
            return;
        }

        questionsAsked++;
        questionHistory.push({ question, answer });
        renderPvPGame();
    }

    function askAIQuestion() {
        const input = document.getElementById('aiQuestionInput');
        const question = input ? input.value.trim() : '';

        if (!question) {
            alert('Please enter a question!');
            return;
        }

        // Simple AI logic to answer based on the current answer's properties
        let answer = 'No';
        const lowerQ = question.toLowerCase();

        if (currentAnswer) {
            // Check various properties
            if ((lowerQ.includes('living') || lowerQ.includes('alive')) && currentAnswer.isLiving) answer = 'Yes';
            if (lowerQ.includes('animal') && currentAnswer.category === 'animal') answer = 'Yes';
            if (lowerQ.includes('object') && currentAnswer.category === 'object') answer = 'Yes';
            if (lowerQ.includes('place') && currentAnswer.category === 'place') answer = 'Yes';
            if (lowerQ.includes('food') && currentAnswer.category === 'food') answer = 'Yes';
            if (lowerQ.includes('fly') && currentAnswer.canFly) answer = 'Yes';
            if (lowerQ.includes('legs') && currentAnswer.hasLegs) answer = 'Yes';
            if (lowerQ.includes('pet') && currentAnswer.isPet) answer = 'Yes';
            if (lowerQ.includes('electronic') && currentAnswer.isElectronic) answer = 'Yes';
            if ((lowerQ.includes('big') || lowerQ.includes('large')) && currentAnswer.size === 'large') answer = 'Yes';
            if ((lowerQ.includes('small') || lowerQ.includes('tiny')) && currentAnswer.size === 'small') answer = 'Yes';
            if (lowerQ.includes('mammal') && currentAnswer.isMammal) answer = 'Yes';
            if (lowerQ.includes('vehicle') && currentAnswer.isVehicle) answer = 'Yes';
            if (lowerQ.includes('indoor') && currentAnswer.isIndoors) answer = 'Yes';
            if (lowerQ.includes('natural') && currentAnswer.isNatural) answer = 'Yes';
            if (lowerQ.includes('sweet') && currentAnswer.isSweet) answer = 'Yes';
            if (lowerQ.includes('fruit') && currentAnswer.isFruit) answer = 'Yes';
        }

        questionsAsked++;
        questionHistory.push({ question, answer });
        renderPlayerGuessingGame();
    }

    function makeGuess() {
        const input = document.getElementById('guessInput') || document.getElementById('finalGuessInput');
        const guess = input ? input.value.trim() : '';

        if (!guess) {
            alert('Please enter a guess!');
            return;
        }

        const correct = guess.toLowerCase() === currentAnswer.name.toLowerCase();

        const content = document.getElementById('twentyQuestionsContent');
        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${correct ? '#d4edda' : '#f8d7da'};
            padding: 3rem;
            border-radius: 15px;
            border: 3px solid ${correct ? '#28a745' : '#dc3545'};
            z-index: 1000;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;

        resultDiv.innerHTML = `
            <h2 style="color: ${correct ? '#155724' : '#721c24'}; margin-bottom: 1rem; font-size: 2rem;">
                ${correct ? '🎉 Correct!' : '❌ Not Quite!'}
            </h2>
            <p style="color: ${correct ? '#155724' : '#721c24'}; font-size: 1.2rem; margin-bottom: 1.5rem;">
                ${correct ?
                    `You guessed it in ${questionsAsked} questions!` :
                    `The answer was: <strong>${currentAnswer.name}</strong>`
                }
            </p>
            <button onclick="this.parentElement.remove(); window.resetTwentyQuestions()"
                style="background: #667eea; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold; margin-right: 1rem;">
                Play Again
            </button>
            <button onclick="this.parentElement.remove()"
                style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                Close
            </button>
        `;

        document.body.appendChild(resultDiv);
    }

    function showModeSelection() {
        const content = document.getElementById('twentyQuestionsContent');
        content.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #333; margin-bottom: 2rem; font-size: 1.5rem;">Choose Game Mode</h3>

                <div style="display: grid; gap: 1.5rem; max-width: 700px; margin: 0 auto;">
                    <div onclick="window.startTwentyQuestionsPvP()"
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.5rem; margin-bottom: 0.5rem;">👥 Pass & Play</h4>
                        <p style="opacity: 0.9;">One player thinks, the other asks questions</p>
                    </div>

                    <div onclick="window.startTwentyQuestionsPlayerGuessing()"
                        style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 2rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.5rem; margin-bottom: 0.5rem;">🤖 You Guess (AI Thinks)</h4>
                        <p style="opacity: 0.9;">The AI thinks of something, you try to guess it</p>
                    </div>

                    <div onclick="window.startTwentyQuestionsAIGuessing()"
                        style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 2rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.5rem; margin-bottom: 0.5rem;">🧠 AI Guesses (You Think)</h4>
                        <p style="opacity: 0.9;">You think of something, the AI asks questions</p>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem; text-align: left; max-width: 700px; margin-left: auto; margin-right: auto;">
                    <h4 style="color: #333; margin-bottom: 1rem;">About 20 Questions:</h4>
                    <p style="color: #666; line-height: 1.6;">
                        20 Questions is a classic guessing game. One player thinks of a person, place, animal, or thing,
                        and the other player has up to 20 yes/no questions to figure out what it is. Strategic questioning
                        is key to winning!
                    </p>
                </div>
            </div>
        `;
    }

    // Expose functions to global scope
    window.launchTwentyQuestions = function() {
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('twentyQuestionsGame').style.display = 'block';
        showModeSelection();
    };

    window.startTwentyQuestionsPvP = function() {
        startPlayerVsPlayer();
    };

    window.startTwentyQuestionsPlayerGuessing = function() {
        startPlayerVsAI();
    };

    window.startTwentyQuestionsAIGuessing = function() {
        startAIVsPlayer();
    };

    window.recordAnswer = recordAnswer;
    window.askAIQuestion = askAIQuestion;
    window.answerAIQuestion = answerAIQuestion;
    window.askNextAIQuestion = askNextAIQuestion;
    window.aiGuessResult = aiGuessResult;
    window.makeGuess = makeGuess;

    window.resetTwentyQuestions = function() {
        if (gameMode === 'pvp') startPlayerVsPlayer();
        else if (gameMode === 'player-guessing') startPlayerVsAI();
        else if (gameMode === 'ai-guessing') startAIVsPlayer();
        else showModeSelection();
    };

    window.exitTwentyQuestions = function() {
        showModeSelection();
    };

    window.exitTwentyQuestionsToMenu = function() {
        document.getElementById('twentyQuestionsGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

})();
