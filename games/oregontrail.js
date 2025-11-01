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
        { type: 'wagon_breakdown', text: 'Wagon breaks down. Lose 3 days fixing it.', days: 3, cost: { type: 'part', item: 'wheel' } },
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
                addLog(`Used a spare ${event.cost.item} to fix the wagon.`);
            } else {
                addLog(`No spare ${event.cost.item}! Repairs take extra time.`);
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
            <div style="text-align: center; padding: 2rem;">
                <h1 style="font-size: 2rem; margin-bottom: 1rem;">🚂 THE OREGON TRAIL 🏔️</h1>
                <p style="margin-bottom: 2rem;">A 2,000 mile journey from Independence, Missouri to Oregon's Willamette Valley in 1848.</p>
                <button onclick="window.startOregonTrail()" style="background: #2ecc71; color: white; border: none; padding: 1rem 2rem; font-size: 1.2rem; cursor: pointer; border-radius: 5px;">Start Your Journey</button>
            </div>
        `;
    }

    function showSetupScreen(container) {
        container.innerHTML = `
            <div style="padding: 1rem;">
                <h2>Choose Your Occupation</h2>
                <p style="margin: 1rem 0;">Your choice affects starting money and final score:</p>
                ${Object.entries(OCCUPATIONS).map(([name, data]) => `
                    <div style="margin: 0.5rem 0;">
                        <button onclick="window.oregonSelectOccupation('${name}')" style="background: #3498db; color: white; border: none; padding: 0.75rem 1.5rem; cursor: pointer; border-radius: 5px; width: 100%; text-align: left;">
                            <strong>${name}</strong> - $${data.money} (Score ×${data.multiplier})
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function showNamingScreen(container) {
        container.innerHTML = `
            <div style="padding: 1rem;">
                <h2>Name Your Party</h2>
                <p style="margin-bottom: 1rem;">You are the wagon leader:</p>
                <input type="text" id="oregonLeaderName" placeholder="Your name" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 5px;" />

                <p style="margin-bottom: 0.5rem;">Name your companions:</p>
                <input type="text" id="oregonName1" placeholder="Companion 1" style="width: 100%; padding: 0.75rem; margin-bottom: 0.5rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 5px;" />
                <input type="text" id="oregonName2" placeholder="Companion 2" style="width: 100%; padding: 0.75rem; margin-bottom: 0.5rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 5px;" />
                <input type="text" id="oregonName3" placeholder="Companion 3" style="width: 100%; padding: 0.75rem; margin-bottom: 0.5rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 5px;" />
                <input type="text" id="oregonName4" placeholder="Companion 4" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 5px;" />

                <button onclick="window.oregonStartJourney()" style="background: #2ecc71; color: white; border: none; padding: 1rem 2rem; cursor: pointer; border-radius: 5px; font-size: 1rem; width: 100%;">Continue to General Store</button>
            </div>
        `;
    }

    function showShoppingScreen(container) {
        const oxenPrice = getPrice('oxen', 0);
        const foodPrice = getPrice('food', 0);
        const ammoPrice = getPrice('ammunition', 0);
        const clothingPrice = getPrice('clothing', 0);
        const wheelPrice = getPrice('wheel', 0);

        container.innerHTML = `
            <div style="padding: 1rem;">
                <h2>Matt's General Store</h2>
                <p style="margin-bottom: 0.5rem;"><strong>Money: $${gameState.money}</strong></p>
                <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">You'll need oxen, food, ammunition, clothing, and spare parts.</p>

                <div style="background: #f0f0f0; padding: 1rem; border-radius: 5px; margin-bottom: 1rem;">
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.5rem; font-size: 0.9rem;">
                        <div><strong>Item</strong></div>
                        <div><strong>Price</strong></div>
                        <div><strong>Owned</strong></div>

                        <div>Oxen</div>
                        <div>$${oxenPrice}</div>
                        <div>${gameState.oxen}</div>

                        <div>Food (lbs)</div>
                        <div>$${foodPrice.toFixed(2)}</div>
                        <div>${gameState.food}</div>

                        <div>Ammunition (box)</div>
                        <div>$${ammoPrice}</div>
                        <div>${gameState.ammunition}</div>

                        <div>Clothing (set)</div>
                        <div>$${clothingPrice}</div>
                        <div>${gameState.clothing}</div>

                        <div>Spare wheel</div>
                        <div>$${wheelPrice}</div>
                        <div>${gameState.parts.wheel}</div>
                    </div>
                </div>

                ${gameState.message ? `<div style="background: #fff3cd; padding: 0.75rem; border-radius: 5px; margin-bottom: 1rem;">${gameState.message}</div>` : ''}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                    <button onclick="window.oregonBuy('oxen')" style="background: #3498db; color: white; border: none; padding: 0.5rem; cursor: pointer; border-radius: 5px;">Buy Oxen</button>
                    <button onclick="window.oregonBuy('food')" style="background: #3498db; color: white; border: none; padding: 0.5rem; cursor: pointer; border-radius: 5px;">Buy Food</button>
                    <button onclick="window.oregonBuy('ammunition')" style="background: #3498db; color: white; border: none; padding: 0.5rem; cursor: pointer; border-radius: 5px;">Buy Ammo</button>
                    <button onclick="window.oregonBuy('clothing')" style="background: #3498db; color: white; border: none; padding: 0.5rem; cursor: pointer; border-radius: 5px;">Buy Clothes</button>
                    <button onclick="window.oregonBuy('wheel')" style="background: #3498db; color: white; border: none; padding: 0.5rem; cursor: pointer; border-radius: 5px;">Buy Wheel</button>
                </div>

                <button onclick="window.oregonLeaveStore()" style="background: #2ecc71; color: white; border: none; padding: 1rem; cursor: pointer; border-radius: 5px; width: 100%; font-size: 1rem;">Leave Store & Start Journey</button>
            </div>
        `;
    }

    function showTravelScreen(container) {
        const nextLandmark = LANDMARKS[gameState.nextLandmark];
        const currentLandmark = LANDMARKS[gameState.currentLandmark];
        const distanceToNext = nextLandmark.distance - gameState.milesTraveled;
        const isFort = currentLandmark.isFort;

        container.innerHTML = `
            <div style="padding: 1rem;">
                <div style="background: #2c3e50; color: white; padding: 1rem; border-radius: 5px; margin-bottom: 1rem;">
                    <div style="font-size: 0.9rem;">
                        📅 ${gameState.month} ${gameState.day} | ☁️ ${gameState.weather}
                    </div>
                    <div style="font-size: 1.2rem; font-weight: bold; margin: 0.5rem 0;">
                        📍 ${currentLandmark.name}
                    </div>
                    <div style="font-size: 0.9rem;">
                        ${gameState.milesTraveled} miles traveled | ${distanceToNext} miles to ${nextLandmark.name}
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; font-size: 0.9rem;">
                    <div style="background: #ecf0f1; padding: 0.5rem; border-radius: 3px;">Food: ${gameState.food} lbs</div>
                    <div style="background: #ecf0f1; padding: 0.5rem; border-radius: 3px;">Ammo: ${gameState.ammunition}</div>
                    <div style="background: #ecf0f1; padding: 0.5rem; border-radius: 3px;">Clothes: ${gameState.clothing}</div>
                    <div style="background: #ecf0f1; padding: 0.5rem; border-radius: 3px;">Money: $${gameState.money}</div>
                </div>

                <div style="background: #fff; border: 1px solid #ddd; padding: 1rem; border-radius: 5px; margin-bottom: 1rem;">
                    <div style="font-weight: bold; margin-bottom: 0.5rem;">Party Health:</div>
                    ${gameState.partyAlive.map((alive, i) => {
                        if (!alive) return `<div style="color: #999;">💀 ${getPartyName(i)} - Dead</div>`;
                        const health = gameState.partyHealth[i];
                        const illness = gameState.partyIllness[i];
                        const healthBar = '█'.repeat(health) + '░'.repeat(5 - health);
                        return `<div>${getPartyName(i)}: ${healthBar} ${illness ? `(${illness})` : ''}</div>`;
                    }).join('')}
                </div>

                ${gameState.eventLog.length > 0 ? `
                    <div style="background: #fffacd; padding: 0.75rem; border-radius: 5px; margin-bottom: 1rem; font-size: 0.9rem;">
                        ${gameState.eventLog.map(log => `<div>${log}</div>`).join('')}
                    </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                    <button onclick="window.oregonContinue()" style="background: #2ecc71; color: white; border: none; padding: 0.75rem; cursor: pointer; border-radius: 5px;">Continue</button>
                    <button onclick="window.oregonRest()" style="background: #3498db; color: white; border: none; padding: 0.75rem; cursor: pointer; border-radius: 5px;">Rest</button>
                    <button onclick="window.oregonHunt()" style="background: #e67e22; color: white; border: none; padding: 0.75rem; cursor: pointer; border-radius: 5px;">Hunt</button>
                    ${isFort ? `<button onclick="window.oregonStore()" style="background: #9b59b6; color: white; border: none; padding: 0.75rem; cursor: pointer; border-radius: 5px;">Store</button>` : ''}
                </div>

                <details style="margin-bottom: 1rem;">
                    <summary style="cursor: pointer; padding: 0.5rem; background: #ecf0f1; border-radius: 5px;">Change Pace & Rations</summary>
                    <div style="padding: 0.5rem;">
                        <div style="margin-bottom: 0.5rem;"><strong>Pace:</strong></div>
                        <button onclick="window.oregonSetPace('steady')" style="background: ${gameState.pace === 'steady' ? '#2ecc71' : '#95a5a6'}; color: white; border: none; padding: 0.5rem; margin-right: 0.25rem; cursor: pointer; border-radius: 3px;">Steady</button>
                        <button onclick="window.oregonSetPace('strenuous')" style="background: ${gameState.pace === 'strenuous' ? '#2ecc71' : '#95a5a6'}; color: white; border: none; padding: 0.5rem; margin-right: 0.25rem; cursor: pointer; border-radius: 3px;">Strenuous</button>
                        <button onclick="window.oregonSetPace('grueling')" style="background: ${gameState.pace === 'grueling' ? '#2ecc71' : '#95a5a6'}; color: white; border: none; padding: 0.5rem; cursor: pointer; border-radius: 3px;">Grueling</button>

                        <div style="margin: 0.75rem 0 0.5rem 0;"><strong>Rations:</strong></div>
                        <button onclick="window.oregonSetRations('filling')" style="background: ${gameState.rations === 'filling' ? '#2ecc71' : '#95a5a6'}; color: white; border: none; padding: 0.5rem; margin-right: 0.25rem; cursor: pointer; border-radius: 3px;">Filling</button>
                        <button onclick="window.oregonSetRations('meager')" style="background: ${gameState.rations === 'meager' ? '#2ecc71' : '#95a5a6'}; color: white; border: none; padding: 0.5rem; margin-right: 0.25rem; cursor: pointer; border-radius: 3px;">Meager</button>
                        <button onclick="window.oregonSetRations('barebones')" style="background: ${gameState.rations === 'barebones' ? '#2ecc71' : '#95a5a6'}; color: white; border: none; padding: 0.5rem; cursor: pointer; border-radius: 3px;">Bare Bones</button>
                    </div>
                </details>
            </div>
        `;
    }

    function showHuntingScreen(container) {
        container.innerHTML = `
            <div style="padding: 1rem; text-align: center;">
                <h2>🦌 Hunting</h2>
                <p style="margin: 1rem 0;">How well did you hunt?</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <button onclick="window.oregonCompleteHunt('excellent')" style="background: #2ecc71; color: white; border: none; padding: 1rem; cursor: pointer; border-radius: 5px;">Excellent<br>(100 lbs)</button>
                    <button onclick="window.oregonCompleteHunt('good')" style="background: #3498db; color: white; border: none; padding: 1rem; cursor: pointer; border-radius: 5px;">Good<br>(60 lbs)</button>
                    <button onclick="window.oregonCompleteHunt('fair')" style="background: #f39c12; color: white; border: none; padding: 1rem; cursor: pointer; border-radius: 5px;">Fair<br>(30 lbs)</button>
                    <button onclick="window.oregonCompleteHunt('poor')" style="background: #e74c3c; color: white; border: none; padding: 1rem; cursor: pointer; border-radius: 5px;">Poor<br>(10 lbs)</button>
                </div>
            </div>
        `;
    }

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
