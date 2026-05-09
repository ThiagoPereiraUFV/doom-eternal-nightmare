# GitHub Copilot Instructions

## Project Overview
This is a DOOM-style 3D game engine built with vanilla JavaScript and Three.js. The engine features true 3D rendering via Three.js (WebGL), AI-driven enemies, weapon systems, procedural map generation, mobile touch controls, and a procedural Web Audio API sound system.

## Architecture Patterns

### State Pattern
- AI behaviors use the State pattern (ChaseState, PatrolState, SearchState)
- Each state should implement consistent interface methods
- States are managed through AIBehavior coordinator

### Factory Pattern
- Entities and weapons use Factory pattern (EnemyFactory, WeaponFactory)
- Factories handle object creation and initialization
- Keep creation logic centralized in factory classes

### Event-Driven Architecture
- Use EventManager for decoupled communication between systems
- Events should be named with descriptive action verbs
- Subscribe to events in component initialization, unsubscribe on cleanup

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
- Add new enemy types through EnemyFactory without modifying core logic

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
- Systems subscribe to game events (enemy_killed, weapon_fired, etc.)
- Decouple event producers from consumers
- Clean up subscriptions to prevent memory leaks

### Strategy Pattern
- AI states implement Strategy pattern
- Different behaviors (chase, patrol, search) are interchangeable
- Weapon firing modes can use Strategy pattern
- Allows runtime behavior switching

### Singleton Pattern
- Use sparingly and only when truly needed
- Game instance, EventManager, ResourceManager are valid singletons
- Avoid for entities that may need multiple instances
- Consider dependency injection over global access

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
- Leverage Vector2D methods for common operations (add, subtract, normalize, etc.)

## Game Engine Specifics

### Rendering (Three.js)
- `Renderer` uses `THREE.WebGLRenderer` for true 3D first-person rendering
- Scene uses `THREE.FogExp2`, `SpotLight` (player flashlight), and wall torch `PointLight`s
- Enemies are 3D `THREE.Group` meshes tracked in `enemyMeshes` Map (enemy.id → Group)
- Weapons render in a separate `weaponScene`/`weaponCamera` layered on top (no fog)
- `RayCaster` handles ray-wall and ray-enemy intersection for **game logic** (shooting, line-of-sight), not for visual rendering
- Window resize is handled via `_onResize()` which updates camera aspect and renderer size
- Maintain 60 FPS target; profile Three.js draw calls and geometry as hot paths

### Entity Management
- Player is a singleton managed by Game core; tracks health, stamina, ADS (`isAiming`), head bob, recoil, and screen shake
- Enemy types: `demon`, `zombie`, `ghost`, `brute` — defined in `GameConfig.ENEMY.TYPES`
- Enemies are instantiated through `EnemyFactory.create(type, x, y, initialState)`; the factory shares a single `AIBehavior` instance per state across all enemies
- All entities should have consistent update/render interface

### Weapons System
- Weapons extend base `Weapon` abstract class (throws if instantiated directly)
- Each weapon defines: `damage`, `magazineSize`, `reserveAmmo`, `fireRate`, `spread`, `recoil`, `screenShake`, `pellets`, `penetration`, `muzzleFlashIntensity`
- Registered types: `pistol`, `shotgun`, `rifle` — add new types via `WeaponFactory.register()`
- `fire(context)` receives `{ player, enemies, map, audioSystem, eventManager }` and performs an internal raycast to resolve hits
- Keep weapon logic separate from player input handling

### Audio
- `AudioSystem` is a singleton that generates all sounds **procedurally** via the Web Audio API
- No audio files are loaded from disk; sounds are synthesized using oscillators and noise buffers
- Internal helpers: `_noiseBurst()` for percussive/noise sounds, `_toneBurst()` for tonal sounds
- Background music is routed through a dedicated `musicGain` node
- Master volume is controlled via `masterGain`; default value is `0.3`
- `AudioContext` is created on first instantiation (browser autoplay policy must be considered)

### Maps
- MapGenerator creates procedural level layouts using cellular automata
- Map data is a 2D array of integers: `0` = floor, `>0` = wall type
- Wall types (1–4): CONCRETE, BRICK, METAL, STONE — assigned randomly during generation
- `generateSpawnMap()` creates a safe open zone around the player spawn and carves corridors

## Performance Considerations
- Minimize object creation in game loop (reuse objects/pools)
- Cache frequently accessed DOM elements
- Use requestAnimationFrame for game loop timing
- Profile rendering pipeline for bottlenecks

## Testing & Debugging
- Test AI state transitions thoroughly
- Verify raycasting edge cases (corners, perpendicular walls)
- Check weapon balance and feel
- Monitor FPS and optimize hot paths

## File Organization
- Core game loop and systems in `/core`
- Gameplay entities in `/entities`
- AI logic isolated in `/ai`
- Reusable utilities in `/utils`
- Configuration centralized in `/config`
- SVG sprite data in `/data/sprites.js` (loaded via script tag as `window.SVGSprites`)
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

**Correct — use the `_bindTap` helper (Game.js) or an equivalent pattern:**
```js
// reusable helper
const _bindTap = (el, fn) => {
  if (!el) return;
  el.onclick = fn;
  el.addEventListener("touchstart", (e) => { e.preventDefault(); fn(e); }, { passive: false });
};
_bindTap(btn, handler);
```

**Rules:**
- Every button, menu item, overlay, or clickable `div` visible during gameplay or in menus must bind **both** `click` (for desktop) and `touchstart` (for mobile).
- Always call `e.preventDefault()` in the `touchstart` handler to suppress the delayed synthetic click and prevent double-firing.
- Use `{ passive: false }` so `preventDefault()` is allowed.
- Backdrop/overlay "close on tap" patterns need the same dual binding.
- When auditing new UI code, search for `.onclick =` and `addEventListener("click"` and verify each has a matching `touchstart` counterpart.
