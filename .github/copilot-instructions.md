# GitHub Copilot Instructions

## Project Overview
This is a DOOM-style 3D game engine built with vanilla JavaScript and Three.js. The engine features true 3D rendering via Three.js (WebGL), AI-driven enemies, weapon systems, procedural map generation, difficulty presets, mobile touch controls, and a procedural Web Audio API sound system. It ships as a PWA (`manifest.json` + `sw.js`).

## Architecture Patterns

### State Pattern
- AI behaviors use the State pattern (ChaseState, PatrolState, SearchState)
- Each state should implement consistent interface methods
- States are managed through `AIBehavior` base class (abstract; throws if instantiated directly)
- `GameStateManager` also uses the State pattern for game-level state transitions

### Factory Pattern
- Entities and weapons use Factory pattern (EnemyFactory, WeaponFactory)
- Factories handle object creation and initialization
- Keep creation logic centralized in factory classes
- Both factories auto-initialize at module load via a static `init()` call

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
- Add new enemy types through `EnemyFactory.registerType()` without modifying core logic
- Add new weapon types through `WeaponFactory.register()` without modifying core logic

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
- Use Vector2D utility class for all position/direction calculations
- Avoid raw x/y object literals for spatial data
- Leverage Vector2D methods for common operations (`add`, `subtract`, `normalize`, `dot`, `distanceTo`, `angle`, etc.)

## Game Engine Specifics

### Rendering (Three.js)
- `Renderer` uses `THREE.WebGLRenderer` (antialias, `high-performance`, pixel ratio capped at 2)
- Shadow maps are **disabled** (`renderer.shadowMap.enabled = false`); tone mapping is `NoToneMapping`
- Main scene uses `THREE.FogExp2` (density 0.06 by default; overridden by difficulty)
- Lighting: `AmbientLight(0x334455, 1.2)` + `SpotLight` player flashlight (intensity 3.5, 18-unit range, `YXZ` rotation order) + wall torch `PointLight`s
- Main camera: `PerspectiveCamera(75°, …)` with `camera.rotation.order = "YXZ"`; ADS smoothly lerps FOV to 42°
- Enemies are 3D `THREE.Group` meshes (body/head/eye/horn parts) tracked in `enemyMeshes` Map (`enemy.id → Group`)
- Wall/floor textures are **procedurally generated on `<canvas>`** and wrapped as `THREE.CanvasTexture`; SVG sprites in `window.SVGSprites` are loaded by `ResourceManager` for other use but are not the source of wall visuals
- Weapons render in a separate `weaponScene`/`weaponCamera(55°)` layered on top (no fog, own ambient + directional lights); muzzle flash via orange `PointLight` in `weaponScene` (blue for plasma)
- Shell casings: cylinder geometry with bouncing physics (up to 3 bounces), fade out; spawned via `spawnShell(px, py, angle, shellType)`
- Explosions: 20 sphere particles with orange→yellow color gradient, gravity; spawned via `spawnExplosion(wx, wy)`
- Wall materials use `THREE.MeshBasicMaterial` (no lighting math); enemy/weapon parts use `MeshLambertMaterial`
- `RayCaster` (DDA step-based, not Three.js `Raycaster`) handles ray-wall and ray-enemy intersection for **game logic** (shooting, line-of-sight), not for visual rendering
- Window resize is handled via `_onResize()` which updates both cameras' aspect ratios and renderer size
- `applyDifficultyLighting(diff)` updates ambient intensity, fog density, and flashlight intensity at game start
- Maintain 60 FPS target; profile Three.js draw calls and geometry as hot paths

### Game State
- `GameStateManager` (singleton) tracks: `LOADING`, `MENU`, `PLAYING`, `PAUSED`, `GAME_OVER`, `VICTORY`
- State transitions fire `enter`, `exit`, and `change` callbacks registered via `stateManager.on(event, state, callback)`
- Check state with `stateManager.is(GameStates.PLAYING)` pattern

### Difficulty System
- Five presets: `EASY`, `MEDIUM`, `HARD`, `IMPOSSIBLE`, `CUSTOM` — defined in `GameConfig.DIFFICULTY`
- Per-difficulty overrides: `maxHealth`, `maxStamina`, `staminaDrain`, `staminaRecovery`, `ammoMultiplier`, `enemyCount`, `enemyHealthMult`, `enemySpeedMult`, `enemyDamage`, `fillRatio`, `smoothIterations`, `ambientIntensity`, `fogDensity`, `flashlightIntensity`, `autoReload`, `aimAssist`, `availableGuns`
- `DIFFICULTY_SCHEMA` array drives the Custom difficulty modal UI — adding an entry here automatically adds a slider, checkbox, or gun picker to the modal; no other changes needed
- `HARD` restricts guns to `['pistol', 'shotgun', 'rifle', 'smg']`; `IMPOSSIBLE` to `['pistol']` only
- Selected at game start by reading `.diff-btn.selected` from the DOM; defaults to `MEDIUM`
- Applied to `Renderer` via `applyDifficultyLighting()` and to `Player`/`Enemy` instances at spawn time

