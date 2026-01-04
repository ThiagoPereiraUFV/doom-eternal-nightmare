# DOOM - Eternal Nightmare

## 🎮 Project Overview

A browser-based first-person shooter (FPS) game inspired by classic titles like DOOM and Wolfenstein 3D. Built using JavaScript and HTML5 Canvas, this project showcases advanced game development techniques, including raycasting, procedural map generation, AI state machines, and modular architecture following SOLID principles.

### Key Features
- 🔫 Multiple weapons (Pistol, Shotgun, Rifle)
- 🤖 Smart AI enemies with state machine (Patrol, Chase, Search)
- 🗺️ Procedural map generation with cellular automata
- 🎨 Ultra-realistic graphics (blood splatters, dynamic lighting, muzzle flashes)
- 🏃 Stamina and sprint mechanics
- 🔊 Procedural audio system
- 📦 Modular architecture following SOLID principles

---

## 🏗️ Architecture

### SOLID Principles Applied

1. **Single Responsibility Principle (SRP)**
   - Each class has one clear purpose
   - `Player` → player state/actions
   - `Renderer` → rendering only
   - `AudioSystem` → audio only

2. **Open/Closed Principle (OCP)**
   - New weapons extend `Weapon` base class
   - New AI behaviors extend `AIBehavior`
   - Extensible without modifying existing code

3. **Liskov Substitution Principle (LSP)**
   - All weapons are interchangeable via base class
   - All AI behaviors implement same interface

4. **Interface Segregation Principle (ISP)**
   - Managers expose only necessary methods
   - No unused dependencies

5. **Dependency Inversion Principle (DIP)**
   - High-level modules depend on abstractions
   - Dependency injection throughout

### Design Patterns

| Pattern | Classes | Purpose |
|---------|---------|---------|
| **Factory** | `WeaponFactory`, `EnemyFactory` | Create objects without specifying exact class |
| **Strategy** | `ChaseState`, `PatrolState`, `SearchState` | Interchangeable AI behaviors |
| **Singleton** | `AudioSystem`, `GameStateManager` | Single instance of critical systems |
| **Observer** | `EventManager` | Publish/subscribe event system |
| **State** | `GameStateManager` | Manage game state transitions |

---

## 📁 File Structure

```
src/
├── config/
│   └── GameConfig.js          # Centralized configuration
├── core/
│   ├── EventManager.js        # Observer pattern events
│   ├── InputManager.js        # Keyboard/mouse input
│   ├── Game.js                # Main game coordinator
│   └── Renderer.js            # Rendering engine
├── entities/
│   ├── Player.js              # Player entity
│   ├── Enemy.js               # Enemy entity
│   └── EnemyFactory.js        # Factory for enemies
├── weapons/
│   ├── Weapon.js              # Base weapon class
│   ├── Pistol.js              # Pistol implementation
│   ├── Shotgun.js             # Shotgun implementation
│   ├── Rifle.js               # Rifle implementation
│   └── WeaponFactory.js       # Weapon factory
├── ai/
│   ├── AIBehavior.js          # Base AI behavior
│   ├── ChaseState.js          # Chase player state
│   ├── PatrolState.js         # Patrol area state
│   └── SearchState.js         # Search for player state
├── systems/
│   └── AudioSystem.js         # Audio management
├── managers/
│   └── GameStateManager.js   # State machine
└── utils/
    ├── Vector2D.js            # 2D vector math
    ├── MapGenerator.js        # Procedural map generation
    └── RayCaster.js           # Raycasting engine
```

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge)
- Local web server (for ES6 modules)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd doom-fps
```

2. Start a local server:

**Python 3:**
```bash
python -m http.server 8000
```

**Node.js (http-server):**
```bash
npx http-server -p 8000
```

**VS Code Live Server:**
- Install Live Server extension
- Right-click `index.html` → "Open with Live Server"

3. Open browser to `http://localhost:8000`

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W` | Move Forward |
| `S` | Move Backward |
| `A` | Strafe Left |
| `D` | Strafe Right |
| `←` / `→` | Turn Left/Right |
| `Shift` | Sprint (drains stamina) |
| `Mouse Click` | Shoot |
| `Right Click` | Aim (future feature) |
| `R` | Reload |
| `1` / `2` / `3` | Switch Weapons |
| `Q` | Previous Weapon |
| `E` | Next Weapon |

---

## 🔧 Configuration

All game constants are centralized in [`src/config/GameConfig.js`](src/config/GameConfig.js).

### Example: Modify Player Stats
```javascript
// src/config/GameConfig.js
PLAYER: {
  MAX_HEALTH: 100,        // Change health
  MAX_STAMINA: 100,       // Change stamina
  MOVE_SPEED: 0.05,       // Movement speed
  SPRINT_MULTIPLIER: 1.8, // Sprint speed multiplier
}
```

### Example: Add New Enemy Type
```javascript
// src/config/GameConfig.js
ENEMY: {
  TYPES: {
    PHANTOM: {
      type: 'phantom',
      health: 40,
      speed: 0.035,
      color: { r: 150, g: 0 },
    }
  }
}

