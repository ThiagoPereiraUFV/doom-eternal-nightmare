# GitHub Copilot Instructions

## Project Overview
This is a DOOM-style raycasting game engine built with vanilla JavaScript. The engine features 3D rendering using raycasting techniques, AI-driven enemies, weapon systems, and procedural map generation.

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

### Raycasting
- RayCaster handles all ray-wall intersection logic
- Maintain 60 FPS target; optimize ray calculations
- Use fixed-point or integer math where possible for performance

### Entity Management
- Player is a singleton managed by Game core
- Enemies should be instantiated through EnemyFactory
- All entities should have consistent update/render interface

### Weapons System
- Weapons extend base Weapon class
- Each weapon defines: damage, fireRate, ammo, spread
- Use WeaponFactory for weapon instantiation
- Keep weapon logic separate from player input handling

### Audio
- AudioSystem manages all sound playback
- Preload audio resources through ResourceManager
- Use positional audio for spatial effects

### Maps
- MapGenerator creates procedural level layouts
- Map data should be 2D arrays of tile types
- Maintain wall/floor/ceiling texture references

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
- Keep files focused and under 300 lines when possible

## Best Practices
- Avoid tight coupling between systems
- Use dependency injection for testability
- Comment complex math/algorithms
- Keep game state immutable where possible
- Validate user input and game state boundaries
- Handle edge cases in collision detection
