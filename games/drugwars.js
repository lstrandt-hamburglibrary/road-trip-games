// Drug Wars - Classic 1984 Drug Dealing Game
(function() {
    'use strict';

    // Game constants
    const STARTING_CASH = 2000;
    const STARTING_DEBT = 5500;
    const STARTING_SPACES = 100;
    const TOTAL_DAYS = 30;
    const INTEREST_RATE = 0.10; // 10% daily interest on debt

    // Locations
    const LOCATIONS = [
        'Bronx',
        'Ghetto',
        'Central Park',
        'Manhattan',
        'Coney Island',
        'Brooklyn'
    ];

    // Drug types with base price ranges
    const DRUGS = {
        'Cocaine': { min: 15000, max: 30000, eventMin: 40000, eventMax: 110000 },
        'Heroin': { min: 5000, max: 14000, eventMin: 20000, eventMax: 45000 },
        'Acid': { min: 1000, max: 4500, eventMin: 6000, eventMax: 15000 },
        'Weed': { min: 300, max: 900, eventMin: 50, eventMax: 250 },
        'Speed': { min: 90, max: 250, eventMin: 300, eventMax: 800 },
        'Ludes': { min: 10, max: 60, eventMin: 5, eventMax: 30 }
    };

    // Special events that affect prices
    const SPECIAL_EVENTS = [
        { drug: 'Cocaine', text: 'The cops made a huge Cocaine bust! Prices are outrageous!', spike: true },
        { drug: 'Heroin', text: 'Addicts are going crazy for Heroin!', spike: true },
        { drug: 'Acid', text: 'A major Acid lab was discovered! Prices skyrocketing!', spike: true },
        { drug: 'Weed', text: 'Columbian freighter dusted the Coast Guard! Weed prices have bottomed out!', spike: false },
        { drug: 'Speed', text: 'Rival dealers are selling cheap Speed!', spike: false },
        { drug: 'Ludes', text: 'The market is flooded with cheap Ludes!', spike: false }
    ];

    // Game state
    let gameState = {
        cash: STARTING_CASH,
        debt: STARTING_DEBT,
        bankBalance: 0,
        day: 1,
        location: 'Bronx',
        inventory: {},
        usedSpaces: 0,
        maxSpaces: STARTING_SPACES,
        prices: {},
        guns: 0,
        health: 100,
        gameOver: false,
        currentEvent: null,
        message: ''
    };

    // Initialize game
    function initGame() {
        resetGame();
        updateDisplay();
        generatePrices();
    }

    function resetGame() {
        gameState = {
            cash: STARTING_CASH,
            debt: STARTING_DEBT,
            bankBalance: 0,
            day: 1,
            location: 'Bronx',
            inventory: {},
            usedSpaces: 0,
            maxSpaces: STARTING_SPACES,
            prices: {},
            guns: 0,
            health: 100,
            gameOver: false,
            currentEvent: null,
            message: 'Welcome to Drug Wars! You owe the loan shark $5,500. You have 30 days to pay it off and make a profit. Good luck!'
        };
    }

    function generatePrices() {
        const newPrices = {};

        // Random chance of special event (15% per location)
        const hasEvent = Math.random() < 0.15;
        gameState.currentEvent = null;

        if (hasEvent) {
            const event = SPECIAL_EVENTS[Math.floor(Math.random() * SPECIAL_EVENTS.length)];
            gameState.currentEvent = event;
            gameState.message = event.text;
        } else {
            gameState.message = '';
        }

        // Generate prices for each drug
        for (const [drug, range] of Object.entries(DRUGS)) {
            // Check if this drug has a special event
            if (gameState.currentEvent && gameState.currentEvent.drug === drug) {
                // Use event prices
                const min = gameState.currentEvent.spike ? range.eventMin : range.eventMin;
                const max = gameState.currentEvent.spike ? range.eventMax : range.eventMax;
                newPrices[drug] = Math.floor(Math.random() * (max - min + 1) + min);
            } else {
                // Normal price variation
                const min = range.min;
                const max = range.max;
                newPrices[drug] = Math.floor(Math.random() * (max - min + 1) + min);

                // Random chance drug is not available (20% chance)
                if (Math.random() < 0.20) {
                    newPrices[drug] = null;
                }
            }
        }

        gameState.prices = newPrices;
    }

    function travel(location) {
        if (gameState.gameOver) return;
        if (location === gameState.location) return;

        // Random police encounter (15% chance)
        if (Math.random() < 0.15 && gameState.usedSpaces > 0) {
            handlePoliceEncounter();
            return;
        }

        gameState.location = location;
        gameState.day++;

        // Apply interest to debt
        if (gameState.debt > 0) {
            gameState.debt = Math.floor(gameState.debt * (1 + INTEREST_RATE));
        }

        // Apply interest to bank (5% daily)
        if (gameState.bankBalance > 0) {
            gameState.bankBalance = Math.floor(gameState.bankBalance * 1.05);
        }

        // Random mugging (10% chance)
        if (Math.random() < 0.10 && gameState.cash > 100) {
            const stolen = Math.floor(gameState.cash * (0.1 + Math.random() * 0.3));
            gameState.cash -= stolen;
            showMessage(`You were mugged! Lost $${stolen.toLocaleString()}!`);
        }

        // Random gun offer (8% chance)
        if (Math.random() < 0.08 && gameState.cash > 500) {
            showGunOffer();
        }

        // Random trenchcoat offer (5% chance)
        if (Math.random() < 0.05 && gameState.cash > 200 && gameState.maxSpaces < 200) {
            showCoatOffer();
        }

        generatePrices();

        // Check if game over
        if (gameState.day > TOTAL_DAYS) {
            endGame();
        }

        updateDisplay();
    }

    function handlePoliceEncounter() {
        showMessage('Officer Hardass is chasing you!');

        const modal = document.getElementById('drugwarsPoliceModal');
        modal.style.display = 'flex';

        // Clear previous event listeners
        const runBtn = document.getElementById('drugwarsPoliceRun');
        const fightBtn = document.getElementById('drugwarsPoliceFight');
        const newRunBtn = runBtn.cloneNode(true);
        const newFightBtn = fightBtn.cloneNode(true);
        runBtn.parentNode.replaceChild(newRunBtn, runBtn);
        fightBtn.parentNode.replaceChild(newFightBtn, fightBtn);

        document.getElementById('drugwarsPoliceRun').addEventListener('click', () => {
            modal.style.display = 'none';
            // 50% chance to escape
            if (Math.random() < 0.5) {
                showMessage('You escaped!');
            } else {
                // Caught - lose some inventory or cash
                if (gameState.usedSpaces > 0) {
                    gameState.inventory = {};
                    gameState.usedSpaces = 0;
                    showMessage('Officer Hardass busted you! Lost all your drugs!');
                } else if (gameState.cash > 0) {
                    const fine = Math.floor(gameState.cash * 0.5);
                    gameState.cash -= fine;
                    showMessage(`Officer Hardass fined you $${fine.toLocaleString()}!`);
                }
            }
            updateDisplay();
        });

        document.getElementById('drugwarsPoliceFight').addEventListener('click', () => {
            modal.style.display = 'none';
            if (gameState.guns > 0) {
                // 70% chance to win if you have guns
                if (Math.random() < 0.7) {
                    const reward = Math.floor(1000 + Math.random() * 2000);
                    gameState.cash += reward;
                    showMessage(`You defeated Officer Hardass! Found $${reward.toLocaleString()} on him!`);
                } else {
                    gameState.health -= 30;
                    showMessage('Officer Hardass shot you! Lost 30 health!');
                    if (gameState.health <= 0) {
                        gameState.gameOver = true;
                        showMessage('You died! Game Over!');
                        endGame();
                    }
                }
            } else {
                showMessage('You can\'t fight without guns! You were arrested!');
                gameState.inventory = {};
                gameState.usedSpaces = 0;
                gameState.cash = Math.floor(gameState.cash * 0.3);
            }
            updateDisplay();
        });
    }

    function showGunOffer() {
        const gunPrice = Math.floor(300 + Math.random() * 700);
        const accept = confirm(`Will you buy a gun for $${gunPrice}?`);
        if (accept && gameState.cash >= gunPrice) {
            gameState.cash -= gunPrice;
            gameState.guns++;
            showMessage(`Bought a gun! You now have ${gameState.guns} gun(s).`);
        }
    }

    function showCoatOffer() {
        const coatPrice = Math.floor(200 + Math.random() * 300);
        const extraSpace = 50;
        const accept = confirm(`Will you buy a bigger trenchcoat for $${coatPrice}? (+${extraSpace} spaces)`);
        if (accept && gameState.cash >= coatPrice) {
            gameState.cash -= coatPrice;
            gameState.maxSpaces += extraSpace;
            showMessage(`Bought a bigger coat! Capacity: ${gameState.maxSpaces} spaces.`);
        }
    }

    function buyDrug(drug) {
        if (gameState.gameOver) return;
        if (!gameState.prices[drug]) {
            showMessage(`${drug} is not available here!`);
            return;
        }

        const price = gameState.prices[drug];
        const maxCanAfford = Math.floor(gameState.cash / price);
        const maxCanCarry = gameState.maxSpaces - gameState.usedSpaces;
        const maxCanBuy = Math.min(maxCanAfford, maxCanCarry);

        if (maxCanBuy === 0) {
            if (maxCanAfford === 0) {
                showMessage(`You can't afford any ${drug}!`);
            } else {
                showMessage('No space in your trenchcoat!');
            }
            return;
        }

        const quantity = parseInt(prompt(`How much ${drug}? (Max: ${maxCanBuy})`) || '0');

        if (quantity > 0 && quantity <= maxCanBuy) {
            const cost = quantity * price;
            gameState.cash -= cost;
            gameState.inventory[drug] = (gameState.inventory[drug] || 0) + quantity;
            gameState.usedSpaces += quantity;
            showMessage(`Bought ${quantity} ${drug} for $${cost.toLocaleString()}`);
            updateDisplay();
        }
    }

    function sellDrug(drug) {
        if (gameState.gameOver) return;
        if (!gameState.inventory[drug] || gameState.inventory[drug] === 0) {
            showMessage(`You don't have any ${drug}!`);
            return;
        }
        if (!gameState.prices[drug]) {
            showMessage(`${drug} is not available here!`);
            return;
        }

        const maxCanSell = gameState.inventory[drug];
        const quantity = parseInt(prompt(`How much ${drug} to sell? (Max: ${maxCanSell})`) || '0');

        if (quantity > 0 && quantity <= maxCanSell) {
            const price = gameState.prices[drug];
            const earnings = quantity * price;
            gameState.cash += earnings;
            gameState.inventory[drug] -= quantity;
            gameState.usedSpaces -= quantity;
            showMessage(`Sold ${quantity} ${drug} for $${earnings.toLocaleString()}`);
            updateDisplay();
        }
    }

    function visitBank() {
        if (gameState.location !== 'Bronx') {
            showMessage('The bank is only in the Bronx!');
            return;
        }

        const action = prompt('Bank - (D)eposit or (W)ithdraw?').toLowerCase();

        if (action === 'd') {
            const amount = parseInt(prompt(`Deposit how much? (You have $${gameState.cash.toLocaleString()})`) || '0');
            if (amount > 0 && amount <= gameState.cash) {
                gameState.cash -= amount;
                gameState.bankBalance += amount;
                showMessage(`Deposited $${amount.toLocaleString()}`);
                updateDisplay();
            }
        } else if (action === 'w') {
            const amount = parseInt(prompt(`Withdraw how much? (Bank balance: $${gameState.bankBalance.toLocaleString()})`) || '0');
            if (amount > 0 && amount <= gameState.bankBalance) {
                gameState.bankBalance -= amount;
                gameState.cash += amount;
                showMessage(`Withdrew $${amount.toLocaleString()}`);
                updateDisplay();
            }
        }
    }

    function visitLoanShark() {
        if (gameState.location !== 'Bronx') {
            showMessage('The loan shark is only in the Bronx!');
            return;
        }

        const action = prompt(`Loan Shark - You owe $${gameState.debt.toLocaleString()}. (P)ay or (B)orrow?`).toLowerCase();

        if (action === 'p') {
            const amount = parseInt(prompt(`Pay how much? (You have $${gameState.cash.toLocaleString()})`) || '0');
            if (amount > 0 && amount <= gameState.cash && amount <= gameState.debt) {
                gameState.cash -= amount;
                gameState.debt -= amount;
                showMessage(`Paid $${amount.toLocaleString()} to loan shark!`);
                updateDisplay();
            }
        } else if (action === 'b') {
            const amount = parseInt(prompt('Borrow how much?') || '0');
            if (amount > 0) {
                gameState.cash += amount;
                gameState.debt += amount;
                showMessage(`Borrowed $${amount.toLocaleString()} (10% daily interest!)`);
                updateDisplay();
            }
        }
    }

    function showMessage(msg) {
        gameState.message = msg;
        const msgEl = document.getElementById('drugwarsMessage');
        if (msgEl) {
            msgEl.textContent = msg;
            msgEl.style.display = 'block';
        }
    }

    function endGame() {
        gameState.gameOver = true;
        const netWorth = gameState.cash + gameState.bankBalance - gameState.debt;

        let message = `GAME OVER!\n\nDay ${gameState.day}/${TOTAL_DAYS}\n\n`;
        message += `Cash: $${gameState.cash.toLocaleString()}\n`;
        message += `Bank: $${gameState.bankBalance.toLocaleString()}\n`;
        message += `Debt: -$${gameState.debt.toLocaleString()}\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;
        message += `Net Worth: $${netWorth.toLocaleString()}\n\n`;

        if (netWorth >= 50000000) {
            message += 'LEGENDARY DEALER! 🏆';
        } else if (netWorth >= 10000000) {
            message += 'KINGPIN! 👑';
        } else if (netWorth >= 1000000) {
            message += 'BIG TIME DEALER! 💰';
        } else if (netWorth >= 100000) {
            message += 'Successful Dealer';
        } else if (netWorth >= 0) {
            message += 'You survived!';
        } else {
            message += 'You\'re in debt... 😢';
        }

        alert(message);
        updateDisplay();
    }

    function updateDisplay() {
        // Update stats
        document.getElementById('drugwarsCash').textContent = gameState.cash.toLocaleString();
        document.getElementById('drugwarsDebt').textContent = gameState.debt.toLocaleString();
        document.getElementById('drugwarsBank').textContent = gameState.bankBalance.toLocaleString();
        document.getElementById('drugwarsDay').textContent = gameState.day;
        document.getElementById('drugwarsLocation').textContent = gameState.location;
        document.getElementById('drugwarsSpace').textContent = `${gameState.usedSpaces}/${gameState.maxSpaces}`;
        document.getElementById('drugwarsGuns').textContent = gameState.guns;
        document.getElementById('drugwarsHealth').textContent = gameState.health;

        // Update net worth
        const netWorth = gameState.cash + gameState.bankBalance - gameState.debt;
        const netWorthEl = document.getElementById('drugwarsNetWorth');
        netWorthEl.textContent = `$${netWorth.toLocaleString()}`;
        netWorthEl.style.color = netWorth >= 0 ? '#2ecc71' : '#e74c3c';

        // Update message
        const msgEl = document.getElementById('drugwarsMessage');
        if (gameState.message) {
            msgEl.textContent = gameState.message;
            msgEl.style.display = 'block';
        } else {
            msgEl.style.display = 'none';
        }

        // Show/hide Bronx actions
        const isBronx = gameState.location === 'Bronx';
        document.getElementById('drugwarsBronxActions').style.display = isBronx ? 'block' : 'none';

        // Update prices table
        const table = document.getElementById('drugwarsPrices');
        table.innerHTML = '';

        for (const [drug, price] of Object.entries(gameState.prices)) {
            const row = document.createElement('tr');
            const owned = gameState.inventory[drug] || 0;

            if (price === null) {
                row.innerHTML = `<td colspan="4" style="padding: 0.25rem; color: #888;">${drug}: Not available</td>`;
            } else {
                const isEvent = gameState.currentEvent && gameState.currentEvent.drug === drug;
                const priceStyle = isEvent ? 'color: #ff00ff; font-weight: bold;' : '';

                row.innerHTML = `
                    <td style="padding: 0.25rem;">${drug}:</td>
                    <td style="padding: 0.25rem; ${priceStyle}">$${price.toLocaleString()}</td>
                    <td style="padding: 0.25rem;">${owned > 0 ? `(own ${owned})` : ''}</td>
                    <td style="padding: 0.25rem;">
                        <a href="#" onclick="window.drugWarsBuy('${drug}'); return false;">Buy</a> |
                        <a href="#" onclick="window.drugWarsSell('${drug}'); return false;">Sell</a>
                    </td>
                `;
            }
            table.appendChild(row);
        }

        // Update locations
        const locationsDiv = document.getElementById('drugwarsLocations');
        locationsDiv.innerHTML = '';

        LOCATIONS.forEach((loc, i) => {
            if (i > 0) locationsDiv.appendChild(document.createTextNode(' | '));

            if (loc === gameState.location) {
                const span = document.createElement('strong');
                span.textContent = loc;
                span.style.color = '#3498db';
                locationsDiv.appendChild(span);
            } else {
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = loc;
                link.onclick = () => { travel(loc); return false; };
                locationsDiv.appendChild(link);
            }
        });

        // Show game over screen if needed
        if (gameState.gameOver) {
            document.getElementById('drugwarsGameOverScreen').style.display = 'flex';
        }
    }

    // Export functions to window
    window.launchDrugWars = function() {
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('drugwarsGame').style.display = 'block';
        initGame();
    };

    window.exitDrugWars = function() {
        document.getElementById('drugwarsGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

    window.drugWarsTravel = travel;
    window.drugWarsBuy = buyDrug;
    window.drugWarsSell = sellDrug;
    window.drugWarsBank = visitBank;
    window.drugWarsLoan = visitLoanShark;
    window.drugWarsRestart = function() {
        document.getElementById('drugwarsGameOverScreen').style.display = 'none';
        initGame();
    };

})();
