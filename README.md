# Saber Showdown Ultimate

A lightweight browser 3D saber-dueling game built with plain JavaScript and Three.js. It is designed to run as a static site on GitHub Pages—there is no build step or server component.

## Play

Serve the repository with any static web server (or use GitHub Pages) and open `index.html`. Three.js is loaded from a CDN.

- **Move:** WASD / mobile joystick
- **Camera:** drag the play area / mouse drag
- **Light combo:** J / LIGHT
- **Heavy attack:** K / HEAVY
- **Block / perfect parry:** hold L / BLOCK; begin blocking just before impact for a perfect parry
- **Dash:** Space / DASH
- **Pause:** Esc or the HUD pause button

## Structure

- `index.html` contains semantic menu, HUD, modal, and touch-control markup.
- `styles.css` contains responsive desktop/mobile presentation.
- `game.js` owns rendering, fighter state, combat resolution, input, bot decisions, menus, customization, generated audio, and visual effects.

The input calls (`light`, `startAttack`, `block`, and `dash`) are deliberately isolated from the rendering loop, providing an integration point for a future network input adapter without pretending that online multiplayer exists today.
