// Would You Rather Game
(function() {
    'use strict';

    let currentQuestionIndex = 0;
    let questions = [];
    let votes = { option1: 0, option2: 0 };
    let userVote = null;
    let askedQuestions = [];

    // Database of Would You Rather questions (200+ questions!)
    const QUESTIONS_DATABASE = [
        // Funny (30+ questions)
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
        { category: 'funny', option1: 'Walk backwards everywhere', option2: 'Hop everywhere on one foot' },
        { category: 'funny', option1: 'Have a permanent bad haircut', option2: 'Have no eyebrows' },
        { category: 'funny', option1: 'Wear a superhero costume every day', option2: 'Wear pajamas every day' },
        { category: 'funny', option1: 'Laugh uncontrollably at sad moments', option2: 'Cry uncontrollably at happy moments' },
        { category: 'funny', option1: 'Have googly eyes', option2: 'Have a clown mouth painted on permanently' },
        { category: 'funny', option1: 'Always talk in rhyme', option2: 'Always talk in questions' },
        { category: 'funny', option1: 'Have a horn like a unicorn', option2: 'Have wings but be unable to fly' },
        { category: 'funny', option1: 'Burp bubbles', option2: 'Fart glitter' },
        { category: 'funny', option1: 'Have elastic arms like Mr. Fantastic', option2: 'Have detachable legs' },
        { category: 'funny', option1: 'Wear shoes on your hands', option2: 'Wear gloves on your feet' },
        { category: 'funny', option1: 'Only eat food that starts with the same letter as your name', option2: 'Only eat foods that are green' },
        { category: 'funny', option1: 'Have a personal theme song that plays when you enter a room', option2: 'Have a laugh track follow you around' },
        { category: 'funny', option1: 'Sneeze every time someone says your name', option2: 'Hiccup every time you laugh' },
        { category: 'funny', option1: 'Have rainbow-colored teeth', option2: 'Have glow-in-the-dark hair' },
        { category: 'funny', option1: 'Be covered in fur', option2: 'Be covered in scales' },
        { category: 'funny', option1: 'Have to announce everything you do', option2: 'Have someone narrate your life like a documentary' },
        { category: 'funny', option1: 'Only be able to communicate through interpretive dance', option2: 'Only be able to communicate through mime' },
        { category: 'funny', option1: 'Have giant hands', option2: 'Have giant feet' },
        { category: 'funny', option1: 'Sound like a chipmunk', option2: 'Sound like Darth Vader' },
        { category: 'funny', option1: 'Have springs instead of legs', option2: 'Have wheels instead of feet' },

        // Superpowers (30+ questions)
        { category: 'powers', option1: 'Be able to fly', option2: 'Be invisible' },
        { category: 'powers', option1: 'Read minds', option2: 'See the future' },
        { category: 'powers', option1: 'Have super strength', option2: 'Have super speed' },
        { category: 'powers', option1: 'Breathe underwater', option2: 'Have night vision' },
        { category: 'powers', option1: 'Time travel to the past', option2: 'Time travel to the future' },
        { category: 'powers', option1: 'Control fire', option2: 'Control water' },
        { category: 'powers', option1: 'Teleport anywhere instantly', option2: 'Never need to sleep' },
        { category: 'powers', option1: 'Talk to animals', option2: 'Control the weather' },
        { category: 'powers', option1: 'Walk through walls', option2: 'Freeze time' },
        { category: 'powers', option1: 'Shapeshift into any animal', option2: 'Transform into any person' },
        { category: 'powers', option1: 'Control plants', option2: 'Control electricity' },
        { category: 'powers', option1: 'Have super healing', option2: 'Never get sick' },
        { category: 'powers', option1: 'Summon any object you want', option2: 'Make any object disappear' },
        { category: 'powers', option1: 'Have X-ray vision', option2: 'Have telescopic vision' },
        { category: 'powers', option1: 'Be able to jump super high', option2: 'Be able to stick to walls' },
        { category: 'powers', option1: 'Control gravity', option2: 'Control probability' },
        { category: 'powers', option1: 'Create force fields', option2: 'Shoot energy beams' },
        { category: 'powers', option1: 'Duplicate yourself', option2: 'Change your size at will' },
        { category: 'powers', option1: 'Have laser eyes', option2: 'Have super hearing' },
        { category: 'powers', option1: 'Control dreams', option2: 'Never have to eat' },
        { category: 'powers', option1: 'Have elastic limbs', option2: 'Have indestructible skin' },
        { category: 'powers', option1: 'Speak to the dead', option2: 'See ghosts' },
        { category: 'powers', option1: 'Breathe in space', option2: 'Survive any temperature' },
        { category: 'powers', option1: 'Control technology with your mind', option2: 'Control animals with your mind' },
        { category: 'powers', option1: 'Have super intelligence', option2: 'Have infinite wisdom' },
        { category: 'powers', option1: 'Manipulate light', option2: 'Manipulate sound' },
        { category: 'powers', option1: 'Create illusions', option2: 'Become intangible' },
        { category: 'powers', option1: 'Absorb knowledge from books instantly', option2: 'Learn any skill in one day' },
        { category: 'powers', option1: 'Control your age', option2: 'Live forever' },
        { category: 'powers', option1: 'Have super reflexes', option2: 'Have super agility' },

        // Food (30+ questions)
        { category: 'food', option1: 'Only eat pizza for the rest of your life', option2: 'Only eat ice cream for the rest of your life' },
        { category: 'food', option1: 'Never eat chocolate again', option2: 'Never eat pizza again' },
        { category: 'food', option1: 'Eat a worm', option2: 'Eat a cricket' },
        { category: 'food', option1: 'Only eat sweet foods', option2: 'Only eat salty foods' },
        { category: 'food', option1: 'Have bacon-flavored everything', option2: 'Have everything taste like chicken' },
        { category: 'food', option1: 'Never eat dessert again', option2: 'Never eat fried food again' },
        { category: 'food', option1: 'Only eat hot food', option2: 'Only eat cold food' },
        { category: 'food', option1: 'Give up cheese forever', option2: 'Give up bread forever' },
        { category: 'food', option1: 'Only drink water', option2: 'Only drink juice' },
        { category: 'food', option1: 'Never eat vegetables again', option2: 'Never eat fruit again' },
        { category: 'food', option1: 'Eat sushi every day', option2: 'Eat tacos every day' },
        { category: 'food', option1: 'Give up coffee', option2: 'Give up soda' },
        { category: 'food', option1: 'Only eat breakfast foods', option2: 'Only eat dinner foods' },
        { category: 'food', option1: 'Never eat meat again', option2: 'Only eat meat (no vegetables)' },
        { category: 'food', option1: 'Have every meal be spicy', option2: 'Have every meal be bland' },
        { category: 'food', option1: 'Eat only crunchy foods', option2: 'Eat only soft foods' },
        { category: 'food', option1: 'Give up cookies', option2: 'Give up cake' },
        { category: 'food', option1: 'Only eat with chopsticks', option2: 'Only eat with your hands' },
        { category: 'food', option1: 'Eat expired food', option2: 'Eat food that looks disgusting but tastes amazing' },
        { category: 'food', option1: 'Never eat fast food again', option2: 'Never eat home-cooked meals again' },
        { category: 'food', option1: 'Only eat food that is one color (your choice)', option2: 'Eat food with every color mixed together' },
        { category: 'food', option1: 'Give up pasta', option2: 'Give up rice' },
        { category: 'food', option1: 'Only eat leftovers', option2: 'Never eat leftovers' },
        { category: 'food', option1: 'Have unlimited french fries', option2: 'Have unlimited chicken nuggets' },
        { category: 'food', option1: 'Give up ketchup', option2: 'Give up ranch dressing' },
        { category: 'food', option1: 'Only eat foods that start with the letter P', option2: 'Only eat foods that are round' },
        { category: 'food', option1: 'Never eat snacks between meals', option2: 'Only eat snacks (no full meals)' },
        { category: 'food', option1: 'Eat a tablespoon of cinnamon', option2: 'Eat a whole lemon' },
        { category: 'food', option1: 'Only eat at fancy restaurants', option2: 'Only eat street food' },
        { category: 'food', option1: 'Give up all condiments', option2: 'Give up all seasonings' },

        // Tough Choices (30+ questions)
        { category: 'tough', option1: 'Live without music', option2: 'Live without movies' },
        { category: 'tough', option1: 'Give up your phone for a year', option2: 'Give up desserts for a year' },
        { category: 'tough', option1: 'Always be 10 minutes late', option2: 'Always be 20 minutes early' },
        { category: 'tough', option1: 'Never use social media again', option2: 'Never watch TV again' },
        { category: 'tough', option1: 'Live in a big city', option2: 'Live in the countryside' },
        { category: 'tough', option1: 'Have unlimited money', option2: 'Have unlimited free time' },
        { category: 'tough', option1: 'Know how you die', option2: 'Know when you die' },
        { category: 'tough', option1: 'Be famous but poor', option2: 'Be rich but unknown' },
        { category: 'tough', option1: 'Lose your sense of taste', option2: 'Lose your sense of smell' },
        { category: 'tough', option1: 'Never be able to lie', option2: 'Never be able to tell the truth' },
        { category: 'tough', option1: 'Give up reading', option2: 'Give up listening to music' },
        { category: 'tough', option1: 'Work a job you hate but make lots of money', option2: 'Work your dream job but barely make enough' },
        { category: 'tough', option1: 'Have no friends but lots of family', option2: 'Have no family but lots of friends' },
        { category: 'tough', option1: 'Be stuck in traffic for 2 hours every day', option2: 'Have a noisy neighbor' },
        { category: 'tough', option1: 'Relive the same day over and over', option2: 'Skip to the end of your life' },
        { category: 'tough', option1: 'Forget who you were', option2: 'Forget everyone you know' },
        { category: 'tough', option1: 'Have no privacy', option2: 'Have no freedom' },
        { category: 'tough', option1: 'Be able to change the past', option2: 'Be able to see the future' },
        { category: 'tough', option1: 'Live without hot water', option2: 'Live without electricity' },
        { category: 'tough', option1: 'Always say what you think', option2: 'Never speak again' },
        { category: 'tough', option1: 'Give up gaming', option2: 'Give up watching sports' },
        { category: 'tough', option1: 'Have no bedroom door', option2: 'Have no bathroom door' },
        { category: 'tough', option1: 'Lose all your memories from the past', option2: 'Never be able to make new memories' },
        { category: 'tough', option1: 'Be hated by everyone but be successful', option2: 'Be loved by everyone but be a failure' },
        { category: 'tough', option1: 'Give up showering for a month', option2: 'Give up the internet for a month' },
        { category: 'tough', option1: 'Have no hobbies', option2: 'Have no vacations' },
        { category: 'tough', option1: 'Always feel too hot', option2: 'Always feel too cold' },
        { category: 'tough', option1: 'Give up chocolate', option2: 'Give up coffee' },
        { category: 'tough', option1: 'Be stuck on a deserted island alone', option2: 'Be stuck on a deserted island with someone you hate' },
        { category: 'tough', option1: 'Have a constant itch you can never scratch', option2: 'Have a constant ringing in your ears' },

        // Adventure (30+ questions)
        { category: 'adventure', option1: 'Explore outer space', option2: 'Explore the deep ocean' },
        { category: 'adventure', option1: 'Climb Mount Everest', option2: 'Go on an African safari' },
        { category: 'adventure', option1: 'Visit every country in the world', option2: 'Travel to Mars' },
        { category: 'adventure', option1: 'Live in the past for a week', option2: 'Live in the future for a week' },
        { category: 'adventure', option1: 'Skydive from an airplane', option2: 'Bungee jump off a bridge' },
        { category: 'adventure', option1: 'Go white water rafting', option2: 'Go hang gliding' },
        { category: 'adventure', option1: 'Hike the Appalachian Trail', option2: 'Sail around the world' },
        { category: 'adventure', option1: 'Swim with sharks', option2: 'Swim with whales' },
        { category: 'adventure', option1: 'Explore the Amazon rainforest', option2: 'Explore Antarctica' },
        { category: 'adventure', option1: 'Go on a hot air balloon ride', option2: 'Go parasailing' },
        { category: 'adventure', option1: 'Visit ancient ruins', option2: 'Discover a new island' },
        { category: 'adventure', option1: 'Go caving', option2: 'Go mountain climbing' },
        { category: 'adventure', option1: 'Take a cross-country road trip', option2: 'Take a trip on the Orient Express' },
        { category: 'adventure', option1: 'Go zorbing', option2: 'Go zip-lining' },
        { category: 'adventure', option1: 'Visit all 7 wonders of the world', option2: 'Discover an 8th wonder' },
        { category: 'adventure', option1: 'Go dog sledding in Alaska', option2: 'Go camel trekking in the desert' },
        { category: 'adventure', option1: 'Dive the Great Barrier Reef', option2: 'See the Northern Lights' },
        { category: 'adventure', option1: 'Go storm chasing', option2: 'Go volcano touring' },
        { category: 'adventure', option1: 'Backpack through Europe', option2: 'Backpack through Asia' },
        { category: 'adventure', option1: 'Live in a different country for a year', option2: 'Visit 20 countries in one year' },
        { category: 'adventure', option1: 'Go on a safari in Africa', option2: 'Go on a wildlife expedition in the Galapagos' },
        { category: 'adventure', option1: 'Explore a haunted house', option2: 'Explore ancient catacombs' },
        { category: 'adventure', option1: 'Go ice climbing', option2: 'Go rock climbing' },
        { category: 'adventure', option1: 'Ride in a fighter jet', option2: 'Ride in a race car' },
        { category: 'adventure', option1: 'Go on a treasure hunt', option2: 'Go geocaching around the world' },
        { category: 'adventure', option1: 'Walk the Great Wall of China', option2: 'Hike Machu Picchu' },
        { category: 'adventure', option1: 'Go wingsuit flying', option2: 'Go base jumping' },
        { category: 'adventure', option1: 'Take a submarine to the ocean floor', option2: 'Take a helicopter to a glacier' },
        { category: 'adventure', option1: 'Go on a cattle drive', option2: 'Work on a fishing boat' },
        { category: 'adventure', option1: 'Explore a jungle', option2: 'Explore a desert' },

        // Skills & Talents (30+ questions)
        { category: 'skills', option1: 'Be an amazing artist', option2: 'Be an amazing musician' },
        { category: 'skills', option1: 'Be the smartest person', option2: 'Be the funniest person' },
        { category: 'skills', option1: 'Be able to play any instrument', option2: 'Be able to speak any language' },
        { category: 'skills', option1: 'Be an Olympic athlete', option2: 'Be a genius inventor' },
        { category: 'skills', option1: 'Have photographic memory', option2: 'Have perfect pitch' },
        { category: 'skills', option1: 'Be a master chef', option2: 'Be a master carpenter' },
        { category: 'skills', option1: 'Be able to sing beautifully', option2: 'Be able to dance amazingly' },
        { category: 'skills', option1: 'Be a best-selling author', option2: 'Be a famous actor' },
        { category: 'skills', option1: 'Be great at math', option2: 'Be great at writing' },
        { category: 'skills', option1: 'Master chess', option2: 'Master poker' },
        { category: 'skills', option1: 'Be an incredible problem solver', option2: 'Be an incredible creative thinker' },
        { category: 'skills', option1: 'Be able to code any program', option2: 'Be able to fix any machine' },
        { category: 'skills', option1: 'Have perfect memory', option2: 'Have perfect foresight' },
        { category: 'skills', option1: 'Be a skilled negotiator', option2: 'Be a skilled debater' },
        { category: 'skills', option1: 'Be amazing at every sport', option2: 'Be amazing at every art form' },
        { category: 'skills', option1: 'Have incredible focus', option2: 'Have unlimited creativity' },
        { category: 'skills', option1: 'Be able to learn anything instantly', option2: 'Be able to master anything with practice' },
        { category: 'skills', option1: 'Be an expert public speaker', option2: 'Be an expert writer' },
        { category: 'skills', option1: 'Have perfect handwriting', option2: 'Have perfect typing speed' },
        { category: 'skills', option1: 'Be incredibly persuasive', option2: 'Be incredibly inspiring' },
        { category: 'skills', option1: 'Be great with animals', option2: 'Be great with children' },
        { category: 'skills', option1: 'Have perfect balance', option2: 'Have perfect coordination' },
        { category: 'skills', option1: 'Be an amazing teacher', option2: 'Be an amazing leader' },
        { category: 'skills', option1: 'Master martial arts', option2: 'Master parkour' },
        { category: 'skills', option1: 'Be a brilliant strategist', option2: 'Be a brilliant tactician' },
        { category: 'skills', option1: 'Have perfect timing', option2: 'Have perfect rhythm' },
        { category: 'skills', option1: 'Be amazing at improvising', option2: 'Be amazing at planning' },
        { category: 'skills', option1: 'Be a master gardener', option2: 'Be a master builder' },
        { category: 'skills', option1: 'Have natural charisma', option2: 'Have natural intelligence' },
        { category: 'skills', option1: 'Be great at photography', option2: 'Be great at videography' },

        // Silly (30+ questions)
        { category: 'silly', option1: 'Fight 100 duck-sized horses', option2: 'Fight 1 horse-sized duck' },
        { category: 'silly', option1: 'Have a tail', option2: 'Have antlers' },
        { category: 'silly', option1: 'Always smell like cheese', option2: 'Always smell like wet dog' },
        { category: 'silly', option1: 'Sneeze confetti', option2: 'Cry chocolate milk' },
        { category: 'silly', option1: 'Have square wheels on your car', option2: 'Have triangle wheels on your bike' },
        { category: 'silly', option1: 'Live in a treehouse', option2: 'Live in a cave' },
        { category: 'silly', option1: 'Have a permanently squeaky voice', option2: 'Have permanent hiccups' },
        { category: 'silly', option1: 'Have jello for bones', option2: 'Have spaghetti for muscles' },
        { category: 'silly', option1: 'Wear a chicken suit to every formal event', option2: 'Wear formal attire to the beach' },
        { category: 'silly', option1: 'Have a third arm growing out of your back', option2: 'Have a third eye on your forehead' },
        { category: 'silly', option1: 'Sweat cheese', option2: 'Cry mayonnaise' },
        { category: 'silly', option1: 'Have tentacles instead of arms', option2: 'Have flippers instead of hands' },
        { category: 'silly', option1: 'Speak in sound effects', option2: 'Only communicate in emojis' },
        { category: 'silly', option1: 'Have bouncy ball feet', option2: 'Have roller skate feet' },
        { category: 'silly', option1: 'Have teeth made of candy', option2: 'Have bones made of breadsticks' },
        { category: 'silly', option1: 'Grow mushrooms on your head', option2: 'Grow flowers in your ears' },
        { category: 'silly', option1: 'Have a snail shell on your back', option2: 'Have butterfly wings' },
        { category: 'silly', option1: 'Communicate only through charades', option2: 'Communicate only through beatboxing' },
        { category: 'silly', option1: 'Have a propeller on your head', option2: 'Have helicopter blades for arms' },
        { category: 'silly', option1: 'Wear swim goggles all the time', option2: 'Wear flippers all the time' },
        { category: 'silly', option1: 'Have a kazoo voice', option2: 'Have a megaphone voice' },
        { category: 'silly', option1: 'Sneeze bubbles', option2: 'Burp rainbows' },
        { category: 'silly', option1: 'Have pickle fingers', option2: 'Have hot dog toes' },
        { category: 'silly', option1: 'Walk on your hands', option2: 'Cartwheel everywhere' },
        { category: 'silly', option1: 'Have polka dot skin', option2: 'Have striped skin' },
        { category: 'silly', option1: 'Wear a fruit hat every day', option2: 'Wear oven mitts as shoes' },
        { category: 'silly', option1: 'Have googly eyes permanently', option2: 'Have a spinning bow tie permanently' },
        { category: 'silly', option1: 'Only move in slow motion', option2: 'Only move in fast forward' },
        { category: 'silly', option1: 'Have popcorn for hair', option2: 'Have cotton candy for hair' },
        { category: 'silly', option1: 'Live in a giant shoe', option2: 'Live in a giant teapot' },

        // Technology (20+ questions)
        { category: 'tech', option1: 'Have no internet', option2: 'Have no air conditioning/heating' },
        { category: 'tech', option1: 'Lose all your photos', option2: 'Lose all your old emails' },
        { category: 'tech', option1: 'Only use a flip phone', option2: 'Only use a computer from the 90s' },
        { category: 'tech', option1: 'Have a robot do all your chores', option2: 'Have a robot do all your homework' },
        { category: 'tech', option1: 'Give up video games', option2: 'Give up streaming services' },
        { category: 'tech', option1: 'Have unlimited battery life', option2: 'Have unlimited storage' },
        { category: 'tech', option1: 'Only use voice commands', option2: 'Only use a keyboard (no mouse)' },
        { category: 'tech', option1: 'Have super slow internet forever', option2: 'Have no wifi but unlimited data' },
        { category: 'tech', option1: 'Give up online shopping', option2: 'Give up food delivery apps' },
        { category: 'tech', option1: 'Have every password leaked', option2: 'Have all your search history public' },
        { category: 'tech', option1: 'Only use apps from 2010', option2: 'Only use websites (no apps)' },
        { category: 'tech', option1: 'Have to charge your devices every hour', option2: 'Have devices that take 12 hours to charge' },
        { category: 'tech', option1: 'Give up GPS navigation', option2: 'Give up music streaming' },
        { category: 'tech', option1: 'Have a smart home that sometimes malfunctions', option2: 'Have no smart home features' },
        { category: 'tech', option1: 'Only use Windows', option2: 'Only use Mac' },
        { category: 'tech', option1: 'Have unlimited cloud storage', option2: 'Have a super powerful computer' },
        { category: 'tech', option1: 'Give up texting', option2: 'Give up calling' },
        { category: 'tech', option1: 'Have AI write all your emails', option2: 'Have AI make all your decisions' },
        { category: 'tech', option1: 'Only watch content in 480p', option2: 'Only watch content with 5-second lag' },
        { category: 'tech', option1: 'Have a phone that never breaks', option2: 'Have a phone that gets free upgrades forever' },

        // Animals & Pets (20+ questions)
        { category: 'animals', option1: 'Have a dog', option2: 'Have a cat' },
        { category: 'animals', option1: 'Be able to run like a cheetah', option2: 'Be able to swim like a dolphin' },
        { category: 'animals', option1: 'Have the hearing of a bat', option2: 'Have the eyesight of an eagle' },
        { category: 'animals', option1: 'Ride a unicorn', option2: 'Ride a pegasus' },
        { category: 'animals', option1: 'Have a pet monkey', option2: 'Have a pet tiger' },
        { category: 'animals', option1: 'Be as strong as a bear', option2: 'Be as agile as a cat' },
        { category: 'animals', option1: 'Have gills like a fish', option2: 'Have wings like a bird' },
        { category: 'animals', option1: 'Befriend a wolf pack', option2: 'Befriend a dolphin pod' },
        { category: 'animals', option1: 'Have the memory of an elephant', option2: 'Have the sense of smell of a bloodhound' },
        { category: 'animals', option1: 'Own a zoo', option2: 'Own an aquarium' },
        { category: 'animals', option1: 'Have a pet owl', option2: 'Have a pet raven' },
        { category: 'animals', option1: 'Communicate with dogs', option2: 'Communicate with cats' },
        { category: 'animals', option1: 'Have scales like a snake', option2: 'Have a shell like a turtle' },
        { category: 'animals', option1: 'Live with penguins', option2: 'Live with pandas' },
        { category: 'animals', option1: 'Be able to camouflage like a chameleon', option2: 'Be able to regenerate like a starfish' },
        { category: 'animals', option1: 'Have the strength of an ant (proportionally)', option2: 'Have the jumping ability of a flea (proportionally)' },
        { category: 'animals', option1: 'Have a pet elephant', option2: 'Have a pet giraffe' },
        { category: 'animals', option1: 'Hibernate like a bear', option2: 'Migrate like a bird' },
        { category: 'animals', option1: 'Have the lifespan of a tortoise', option2: 'Have the energy of a hummingbird' },
        { category: 'animals', option1: 'Own a ranch', option2: 'Own a wildlife sanctuary' },
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
