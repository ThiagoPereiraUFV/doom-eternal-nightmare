# GitHub Copilot Instructions

## Project Overview
This is a DOOM-style 3D game engine built with vanilla JavaScript and Three.js. The engine features true 3D rendering via Three.js (WebGL), AI-driven enemies, weapon systems, procedural map generation, difficulty presets, mobile touch controls, and a procedural Web Audio API sound system. It ships as a PWA (`manifest.json` + `sw.js`).

## Architecture Patterns

### State Pattern
- Enemy AI behaviors use the State pattern (ChaseState, PatrolState, SearchState) via `AIBehavior` base class
- Friendly bot behaviors use the State pattern (BotFollowState, BotIdleState, BotSearchClearState) via `BotBehavior` base class
- Both `AIBehavior` and `BotBehavior` extend `BaseBehavior` (`src/ai/BaseBehavior.js`), which consolidates shared movement, navigation, and line-of-sight helpers
- Each state should implement consistent interface methods
- States are managed through their respective base classes (all three are abstract; throw if instantiated directly)
- `GameStateManager` also uses the State pattern for game-level state transitions
- Shared state instances (enemy AI states, bot states) must remain stateless; validate that no per-entity data is stored on state objects — all mutable state must live on the entity instance itself
- If a shared state instance is found storing per-entity mutable data (any field other than `name`), treat it as a bug: move that data to the entity instance immediately and validate that all callers read it from the entity, not the state object

### Factory Pattern
- Entities and weapons use Factory pattern (EnemyFactory, WeaponFactory)
- Factories handle object creation and initialization
- Keep creation logic centralized in factory classes
- Both factories auto-initialize via a static `async init()` call
- Both factories delegate type registration to `EntityRegistry` — factories themselves contain no hard-coded type lists

### Registry Pattern
- `EntityRegistry` (`src/registry/EntityRegistry.js`) is the single source of truth for all registered entity types
- Categories: `enemy`, `weapon`, `bot`, `player`, `particle`, `map` (constants in `ENTITY_CATEGORIES`)
- Model files self-register at import time via `EntityRegistry.register(category, config, EntityClass)`
- Factories and systems query the registry via `EntityRegistry.getTypes()`, `getConfig()`, `getClass()`
- Adding a new enemy or weapon requires only: (1) create a model file, (2) add its import to the manifest index — no factory changes needed

### Event-Driven Architecture
- Use EventManager for decoupled communication between systems
- Events should be named with descriptive action verbs
- Subscribe to events in component initialization, unsubscribe on cleanup
- `EventManager.on()` returns an unsubscribe function; `EventManager.off()` for manual unsubscribe

## SOLID Principles

### Single Responsibility Principle (SRP)
- Each class should have one reason to change
- Separate rendering logic from game logic
- Keep input handling separate from game state updates
- Example: RayCaster only handles ray calculations, not rendering

### Open/Closed Principle (OCP)
- Classes should be open for extension, closed for modification
- Use inheritance for weapon types (extend base Weapon class)
- AI states extend base State interface
- Add new enemy types by creating `src/entities/models/<type>.js` and importing it in `models/index.js` — `EntityRegistry` handles the rest
- Add new weapon types by creating `src/weapons/models/<type>.js` and importing it in `models/index.js` — `EntityRegistry` handles the rest

### Liskov Substitution Principle (LSP)
- Derived classes must be substitutable for their base classes
- All weapons must implement the same interface (fire, reload, etc.)
- All AI states must be interchangeable in AIBehavior
- Enemy subtypes should work anywhere an Enemy is expected

### Interface Segregation Principle (ISP)
- Don't force classes to depend on methods they don't use
- Keep interfaces focused and minimal
- Separate Updateable, Renderable, and Collidable concerns
- Entities only implement interfaces they actually need

### Dependency Inversion Principle (DIP)
- Depend on abstractions, not concrete implementations
- Inject dependencies through constructors
- Game systems depend on EventManager interface, not implementation
- Use factories to manage concrete instantiation

## Design Patterns Standards

