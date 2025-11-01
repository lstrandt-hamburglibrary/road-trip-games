// Travel Facts - State information and trivia
(function() {
    'use strict';

    let statesData = null;
    let currentState = null;

    // Load states data
    async function loadStatesData() {
        if (statesData) return statesData;

        try {
            const response = await fetch('data/states.json');
            statesData = await response.json();
            return statesData;
        } catch (error) {
            console.error('Error loading states data:', error);
            return null;
        }
    }

    // Show Travel Facts page with state selector
    window.showTravelFacts = async function() {
        document.getElementById('home').style.display = 'none';
        document.getElementById('travelFacts').style.display = 'block';

        await loadStatesData();

        // Load last selected state from localStorage
        const lastState = localStorage.getItem('selectedState');
        if (lastState && statesData[lastState]) {
            showStateInfo(lastState);
        } else {
            showStateSelector();
        }
    };

    // Show state selector
    function showStateSelector() {
        const selector = document.getElementById('stateSelector');
        const display = document.getElementById('stateDisplay');

        selector.style.display = 'block';
        display.style.display = 'none';

        if (!statesData) return;

        // Sort states alphabetically
        const sortedStates = Object.keys(statesData).sort();

        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">';

        sortedStates.forEach(state => {
            html += `
                <button onclick="selectState('${state}')" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 1rem;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: bold;
                    transition: transform 0.2s;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    ${state}
                </button>
            `;
        });

        html += '</div>';

        selector.innerHTML = `
            <h3 style="margin-top: 0;">Select a State:</h3>
            ${html}
        `;
    }

    // Select a state and show its info
    window.selectState = function(stateName) {
        localStorage.setItem('selectedState', stateName);
        showStateInfo(stateName);
    };

    // Show state information
    function showStateInfo(stateName) {
        const selector = document.getElementById('stateSelector');
        const display = document.getElementById('stateDisplay');

        selector.style.display = 'none';
        display.style.display = 'block';

        currentState = stateName;
        const state = statesData[stateName];

        if (!state) return;

        // Build facts list
        let factsHtml = '<ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">';
        state.facts.forEach(fact => {
            factsHtml += `<li>${fact}</li>`;
        });
        factsHtml += '</ul>';

        // Build landmarks list
        let landmarksHtml = '<ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.8;">';
        state.landmarks.forEach(landmark => {
            landmarksHtml += `<li>${landmark}</li>`;
        });
        landmarksHtml += '</ul>';

        display.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 15px; margin-bottom: 2rem; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
                <h1 style="margin: 0 0 0.5rem 0; font-size: 2.5rem;">${stateName}</h1>
                <p style="margin: 0; font-size: 1.3rem; opacity: 0.9;">${state.nickname}</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; border-left: 4px solid #667eea;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #667eea;">📍 Capital</h4>
                    <p style="margin: 0; font-size: 1.2rem; font-weight: bold;">${state.capital}</p>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; border-left: 4px solid #764ba2;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #764ba2;">📅 Founded</h4>
                    <p style="margin: 0; font-size: 1.2rem; font-weight: bold;">${state.founded}</p>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; border-left: 4px solid #667eea;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #667eea;">👥 Population</h4>
                    <p style="margin: 0; font-size: 1.2rem; font-weight: bold;">${state.population}</p>
                </div>
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; border: 2px solid #e9ecef;">
                <h3 style="margin: 0 0 1rem 0; color: #667eea;">🦅 State Symbols</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong>Bird:</strong> ${state.bird}
                    </div>
                    <div>
                        <strong>Flower:</strong> ${state.flower}
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <strong>Motto:</strong> "${state.motto}"
                    </div>
                </div>
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; border: 2px solid #e9ecef;">
                <h3 style="margin: 0 0 1rem 0; color: #764ba2;">💡 Did You Know?</h3>
                ${factsHtml}
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 10px; border: 2px solid #e9ecef;">
                <h3 style="margin: 0 0 1rem 0; color: #667eea;">🏛️ Famous Landmarks</h3>
                ${landmarksHtml}
            </div>

            <div style="margin-top: 2rem; text-align: center;">
                <button onclick="showStateSelector()" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: bold;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                ">Choose Different State</button>
            </div>
        `;
    }

    // Make showStateSelector global
    window.showStateSelector = showStateSelector;

    // Go back to home
    window.exitTravelFacts = function() {
        document.getElementById('travelFacts').style.display = 'none';
        document.getElementById('home').style.display = 'block';
    };

})();