### Entity Management
- Player is a singleton managed by Game core; tracks health, stamina, `isAiming` (ADS), `isSprinting`, `headBob`, `recoilOffset`, `screenShake`, and `bloodLoss`
- Enemy types: `demon`, `zombie`, `ghost`, `brute` — defined in `GameConfig.ENEMY.TYPES`
- Enemies are instantiated through `EnemyFactory.create(type, x, y, initialState)`
- **AI state instances are shared** — `EnemyFactory` holds one `ChaseState`, one `PatrolState`, one `SearchState` shared across all enemies; states must be stateless regarding individual enemy data
- `Enemy.setState(state)` accepts either a state name string or a state object; when hit while not chasing, enemy auto-switches to `'chase'`
- All entities should have consistent update/render interface

### Weapons System
- Weapons extend base `Weapon` abstract class (throws if instantiated directly)
- Each weapon defines: `damage`, `magazineSize`, `reserveAmmo`, `fireRate`, `spread`, `reloadTime`, `penetration`, `bulletSpeed`, `muzzleFlashIntensity`, `recoil`, `screenShake`, `pellets`; optional: `maxDistance`, `raycastStep`, `falloffRange`, `falloffMin`, `falloffScale`, `wallPenetrationCost`, `splashRadius`
- Registered types (7 total): `pistol`, `shotgun`, `rifle`, `smg`, `sniper`, `grenade_launcher`, `plasma` — add new types via `WeaponFactory.register(type, WeaponClass)`
- `fire(context)` receives `{ player, enemies, map, audioSystem, eventManager }` and performs an internal raycast to resolve hits
- Reload lifecycle: `startReload()` → `updateReload()` (polls elapsed time) → `completeReload()` (adjusts magazine/reserve)
- `canFire()` checks: not reloading, magazine > 0, fire rate cooldown elapsed
- Penetrating weapons use `_penetratingRaycast()`; grenade launcher uses arc trajectory + splash damage within `splashRadius` (2.5 units)
- Damage falloff: `_calcFalloffDamage(distance)` applies distance-based reduction capped at `falloffMin × base`
- Keep weapon logic separate from player input handling

### Input & Controls
- `controlType` is auto-detected from device capabilities at game start; values: `'keyboard'` or `'touch'`
- `InputManager` handles keyboard (`keydown`/`keyup`) and mouse events; also contains a built-in dual-zone touch handler for raw movement (left zone = joystick, right zone = look delta)
- `TouchInputManager` manages the visible virtual joystick UI (`#touchJoystick`, `#joystickStick`, `#touchLookArea`) and emits `touchlook` events via `EventManager`
- Touch fire (`#touch-fire`), ADS (`#touch-ads`), and reload (`#touch-reload`) buttons are wired directly in `Game._setupEventListeners()`
- `_touchFireActive` and `_touchAdsActive` flags in `Game` track hold state for auto-fire and ADS

### Audio
- `AudioSystem` is a singleton that generates all sounds **procedurally** via the Web Audio API
- No audio files are loaded from disk; sounds are synthesized using oscillators and noise buffers
- Internal helpers: `_noiseBurst({ freq, q, filterType, vol, attack, decay, dur })` for percussive/noise sounds, `_toneBurst({ type, freq, freqEnd, vol, attack, decay, dur })` for tonal sounds
- Sound types: `'shoot'`, `'explosion'`, `'hit'`, `'death'`, `'enemy_hurt'`, `'footstep'`, `'reload'`, `'reload_end'`, `'empty'`, `'ambience'`
- Weapon-specific gunshot profiles via `_getWeaponSoundProfile(weaponName)` — different body/snap/tail tuning for `pistol`, `shotgun`, `rifle`, `smg`, `sniper`, `grenade_launcher`, and `plasma`
- Background music is routed through a dedicated `musicGain` node (gain 0.75 relative to masterGain); 8-second procedural loops with bass, atmospheric pad, and tension notes
- Master volume is controlled via `masterGain`; default value is `0.3`
- `AudioContext` is created on first instantiation; call `audioSystem.resume()` on user gesture to comply with browser autoplay policy
- Constants in `GameConfig.AUDIO`: `FOOTSTEP_INTERVAL` (400ms), `FOOTSTEP_INTERVAL_SPRINT` (300ms), `AMBIENCE_INTERVAL` (3000ms)

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
- Core game loop and systems in `/core`
- Gameplay entities in `/entities`
- AI logic isolated in `/ai`
- Reusable utilities in `/utils`
- Configuration centralized in `/config`
- SVG sprite data in `/data/sprites.js` (loaded via `<script>` tag as `window.SVGSprites`; categories: `walls`, `enemies`, `weapons`)
- PWA assets: `manifest.json`, `sw.js`, `icons/`
- Keep files focused and under 300 lines when possible

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
