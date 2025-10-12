// 20 Questions Game
(function() {
    'use strict';

    let gameMode = null;
    let questionsAsked = 0;
    let maxQuestions = 20;
    let currentAnswer = null;
    let questionHistory = [];
    let aiKnowledge = {}; // For AI asking questions mode
    let possibleItems = []; // Remaining possible answers based on what AI knows

    // Database of things for AI to think of
    const THINGS_DATABASE = [
        // Animals (60 total) - with complete properties
        { name: 'Dog', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: true, size: 'medium', isWild: false, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Cat', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: true, size: 'small', isWild: false, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Eagle', category: 'animal', isLiving: true, canFly: true, hasLegs: true, isMammal: false, isPet: false, size: 'medium', isWild: true, hasFur: false, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Elephant', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Dolphin', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: true, makesNoise: true },
        { name: 'Butterfly', category: 'animal', isLiving: true, canFly: true, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: false, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Lion', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Penguin', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: false, size: 'medium', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Goldfish', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: false, isPet: true, size: 'small', isWild: false, hasFur: false, hasTail: true, canSwim: true, livesInWater: true, makesNoise: false },
        { name: 'Horse', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: false, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Rabbit', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: true, size: 'small', isWild: false, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Shark', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: false, isPet: false, size: 'large', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: true, makesNoise: false },
        { name: 'Giraffe', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Zebra', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Monkey', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'medium', isWild: true, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Bear', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Cow', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: false, hasFur: false, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Pig', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'medium', isWild: false, hasFur: false, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Chicken', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: false, hasFur: false, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Duck', category: 'animal', isLiving: true, canFly: true, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: false, hasFur: false, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Owl', category: 'animal', isLiving: true, canFly: true, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Parrot', category: 'animal', isLiving: true, canFly: true, hasLegs: true, isMammal: false, isPet: true, size: 'small', isWild: false, hasFur: false, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Snake', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: false, isPet: false, size: 'medium', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: false, makesNoise: false },
        { name: 'Lizard', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: true, size: 'small', isWild: false, hasFur: false, hasTail: true, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Frog', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: false, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Turtle', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: true, size: 'small', isWild: false, hasFur: false, hasTail: true, canSwim: true, livesInWater: false, makesNoise: false },
        { name: 'Spider', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: false, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Bee', category: 'animal', isLiving: true, canFly: true, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: false, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Ant', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: false, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Ladybug', category: 'animal', isLiving: true, canFly: true, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: false, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Whale', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: true, makesNoise: true },
        { name: 'Octopus', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: false, isPet: false, size: 'medium', isWild: true, hasFur: false, hasTail: false, canSwim: true, livesInWater: true, makesNoise: false },
        { name: 'Crab', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: false, canSwim: true, livesInWater: false, makesNoise: false },
        { name: 'Lobster', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: true, makesNoise: false },
        { name: 'Seahorse', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: true, makesNoise: false },
        { name: 'Jellyfish', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: false, isPet: false, size: 'medium', isWild: true, hasFur: false, hasTail: false, canSwim: true, livesInWater: true, makesNoise: false },
        { name: 'Starfish', category: 'animal', isLiving: true, canFly: false, hasLegs: false, isMammal: false, isPet: false, size: 'small', isWild: true, hasFur: false, hasTail: false, canSwim: false, livesInWater: true, makesNoise: false },
        { name: 'Tiger', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Leopard', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Cheetah', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Wolf', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'medium', isWild: true, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Fox', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'small', isWild: true, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Deer', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: false },
        { name: 'Moose', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: false },
        { name: 'Raccoon', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'small', isWild: true, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: false },
        { name: 'Squirrel', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'small', isWild: true, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Hamster', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: true, size: 'small', isWild: false, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Guinea Pig', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: true, size: 'small', isWild: false, hasFur: true, hasTail: false, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Mouse', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'small', isWild: true, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Rat', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'small', isWild: true, hasFur: true, hasTail: true, canSwim: true, livesInWater: false, makesNoise: false },
        { name: 'Bat', category: 'animal', isLiving: true, canFly: true, hasLegs: true, isMammal: true, isPet: false, size: 'small', isWild: true, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Kangaroo', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Koala', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'small', isWild: true, hasFur: true, hasTail: false, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Panda', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: true, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Gorilla', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: true, hasTail: false, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Chimpanzee', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'medium', isWild: true, hasFur: true, hasTail: false, canSwim: false, livesInWater: false, makesNoise: true },
        { name: 'Hippo', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: false, makesNoise: true },
        { name: 'Rhino', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: true, isPet: false, size: 'large', isWild: true, hasFur: false, hasTail: true, canSwim: false, livesInWater: false, makesNoise: false },
        { name: 'Crocodile', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: false, size: 'large', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: false, makesNoise: false },
        { name: 'Alligator', category: 'animal', isLiving: true, canFly: false, hasLegs: true, isMammal: false, isPet: false, size: 'large', isWild: true, hasFur: false, hasTail: true, canSwim: true, livesInWater: false, makesNoise: false },

        // Objects (120 total) - with complete properties
        { name: 'Car', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: true, size: 'large', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Phone', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'plastic' },
        { name: 'Book', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'paper' },
        { name: 'Bicycle', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: true, size: 'medium', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Piano', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: false, isTool: false, isFurniture: true, isClothing: false, forEntertainment: true, material: 'wood' },
        { name: 'Refrigerator', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'large', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Pencil', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'wood' },
        { name: 'Airplane', category: 'object', isLiving: false, canMove: true, isElectronic: true, isVehicle: true, size: 'large', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Guitar', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'medium', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'wood' },
        { name: 'Computer', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'medium', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'plastic' },
        { name: 'Television', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'large', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'plastic' },
        { name: 'Watch', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'metal' },
        { name: 'Camera', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'plastic' },
        { name: 'Lamp', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Chair', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'medium', usedDaily: true, isTool: false, isFurniture: true, isClothing: false, forEntertainment: false, material: 'wood' },
        { name: 'Table', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: true, isTool: false, isFurniture: true, isClothing: false, forEntertainment: false, material: 'wood' },
        { name: 'Bed', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: true, isTool: false, isFurniture: true, isClothing: false, forEntertainment: false, material: 'wood' },
        { name: 'Couch', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: true, isTool: false, isFurniture: true, isClothing: false, forEntertainment: false, material: 'fabric' },
        { name: 'Desk', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: true, isTool: false, isFurniture: true, isClothing: false, forEntertainment: false, material: 'wood' },
        { name: 'Mirror', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'medium', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'glass' },
        { name: 'Clock', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Microwave', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'medium', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Oven', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'large', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Toaster', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Blender', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Knife', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Fork', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Spoon', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Plate', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'ceramic' },
        { name: 'Cup', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'ceramic' },
        { name: 'Bottle', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Backpack', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'medium', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'fabric' },
        { name: 'Wallet', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'leather' },
        { name: 'Umbrella', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'fabric' },
        { name: 'Sunglasses', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'plastic' },
        { name: 'Hat', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'fabric' },
        { name: 'Shoes', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'leather' },
        { name: 'Shirt', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'fabric' },
        { name: 'Pants', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'fabric' },
        { name: 'Jacket', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'fabric' },
        { name: 'Gloves', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'fabric' },
        { name: 'Scarf', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'fabric' },
        { name: 'Socks', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'fabric' },
        { name: 'Belt', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'leather' },
        { name: 'Tie', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'fabric' },
        { name: 'Ring', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'metal' },
        { name: 'Necklace', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'metal' },
        { name: 'Earrings', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'metal' },
        { name: 'Toothbrush', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Toothpaste', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Soap', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'other' },
        { name: 'Shampoo', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Towel', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'medium', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'fabric' },
        { name: 'Hairbrush', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Scissors', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Tape', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Glue', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Stapler', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Notebook', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'paper' },
        { name: 'Pen', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Marker', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Crayon', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'wax' },
        { name: 'Eraser', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'rubber' },
        { name: 'Ruler', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Calculator', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Keyboard', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'medium', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Mouse', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Printer', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'medium', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Scanner', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'medium', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Headphones', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'plastic' },
        { name: 'Speaker', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'plastic' },
        { name: 'Microphone', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'metal' },
        { name: 'Radio', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'plastic' },
        { name: 'Flashlight', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Battery', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Remote Control', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Vacuum', category: 'object', isLiving: false, canMove: true, isElectronic: true, isVehicle: false, size: 'medium', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Broom', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'wood' },
        { name: 'Mop', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'wood' },
        { name: 'Bucket', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Trash Can', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'medium', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Basket', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'wood' },
        { name: 'Luggage', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'large', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'plastic' },
        { name: 'Pillow', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'fabric' },
        { name: 'Blanket', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'medium', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'fabric' },
        { name: 'Curtain', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'fabric' },
        { name: 'Carpet', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'fabric' },
        { name: 'Picture Frame', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'wood' },
        { name: 'Candle', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'wax' },
        { name: 'Vase', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'ceramic' },
        { name: 'Pot', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Pan', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: true, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Wrench', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Hammer', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Screwdriver', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Drill', category: 'object', isLiving: false, canMove: false, isElectronic: true, isVehicle: false, size: 'small', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Saw', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'medium', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Ladder', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Shovel', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Rake', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Hose', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'large', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'rubber' },
        { name: 'Lawnmower', category: 'object', isLiving: false, canMove: true, isElectronic: true, isVehicle: false, size: 'large', usedDaily: false, isTool: true, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Basketball', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'rubber' },
        { name: 'Football', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'leather' },
        { name: 'Soccer Ball', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'leather' },
        { name: 'Baseball', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'leather' },
        { name: 'Tennis Ball', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'rubber' },
        { name: 'Golf Ball', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'plastic' },
        { name: 'Frisbee', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'plastic' },
        { name: 'Skateboard', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: true, size: 'medium', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'wood' },
        { name: 'Roller Skates', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: true, material: 'plastic' },
        { name: 'Helmet', category: 'object', isLiving: false, canMove: false, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: true, forEntertainment: false, material: 'plastic' },
        { name: 'Boat', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: true, size: 'large', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'wood' },
        { name: 'Motorcycle', category: 'object', isLiving: false, canMove: true, isElectronic: true, isVehicle: true, size: 'large', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Truck', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: true, size: 'large', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Bus', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: true, size: 'large', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Train', category: 'object', isLiving: false, canMove: true, isElectronic: true, isVehicle: true, size: 'large', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Helicopter', category: 'object', isLiving: false, canMove: true, isElectronic: true, isVehicle: true, size: 'large', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Rocket', category: 'object', isLiving: false, canMove: true, isElectronic: true, isVehicle: true, size: 'large', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: false, material: 'metal' },
        { name: 'Balloon', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'rubber' },
        { name: 'Kite', category: 'object', isLiving: false, canMove: true, isElectronic: false, isVehicle: false, size: 'small', usedDaily: false, isTool: false, isFurniture: false, isClothing: false, forEntertainment: true, material: 'paper' },

        // Places (50 total)
        { name: 'Beach', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: true, isPublic: true },
        { name: 'Library', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Mountain', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: false, isPublic: true },
        { name: 'School', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Restaurant', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Park', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: false, isPublic: true },
        { name: 'Hospital', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Zoo', category: 'place', isLiving: false, isIndoors: false, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Museum', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Theater', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Cinema', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Stadium', category: 'place', isLiving: false, isIndoors: false, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Gym', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Mall', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Store', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Supermarket', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Bakery', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Cafe', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Airport', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Train Station', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Bus Stop', category: 'place', isLiving: false, isIndoors: false, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Hotel', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Office', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: false },
        { name: 'Bank', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Post Office', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Church', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Temple', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Mosque', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Castle', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Palace', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Bridge', category: 'place', isLiving: false, isIndoors: false, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Tunnel', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Cave', category: 'place', isLiving: false, isIndoors: true, isNatural: true, hasWater: false, isPublic: false },
        { name: 'Forest', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: false, isPublic: true },
        { name: 'Desert', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: false, isPublic: true },
        { name: 'Ocean', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: true, isPublic: true },
        { name: 'Lake', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: true, isPublic: true },
        { name: 'River', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: true, isPublic: true },
        { name: 'Waterfall', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: true, isPublic: true },
        { name: 'Island', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: true, isPublic: false },
        { name: 'Volcano', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: false, isPublic: false },
        { name: 'Garden', category: 'place', isLiving: false, isIndoors: false, isNatural: true, hasWater: false, isPublic: false },
        { name: 'Farm', category: 'place', isLiving: false, isIndoors: false, isNatural: false, hasWater: false, isPublic: false },
        { name: 'Playground', category: 'place', isLiving: false, isIndoors: false, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Swimming Pool', category: 'place', isLiving: false, isIndoors: false, isNatural: false, hasWater: true, isPublic: true },
        { name: 'Parking Lot', category: 'place', isLiving: false, isIndoors: false, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Gas Station', category: 'place', isLiving: false, isIndoors: false, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Amusement Park', category: 'place', isLiving: false, isIndoors: false, isNatural: false, hasWater: false, isPublic: true },
        { name: 'Aquarium', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: true, isPublic: true },
        { name: 'Planetarium', category: 'place', isLiving: false, isIndoors: true, isNatural: false, hasWater: false, isPublic: true },

        // Food (50 total) - with complete properties
        { name: 'Pizza', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Apple', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Ice Cream', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Broccoli', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: true, isDrink: false, isBreakfast: false },
        { name: 'Chocolate', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Banana', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: true },
        { name: 'Burger', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Hot Dog', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Sandwich', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Salad', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: true, isDrink: false, isBreakfast: false },
        { name: 'Pasta', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Rice', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Bread', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: true },
        { name: 'Cheese', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Milk', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: false, isDrink: true, isBreakfast: true },
        { name: 'Eggs', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: true },
        { name: 'Bacon', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: true },
        { name: 'Sausage', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: true },
        { name: 'Chicken', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Steak', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Fish', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Shrimp', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Sushi', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Taco', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Burrito', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: true },
        { name: 'Nachos', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Popcorn', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Chips', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Cookie', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Cake', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Donut', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: true },
        { name: 'Pie', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Candy', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Lollipop', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Gum', category: 'food', isLiving: false, isSweet: true, isFruit: false, isHot: false, isHealthy: false, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Orange', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Grape', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Strawberry', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Watermelon', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Pineapple', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Mango', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Peach', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Pear', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Cherry', category: 'food', isLiving: false, isSweet: true, isFruit: true, isHot: false, isHealthy: true, isVegetable: false, isDrink: false, isBreakfast: false },
        { name: 'Carrot', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: true, isDrink: false, isBreakfast: false },
        { name: 'Tomato', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: true, isDrink: false, isBreakfast: false },
        { name: 'Potato', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: true, isHealthy: true, isVegetable: true, isDrink: false, isBreakfast: false },
        { name: 'Onion', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: true, isDrink: false, isBreakfast: false },
        { name: 'Lettuce', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: true, isDrink: false, isBreakfast: false },
        { name: 'Cucumber', category: 'food', isLiving: false, isSweet: false, isFruit: false, isHot: false, isHealthy: true, isVegetable: true, isDrink: false, isBreakfast: false },

        // Concepts/People (40 total) - with complete properties
        { name: 'Superhero', category: 'concept', isReal: false, isPerson: true, isFamous: true, isFictional: true, isJob: false },
        { name: 'Teacher', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Astronaut', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Doctor', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Nurse', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Firefighter', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Police Officer', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Chef', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Artist', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Musician', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Singer', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Actor', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Dancer', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Athlete', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Scientist', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Engineer', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Programmer', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Writer', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Journalist', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Lawyer', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Judge', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Pilot', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Soldier', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Farmer', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Mechanic', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Plumber', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Electrician', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Carpenter', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Photographer', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Librarian', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Waiter', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Cashier', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'Manager', category: 'concept', isReal: true, isPerson: true, isFamous: false, isFictional: false, isJob: true },
        { name: 'President', category: 'concept', isReal: true, isPerson: true, isFamous: true, isFictional: false, isJob: true },
        { name: 'King', category: 'concept', isReal: true, isPerson: true, isFamous: true, isFictional: false, isJob: false },
        { name: 'Queen', category: 'concept', isReal: true, isPerson: true, isFamous: true, isFictional: false, isJob: false },
        { name: 'Prince', category: 'concept', isReal: true, isPerson: true, isFamous: true, isFictional: false, isJob: false },
        { name: 'Princess', category: 'concept', isReal: true, isPerson: true, isFamous: true, isFictional: false, isJob: false },
        { name: 'Wizard', category: 'concept', isReal: false, isPerson: true, isFamous: false, isFictional: true, isJob: false },
        { name: 'Pirate', category: 'concept', isReal: false, isPerson: true, isFamous: false, isFictional: true, isJob: false },
    ];

    // Common questions AI can ask when it's the guesser
    const AI_QUESTIONS = [
        // Category questions (most important - ask first)
        { question: "Is it a living thing?", property: 'isLiving' },
        { question: "Is it an animal?", property: 'category', value: 'animal' },
        { question: "Is it an object?", property: 'category', value: 'object' },
        { question: "Is it a place?", property: 'category', value: 'place' },
        { question: "Is it food?", property: 'category', value: 'food' },
        { question: "Is it a concept or idea?", property: 'category', value: 'concept' },

        // Animal-specific questions
        { question: "Can it fly?", property: 'canFly' },
        { question: "Does it have legs?", property: 'hasLegs' },
        { question: "Does it live in water?", property: 'livesInWater' },
        { question: "Is it a mammal?", property: 'isMammal' },
        { question: "Is it a pet?", property: 'isPet' },
        { question: "Does it have fur?", property: 'hasFur' },
        { question: "Is it a wild animal?", property: 'isWild' },
        { question: "Does it have a tail?", property: 'hasTail' },
        { question: "Can it swim?", property: 'canSwim' },
        { question: "Does it make noise?", property: 'makesNoise' },

        // Object-specific questions
        { question: "Is it electronic?", property: 'isElectronic' },
        { question: "Is it a vehicle?", property: 'isVehicle' },
        { question: "Do people use it every day?", property: 'usedDaily' },
        { question: "Can you hold it in your hand?", property: 'size', value: 'small' },
        { question: "Is it made of metal?", property: 'material', value: 'metal' },
        { question: "Is it made of wood?", property: 'material', value: 'wood' },
        { question: "Is it made of plastic?", property: 'material', value: 'plastic' },
        { question: "Is it made of fabric?", property: 'material', value: 'fabric' },
        { question: "Is it made of glass?", property: 'material', value: 'glass' },
        { question: "Is it made of paper?", property: 'material', value: 'paper' },
        { question: "Is it a tool?", property: 'isTool' },
        { question: "Is it furniture?", property: 'isFurniture' },
        { question: "Can you wear it?", property: 'isClothing' },
        { question: "Is it used for entertainment?", property: 'forEntertainment' },

        // Size questions
        { question: "Is it bigger than a person?", property: 'size', value: 'large' },
        { question: "Is it smaller than your hand?", property: 'size', value: 'small' },
        { question: "Can it fit in a backpack?", property: 'size', value: 'small' },
        { question: "Is it bigger than a car?", property: 'size', value: 'huge' },

        // Place-specific questions
        { question: "Is it indoors?", property: 'isIndoors' },
        { question: "Is it natural (not man-made)?", property: 'isNatural' },
        { question: "Does it have water?", property: 'hasWater' },
        { question: "Is it a public place?", property: 'isPublic' },

        // Food-specific questions
        { question: "Is it sweet?", property: 'isSweet' },
        { question: "Is it a fruit?", property: 'isFruit' },
        { question: "Is it hot when you eat it?", property: 'isHot' },
        { question: "Is it healthy?", property: 'isHealthy' },
        { question: "Is it a vegetable?", property: 'isVegetable' },
        { question: "Is it a drink?", property: 'isDrink' },
        { question: "Do you eat it for breakfast?", property: 'isBreakfast' },

        // Person/concept questions
        { question: "Is it a real person?", property: 'isReal' },
        { question: "Is it fictional?", property: 'isFictional' },
        { question: "Is it famous?", property: 'isFamous' },
        { question: "Is it a job or profession?", property: 'isJob' },
    ];

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
        possibleItems = [...THINGS_DATABASE]; // Start with all items as possibilities
        renderAIGuessingGame();
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
                        ${possibleItems.length < THINGS_DATABASE.length ?
                            `<p style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.5rem;">🎯 Narrowed down to ${possibleItems.length} possibilities</p>` :
                            ''}
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

        // If we've already asked this question (or have no good questions left), make a guess instead
        const alreadyAsked = questionHistory.some(q => q.question === question.question);
        if (alreadyAsked || question.property === 'generic' || question.property === 'guess-now') {
            makeAIGuess();
            return;
        }

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
        // If only a few items left, just guess
        if (possibleItems.length <= 5 && questionsAsked >= 8) {
            return { question: "Time to guess!", property: 'guess-now' };
        }

        if (possibleItems.length <= 2) {
            return { question: "Time to guess!", property: 'guess-now' };
        }

        // Filter out questions we've already asked
        const askedQuestions = questionHistory.map(q => q.question);
        let availableQuestions = AI_QUESTIONS.filter(q => !askedQuestions.includes(q.question));

        if (availableQuestions.length === 0) {
            return { question: "Time to guess!", property: 'guess-now' };
        }

        // Calculate information gain for each question
        // Information gain = how close to 50/50 split it creates
        let bestQuestion = null;
        let bestScore = -1;

        for (const question of availableQuestions) {
            // Count how many items would answer "yes" vs "no" vs "unknown"
            let yesCount = 0;
            let noCount = 0;
            let unknownCount = 0;

            for (const item of possibleItems) {
                const answer = checkItemProperty(item, question.property, question.value);
                if (answer === 'yes') {
                    yesCount++;
                } else if (answer === 'no') {
                    noCount++;
                } else {
                    unknownCount++;
                }
            }

            // Skip questions that don't split the items at all
            // A question is only useful if it can eliminate some items
            if (yesCount === 0 || noCount === 0) {
                continue;
            }

            // Calculate information gain score
            // Items with 'unknown' will stay regardless of answer, so they dilute the value
            // Best questions have high yes/no counts and low unknown counts
            const total = yesCount + noCount;
            const balance = Math.min(yesCount, noCount) / total;

            // Penalize questions with too many unknowns
            const knownRatio = total / possibleItems.length;
            let score = balance * knownRatio;

            // Bonus for category questions early on
            if (question.property === 'category' || question.property === 'isLiving') {
                score += 0.1; // Small bonus to prioritize these
            }

            if (score > bestScore) {
                bestScore = score;
                bestQuestion = question;
            }
        }

        console.log(`Best question score: ${bestScore}, remaining items: ${possibleItems.length}, questions asked: ${questionsAsked}`);

        // If we have a decent question, ask it
        if (bestQuestion && bestScore > 0) {
            return bestQuestion;
        }

        // If no good questions but still have many questions left and many items, keep trying with any question
        if (questionsAsked < 15 && possibleItems.length > 10) {
            // Pick any question that wasn't asked yet, even if score is low
            if (availableQuestions.length > 0) {
                console.log('Using fallback question strategy');
                return availableQuestions[0];
            }
        }

        // If no good questions found, make a guess
        return { question: "Time to guess!", property: 'guess-now' };
    }

    // Helper function to check if an item matches a property
    function checkItemProperty(item, property, value) {
        // Handle category checks
        if (property === 'category' && value) {
            if (item.category === value) return 'yes';
            if (item.category && item.category !== value) return 'no';
            return 'unknown';
        }

        // Handle size checks with specific values
        if (property === 'size' && value) {
            if (item.size === value) return 'yes';
            if (item.size && item.size !== value) return 'no';
            return 'unknown';
        }

        // Handle material checks
        if (property === 'material' && value) {
            if (item.material === value) return 'yes';
            if (item.material && item.material !== value) return 'no';
            return 'unknown';
        }

        // Handle color checks
        if (property === 'color' && value) {
            if (item.color === value) return 'yes';
            if (item.color && item.color !== value) return 'no';
            return 'unknown';
        }

        // Handle boolean properties
        if (item[property] === true) return 'yes';
        if (item[property] === false) return 'no';

        // Infer properties based on category when undefined
        // This prevents items from staying in the list when they logically can't have certain properties
        if (item[property] === undefined) {
            // DON'T infer within-category properties as 'no' - that prevents splitting
            // We only want to infer cross-category properties as 'no'
            // Animal-specific properties - non-animals should answer 'no'
            const animalProps = ['isMammal', 'isPet', 'isWild', 'hasFur', 'hasTail', 'canSwim', 'makesNoise', 'livesInWater'];
            if (animalProps.includes(property) && item.category !== 'animal') {
                return 'no';
            }

            // Object-specific properties - non-objects should answer 'no'
            const objectProps = ['isElectronic', 'isVehicle', 'usedDaily', 'isTool', 'isFurniture', 'isClothing', 'forEntertainment'];
            if (objectProps.includes(property) && item.category !== 'object') {
                return 'no';
            }

            // Place-specific properties - non-places should answer 'no'
            const placeProps = ['isIndoors', 'isNatural', 'hasWater', 'isPublic'];
            if (placeProps.includes(property) && item.category !== 'place') {
                return 'no';
            }

            // Food-specific properties - non-food should answer 'no'
            const foodProps = ['isSweet', 'isFruit', 'isHot', 'isHealthy', 'isVegetable', 'isDrink', 'isBreakfast'];
            if (foodProps.includes(property) && item.category !== 'food') {
                return 'no';
            }

            // Concept-specific properties - non-concepts should answer 'no'
            const conceptProps = ['isReal', 'isFictional', 'isFamous', 'isPerson', 'isJob'];
            if (conceptProps.includes(property) && item.category !== 'concept') {
                return 'no';
            }

            // Living-specific properties
            if (property === 'isLiving') {
                // Animals are living
                if (item.category === 'animal') {
                    return 'yes';
                }
                // Objects, places, food are not living
                if (item.category === 'object' || item.category === 'place' || item.category === 'food') {
                    return 'no';
                }
                // Concepts could be living people or not - leave as unknown
            }

            // Movement properties - if category doesn't typically move, answer no
            if (property === 'canFly') {
                if (item.category === 'place' || item.category === 'food' || item.category === 'concept') {
                    return 'no';
                }
            }
            if (property === 'hasLegs') {
                if (item.category === 'place' || item.category === 'food') {
                    return 'no';
                }
            }
        }

        return 'unknown'; // Property truly unknown
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

        // Filter possibleItems based on the answer
        const beforeCount = possibleItems.length;
        possibleItems = possibleItems.filter(item => {
            const itemAnswer = checkItemProperty(item, property, value);

            // If item's answer is unknown, keep it (could be either yes or no)
            if (itemAnswer === 'unknown') {
                return true;
            }

            // Keep item if its answer matches the user's answer
            return itemAnswer === answer;
        });

        console.log(`Question: "${question}" Answer: "${answer}" - Filtered from ${beforeCount} to ${possibleItems.length} items`);
        if (possibleItems.length <= 10) {
            console.log('Remaining items:', possibleItems.map(i => i.name).join(', '));
        }

        renderAIGuessingGame();

        // After a few questions, maybe make a guess if narrowed down significantly
        if (possibleItems.length <= 2 && questionsAsked >= 8) {
            setTimeout(() => makeAIGuess(), 500);
        } else if (questionsAsked >= 15 && questionsAsked < maxQuestions && possibleItems.length <= 5) {
            setTimeout(() => makeAIGuess(), 500);
        } else {
            setTimeout(() => askNextAIQuestion(), 500);
        }
    }

    function makeAIGuess() {
        // Use the filtered possibleItems list (already filtered by all answers)
        const guess = possibleItems.length > 0 ?
            possibleItems[Math.floor(Math.random() * possibleItems.length)].name :
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

    window.startTwentyQuestionsPlayerGuessing = function() {
        startPlayerVsAI();
    };

    window.startTwentyQuestionsAIGuessing = function() {
        startAIVsPlayer();
    };

    window.askAIQuestion = askAIQuestion;
    window.answerAIQuestion = answerAIQuestion;
    window.askNextAIQuestion = askNextAIQuestion;
    window.aiGuessResult = aiGuessResult;
    window.makeGuess = makeGuess;

    window.resetTwentyQuestions = function() {
        if (gameMode === 'player-guessing') startPlayerVsAI();
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
