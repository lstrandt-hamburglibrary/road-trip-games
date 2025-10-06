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
- index.html: Main app file containing all functionality
- sw.js: Service worker (if present) - handles caching and update notifications
- manifest.json: PWA manifest configuration

## Development Workflow
1. Make changes to code
2. Commit with version number in message
3. Push to GitHub
4. PWA will detect update and notify users

## Testing Commands
- No specific test framework currently set up
- Manual testing in browser/PWA required

## Code Style
- Single-file application (all code in index.html)
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
