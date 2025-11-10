# Road Trip Games - TODO

## GPS Facts Feature Ideas

### Option 1: True GPS Location (Most Immersive)
- Use device GPS to detect current location
- Show facts about:
  - Current city/town you're driving through
  - State you're in
  - Nearby landmarks/points of interest
  - Historical markers you're passing

**Pros:** Automatic, real-time, very engaging
**Cons:** Requires location permissions, battery drain, needs internet/database, privacy concerns

### Option 2: State Selector (Simpler MVP) ⭐ RECOMMENDED
- Dropdown or map to select current state
- Show curated facts about that state:
  - Population, capital, founded date
  - State symbols (bird, flower, motto)
  - Famous people from that state
  - Fun trivia and "Did you know?" facts
  - Major landmarks and attractions

**Pros:** Works offline, no permissions, simple, built-in data
**Cons:** Manual selection, less automatic

### Option 3: Hybrid Approach
- GPS when available (with permission)
- Falls back to manual state/city selection
- Best of both worlds

### Option 4: Mile Marker / Highway Mode
- Enter highway number (I-95, Route 66, etc.)
- Enter current mile marker
- Show facts about that specific area/region

---

## Completed Features ✅

- [x] Oregon Trail
  - Classic survival game adapted for road trips
  - Manage resources (food, ammo, health, supplies)
  - Random events and challenges
  - Make decisions that affect journey
  - Complete with diseases, hunting, river crossings

- [x] Themed bingo expansions
  - Travel bingo implemented

## Working On 🚧

- [ ] I Spy Game Improvements - Make it Actually Challenging
  - [ ] Reduce object size significantly (18-20px instead of 28px)
  - [ ] Add much more visual clutter - many more background emojis
  - [ ] Use similar-looking emojis in background near hidden objects
    - Example: If hiding butterfly 🦋, add flowers 🌸🌼 and bees 🐝 nearby
  - [ ] Randomize object positions each playthrough instead of fixed positions
  - [ ] Add decoy objects - similar emojis that aren't the actual target
    - Example: Multiple butterflies but only one specific position counts
  - [ ] Consider making objects partially obscured by background elements
  - [ ] Maybe add a zoom feature to help search detailed areas

## Future Game Ideas

- [ ] Dungeon Crawler
  - Simple roguelike/dungeon exploration
  - Turn-based combat
  - Collect items and level up
  - Procedurally generated dungeons

## Future Features

- [ ] GPS Facts implementation