### Observer Pattern
- EventManager implements Observer pattern
- Systems subscribe to game events (`enemyKilled`, `enemyDamaged`, `enemyHit`, `weaponChanged`, `weaponFired`, `reloadStarted`, `reloadCompleted`, `playerDamaged`, `playerHealed`, `playerDied`, `explosion`, `shellEjected`, `touchlook`, `keydown`, `keyup`, `mousedown`, `mouseup`)
- Decouple event producers from consumers
- Clean up subscriptions to prevent memory leaks

### Strategy Pattern
- AI states implement Strategy pattern
- Different behaviors (chase, patrol, search) are interchangeable
- Weapon firing modes can use Strategy pattern
- Allows runtime behavior switching

### Singleton Pattern
- Use sparingly and only when truly needed
- `GameStateManager`, `ResourceManager`, and `AudioSystem` are singletons (use `getInstance()`)
- `EventManager` is instantiated once in `Game` and injected (not a singleton — injected as dependency)
- Avoid for entities that may need multiple instances

### Object Pool Pattern
- Reuse objects for projectiles, particles, and effects
- Pre-allocate pools during initialization
- Reset objects instead of creating new ones
- Critical for maintaining 60 FPS performance

### Command Pattern
- Encapsulate input actions as command objects
- Enable input rebinding and replay systems
- Separate input detection from action execution
- Useful for implementing undo/redo if needed

## Code Style & Conventions

### Class Structure
- Use ES6 class syntax
- Constructor should initialize state and dependencies
- Group related methods together
- Use private fields/methods with `#` prefix when appropriate

### Naming Conventions
- Classes: PascalCase (e.g., `RayCaster`, `AIBehavior`)
- Methods/Functions: camelCase (e.g., `castRay`, `updateState`)
- Constants: UPPER_SNAKE_CASE in GameConfig
- File names: Match class names (PascalCase.js)

### Vector Math
- `Vector2D` utility class is available for position/direction calculations (`add`, `subtract`, `normalize`, `dot`, `distanceTo`, `angle`, etc.)
- **Note:** Most existing entity/AI code uses raw scalar math and `{x, y}` objects rather than `Vector2D`; this is legacy — **new code must use the `Vector2D` utility class**; do not add new raw scalar math for vector operations

### Math Utilities
- `MathUtils.js` (`src/utils/MathUtils.js`) provides shared math primitives used across AI, movement, and map systems: `distance`, `clamp`, `lerp`, `isInBounds`, `isWalkable`, `spliceByIndices`
- `BaseBehavior` and map helpers import from `MathUtils.js`; prefer these over inline math for the same operations

## Game Engine Specifics

### Rendering (Three.js)
**Renderer setup:** `THREE.WebGLRenderer` (antialias, `high-performance`, pixel ratio capped at 2); shadow maps **disabled**; tone mapping `NoToneMapping`; resize via `_onResize()`; maintain 60 FPS — profile draw calls as hot path.

**Scene & camera:** Main scene uses `THREE.FogExp2` (density 0.06, overridden by difficulty). Main camera: `PerspectiveCamera(75°, aspect, 0.05, 60)`, `rotation.order = "YXZ"`; ADS lerps FOV to 42° (sniper: `weapon.render.adsFOV`, e.g. 22°). Scene holds `enemiesGroup` and `botsGroup` (`THREE.Group`s). `applyDifficultyLighting(diff)` updates ambient intensity, fog density, and flashlight intensity at game start.

**Lighting:** `AmbientLight(0x334455, 1.2)` + `SpotLight` player flashlight (intensity 3.5, 18-unit range, `YXZ` rotation order) + wall torch `PointLight`s. `MapRenderer` randomly places flickering `PointLight` torches on ~3% of wall tiles.

**Geometry & materials:** Wall/floor textures procedurally generated on `<canvas>` (256×256) as `THREE.CanvasTexture`. `MapRenderer` buckets wall tiles by type → one `InstancedMesh` per type (4 draw calls total). Wall materials: `MeshBasicMaterial`; enemy and bot parts: `MeshStandardMaterial` (defined in model files under `getMaterials()`). SVG sprites in `window.SVGSprites` are loaded by `ResourceManager` but not used for rendering.