// Then in code:
const phantom = EnemyFactory.create('phantom', x, y);
```

---

## 🛠️ Development

### Adding New Weapon

1. Create weapon class:
```javascript
// src/weapons/RocketLauncher.js
import { Weapon } from './Weapon.js';

export class RocketLauncher extends Weapon {
  constructor() {
    super('ROCKET LAUNCHER', {
      damage: 100,
      magazineSize: 1,
      reserveAmmo: 10,
      fireRate: 2000,
      spread: 0,
      reloadTime: 3000,
    });
  }

  fire(context) {
    // Implementation
  }
}
```

2. Register with factory:
```javascript
// src/weapons/WeaponFactory.js
import { RocketLauncher } from './RocketLauncher.js';

WeaponFactory.register('rocket', RocketLauncher);
```

### Adding New AI Behavior

1. Create behavior class:
```javascript
// src/ai/FleeState.js
import { AIBehavior } from './AIBehavior.js';

export class FleeState extends AIBehavior {
  constructor() {
    super('Flee');
  }

  execute(enemy, player, map, deltaTime) {
    // Run away from player
  }
}
```

2. Register with factory:
```javascript
// src/entities/EnemyFactory.js
EnemyFactory.registerAIState('flee', new FleeState());
```

### Event System Usage

```javascript
// Subscribe to event
EventManager.on('enemyKilled', (enemy) => {
  console.log('Enemy killed:', enemy.type);
});

// Emit event
EventManager.emit('enemyKilled', enemy);

// One-time subscription
EventManager.once('playerDied', () => {
  console.log('Game over!');
});
```

---

## 📊 Performance Optimizations

- ✅ Object pooling for frequently created objects
- ✅ Frustum culling for off-screen entities
- ✅ Depth buffering for proper occlusion
- ✅ Limited particle counts
- ✅ Simplified post-processing effects
- ✅ Efficient raycasting algorithm

---

## 🧪 Testing Strategy

### Unit Tests
Test individual classes in isolation:
- Weapon firing mechanics
- AI state transitions
- Map generation algorithms
- Vector mathematics

### Integration Tests
Test system interactions:
- Event flow between systems
- Weapon-Enemy collision detection
- AI behavior with map obstacles

---

## 📝 Code Style

### Naming Conventions
- **Classes**: `PascalCase` (`EnemyFactory`, `AudioSystem`)
- **Methods**: `camelCase` (`createEnemy`, `playSound`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_HEALTH`, `FIRE_RATE`)
- **Private**: Prefix with `_` (`_health`, `_update`)

### JSDoc Documentation
```javascript
/**
 * Creates a new enemy at specified position
 * @param {string} type - Enemy type ('demon', 'zombie', 'ghost', 'brute')
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Enemy} Created enemy instance
 * @example
 * const demon = EnemyFactory.create('demon', 10, 10);
 */
```

---

## 🐛 Known Issues

- None currently reported

---

## 🔮 Future Enhancements

- [ ] Multiplayer support
- [ ] More weapon types (Grenade Launcher, Plasma Gun)
- [ ] Power-ups and health packs
- [ ] Multiple levels
- [ ] Boss battles
- [ ] Sound effects library
- [ ] Mobile touch controls
- [ ] Save/Load game state

---

## 📜 License

MIT License - see LICENSE file for details

---

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📚 Resources

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Design Patterns](https://refactoring.guru/design-patterns)
- [Raycasting Tutorial](https://lodev.org/cgtutor/raycasting.html)
- [Cellular Automata](https://en.wikipedia.org/wiki/Cellular_automaton)

---

## 🙏 Acknowledgments

- Inspired by classic DOOM (id Software)
- Raycasting techniques from Wolfenstein 3D
- Community feedback and suggestions
