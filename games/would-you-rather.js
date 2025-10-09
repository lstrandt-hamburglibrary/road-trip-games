// Would You Rather Game
(function() {
    'use strict';

    let currentQuestionIndex = 0;
    let questions = [];
    let votes = { option1: 0, option2: 0 };
    let userVote = null;
    let askedQuestions = [];

    // Database of Would You Rather questions
    const QUESTIONS_DATABASE = [
        // Funny
        { category: 'funny', option1: 'Have to sing instead of speak', option2: 'Have to dance everywhere you go' },
        { category: 'funny', option1: 'Have spaghetti for hair', option2: 'Have to sweat maple syrup' },
        { category: 'funny', option1: 'Always have to wear clown shoes', option2: 'Always have to wear a clown nose' },
        { category: 'funny', option1: 'Talk like a pirate forever', option2: 'Talk like a robot forever' },
        { category: 'funny', option1: 'Have a pet dinosaur', option2: 'Have a pet dragon' },
        { category: 'funny', option1: 'Be able to talk to animals', option2: 'Be able to speak every human language' },
        { category: 'funny', option1: 'Have a rewind button for your life', option2: 'Have a pause button for your life' },
        { category: 'funny', option1: 'Only be able to whisper', option2: 'Only be able to shout' },
        { category: 'funny', option1: 'Have fingers for toes', option2: 'Have toes for fingers' },
        { category: 'funny', option1: 'Always have wet socks', option2: 'Always have a popcorn kernel stuck in your teeth' },

        // Superpowers
        { category: 'powers', option1: 'Be able to fly', option2: 'Be invisible' },
        { category: 'powers', option1: 'Read minds', option2: 'See the future' },
        { category: 'powers', option1: 'Have super strength', option2: 'Have super speed' },
        { category: 'powers', option1: 'Breathe underwater', option2: 'Have night vision' },
        { category: 'powers', option1: 'Time travel to the past', option2: 'Time travel to the future' },
        { category: 'powers', option1: 'Control fire', option2: 'Control water' },
        { category: 'powers', option1: 'Teleport anywhere instantly', option2: 'Never need to sleep' },
        { category: 'powers', option1: 'Talk to animals', option2: 'Control the weather' },

        // Food
        { category: 'food', option1: 'Only eat pizza for the rest of your life', option2: 'Only eat ice cream for the rest of your life' },
        { category: 'food', option1: 'Never eat chocolate again', option2: 'Never eat pizza again' },
        { category: 'food', option1: 'Eat a worm', option2: 'Eat a cricket' },
        { category: 'food', option1: 'Only eat sweet foods', option2: 'Only eat salty foods' },
        { category: 'food', option1: 'Have bacon-flavored everything', option2: 'Have everything taste like chicken' },
        { category: 'food', option1: 'Never eat dessert again', option2: 'Never eat fried food again' },

        // Tough Choices
        { category: 'tough', option1: 'Live without music', option2: 'Live without movies' },
        { category: 'tough', option1: 'Give up your phone for a year', option2: 'Give up desserts for a year' },
        { category: 'tough', option1: 'Always be 10 minutes late', option2: 'Always be 20 minutes early' },
        { category: 'tough', option1: 'Never use social media again', option2: 'Never watch TV again' },
        { category: 'tough', option1: 'Live in a big city', option2: 'Live in the countryside' },
        { category: 'tough', option1: 'Have unlimited money', option2: 'Have unlimited free time' },
        { category: 'tough', option1: 'Know how you die', option2: 'Know when you die' },
        { category: 'tough', option1: 'Be famous but poor', option2: 'Be rich but unknown' },

        // Adventure
        { category: 'adventure', option1: 'Explore outer space', option2: 'Explore the deep ocean' },
        { category: 'adventure', option1: 'Climb Mount Everest', option2: 'Go on an African safari' },
        { category: 'adventure', option1: 'Visit every country in the world', option2: 'Travel to Mars' },
        { category: 'adventure', option1: 'Live in the past for a week', option2: 'Live in the future for a week' },
        { category: 'adventure', option1: 'Skydive from an airplane', option2: 'Bungee jump off a bridge' },

        // Skills & Talents
        { category: 'skills', option1: 'Be an amazing artist', option2: 'Be an amazing musician' },
        { category: 'skills', option1: 'Be the smartest person', option2: 'Be the funniest person' },
        { category: 'skills', option1: 'Be able to play any instrument', option2: 'Be able to speak any language' },
        { category: 'skills', option1: 'Be an Olympic athlete', option2: 'Be a genius inventor' },
        { category: 'skills', option1: 'Have photographic memory', option2: 'Have perfect pitch' },

        // Silly
        { category: 'silly', option1: 'Fight 100 duck-sized horses', option2: 'Fight 1 horse-sized duck' },
        { category: 'silly', option1: 'Have a tail', option2: 'Have antlers' },
        { category: 'silly', option1: 'Always smell like cheese', option2: 'Always smell like wet dog' },
        { category: 'silly', option1: 'Sneeze confetti', option2: 'Cry chocolate milk' },
        { category: 'silly', option1: 'Have square wheels on your car', option2: 'Have triangle wheels on your bike' },
        { category: 'silly', option1: 'Live in a treehouse', option2: 'Live in a cave' },
        { category: 'silly', option1: 'Have a permanently squeaky voice', option2: 'Have permanent hiccups' },

        // Technology
        { category: 'tech', option1: 'Have no internet', option2: 'Have no air conditioning/heating' },
        { category: 'tech', option1: 'Lose all your photos', option2: 'Lose all your old emails' },
        { category: 'tech', option1: 'Only use a flip phone', option2: 'Only use a computer from the 90s' },
        { category: 'tech', option1: 'Have a robot do all your chores', option2: 'Have a robot do all your homework' },

        // Animals & Pets
        { category: 'animals', option1: 'Have a dog', option2: 'Have a cat' },
        { category: 'animals', option1: 'Be able to run like a cheetah', option2: 'Be able to swim like a dolphin' },
        { category: 'animals', option1: 'Have the hearing of a bat', option2: 'Have the eyesight of an eagle' },
        { category: 'animals', option1: 'Ride a unicorn', option2: 'Ride a pegasus' },
    ];

    function shuffleQuestions(category = 'all') {
        if (category === 'all') {
            questions = [...QUESTIONS_DATABASE];
        } else {
            questions = QUESTIONS_DATABASE.filter(q => q.category === category);
        }

        // Shuffle the questions
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }

        currentQuestionIndex = 0;
        askedQuestions = [];
    }

    function loadQuestion() {
        if (currentQuestionIndex >= questions.length) {
            currentQuestionIndex = 0; // Loop back to start
        }

        const question = questions[currentQuestionIndex];
        votes = { option1: 0, option2: 0 };
        userVote = null;

        renderQuestion(question);
    }

    function renderQuestion(question) {
        const content = document.getElementById('wouldYouRatherContent');

        content.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: white; padding: 2rem; border-radius: 15px; text-align: center; margin-bottom: 2rem;">
                    <h3 style="font-size: 2rem; margin-bottom: 1rem;">🤔 Would You Rather...</h3>
                    <div style="background: rgba(255,255,255,0.2); padding: 0.75rem 1.5rem; border-radius: 10px; display: inline-block;">
                        <span style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">${question.category}</span>
                    </div>
                </div>

                <div style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
                    <div onclick="window.selectOption(1)"
                        style="background: ${userVote === 1 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
                               color: ${userVote === 1 ? 'white' : '#333'};
                               padding: 3rem 2rem;
                               border-radius: 15px;
                               cursor: pointer;
                               transition: all 0.3s;
                               box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                               border: 3px solid ${userVote === 1 ? '#667eea' : '#e9ecef'};"
                        onmouseover="if(!window.userVoted) this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Option A</div>
                        <div style="font-size: 1.8rem; line-height: 1.4;">${question.option1}</div>
                        ${userVote ? `
                            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid ${userVote === 1 ? 'rgba(255,255,255,0.3)' : '#e9ecef'};">
                                <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">${userVote === 1 ? '✓ You chose this!' : ''}</div>
                            </div>
                        ` : ''}
                    </div>

                    <div style="text-align: center; font-size: 2rem; font-weight: bold; color: #ff6b6b;">VS</div>

                    <div onclick="window.selectOption(2)"
                        style="background: ${userVote === 2 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'white'};
                               color: ${userVote === 2 ? 'white' : '#333'};
                               padding: 3rem 2rem;
                               border-radius: 15px;
                               cursor: pointer;
                               transition: all 0.3s;
                               box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                               border: 3px solid ${userVote === 2 ? '#f093fb' : '#e9ecef'};"
                        onmouseover="if(!window.userVoted) this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Option B</div>
                        <div style="font-size: 1.8rem; line-height: 1.4;">${question.option2}</div>
                        ${userVote ? `
                            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid ${userVote === 2 ? 'rgba(255,255,255,0.3)' : '#e9ecef'};">
                                <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">${userVote === 2 ? '✓ You chose this!' : ''}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div style="text-align: center; margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.nextQuestion()" style="background: #667eea; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                        ${userVote ? 'Next Question →' : 'Skip Question'}
                    </button>
                    <button onclick="window.changeCategory()" style="background: #3498db; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: bold;">
                        Change Category
                    </button>
                    <button onclick="window.exitWouldYouRatherToMenu()" style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                        Back to Games
                    </button>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem;">
                    <h4 style="color: #333; margin-bottom: 1rem;">How to Play:</h4>
                    <ul style="color: #666; line-height: 1.8; padding-left: 1.5rem;">
                        <li>Read both options carefully</li>
                        <li>Choose the option you'd rather do/have</li>
                        <li>Discuss your choices with fellow passengers!</li>
                        <li>No wrong answers - it's all about preference and fun debate</li>
                    </ul>
                </div>

                <div style="text-align: center; margin-top: 1.5rem; color: #999; font-size: 0.9rem;">
                    Question ${currentQuestionIndex + 1} of ${questions.length}
                </div>
            </div>
        `;
    }

    function selectOption(option) {
        if (userVote) return; // Already voted

        userVote = option;
        if (option === 1) {
            votes.option1++;
        } else {
            votes.option2++;
        }

        window.userVoted = true;
        askedQuestions.push(currentQuestionIndex);

        const question = questions[currentQuestionIndex];
        renderQuestion(question);

        // Auto-advance after a short delay
        setTimeout(() => {
            window.userVoted = false;
        }, 1000);
    }

    function nextQuestion() {
        currentQuestionIndex++;
        loadQuestion();
    }

    function showCategorySelection() {
        const content = document.getElementById('wouldYouRatherContent');
        content.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #333; margin-bottom: 2rem; font-size: 1.5rem;">Choose a Category</h3>

                <div style="display: grid; gap: 1rem; max-width: 700px; margin: 0 auto;">
                    <div onclick="window.startWouldYouRather('all')"
                        style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: white; padding: 1.5rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.3rem; margin-bottom: 0.5rem;">🎲 All Categories</h4>
                        <p style="opacity: 0.9; font-size: 0.95rem;">Mix of all question types</p>
                    </div>

                    <div onclick="window.startWouldYouRather('funny')"
                        style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 1.5rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.3rem; margin-bottom: 0.5rem;">😂 Funny</h4>
                        <p style="opacity: 0.9; font-size: 0.95rem;">Hilarious and silly scenarios</p>
                    </div>

                    <div onclick="window.startWouldYouRather('powers')"
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.3rem; margin-bottom: 0.5rem;">⚡ Superpowers</h4>
                        <p style="opacity: 0.9; font-size: 0.95rem;">Choose your dream abilities</p>
                    </div>

                    <div onclick="window.startWouldYouRather('food')"
                        style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 1.5rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.3rem; margin-bottom: 0.5rem;">🍕 Food</h4>
                        <p style="opacity: 0.9; font-size: 0.95rem;">Tasty and tough food choices</p>
                    </div>

                    <div onclick="window.startWouldYouRather('tough')"
                        style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 1.5rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.3rem; margin-bottom: 0.5rem;">🤔 Tough Choices</h4>
                        <p style="opacity: 0.9; font-size: 0.95rem;">Really hard decisions</p>
                    </div>

                    <div onclick="window.startWouldYouRather('adventure')"
                        style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); color: white; padding: 1.5rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.3rem; margin-bottom: 0.5rem;">🏔️ Adventure</h4>
                        <p style="opacity: 0.9; font-size: 0.95rem;">Exciting experiences</p>
                    </div>

                    <div onclick="window.startWouldYouRather('skills')"
                        style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: white; padding: 1.5rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.3rem; margin-bottom: 0.5rem;">🎨 Skills & Talents</h4>
                        <p style="opacity: 0.9; font-size: 0.95rem;">Choose your abilities</p>
                    </div>

                    <div onclick="window.startWouldYouRather('silly')"
                        style="background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%); color: white; padding: 1.5rem; border-radius: 15px; cursor: pointer; transition: transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'">
                        <h4 style="font-size: 1.3rem; margin-bottom: 0.5rem;">🎪 Silly</h4>
                        <p style="opacity: 0.9; font-size: 0.95rem;">Absurd and wacky scenarios</p>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 2rem; text-align: left; max-width: 700px; margin-left: auto; margin-right: auto;">
                    <h4 style="color: #333; margin-bottom: 1rem;">About Would You Rather:</h4>
                    <p style="color: #666; line-height: 1.6;">
                        Would You Rather is a fun conversation game where you choose between two options.
                        There are no right or wrong answers - it's all about your preferences and having fun
                        discussing your choices with others!
                    </p>
                </div>
            </div>
        `;
    }

    // Expose functions to global scope
    window.launchWouldYouRather = function() {
        document.querySelector('.welcome').style.display = 'none';
        document.querySelector('.feature-grid').style.display = 'none';
        document.querySelector('.roadmap').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'none';
        document.getElementById('wouldYouRatherGame').style.display = 'block';
        showCategorySelection();
    };

    window.startWouldYouRather = function(category) {
        shuffleQuestions(category);
        loadQuestion();
    };

    window.selectOption = selectOption;
    window.nextQuestion = nextQuestion;
    window.changeCategory = showCategorySelection;

    window.exitWouldYouRatherToMenu = function() {
        document.getElementById('wouldYouRatherGame').style.display = 'none';
        document.getElementById('gamesMenu').style.display = 'block';
    };

})();