**Entities:** Enemies are 3D `THREE.Group` meshes (body/head/eye/horn parts). Friendly bots are humanoid meshes with 3 weapon sub-groups.

**Weapon rendering:** Separate `weaponScene`/`weaponCamera(55°)` layered on top (no fog, own ambient + directional lights); muzzle flash via orange `PointLight` (blue for plasma). `#weaponCanvas` DOM element is accepted by `Renderer` constructor for API compatibility but is no longer used (rendering done entirely in `#gameCanvas`); do not restore or repurpose it.

**Effects:** Shell casings: cylinder geometry, bouncing physics (up to 3 bounces, restitution 0.3–0.55), fade out; `spawnShell(px, py, angle, shellConfig)`; hard cap 60. Explosions: 20 sphere particles, orange→yellow gradient + `PointLight` flash; `spawnExplosion(wx, wy)`. Death animation: mesh sinks and rotates 90° over 1.2s via `DeathAnimationSystem`.

**Game logic raycasting:** `RayCaster` (incremental ray march at 0.01 precision, not Three.js `Raycaster`) handles ray-wall and ray-enemy intersection for shooting and line-of-sight — not for visual rendering.

### MeshBuilder
- `MeshBuilderMixin(BaseClass)` is a mixin function that adds geometry helper methods to any class: `box`, `sphere`, `cone`, `cyl`, `torus`, `ring`, `addTube`
- All mixin helpers add a mesh to `this.g` (the current group) and return it
- Enemy subclasses use `class Demon extends MeshBuilderMixin(Enemy)` pattern; `FriendlyBot` uses `class FriendlyBot extends MeshBuilderMixin(Entity)` since it extends `Entity` but not `Enemy`
- `MeshBuilder` is also available as a standalone class: `new MeshBuilder(group, mat)`
- Use this mixin for all new entity mesh construction instead of raw `THREE.Mesh` creation

### Game State
- `GameStateManager` (singleton) tracks: `LOADING`, `MENU`, `PLAYING`, `PAUSED`, `GAME_OVER`, `VICTORY`
- State transitions fire `enter`, `exit`, and `change` callbacks registered via `stateManager.on(event, state, callback)`
- Check state with `stateManager.is(GameStates.PLAYING)` pattern

### Difficulty System
- Five presets: `EASY`, `MEDIUM`, `HARD`, `IMPOSSIBLE`, `CUSTOM` — defined in `GameConfig.DIFFICULTY`
- Per-difficulty overrides: `maxHealth`, `maxStamina`, `staminaDrain`, `staminaRecovery`, `ammoMultiplier`, `enemyCount`, `enemyHealthMult`, `enemySpeedMult`, `enemyDamage`, `fillRatio`, `smoothIterations`, `ambientIntensity`, `fogDensity`, `flashlightIntensity`, `autoReload`, `aimAssist`, `availableGuns`, `botCount`
- `DIFFICULTY_SCHEMA` array drives the Custom difficulty modal UI — adding an entry here automatically adds a slider, checkbox, or gun picker to the modal; no other changes needed
- `HARD` restricts guns to `['pistol', 'shotgun', 'rifle', 'smg']`; `IMPOSSIBLE` to `['pistol']` only
- Selected at game start by reading `.diff-btn.selected` from the DOM; defaults to `MEDIUM`
- Applied to `Renderer` via `applyDifficultyLighting()` and to `Player`/`Enemy` instances at spawn time

### Entity Base Class
- `Entity` (`src/entities/Entity.js`) is the shared base for all positioned, living entities (`Player`, `Enemy`, `FriendlyBot`)
- Provides: `x`, `y`, `angle`, `health`, `maxHealth`, `isAlive()`, `distanceTo(x, y)`, `angleTo(x, y)`

