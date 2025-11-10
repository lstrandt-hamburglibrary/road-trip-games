# Project: Road Trip Games

## Commit Guidelines
- ALWAYS add a version number to commit messages
- Version format: vX.Y.Z (e.g., v1.9.7)
- Increment versions as follows:
  - Patch (Z): Bug fixes, minor tweaks (v1.9.6 → v1.9.7)
  - Minor (Y): New features, improvements (v1.9.7 → v1.10.0)
  - Major (X): Breaking changes, major redesigns (v1.9.7 → v2.0.0)

## Update Notifications
- The app should display a toast message when updates are available
- Toast should be non-intrusive and user-friendly
- Users should be able to refresh/reload to get the latest version

## Important Files
- index.html: Main app shell (app layout, navigation, License Plate Game, shared utilities)
- games/*.js: Individual game files (battleship.js, connect4.js, minesweeper.js)
- sw.js: Service worker - handles caching and update notifications
- manifest.json: PWA manifest configuration

## File Structure
```
/road-trip-games/
  index.html          - App shell, navigation, License Plate Game, shared utilities
  sw.js              - Service worker for PWA caching
  manifest.json      - PWA configuration
  icon-192.svg       - App icon (192x192)
  icon-512.svg       - App icon (512x512)
  games/
    battleship.js    - Battleship game (pass-and-play & vs AI)
    connect4.js      - Connect 4 game (pass-and-play & vs AI)
    minesweeper.js   - Minesweeper game (3 difficulty levels)
```

## Development Workflow
1. Make changes to code (index.html or games/*.js)
2. Update VERSION in both index.html and sw.js
3. Commit with version number in message
4. Push to GitHub
5. PWA will detect update and notify users

## Local Development Server
- **Port**: 8000
- **Command**: Already running on localhost:8000
- **URL**: http://localhost:8000
- To restart: `lsof -ti:8000 | xargs kill` then `python3 -m http.server 8000`

## Testing Commands
- No specific test framework currently set up
- Manual testing in browser/PWA required
- Use hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows) to clear cache

## Code Style
- Modular structure: index.html for app shell, games separated into individual JS files
- Each game wrapped in IIFE to avoid global scope pollution
- Games expose necessary functions to window object for HTML integration
- No external dependencies or frameworks
- Pure vanilla JavaScript, HTML, CSS
- Mobile-first design for road trip entertainment

## Features
- License plate tracking by state
- GPS-based facts and information
- Multiple games (Battleship, Connect 4, etc.)
- Works offline as a PWA
- Data stored in localStorage

## Deployment
- Hosted on GitHub Pages
- Updates deploy automatically on push to main branch
- Repository: https://github.com/lstrandt-hamburglibrary/road-trip-games
