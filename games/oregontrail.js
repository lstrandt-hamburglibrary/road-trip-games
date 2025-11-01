// The Oregon Trail - Classic 1971 Survival Game
(function() {
    'use strict';

    // Game constants
    const OCCUPATIONS = {
        'Banker': { money: 1600, multiplier: 1.0 },
        'Carpenter': { money: 800, multiplier: 2.0 },
        'Farmer': { money: 400, multiplier: 3.0 }
    };

    const MONTHS = ['March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const LANDMARKS = [
        { name: 'Independence, Missouri', distance: 0, isFort: true },
        { name: 'Kansas River', distance: 102, isFort: false },
        { name: 'Big Blue River', distance: 184, isFort: false },
        { name: 'Fort Kearney', distance: 302, isFort: true },
        { name: 'Chimney Rock', distance: 552, isFort: false },
        { name: 'Fort Laramie', distance: 638, isFort: true },
        { name: 'Independence Rock', distance: 828, isFort: false },
        { name: 'South Pass', distance: 930, isFort: false },
        { name: 'Fort Bridger', distance: 1112, isFort: true },
        { name: 'Soda Springs', distance: 1255, isFort: false },
        { name: 'Fort Hall', distance: 1312, isFort: true },
        { name: 'Snake River', distance: 1494, isFort: false },
        { name: 'Fort Boise', distance: 1607, isFort: true },
        { name: 'Blue Mountains', distance: 1767, isFort: false },
        { name: 'The Dalles', distance: 1947, isFort: false },
        { name: 'Willamette Valley, Oregon', distance: 2047, isFort: false }
    ];

    const DISEASES = ['Dysentery', 'Cholera', 'Typhoid', 'Measles', 'Exhaustion'];
    const INJURIES = ['Broken Arm', 'Broken Leg', 'Snake Bite'];

    const RANDOM_EVENTS = [
        { type: 'wagon_breakdown', text: 'Wagon breaks down!', cost: { type: 'part', item: 'wheel' } },
        { type: 'ox_injured', text: 'An ox injures its leg. Slowing down.', effect: 'slow' },
        { type: 'bad_water', text: 'Bad water! You lose time looking for clean source.', days: 2 },
        { type: 'heavy_rain', text: 'Heavy rains slow your progress.', days: 2 },
        { type: 'bandits', text: 'Bandits attack! You lose supplies.', loss: { food: 20, ammo: 5 } },
        { type: 'fire', text: 'Fire in wagon! You lose clothing and food.', loss: { food: 30, clothing: 1 } },
        { type: 'fog', text: 'Lost in fog. Wasted time.', days: 1 },
        { type: 'thief', text: 'Thief stole some of your supplies!', loss: { food: 10 } },
        { type: 'helpful_locals', text: 'Friendly travelers share food with you!', gain: { food: 20 } },
        { type: 'wild_fruit', text: 'Found wild fruit and berries!', gain: { food: 15 } }
    ];

    // Game state
    let gameState = {
        screen: 'title', // title, setup, naming, shopping, traveling, hunting, river, gameover
        occupation: null,
        leaderName: '',
        partyNames: ['', '', '', ''],
        month: 'March',
        day: 1,

        // Resources
        money: 0,
        food: 0,
        ammunition: 0,
        clothing: 3,
        oxen: 0,
        parts: { wheel: 0, axle: 0, tongue: 0 },

        // Status
        milesTraveled: 0,
        pace: 'steady', // steady, strenuous, grueling
        rations: 'filling', // filling, meager, barebones
        weather: 'fair',

        // Party health (1-5 scale, 5=healthy, 0=dead)
        partyHealth: [5, 5, 5, 5, 5],
        partyIllness: [null, null, null, null, null],
        partyAlive: [true, true, true, true, true],

        // Game state
        dayOfYear: 60, // March 1st
        isResting: false,
        restDays: 0,
        currentLandmark: 0,
        nextLandmark: 1,
        message: '',
        eventLog: [],
        gameOver: false,
        won: false
    };

    // Prices
    function getPrice(item, landmarkIndex) {
        const basePrices = {
            oxen: 20,
            food: 0.20,
            clothing: 10,
            ammunition: 2,
            wheel: 10,
            axle: 10,
            tongue: 10
        };
        // Prices increase as you go west
        const multiplier = 1 + (landmarkIndex * 0.1);
        return Math.floor(basePrices[item] * multiplier);
    }

    function initGame() {
        // Game is initialized through screens
    }

    function resetGame() {
        gameState = {
            screen: 'title',
            occupation: null,
            leaderName: '',
            partyNames: ['', '', '', ''],
            month: 'March',
            day: 1,
            money: 0,
            food: 0,
            ammunition: 0,
            clothing: 3,
            oxen: 0,
            parts: { wheel: 0, axle: 0, tongue: 0 },
            milesTraveled: 0,
            pace: 'steady',
            rations: 'filling',
            weather: 'fair',
            partyHealth: [5, 5, 5, 5, 5],
            partyIllness: [null, null, null, null, null],
            partyAlive: [true, true, true, true, true],
            dayOfYear: 60,
            isResting: false,
            restDays: 0,
            currentLandmark: 0,
            nextLandmark: 1,
            message: '',
            eventLog: [],
            gameOver: false,
            won: false
        };
    }

    // Advance day
    function advanceDay(days = 1) {
        for (let i = 0; i < days; i++) {
            gameState.dayOfYear++;
            gameState.day++;

            // Change month
            if (gameState.day > 30) {
                gameState.day = 1;
                const currentMonthIndex = MONTHS.indexOf(gameState.month);
                if (currentMonthIndex < MONTHS.length - 1) {
                    gameState.month = MONTHS[currentMonthIndex + 1];
                }
            }

            // Consume food
            consumeFood();

            // Check for illness progression
            updateHealth();

            // Random weather
            updateWeather();
        }

        // Check if time ran out (December 31st)
        if (gameState.dayOfYear > 274) { // ~October 1st deadline
            endGame(false, 'You ran out of time! Winter has set in.');
        }
    }

    function consumeFood() {
        const aliveCount = gameState.partyAlive.filter(a => a).length;
        let foodPerPerson = 3; // filling

        if (gameState.rations === 'meager') foodPerPerson = 2;
        if (gameState.rations === 'barebones') foodPerPerson = 1;

        const foodNeeded = aliveCount * foodPerPerson;
        gameState.food = Math.max(0, gameState.food - foodNeeded);

        // Starvation
        if (gameState.food === 0) {
            // Lose health when no food
            for (let i = 0; i < gameState.partyHealth.length; i++) {
                if (gameState.partyAlive[i]) {
                    gameState.partyHealth[i] = Math.max(0, gameState.partyHealth[i] - 1);
                    if (gameState.partyHealth[i] === 0) {
                        killPartyMember(i, 'starvation');
                    }
                }
            }
        }
    }

    function updateHealth() {
        for (let i = 0; i < gameState.partyHealth.length; i++) {
            if (!gameState.partyAlive[i]) continue;

            // If sick, lose health
            if (gameState.partyIllness[i]) {
                gameState.partyHealth[i] = Math.max(0, gameState.partyHealth[i] - 0.5);

                // Random recovery (20% chance per day if resting)
                if (gameState.isResting && Math.random() < 0.2) {
                    addLog(`${getPartyName(i)} has recovered from ${gameState.partyIllness[i]}!`);
                    gameState.partyIllness[i] = null;
                }

                // Death from illness
                if (gameState.partyHealth[i] === 0) {
                    killPartyMember(i, gameState.partyIllness[i]);
                }
            } else if (gameState.isResting) {
                // Recover health when resting
                gameState.partyHealth[i] = Math.min(5, gameState.partyHealth[i] + 0.5);
            }

            // Poor rations reduce health slowly
            if (gameState.rations === 'barebones' && Math.random() < 0.1) {
                gameState.partyHealth[i] = Math.max(0, gameState.partyHealth[i] - 0.2);
            }
        }
    }

    function updateWeather() {
        const weathers = ['fair', 'rainy', 'cold', 'hot', 'foggy'];
        // Weather changes 20% of the time
        if (Math.random() < 0.2) {
            gameState.weather = weathers[Math.floor(Math.random() * weathers.length)];
        }
    }

    function getPartyName(index) {
        if (index === 0) return gameState.leaderName;
        return gameState.partyNames[index - 1] || `Person ${index + 1}`;
    }

    function killPartyMember(index, cause) {
        gameState.partyAlive[index] = false;
        gameState.partyHealth[index] = 0;
        const name = getPartyName(index);
        addLog(`💀 ${name} has died of ${cause}.`);

        // Check if all dead
        if (!gameState.partyAlive.some(a => a)) {
            endGame(false, 'Your entire party has perished.');
        }
    }

    function addLog(message) {
        gameState.eventLog.unshift(message);
        if (gameState.eventLog.length > 3) {
            gameState.eventLog.pop();
        }
    }

    function travel() {
        if (gameState.isResting) {
            gameState.restDays--;
            if (gameState.restDays <= 0) {
                gameState.isResting = false;
                addLog('Finished resting. Ready to travel.');
            }
            advanceDay(1);
            updateDisplay();
            return;
        }

        // Calculate miles traveled
        let baseMiles = 20;

        // Pace affects distance
        if (gameState.pace === 'strenuous') baseMiles = 25;
        if (gameState.pace === 'grueling') baseMiles = 30;

        // Oxen affect distance
        const oxenFactor = Math.min(1, gameState.oxen / 4);
        baseMiles *= oxenFactor;

        // Weather affects distance
        if (gameState.weather === 'rainy') baseMiles *= 0.5;
        if (gameState.weather === 'foggy') baseMiles *= 0.7;

        // Random variation
        const miles = Math.floor(baseMiles * (0.8 + Math.random() * 0.4));

        gameState.milesTraveled += miles;

        // Random illness (varies by rations and pace) - check BEFORE advancing day
        checkForIllness();

        // Advance 1 day
        advanceDay(1);

        // Check for landmark
        if (gameState.milesTraveled >= LANDMARKS[gameState.nextLandmark].distance) {
            reachLandmark();
        }

        // Random event (15% chance)
        if (Math.random() < 0.15) {
            triggerRandomEvent();
        }

        updateDisplay();
    }

    function reachLandmark() {
        gameState.currentLandmark = gameState.nextLandmark;
        const landmark = LANDMARKS[gameState.currentLandmark];

        addLog(`📍 You have reached ${landmark.name}!`);

        if (gameState.currentLandmark === LANDMARKS.length - 1) {
            // Won the game!
            endGame(true, 'You have reached Oregon!');
            return;
        }

        gameState.nextLandmark++;
    }

    function triggerRandomEvent() {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];

        addLog(event.text);

        if (event.days) {
            advanceDay(event.days);
        }

        if (event.loss) {
            if (event.loss.food) gameState.food = Math.max(0, gameState.food - event.loss.food);
            if (event.loss.ammo) gameState.ammunition = Math.max(0, gameState.ammunition - event.loss.ammo);
            if (event.loss.clothing) gameState.clothing = Math.max(0, gameState.clothing - event.loss.clothing);
        }

        if (event.gain) {
            if (event.gain.food) gameState.food += event.gain.food;
        }

        if (event.cost && event.cost.type === 'part') {
            if (gameState.parts[event.cost.item] > 0) {
                gameState.parts[event.cost.item]--;
                addLog(`Used a spare ${event.cost.item} to fix the wagon. Lost 1 day.`);
                advanceDay(1);
            } else {
                addLog(`No spare ${event.cost.item}! Making repairs from scratch. Lost 3 days.`);
                advanceDay(3);
            }
        }
    }

    function checkForIllness() {
        // Higher chance if poor rations or grueling pace
        let chance = 0.02;

        if (gameState.rations === 'barebones') chance += 0.03;
        if (gameState.rations === 'meager') chance += 0.01;

        if (gameState.pace === 'grueling') chance += 0.03;
        if (gameState.pace === 'strenuous') chance += 0.01;

        // Cold weather increases illness
        if (gameState.weather === 'cold') chance += 0.02;

        for (let i = 0; i < gameState.partyAlive.length; i++) {
            if (!gameState.partyAlive[i]) continue;
            if (gameState.partyIllness[i]) continue; // Already sick

            if (Math.random() < chance) {
                // Get sick!
                const disease = DISEASES[Math.floor(Math.random() * DISEASES.length)];
                gameState.partyIllness[i] = disease;
                addLog(`${getPartyName(i)} has ${disease}!`);

                // Cholera can be instant death (10% chance)
                if (disease === 'Cholera' && Math.random() < 0.1) {
                    killPartyMember(i, 'Cholera');
                }
            }
        }
    }

    function rest(days) {
        gameState.isResting = true;
        gameState.restDays = days;
        addLog(`Resting for ${days} days...`);
        advanceDay(1);
        updateDisplay();
    }

    function hunt() {
        if (gameState.ammunition < 10) {
            gameState.message = 'Not enough ammunition to hunt! Need at least 10 bullets.';
            updateDisplay();
            return;
        }

        gameState.screen = 'hunting';
        updateDisplay();
    }

    function completeHunt(result) {
        // result is 'excellent', 'good', 'fair', 'poor'
        const ammoUsed = 10 + Math.floor(Math.random() * 10);
        gameState.ammunition = Math.max(0, gameState.ammunition - ammoUsed);

        let foodGained = 0;
        if (result === 'excellent') foodGained = 100;
        if (result === 'good') foodGained = 60;
        if (result === 'fair') foodGained = 30;
        if (result === 'poor') foodGained = 10;

        gameState.food = Math.min(985, gameState.food + foodGained); // Max 985 lbs

        addLog(`Hunted and got ${foodGained} lbs of food. Used ${ammoUsed} bullets.`);
        advanceDay(1);

        gameState.screen = 'traveling';
        updateDisplay();
    }

    function crossRiver(method) {
        // method: 'ford', 'caulk', 'ferry'
        const river = LANDMARKS[gameState.currentLandmark];

        let success = true;
        let cost = 0;

        if (method === 'ferry') {
            cost = 5 + Math.floor(Math.random() * 10);
            if (gameState.money >= cost) {
                gameState.money -= cost;
                success = true;
                addLog(`Paid $${cost} for ferry. Crossed safely.`);
            } else {
                gameState.message = 'Not enough money for ferry!';
                updateDisplay();
                return;
            }
        } else if (method === 'caulk') {
            // 70% success
            success = Math.random() < 0.7;
            if (success) {
                addLog('Successfully caulked wagon and floated across!');
            } else {
                addLog('Wagon tipped over in the river!');
                // Lose some supplies
                gameState.food = Math.floor(gameState.food * 0.7);
                gameState.ammunition = Math.floor(gameState.ammunition * 0.8);

                // Possible drowning
                if (Math.random() < 0.2) {
                    const victim = gameState.partyAlive.findIndex(a => a);
                    if (victim >= 0) {
                        killPartyMember(victim, 'drowning');
                    }
                }
            }
        } else if (method === 'ford') {
            // 50% success
            success = Math.random() < 0.5;
            if (success) {
                addLog('Forded the river successfully!');
            } else {
                addLog('Lost your footing in the river!');
                // Worse losses
                gameState.food = Math.floor(gameState.food * 0.5);
                gameState.ammunition = Math.floor(gameState.ammunition * 0.6);
                gameState.clothing = Math.max(0, gameState.clothing - 1);

                // Higher chance of drowning
                if (Math.random() < 0.3) {
                    const victim = gameState.partyAlive.findIndex(a => a);
                    if (victim >= 0) {
                        killPartyMember(victim, 'drowning');
                    }
                }
            }
        }

        advanceDay(1);
        gameState.screen = 'traveling';
        updateDisplay();
    }

    function buySupplies(item, quantity) {
        const price = getPrice(item, gameState.currentLandmark);
        const cost = price * quantity;

        if (gameState.money < cost) {
            gameState.message = 'Not enough money!';
            updateDisplay();
            return;
        }

        gameState.money -= cost;

        if (item === 'oxen') gameState.oxen += quantity;
        if (item === 'food') gameState.food += quantity;
        if (item === 'ammunition') gameState.ammunition += quantity;
        if (item === 'clothing') gameState.clothing += quantity;
        if (item === 'wheel') gameState.parts.wheel += quantity;
        if (item === 'axle') gameState.parts.axle += quantity;
        if (item === 'tongue') gameState.parts.tongue += quantity;

        gameState.message = `Bought ${quantity} ${item} for $${cost}`;
        updateDisplay();
    }

    function endGame(won, reason) {
        gameState.gameOver = true;
        gameState.won = won;
        gameState.screen = 'gameover';

        if (won) {
            addLog('🎉 ' + reason);
        } else {
            addLog('💀 ' + reason);
        }

        updateDisplay();
    }

    function calculateScore() {
        if (!gameState.won) return 0;

        let score = 0;

        // Points for health
        const totalHealth = gameState.partyHealth.reduce((a, b) => a + b, 0);
        score += totalHealth * 20;

        // Points for supplies
        score += gameState.food * 0.5;
        score += gameState.ammunition * 1;
        score += gameState.money;

        // Multiply by occupation
        const multiplier = OCCUPATIONS[gameState.occupation].multiplier;
        score = Math.floor(score * multiplier);

        return score;
    }

    function updateDisplay() {
        const container = document.getElementById('oregontrailContent');
        if (!container) return;

        if (gameState.screen === 'title') {
            showTitleScreen(container);
        } else if (gameState.screen === 'setup') {
            showSetupScreen(container);
        } else if (gameState.screen === 'naming') {
            showNamingScreen(container);
        } else if (gameState.screen === 'shopping') {
            showShoppingScreen(container);
        } else if (gameState.screen === 'traveling') {
            showTravelScreen(container);
        } else if (gameState.screen === 'hunting') {
            showHuntingScreen(container);
        } else if (gameState.screen === 'gameover') {
            showGameOverScreen(container);
        }
    }

    function showTitleScreen(container) {
        container.innerHTML = `
            <div style="
                background: linear-gradient(180deg, #87CEEB 0%, #F4E4C1 50%, #8B7355 100%);
                padding: 3rem 2rem;
                text-align: center;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            ">
                <div style="
                    background: rgba(255,255,255,0.9);
                    padding: 2rem;
                    border-radius: 10px;
                    margin-bottom: 2rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                ">
                    <h1 style="
                        font-size: 2.5rem;
                        margin-bottom: 0.5rem;
                        color: #5D4E37;
                        font-family: Georgia, serif;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                    ">THE OREGON TRAIL</h1>
                    <p style="
                        font-size: 1.1rem;
                        color: #6B5B45;
                        margin-top: 1rem;
                        line-height: 1.6;
                    ">Journey 2,000 miles from Independence, Missouri<br>to Oregon's Willamette Valley in 1848</p>
                </div>

                <button onclick="window.startOregonTrail()" style="
                    background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
                    color: white;
                    border: 3px solid #654321;
                    padding: 1.25rem 3rem;
                    font-size: 1.3rem;
                    font-weight: bold;
                    cursor: pointer;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    transition: transform 0.2s, box-shadow 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.3)'">
                    🚂 Start Your Journey
                </button>
            </div>
        `;
    }

    function showSetupScreen(container) {
        const occupationIcons = { 'Banker': '💰', 'Carpenter': '🔨', 'Farmer': '🌾' };
        container.innerHTML = `
            <div style="
                background: linear-gradient(180deg, #F4E4C1 0%, #E8D4B0 100%);
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            ">
                <h2 style="
                    color: #5D4E37;
                    font-family: Georgia, serif;
                    font-size: 2rem;
                    margin-bottom: 1rem;
                    text-align: center;
                ">Choose Your Occupation</h2>
                <p style="
                    text-align: center;
                    color: #6B5B45;
                    margin-bottom: 2rem;
                    font-size: 1.1rem;
                ">Your choice affects starting money and final score</p>
                ${Object.entries(OCCUPATIONS).map(([name, data]) => `
                    <div style="margin-bottom: 1rem;">
                        <button onclick="window.oregonSelectOccupation('${name}')" style="
                            background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
                            color: white;
                            border: 2px solid #654321;
                            padding: 1.5rem;
                            cursor: pointer;
                            border-radius: 10px;
                            width: 100%;
                            text-align: left;
                            font-size: 1.1rem;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                            transition: transform 0.2s, box-shadow 0.2s;
                        " onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.2)'">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <span style="font-size: 1.5rem; margin-right: 0.5rem;">${occupationIcons[name]}</span>
                                    <strong style="font-size: 1.2rem;">${name}</strong>
                                </div>
                                <div style="text-align: right; font-size: 0.95rem;">
                                    <div>$${data.money}</div>
                                    <div style="opacity: 0.8;">Score ×${data.multiplier}</div>
                                </div>
                            </div>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function showNamingScreen(container) {
        container.innerHTML = `
            <div style="
                background: linear-gradient(180deg, #F4E4C1 0%, #E8D4B0 100%);
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            ">
                <h2 style="
                    color: #5D4E37;
                    font-family: Georgia, serif;
                    font-size: 2rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                ">Name Your Party</h2>

                <div style="
                    background: rgba(255,255,255,0.7);
                    padding: 1.5rem;
                    border-radius: 10px;
                    margin-bottom: 1.5rem;
                ">
                    <p style="
                        color: #6B5B45;
                        font-weight: bold;
                        margin-bottom: 0.75rem;
                        font-size: 1.1rem;
                    ">👨‍🌾 Wagon Leader:</p>
                    <input type="text" id="oregonLeaderName" placeholder="Your name" style="
                        width: 100%;
                        padding: 0.75rem;
                        font-size: 1.1rem;
                        border: 2px solid #8B4513;
                        border-radius: 8px;
                        box-sizing: border-box;
                    " />
                </div>

                <div style="
                    background: rgba(255,255,255,0.7);
                    padding: 1.5rem;
                    border-radius: 10px;
                    margin-bottom: 1.5rem;
                ">
                    <p style="
                        color: #6B5B45;
                        font-weight: bold;
                        margin-bottom: 0.75rem;
                        font-size: 1.1rem;
                    ">👥 Companions:</p>
                    <input type="text" id="oregonName1" placeholder="Companion 1" style="
                        width: 100%;
                        padding: 0.75rem;
                        margin-bottom: 0.75rem;
                        font-size: 1rem;
                        border: 2px solid #A0522D;
                        border-radius: 8px;
                        box-sizing: border-box;
                    " />
                    <input type="text" id="oregonName2" placeholder="Companion 2" style="
                        width: 100%;
                        padding: 0.75rem;
                        margin-bottom: 0.75rem;
                        font-size: 1rem;
                        border: 2px solid #A0522D;
                        border-radius: 8px;
                        box-sizing: border-box;
                    " />
                    <input type="text" id="oregonName3" placeholder="Companion 3" style="
                        width: 100%;
                        padding: 0.75rem;
                        margin-bottom: 0.75rem;
                        font-size: 1rem;
                        border: 2px solid #A0522D;
                        border-radius: 8px;
                        box-sizing: border-box;
                    " />
                    <input type="text" id="oregonName4" placeholder="Companion 4" style="
                        width: 100%;
                        padding: 0.75rem;
                        font-size: 1rem;
                        border: 2px solid #A0522D;
                        border-radius: 8px;
                        box-sizing: border-box;
                    " />
                </div>

                <button onclick="window.oregonStartJourney()" style="
                    background: linear-gradient(135deg, #228B22 0%, #32CD32 100%);
                    color: white;
                    border: 3px solid #1B5E1B;
                    padding: 1.25rem 2rem;
                    cursor: pointer;
                    border-radius: 10px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    width: 100%;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    🏪 Continue to General Store
                </button>
            </div>
        `;
    }

    function showShoppingScreen(container) {
        const oxenPrice = getPrice('oxen', gameState.currentLandmark);
        const foodPrice = getPrice('food', gameState.currentLandmark);
        const ammoPrice = getPrice('ammunition', gameState.currentLandmark);
        const clothingPrice = getPrice('clothing', gameState.currentLandmark);
        const wheelPrice = getPrice('wheel', gameState.currentLandmark);

        container.innerHTML = `
            <div style="
                background: linear-gradient(180deg, #F4E4C1 0%, #E8D4B0 100%);
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            ">
                <h2 style="
                    color: #5D4E37;
                    font-family: Georgia, serif;
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                    text-align: center;
                ">🏪 Matt's General Store</h2>

                <div style="
                    background: linear-gradient(135deg, #228B22 0%, #32CD32 100%);
                    color: white;
                    padding: 1rem;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    text-align: center;
                    font-size: 1.5rem;
                    font-weight: bold;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                ">💰 Money: $${gameState.money}</div>

                <div style="
                    background: rgba(255,235,205,0.9);
                    border: 2px solid #DEB887;
                    padding: 1rem;
                    border-radius: 10px;
                    margin-bottom: 1.5rem;
                    font-size: 0.95rem;
                    line-height: 1.6;
                ">
                    <div style="font-weight: bold; color: #5D4E37; margin-bottom: 0.5rem;">💡 Recommended Supplies:</div>
                    <div><strong>Oxen:</strong> 3-4 (need at least 2 to pull wagon)</div>
                    <div><strong>Food:</strong> 200-300 lbs (can hunt for more)</div>
                    <div><strong>Ammunition:</strong> 100-200 bullets (for hunting)</div>
                    <div><strong>Clothing:</strong> 2-3 sets (for harsh weather)</div>
                    <div><strong>Spare Parts:</strong> 1-2 wheels, axles, tongues (repairs)</div>
                </div>

                <div style="
                    background: rgba(255,255,255,0.9);
                    padding: 1.5rem;
                    border-radius: 10px;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                ">
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.75rem; font-size: 1rem;">
                        <div style="font-weight: bold; color: #5D4E37;">Item</div>
                        <div style="font-weight: bold; color: #5D4E37; text-align: center;">Price</div>
                        <div style="font-weight: bold; color: #5D4E37; text-align: center;">Owned</div>

                        <div>🐂 Oxen</div>
                        <div style="text-align: center;">$${oxenPrice}</div>
                        <div style="text-align: center; font-weight: bold; color: #228B22;">${gameState.oxen}</div>

                        <div>🌾 Food (lbs)</div>
                        <div style="text-align: center;">$${foodPrice.toFixed(2)}</div>
                        <div style="text-align: center; font-weight: bold; color: #228B22;">${gameState.food}</div>

                        <div>🔫 Ammunition</div>
                        <div style="text-align: center;">$${ammoPrice}</div>
                        <div style="text-align: center; font-weight: bold; color: #228B22;">${gameState.ammunition}</div>

                        <div>👕 Clothing</div>
                        <div style="text-align: center;">$${clothingPrice}</div>
                        <div style="text-align: center; font-weight: bold; color: #228B22;">${gameState.clothing}</div>

                        <div>⚙️ Spare Wheel</div>
                        <div style="text-align: center;">$${wheelPrice}</div>
                        <div style="text-align: center; font-weight: bold; color: #228B22;">${gameState.parts.wheel}</div>
                    </div>
                </div>

                ${gameState.message ? `<div style="background: #FFA500; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-weight: bold; text-align: center;">${gameState.message}</div>` : ''}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
                    <button onclick="window.oregonBuy('oxen')" style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; border: 2px solid #654321; padding: 0.75rem; cursor: pointer; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">🐂 Buy Oxen</button>
                    <button onclick="window.oregonBuy('food')" style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; border: 2px solid #654321; padding: 0.75rem; cursor: pointer; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">🌾 Buy Food</button>
                    <button onclick="window.oregonBuy('ammunition')" style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; border: 2px solid #654321; padding: 0.75rem; cursor: pointer; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">🔫 Buy Ammo</button>
                    <button onclick="window.oregonBuy('clothing')" style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; border: 2px solid #654321; padding: 0.75rem; cursor: pointer; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">👕 Buy Clothes</button>
                    <button onclick="window.oregonBuy('wheel')" style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; border: 2px solid #654321; padding: 0.75rem; cursor: pointer; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">⚙️ Buy Wheel</button>
                </div>

                <button onclick="window.oregonLeaveStore()" style="
                    background: linear-gradient(135deg, #228B22 0%, #32CD32 100%);
                    color: white;
                    border: 3px solid #1B5E1B;
                    padding: 1.25rem;
                    cursor: pointer;
                    border-radius: 10px;
                    width: 100%;
                    font-size: 1.2rem;
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    🚂 Leave Store & Start Journey
                </button>
            </div>
        `;
    }

    function showTravelScreen(container) {
        const nextLandmark = LANDMARKS[gameState.nextLandmark];
        const currentLandmark = LANDMARKS[gameState.currentLandmark];
        const distanceToNext = nextLandmark.distance - gameState.milesTraveled;
        const isFort = currentLandmark.isFort;
        const weatherIcons = { fair: '☀️', rainy: '🌧️', cold: '❄️', hot: '🔥', foggy: '🌫️' };

        container.innerHTML = `
            <div style="
                background: linear-gradient(180deg, #87CEEB 0%, #F4E4C1 50%, #8B7355 100%);
                padding: 1.5rem;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            ">
                <!-- Location & Date Header -->
                <div style="
                    background: linear-gradient(135deg, #5D4E37 0%, #8B7355 100%);
                    color: white;
                    padding: 1.25rem;
                    border-radius: 10px;
                    margin-bottom: 1.25rem;
                    box-shadow: 0 3px 15px rgba(0,0,0,0.3);
                ">
                    <div style="font-size: 1rem; opacity: 0.9; margin-bottom: 0.5rem;">
                        📅 ${gameState.month} ${gameState.day} | ${weatherIcons[gameState.weather] || '☁️'} ${gameState.weather.charAt(0).toUpperCase() + gameState.weather.slice(1)}
                    </div>
                    <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                        📍 ${currentLandmark.name}
                    </div>
                    <div style="font-size: 1rem; opacity: 0.95;">
                        ${gameState.milesTraveled} miles traveled
                    </div>
                    <div style="font-size: 0.95rem; opacity: 0.9; margin-top: 0.25rem;">
                        ${distanceToNext} miles to ${nextLandmark.name}
                    </div>
                </div>

                <!-- Visual Wagon -->
                <div style="
                    background: rgba(255,255,255,0.95);
                    padding: 1.5rem;
                    border-radius: 10px;
                    margin-bottom: 1.25rem;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                ">
                    <div style="font-size: 3rem; line-height: 1;">
                        ${gameState.pace === 'grueling' ? '🏃' : gameState.pace === 'strenuous' ? '🚶' : '🧍'}
                        <span style="font-size: 4rem;">🎪</span>
                        ${gameState.oxen >= 4 ? '🐂🐂' : gameState.oxen >= 2 ? '🐂' : '❌'}
                    </div>
                    <div style="font-size: 0.9rem; color: #5D4E37; margin-top: 0.5rem;">
                        Pace: <strong>${gameState.pace.charAt(0).toUpperCase() + gameState.pace.slice(1)}</strong> |
                        Oxen: <strong>${gameState.oxen}</strong>
                    </div>
                </div>

                <!-- Progress Map -->
                <div style="
                    background: rgba(255,255,255,0.95);
                    padding: 1.5rem;
                    border-radius: 10px;
                    margin-bottom: 1.25rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                ">
                    <div style="font-weight: bold; margin-bottom: 1rem; color: #5D4E37; font-size: 1.1rem;">
                        🗺️ Trail Progress
                    </div>
                    <div style="position: relative; height: 60px; background: linear-gradient(to right, #8B7355 0%, #A0522D 50%, #228B22 100%); border-radius: 20px; overflow: hidden;">
                        <!-- Trail line -->
                        <div style="position: absolute; top: 50%; left: 0; right: 0; height: 4px; background: #654321; transform: translateY(-50%);"></div>

                        <!-- Landmarks -->
                        ${LANDMARKS.map((landmark, idx) => {
                            const progress = (landmark.distance / 2047) * 100;
                            const isPassed = gameState.milesTraveled >= landmark.distance;
                            const isCurrent = idx === gameState.currentLandmark;
                            return `
                                <div style="
                                    position: absolute;
                                    left: ${progress}%;
                                    top: 50%;
                                    transform: translate(-50%, -50%);
                                    font-size: ${isCurrent ? '2rem' : '1.5rem'};
                                    ${isCurrent ? 'animation: bounce 1s infinite;' : ''}
                                " title="${landmark.name}">
                                    ${isCurrent ? '🚂' : isPassed ? (landmark.isFort ? '🏰' : '✅') : (landmark.isFort ? '🏛️' : '⭕')}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div style="margin-top: 0.75rem; font-size: 0.85rem; color: #5D4E37; text-align: center;">
                        ${Math.round((gameState.milesTraveled / 2047) * 100)}% complete (${gameState.milesTraveled} / 2047 miles)
                    </div>
                    <style>
                        @keyframes bounce {
                            0%, 100% { transform: translate(-50%, -60%); }
                            50% { transform: translate(-50%, -40%); }
                        }
                    </style>
                </div>

                <!-- Supplies -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
                    <div style="background: rgba(255,255,255,0.95); padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-weight: bold; color: #5D4E37;">
                        🌾 Food: <span style="color: ${gameState.food < 50 ? '#e74c3c' : '#228B22'};">${gameState.food} lbs</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.95); padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-weight: bold; color: #5D4E37;">
                        🔫 Ammo: <span style="color: ${gameState.ammunition < 20 ? '#e74c3c' : '#228B22'};">${gameState.ammunition}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.95); padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-weight: bold; color: #5D4E37;">
                        👕 Clothes: <span style="color: ${gameState.clothing < 1 ? '#e74c3c' : '#228B22'};">${gameState.clothing}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.95); padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-weight: bold; color: #5D4E37;">
                        💰 Money: <span style="color: #228B22;">$${gameState.money}</span>
                    </div>
                </div>

                <!-- Party Health -->
                <div style="background: rgba(255,255,255,0.95); padding: 1.25rem; border-radius: 10px; margin-bottom: 1.25rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="font-weight: bold; margin-bottom: 0.75rem; color: #5D4E37; font-size: 1.1rem;">👥 Party Health:</div>
                    ${gameState.partyAlive.map((alive, i) => {
                        if (!alive) return `<div style="color: #999; margin-bottom: 0.5rem; font-size: 1rem;">💀 ${getPartyName(i)} - Dead</div>`;
                        const health = Math.round(gameState.partyHealth[i]);
                        const illness = gameState.partyIllness[i];
                        const healthColor = health >= 4 ? '#228B22' : health >= 2 ? '#FFA500' : '#e74c3c';
                        const healthBar = '█'.repeat(health) + '░'.repeat(5 - health);
                        return `<div style="margin-bottom: 0.5rem; font-size: 1rem;">
                            <strong>${getPartyName(i)}:</strong>
                            <span style="color: ${healthColor};">${healthBar}</span>
                            ${illness ? `<span style="color: #e74c3c; font-weight: bold;">(${illness})</span>` : ''}
                        </div>`;
                    }).join('')}
                </div>

                <!-- Event Log -->
                ${gameState.eventLog.length > 0 ? `
                    <div style="background: rgba(255,235,205,0.95); border: 2px solid #DEB887; padding: 1rem; border-radius: 10px; margin-bottom: 1.25rem; font-size: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        ${gameState.eventLog.map(log => `<div style="margin-bottom: 0.5rem; line-height: 1.5;">${log}</div>`).join('')}
                    </div>
                ` : ''}

                <!-- Action Buttons -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
                    <button onclick="window.oregonContinue()" style="
                        background: linear-gradient(135deg, #228B22 0%, #32CD32 100%);
                        color: white;
                        border: 2px solid #1B5E1B;
                        padding: 1rem;
                        cursor: pointer;
                        border-radius: 8px;
                        font-weight: bold;
                        font-size: 1.1rem;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🚂 Continue</button>
                    <button onclick="window.oregonRest()" style="
                        background: linear-gradient(135deg, #3498db 0%, #5DADE2 100%);
                        color: white;
                        border: 2px solid #2874A6;
                        padding: 1rem;
                        cursor: pointer;
                        border-radius: 8px;
                        font-weight: bold;
                        font-size: 1.1rem;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">😴 Rest</button>
                    <button onclick="window.oregonHunt()" style="
                        background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
                        color: white;
                        border: 2px solid #654321;
                        padding: 1rem;
                        cursor: pointer;
                        border-radius: 8px;
                        font-weight: bold;
                        font-size: 1.1rem;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🦌 Hunt</button>
                    ${isFort ? `<button onclick="window.oregonStore()" style="
                        background: linear-gradient(135deg, #9b59b6 0%, #BB8FCE 100%);
                        color: white;
                        border: 2px solid #7D3C98;
                        padding: 1rem;
                        cursor: pointer;
                        border-radius: 8px;
                        font-weight: bold;
                        font-size: 1.1rem;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🏪 Store</button>` : ''}
                </div>

                <!-- Pace & Rations Settings -->
                <details style="margin-bottom: 1rem;">
                    <summary style="
                        cursor: pointer;
                        padding: 1rem;
                        background: rgba(255,255,255,0.95);
                        border-radius: 8px;
                        font-weight: bold;
                        color: #5D4E37;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    ">⚙️ Change Pace & Rations</summary>
                    <div style="padding: 1rem; background: rgba(255,255,255,0.9); border-radius: 8px; margin-top: 0.5rem;">
                        <div style="margin-bottom: 0.75rem; font-weight: bold; color: #5D4E37;">Pace:</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                            <button onclick="window.oregonSetPace('steady')" style="background: ${gameState.pace === 'steady' ? 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)' : '#95a5a6'}; color: white; border: none; padding: 0.75rem; cursor: pointer; border-radius: 6px; font-weight: bold;">Steady</button>
                            <button onclick="window.oregonSetPace('strenuous')" style="background: ${gameState.pace === 'strenuous' ? 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)' : '#95a5a6'}; color: white; border: none; padding: 0.75rem; cursor: pointer; border-radius: 6px; font-weight: bold;">Strenuous</button>
                            <button onclick="window.oregonSetPace('grueling')" style="background: ${gameState.pace === 'grueling' ? 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)' : '#95a5a6'}; color: white; border: none; padding: 0.75rem; cursor: pointer; border-radius: 6px; font-weight: bold;">Grueling</button>
                        </div>

                        <div style="margin-bottom: 0.75rem; font-weight: bold; color: #5D4E37;">Rations:</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">
                            <button onclick="window.oregonSetRations('filling')" style="background: ${gameState.rations === 'filling' ? 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)' : '#95a5a6'}; color: white; border: none; padding: 0.75rem; cursor: pointer; border-radius: 6px; font-weight: bold;">Filling</button>
                            <button onclick="window.oregonSetRations('meager')" style="background: ${gameState.rations === 'meager' ? 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)' : '#95a5a6'}; color: white; border: none; padding: 0.75rem; cursor: pointer; border-radius: 6px; font-weight: bold;">Meager</button>
                            <button onclick="window.oregonSetRations('barebones')" style="background: ${gameState.rations === 'barebones' ? 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)' : '#95a5a6'}; color: white; border: none; padding: 0.75rem; cursor: pointer; border-radius: 6px; font-weight: bold;">Bare Bones</button>
                        </div>
                    </div>
                </details>
            </div>
        `;
    }

    function showHuntingScreen(container) {
        container.innerHTML = `
            <div style="
                background: linear-gradient(180deg, #87CEEB 0%, #90EE90 100%);
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            ">
                <h2 style="text-align: center; color: #5D4E37; font-family: Georgia, serif; margin-bottom: 1rem;">
                    🏹 Hunting Mini-Game
                </h2>

                <div style="
                    background: rgba(255,255,255,0.9);
                    padding: 1rem;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    text-align: center;
                ">
                    <div style="font-size: 1.1rem; color: #5D4E37; margin-bottom: 0.5rem;">
                        🔫 Ammo: <span id="huntAmmo" style="font-weight: bold;">10</span> |
                        🥩 Food: <span id="huntFood" style="font-weight: bold; color: #228B22;">0</span> lbs |
                        ⏱️ Time: <span id="huntTime" style="font-weight: bold;">30</span>s
                    </div>
                    <div style="font-size: 0.9rem; color: #666;">
                        Click on animals to shoot them!
                    </div>
                </div>

                <canvas id="huntingCanvas" width="600" height="400" style="
                    display: block;
                    margin: 0 auto;
                    background: linear-gradient(180deg, #87CEEB 0%, #90EE90 70%, #8B7355 100%);
                    border: 4px solid #654321;
                    border-radius: 10px;
                    cursor: crosshair;
                    max-width: 100%;
                    height: auto;
                "></canvas>

                <div style="text-align: center; margin-top: 1rem;">
                    <button id="huntDoneBtn" onclick="window.endHunt()" style="
                        background: linear-gradient(135deg, #228B22 0%, #32CD32 100%);
                        color: white;
                        border: 3px solid #1B5E1B;
                        padding: 1rem 2rem;
                        cursor: pointer;
                        border-radius: 10px;
                        font-size: 1.1rem;
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    ">Done Hunting</button>
                </div>
            </div>
        `;

        // Start hunting game
        setTimeout(() => startHuntingGame(), 100);
    }

    let huntingGame = null;

    function startHuntingGame() {
        const canvas = document.getElementById('huntingCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const animals = [];
        let ammo = 10;
        let foodGained = 0;
        let timeLeft = 30;
        let gameRunning = true;

        // Animal types
        const animalTypes = [
            { emoji: '🦌', points: 50, speed: 2, size: 40 },
            { emoji: '🐰', points: 10, speed: 4, size: 30 },
            { emoji: '🦆', points: 15, speed: 3, size: 30 },
            { emoji: '🦬', points: 100, speed: 1, size: 50 }
        ];

        // Spawn animal
        function spawnAnimal() {
            if (!gameRunning) return;
            const type = animalTypes[Math.floor(Math.random() * animalTypes.length)];
            const fromLeft = Math.random() > 0.5;
            animals.push({
                ...type,
                x: fromLeft ? -50 : canvas.width + 50,
                y: 250 + Math.random() * 100,
                direction: fromLeft ? 1 : -1,
                alive: true
            });
        }

        // Update game
        function update() {
            if (!gameRunning) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw ground
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(0, 350, canvas.width, 50);

            // Draw grass
            for (let i = 0; i < 20; i++) {
                ctx.font = '20px Arial';
                ctx.fillText('🌿', i * 30, 370 + Math.sin(Date.now() / 200 + i) * 5);
            }

            // Update and draw animals
            for (let i = animals.length - 1; i >= 0; i--) {
                const animal = animals[i];

                if (animal.alive) {
                    animal.x += animal.speed * animal.direction;

                    // Remove if off screen
                    if (animal.x < -100 || animal.x > canvas.width + 100) {
                        animals.splice(i, 1);
                        continue;
                    }

                    // Draw animal
                    ctx.font = `${animal.size}px Arial`;
                    ctx.fillText(animal.emoji, animal.x, animal.y);
                }
            }

            // Update UI
            document.getElementById('huntAmmo').textContent = ammo;
            document.getElementById('huntFood').textContent = foodGained;
            document.getElementById('huntTime').textContent = timeLeft;

            if (gameRunning) {
                requestAnimationFrame(update);
            }
        }

        // Handle clicks
        canvas.addEventListener('click', (e) => {
            if (!gameRunning || ammo <= 0) return;

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;

            ammo--;

            // Check if hit animal
            for (let animal of animals) {
                if (!animal.alive) continue;

                const distance = Math.sqrt(
                    Math.pow(clickX - animal.x, 2) +
                    Math.pow(clickY - animal.y, 2)
                );

                if (distance < animal.size) {
                    animal.alive = false;
                    foodGained += animal.points;

                    // Show hit effect
                    ctx.fillStyle = 'red';
                    ctx.beginPath();
                    ctx.arc(clickX, clickY, 20, 0, Math.PI * 2);
                    ctx.fill();

                    break;
                }
            }

            // Show shot
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(clickX, clickY, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Timer
        const timerInterval = setInterval(() => {
            if (!gameRunning) {
                clearInterval(timerInterval);
                return;
            }

            timeLeft--;
            if (timeLeft <= 0 || ammo <= 0) {
                gameRunning = false;
                clearInterval(timerInterval);
                document.getElementById('huntDoneBtn').style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
                document.getElementById('huntDoneBtn').textContent = 'Time Up! Return to Trail';
            }
        }, 1000);

        // Spawn animals periodically
        const spawnInterval = setInterval(() => {
            if (!gameRunning) {
                clearInterval(spawnInterval);
                return;
            }
            spawnAnimal();
        }, 2000);

        // Initial animals
        spawnAnimal();
        spawnAnimal();

        // Start game loop
        update();

        // Store game state
        huntingGame = {
            stop: () => {
                gameRunning = false;
                clearInterval(timerInterval);
                clearInterval(spawnInterval);
            },
            getFood: () => foodGained,
            getAmmo: () => ammo
        };
    }

    window.endHunt = function() {
        if (!huntingGame) {
            completeHunt('poor');
            return;
        }

        const foodGained = huntingGame.getFood();
        const ammoUsed = 10 - huntingGame.getAmmo();

        huntingGame.stop();
        huntingGame = null;

        // Determine result
        let result = 'poor';
        if (foodGained >= 100) result = 'excellent';
        else if (foodGained >= 60) result = 'good';
        else if (foodGained >= 30) result = 'fair';

        gameState.ammunition = Math.max(0, gameState.ammunition - ammoUsed);
        gameState.food = Math.min(985, gameState.food + foodGained);

        addLog(`Hunted and got ${foodGained} lbs of food. Used ${ammoUsed} bullets.`);
        advanceDay(1);

        gameState.screen = 'traveling';
        updateDisplay();
    };

    function showGameOverScreen(container) {
        const score = calculateScore();

        container.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h1 style="font-size: 2rem; margin-bottom: 1rem;">${gameState.won ? '🎉 YOU MADE IT!' : '💀 GAME OVER'}</h1>
                ${gameState.won ? `
                    <p style="font-size: 1.2rem; margin-bottom: 1rem;">Congratulations! You reached Oregon!</p>
                    <div style="background: #2ecc71; color: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem;">
                        <div style="font-size: 2rem; font-weight: bold;">Score: ${score.toLocaleString()}</div>
                        <div style="font-size: 0.9rem; margin-top: 0.5rem;">${gameState.occupation} (×${OCCUPATIONS[gameState.occupation].multiplier})</div>
                    </div>
                ` : `
                    <p style="margin-bottom: 1rem;">${gameState.eventLog[0]}</p>
                `}

                <div style="background: #ecf0f1; padding: 1rem; border-radius: 5px; margin-bottom: 1rem; text-align: left;">
                    <div><strong>Miles Traveled:</strong> ${gameState.milesTraveled} / 2047</div>
                    <div><strong>Days Survived:</strong> ${gameState.dayOfYear - 60}</div>
                    <div><strong>Survivors:</strong> ${gameState.partyAlive.filter(a => a).length} / 5</div>
                </div>

                <button onclick="window.oregonPlayAgain()" style="background: #3498db; color: white; border: none; padding: 1rem 2rem; cursor: pointer; border-radius: 5px; font-size: 1rem;">Play Again</button>
            </div>
        `;
    }

    // Export functions to window
    window.launchOregonTrail = function() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('oregontrailGame').style.display = 'block';
        resetGame();
        updateDisplay();
    };

    window.exitOregonTrail = function() {
        document.getElementById('oregontrailGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

    window.startOregonTrail = function() {
        gameState.screen = 'setup';
        updateDisplay();
    };

    window.oregonSelectOccupation = function(occupation) {
        gameState.occupation = occupation;
        gameState.money = OCCUPATIONS[occupation].money;
        gameState.screen = 'naming';
        updateDisplay();
    };

    window.oregonStartJourney = function() {
        gameState.leaderName = document.getElementById('oregonLeaderName').value || 'Leader';
        gameState.partyNames[0] = document.getElementById('oregonName1').value || 'Person 2';
        gameState.partyNames[1] = document.getElementById('oregonName2').value || 'Person 3';
        gameState.partyNames[2] = document.getElementById('oregonName3').value || 'Person 4';
        gameState.partyNames[3] = document.getElementById('oregonName4').value || 'Person 5';
        gameState.screen = 'shopping';
        updateDisplay();
    };

    window.oregonBuy = function(item) {
        let amount = 1;
        if (item === 'food') amount = 50;
        if (item === 'ammunition') amount = 20;

        const input = prompt(`How many ${item}?`, amount);
        if (input) {
            const qty = parseInt(input);
            if (qty > 0) {
                buySupplies(item, qty);
            }
        }
    };

    window.oregonLeaveStore = function() {
        if (gameState.oxen < 2) {
            alert('You need at least 2 oxen to pull your wagon!');
            return;
        }
        gameState.screen = 'traveling';
        addLog('Your journey begins!');
        updateDisplay();
    };

    window.oregonContinue = function() {
        // Clear "Your journey begins!" message on first travel
        if (gameState.milesTraveled === 0 && gameState.eventLog.includes('Your journey begins!')) {
            gameState.eventLog = [];
        }
        travel();
    };

    window.oregonRest = function() {
        rest(3);
    };

    window.oregonHunt = function() {
        hunt();
    };

    window.oregonStore = function() {
        gameState.screen = 'shopping';
        updateDisplay();
    };

    window.oregonSetPace = function(pace) {
        gameState.pace = pace;
        updateDisplay();
    };

    window.oregonSetRations = function(rations) {
        gameState.rations = rations;
        updateDisplay();
    };

    window.oregonCompleteHunt = function(result) {
        completeHunt(result);
    };

    window.oregonPlayAgain = function() {
        resetGame();
        updateDisplay();
    };

})();