### Entity Management
- Player is a singleton managed by Game core; tracks health, stamina, `isAiming` (ADS), `isSprinting`, `headBob`, `recoilOffset`, `screenShake`, and `bloodLoss`
- Enemy types: `demon`, `zombie`, `ghost`, `brute` — defined in `src/entities/models/` and auto-registered with `EntityRegistry` at import time; use `EnemyFactory.getTypes()` at runtime to enumerate them
- `GameConfig.ENEMY.AI_STATES` holds string constants (`CHASE`, `PATROL`, `SEARCH`) — single source of truth for all `setState()` calls
- Enemies are instantiated through `EnemyFactory.create(type, x, y, initialState)`; `EnemyFactory` lives in `src/entities/enemies/EnemyFactory.js`
- **AI state instances are shared** — `EnemyFactory` holds one `ChaseState`, one `PatrolState`, one `SearchState` shared across all enemies; states must be stateless regarding individual enemy data; all per-enemy state (`patrolTarget`, `searchTarget`, `lastKnownPlayerPosition`, `stuckCounter`) is stored on the enemy instance itself
- `Enemy.setState(state)` monkey-patched by `EnemyFactory` to route string names through `_aiStates` map; accepts either a state name string or a state object; when hit while not chasing, enemy auto-switches to `'chase'`
- All entities should have consistent update/render interface

### FriendlyBot System
- `FriendlyBot` is a friendly AI companion (`src/entities/bots/FriendlyBot.js`) that extends `MeshBuilderMixin(Entity)` — it does NOT extend `Enemy`
- Bots are spawned in an arc behind the player at game start; count and behavior driven by difficulty settings
- Bot AI uses a **separate** base class `BotBehavior` (not `AIBehavior`) with `execute(bot, player, enemies, map, deltaTime)` signature
- Three bot states: `BotFollowState` (follow player + engage enemies), `BotIdleState` (hold position, short-range engage), `BotSearchClearState` (wander + clear area)
- Bot commands issued by player: `Z` = follow, `X` = search_clear, `C` = stop (keyboard); `#bot-touch-commands` buttons on mobile
- **Bot state instances are also shared** — `Game` holds one instance of each bot state; like enemy states, they must be stateless regarding individual bot data
- `bot.eventManager` and `bot.audioSystem` are **injected per frame** in `Game._updateBots()` (not in the constructor) — a deliberate decoupling pattern
- `BotBehavior._tryAttack()` selects weapon dynamically using `GameConfig.BOT.BOT_WEAPONS` profiles (ordered by `maxRange`): first matching profile wins; sets `bot.weaponType` which controls which weapon sub-mesh is visible; default profiles: shotgun (<3.5u, 40dmg, 900ms cd), pistol (<7.5u, 25dmg, 600ms cd), sniper (∞, 60dmg, 1400ms cd)
- Bot mesh contains 3 weapon sub-groups (pistol/shotgun/sniper); only one is visible at a time based on `bot.weaponType`
- Bots can target both enemies and shield the player; `ChaseState` also considers living bots as potential targets (nearest entity with LoS)
- `GameConfig.BOT`: `HEALTH: 100`, `SPEED: 0.04`, `ATTACK_RANGE: 9`, `ATTACK_DAMAGE: 25`, `ATTACK_COOLDOWN: 700`, `FOLLOW_DESIRED_DISTANCE: 2.5`, `FOLLOW_MAX_DISTANCE: 8`, `SEARCH_WANDER_INTERVAL: 3000ms`, `SEARCH_WANDER_MIN_DIST: 3`, `SEARCH_WANDER_RANGE: 8`, `SEARCH_WANDER_ATTEMPTS: 20`, `ENGAGE_BUFFER: 1.2`, `MAX_COUNT: 5`, `COMMANDS` string constants, `BOT_WEAPONS` array of range-ordered weapon profiles

