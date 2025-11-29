# Magitech Engine: High Energy Overload

A puzzle game where you play as an Aether Engineer, managing high-energy magic flows using industrial magitech components.

## Core Gameplay
- **Extract** energy from the environment (blue spots).
- **Transport** energy via superconductive wires.
- **Manage** load using capacitors and vents to prevent explosions.
- **Produce** matter particles using high-energy fabricators.
- **Transport** particles using rails and prisms.

## Key Features
- **Component System**: Standardized, configurable components including Extractors, Wires, Capacitors, Vents, Makers, Rails, Prisms, and Walls.
- **Level System**: Progression from tutorials to complex challenges.
- **Main Menu**: Select levels and track progress.
- **Real-time Simulation**: Energy flow, heat management, and particle physics.
- **Responsive Design**: Mobile-friendly interface with touch controls.

## Development
- **Architecture**: Modularized into `constants.js`, `components.js`, `levels.js`, and `app.js`.
- **Testing**:
    - **Unit Tests**: Browser-based tests for logic validation (`tests/unit_test.html`).
    - **E2E Tests**: Playwright-based automated verification (`tests/verify_full.py`).
    - **Run Tests**: Execute `tests/run_tests.sh` to run the full suite.

## Tech Stack
- Vanilla JavaScript (ES6+)
- HTML5 Canvas
- Tailwind CSS
- Web Audio API

## Lore
See `lore/` directory for details on the world, components, and mechanics.
