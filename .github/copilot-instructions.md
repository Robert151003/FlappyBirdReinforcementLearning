# Copilot instructions

## Project status and architecture

This repository is currently a dependency-free vanilla browser game, not yet a reinforcement-learning implementation. The playable experience is assembled from:

- `index.html`: the fixed DOM shell for the canvas, start/game-over screens, score history, and character/theme customization modal.
- `game.js`: the application and simulation code. It owns the `STATE` state machine, physics, pipe spawning/collision, score progression, animation loop, input handling, audio synthesis, character/theme registries, UI rendering, and `localStorage` persistence.
- `style.css`: the responsive presentation layer. The canvas uses a logical `360x640` coordinate system and is scaled to fit `#game-container`.
- `sw.js` and `manifest.json`: the installable/offline PWA layer. The service worker precaches the relative asset list and falls back to `index.html` when a network request fails.

The main runtime boundaries are the `gameState`/`STATE` values, the `bird` and `pipes` simulation objects, and the `loop()` update/draw cycle. Keep future agent or environment code at those boundaries rather than coupling it directly to individual DOM elements.

## Build, test, and lint

There is no package manager manifest, build step, automated test suite, or lint configuration in this repository.

Run the game through a local HTTP server so service-worker behavior works:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`. On Windows, `py -m http.server 8000` is an equivalent command.

The targeted JavaScript syntax check is:

```powershell
node --check game.js
```

There is no single automated test command. For a focused manual smoke test, load the page, start a run with the button/Space/tap, flap through at least one pipe, verify score and game-over state, restart, then open customization and verify character/theme selection persists after reload.

## Repository-specific conventions

- Keep the implementation as plain browser JavaScript loaded by the script tag in `index.html`; do not introduce imports, bundler assumptions, or a framework without adding the corresponding project tooling.
- Keep canvas simulation coordinates in the logical `360x640` space. CSS handles visual scaling; physics, collision, spawn positions, and drawing should use canvas coordinates.
- Use the existing `STATE.START`, `STATE.PLAYING`, and `STATE.GAMEOVER` flow. `startGame()` resets simulation state, `triggerGameOver()` records the run and reveals the game-over UI, and `loop()` remains the single animation/update pipeline.
- Add playable characters to `CHARACTERS` with their metadata and a `draw(ctx, flapFrame)` implementation. Add visual environments to `THEMES`; selection and picker rendering are already data-driven.
- Character and theme selections, high score, and the five-run history are persisted through the versioned `flappy_*_v2` keys. Preserve fallback behavior for missing or malformed stored data when changing persistence.
- Browser audio is intentionally initialized from a user gesture through `initAudio()`. Keep sound effects behind `playSound()` and do not assume an `AudioContext` exists before interaction.
- UI elements are resolved by their IDs near the top of `game.js`; when adding controls, add the matching markup in `index.html` and wire them alongside the existing modal/button handlers.
- All static asset references are relative paths. If an asset or application file changes, update the `ASSETS` list or bump `CACHE_NAME` in `sw.js` as appropriate so installed versions do not retain stale files.
- The Google Fonts stylesheet is an external runtime dependency; keep a usable fallback font in CSS for offline or blocked-network cases.