### MenuModelViewer
- `MenuModelViewer` (`src/core/MenuModelViewer.js`) renders a standalone Three.js scene in `#modelViewerCanvas` for the pre-game model browser
- Supports three categories: `enemies` (all registered enemy types), `weapons` (all registered weapon types), `characters` (marine variants: `marine_pistol`, `marine_shotgun`, `marine_sniper`)
- Enemy and weapon entries are sourced dynamically from `EnemyFactory.getTypes()` / `WeaponFactory.getTypes()` (backed by `EntityRegistry`) so new types appear automatically
- Uses `WeaponFactory.create()` / `EnemyFactory.create()` to build models, then `renderer.createWeaponPreview()` / `renderer.createEnemyPreview()` to clone materials for independent emissive state
- Auto-rotates model (0.006 rad/frame); drag to rotate manually; auto-rotation resumes when pointer is released
- `_fitModel()` computes camera distance from bounding box using FOV math
- `_loadToken` pattern: increments on each navigation; stale async results are discarded by token comparison
- Opened via `#model-viewer-open` button on start screen; closed via close button

### Weapons System
- Weapons extend base `Weapon` abstract class (throws if instantiated directly); `Weapon` also uses `MeshBuilderMixin` for 3D model construction
- Each weapon defines: `damage`, `magazineSize`, `reserveAmmo`, `fireRate`, `spread`, `reloadTime`, `penetration`, `bulletSpeed`, `recoil`, `screenShake`, `pellets`; optional: `maxDistance`, `raycastStep`, `falloffRange`, `falloffMin`, `falloffScale`, `wallPenetrationCost`, `splashRadius`
- `fireType`: `'auto'` (held trigger, continuous fire), `'semi'` (one shot per click), `'manual'` (manual cycling — grenade launcher, sniper)
- `render` config per weapon: `{ basePosition, baseRotationY, adsOffset, adsRotation, scale, muzzleFlash: {intensity, color?, duration?} }`; sniper includes `adsFOV: 22°`
- `audio` config per weapon: `{ shoot: [...sequence] }` — played by `AudioSystem` instead of the generic gunshot fallback
- `shell` config per weapon (optional): ejection angle offset, geometry dimensions — absent on grenade launcher and plasma
- Registered types (7 total): `pistol`, `shotgun`, `rifle`, `smg`, `sniper`, `grenade_launcher`, `plasma` — add new types by creating a model file that calls `EntityRegistry.register(ENTITY_CATEGORIES.WEAPON, config, WeaponClass)` and importing it in `src/weapons/models/index.js`
- `WeaponFactory.create(type)` is **async** — resolves via `EntityRegistry`; falls back to a dynamic `import('./models/${type}.js')` for types not in the index
- `fire(context)` receives `{ player, enemies, map, audioSystem, eventManager }` and performs an internal raycast to resolve hits
- Reload lifecycle: `startReload()` → `updateReload()` (polls elapsed time) → `completeReload()` (adjusts magazine/reserve)
- `canFire()` checks: not reloading, magazine > 0, fire rate cooldown elapsed
- Penetrating weapons use `_penetratingRaycast()` — returns all hits, tracks `penetrationLeft`; grenade launcher uses parabolic arc simulation + splash damage within `splashRadius` (2.5 units), emits `explosion` event
- Pitch-aware hit detection: `_isEnemyWithinPitch(enemy, distance, pitch)` checks shot height against enemy bounding volume
- Damage falloff: `_calcFalloffDamage(distance)` applies linear reduction beyond `falloffRange`; clamped to `falloffMin × base`
- Keep weapon logic separate from player input handling

### Input & Controls
- `controlType` is auto-detected via `matchMedia("(hover: none) and (pointer: coarse)")` at game start; values: `'keyboard'` or `'touch'`
- `InputManager` handles keyboard (`keydown`/`keyup`) and mouse events; `mousemove` is handled directly in `Game._setupEventListeners()` via `pointerLockElement` check
- `TouchInputManager` manages the visible virtual joystick UI (`#touchJoystick`, `#joystickStick`, `#touchLookArea`) and emits `touchlook` events via `EventManager`; joystick clamped to 50px radius, normalized to −1…1
- Touch fire (`#touch-fire`), ADS (`#touch-ads`), and reload (`#touch-reload`) buttons are wired directly in `Game._setupEventListeners()`
- `_touchFireActive` and `_touchAdsActive` flags in `Game` track hold state for auto-fire and ADS
- Bot commands: keyboard `Z`=follow, `X`=search_clear, `C`=stop; `#bot-touch-commands` panel (shown when bots active) has corresponding touch buttons
- `#touch-jump` exists in the DOM but is hidden (`display: none`) and has no binding — vestigial

