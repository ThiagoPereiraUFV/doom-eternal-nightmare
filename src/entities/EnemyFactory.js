/**
 * Enemy Factory - Factory Pattern
 * Creates enemy instances with proper AI states.
 * Following OCP — new enemy types are registered via EntityRegistry;
 * no changes to this file are needed when adding a new enemy model.
 *
 * To add a new enemy:
 *   1. Create src/entities/models/<type>.js
 *   2. Import it in src/entities/models/index.js
 */

import { Enemy } from "./Enemy.js";
import {
  EntityRegistry,
  ENTITY_CATEGORIES,
} from "../registry/EntityRegistry.js";
import { GameConfig } from "../config/GameConfig.js";
import { ChaseState } from "../ai/ChaseState.js";
import { PatrolState } from "../ai/PatrolState.js";
import { SearchState } from "../ai/SearchState.js";

export class EnemyFactory {
  static _aiStates = new Map();
  static _initialized = false;

  /**
   * Async init — loads all enemy model descriptors (triggering self-registration
   * with EntityRegistry) and sets up shared AI state instances.
   * Call once with `await EnemyFactory.init()` before creating enemies.
   */
  static async init() {
    if (this._initialized) {
      return;
    }
    this._initialized = true;

    // Load all enemy model descriptors — each file calls EntityRegistry.register()
    await import("./models/index.js");

    // Register shared AI states (one instance per state, reused across all enemies)
    this.registerAIState(GameConfig.ENEMY.AI_STATES.CHASE, new ChaseState());
    this.registerAIState(GameConfig.ENEMY.AI_STATES.PATROL, new PatrolState());
    this.registerAIState(GameConfig.ENEMY.AI_STATES.SEARCH, new SearchState());
  }

  /**
   * Register an AI state.
   * @param {string}      name        – state name key
   * @param {AIBehavior}  stateObject – shared, stateless state object
   */
  static registerAIState(name, stateObject) {
    this._aiStates.set(name.toLowerCase(), stateObject);
  }

  /**
   * Create an enemy instance.
   * @param {string} type         – enemy type (e.g. 'demon', 'zombie')
   * @param {number} x            – X coordinate
   * @param {number} y            – Y coordinate
   * @param {string} initialState – initial AI state (default: 'patrol')
   * @returns {Enemy}
   */
  static create(type, x, y, initialState = GameConfig.ENEMY.AI_STATES.PATROL) {
    const typeKey = type.toLowerCase();
    const config = EntityRegistry.getConfig(ENTITY_CATEGORIES.ENEMY, typeKey);

    if (!config) {
      throw new Error(
        `Unknown enemy type: "${type}". Did you add it to src/entities/models/index.js?`,
      );
    }

    const EntityClass =
      EntityRegistry.getClass(ENTITY_CATEGORIES.ENEMY, typeKey) ?? Enemy;

    const enemy =
      EntityClass === Enemy
        ? new Enemy(type, x, y, config)
        : new EntityClass(x, y, config);

    // Set initial AI state
    const stateObject =
      this._aiStates.get(initialState.toLowerCase()) ??
      this._aiStates.get(GameConfig.ENEMY.AI_STATES.PATROL);

    if (stateObject) {
      enemy.setState(stateObject);
    }

    // Override setState to resolve string names through the factory's state map
    const originalSetState = enemy.setState.bind(enemy);
    enemy.setState = (state) => {
      if (typeof state === "string") {
        const stateObj = this._aiStates.get(state.toLowerCase());
        if (stateObj) {
          originalSetState(stateObj);
        }
      } else {
        originalSetState(state);
      }
    };

    return enemy;
  }

  /**
   * Return all registered enemy type names.
   * @returns {string[]}
   */
  static getTypes() {
    return EntityRegistry.getTypes(ENTITY_CATEGORIES.ENEMY);
  }

  /**
   * Check whether an enemy type is registered.
   * @param {string} type
   * @returns {boolean}
   */
  static hasType(type) {
    return EntityRegistry.hasType(ENTITY_CATEGORIES.ENEMY, type);
  }

  /**
   * Return the config for a registered enemy type, or null.
   * @param {string} type
   * @returns {object|null}
   */
  static getConfig(type) {
    return EntityRegistry.getConfig(ENTITY_CATEGORIES.ENEMY, type);
  }
}

export default EnemyFactory;