### Audio
- `AudioSystem` is a singleton that generates all sounds **procedurally** via the Web Audio API
- No audio files are loaded from disk; sounds are synthesized using oscillators and noise buffers
- Internal helpers: `_noiseBurst({ freq, q, filterType, vol, attack, decay, dur })` for percussive/noise sounds, `_toneBurst({ type, freq, freqEnd, vol, attack, decay, dur })` for tonal sounds; `_playAudioSequence(sequence[])` for multi-step weapon sounds
- Sound types: `'shoot'`, `'explosion'`, `'hit'`, `'plasma_hit'`, `'death'`, `'enemy_hurt'`, `'footstep'`, `'reload'`, `'reload_end'`, `'empty'`, `'ambience'`, `'shell_drop'`
- `'shoot'` uses `weapon.audio.shoot` sequence from the weapon config if present; falls back to a generic 5-layer gunshot synthesis
- Background music is routed through a dedicated `musicGain` node (gain `GameConfig.AUDIO.MUSIC_VOLUME: 0.75` relative to masterGain); 8-second procedural loops with bass, atmospheric pad, and tension notes
- Master volume is controlled via `masterGain`; default value is `0.3`
- `AudioContext` is created on first instantiation; call `audioSystem.resume()` on user gesture to comply with browser autoplay policy
- Constants in `GameConfig.AUDIO`: `FOOTSTEP_INTERVAL` (400ms), `FOOTSTEP_INTERVAL_SPRINT` (300ms), `AMBIENCE_INTERVAL` (3000ms), `MUSIC_VOLUME` (0.75), `MUSIC_LOOP_DURATION` (8s)

### Maps
- `MapGenerator` creates procedural level layouts using cellular automata
- Map data is a 2D array of integers: `0` = floor, `>0` = wall type
- Wall types (1–4): CONCRETE, BRICK, METAL, STONE — assigned randomly during generation (thresholds: 0.25/0.5/0.75/1.0)
- `generate(width, height, options)` accepts `fillRatio`, `smoothIterations`, `wallThreshold` overrides (difficulty drives `fillRatio` and `smoothIterations`); default 20×20
- `generateSpawnMap(playerX, playerY, options)` creates a safe open zone (radius 12) around the player spawn and carves corridors; map size 30×30 (`SPAWN_SIZE`)
- Generation stages: random fill → cellular automata smoothing → room carving (6–12 rooms) → corridor carving → column detail → wall type assignment

## Performance Considerations
- Minimize object creation in game loop (reuse objects/pools)
- Cache frequently accessed DOM elements
- Use requestAnimationFrame for game loop timing
- Profile rendering pipeline for bottlenecks; watch Three.js draw call count

## Testing & Debugging
- Test AI state transitions thoroughly (shared state instances must remain stateless)
- Verify raycasting edge cases (corners, perpendicular walls)
- Check weapon balance and feel across all difficulty presets
- Monitor FPS and optimize hot paths

## File Organization
- Core game loop in `/core` (`Game.js` only)
- Rendering systems in `/rendering` (`Renderer.js`, `MapRenderer.js`, `MenuModelViewer.js`)
- Input handlers in `/input` (`InputManager.js`, `TouchInputManager.js`)
- Map generation and raycasting in `/map` (`MapGenerator.js`, `RayCaster.js`)
- Entity base and player in `/entities` (`Entity.js` base class, `Player.js`)
- Enemy classes and factory in `/entities/enemies/` (`Enemy.js`, `EnemyFactory.js`, `Brute.js`, `Demon.js`, `Ghost.js`, `Zombie.js`)
- Enemy model descriptors in `/entities/enemies/models/` (one file per enemy type; each calls `EntityRegistry.register()`; manifest in `index.js`)
- Friendly bot in `/entities/bots/` (`FriendlyBot.js`)
- AI logic isolated in `/ai` (`BaseBehavior.js` shared abstract base; `AIBehavior.js` + ChaseState/PatrolState/SearchState for enemies; `BotBehavior.js` + BotFollowState/BotIdleState/BotSearchClearState for bots)
- Particle/effect systems in `/systems` (`BloodSystem.js`, `ShellSystem.js`, `ExplosionSystem.js`, `DeathAnimationSystem.js`, `AudioSystem.js`)
- Reusable utilities in `/utils` (`MathUtils.js`, `MeshBuilder.js`, `Vector2D.js`)
- Weapon models in `/weapons/models/` (one file per weapon type; each calls `EntityRegistry.register()`; manifest in `index.js`)
- Central type registry in `/registry/EntityRegistry.js` (`EntityRegistry` class + `ENTITY_CATEGORIES` constants)
- Configuration centralized in `/config/GameConfig.js`
- SVG sprite data in `/data/sprites.js` (loaded via `<script>` tag as `window.SVGSprites`; categories: `walls`, `enemies`, `weapons`)
- State management and event system in `/managers/` (`EventManager.js`, `GameStateManager.js`, `ResourceManager.js`)
- PWA assets: `manifest.json`, `sw.js`, `icons/`
- Keep files focused and under 300 lines when possible

## Utility Commands

- `yarn generate-icons` — regenerate PWA icons via `scripts/generate-icons.js`
- `yarn generate-sw` — regenerate service worker via `scripts/generate-sw.js`
- `yarn lint` — run all linters (JS + CSS + HTML)
- `yarn lint:js` — ESLint on `src/**/*.js`, `scripts/**/*.js`, `sw.js`
- `yarn lint:css` — Stylelint on all CSS files
- `yarn lint:html` — HTMLHint on all HTML files
- `yarn lint:ci` — strict lint + Prettier check (zero warnings, used in CI)
- `yarn lint:fix` — auto-fix ESLint and Stylelint issues
- `yarn format` — Prettier format all JS/CSS/HTML files
- `yarn validate` — alias for `yarn lint`

## Best Practices
- Avoid tight coupling between systems
- Use dependency injection for testability
- Comment complex math/algorithms
- Keep game state immutable where possible
- Validate user input and game state boundaries
- Handle edge cases in collision detection

## Mobile Touch Input — Critical Bug Pattern

### The `click`-only handler bug
This project sets `touch-action: none` on `body` (required for the game canvas). This prevents the browser from synthesizing `click` events from touch, so any interactive element that only listens for `click` or assigns `.onclick` **will not respond on mobile**.

**Wrong — click-only:**
```js
btn.onclick = () => doSomething();
btn.addEventListener("click", handler);
```

**Correct — use the `_bindTap` helper (defined locally in `Game._setupEventListeners`) or an equivalent pattern:**
```js
// reusable helper
const _bindTap = (el, fn) => {
  if (!el) return;
  el.onclick = fn;
  el.addEventListener("touchstart", (e) => { e.preventDefault(); fn(); }, { passive: false });
};
_bindTap(btn, handler);
```

**Rules:**
- Every button, menu item, overlay, or clickable `div` visible during gameplay or in menus must bind **both** `click` (for desktop) and `touchstart` (for mobile).
- Always call `e.preventDefault()` in the `touchstart` handler to suppress the delayed synthetic click and prevent double-firing.
- Use `{ passive: false }` so `preventDefault()` is allowed.
- Backdrop/overlay "close on tap" patterns need the same dual binding.
- Touches on `BUTTON`, `A` tags, and elements inside `.overlay-screen`, `#startScreen`, `#pauseMenu`, `.menu-item`, `#start-btn` are intentionally skipped by `InputManager`'s raw touch handler — let `_bindTap` handle them instead.
- When auditing new UI code, search for `.onclick =` and `addEventListener("click"` and verify each has a matching `touchstart` counterpart.
