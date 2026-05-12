/**
 * Enemy Factory - Factory Pattern
 * Creates enemy instances with proper AI states
 * Following OCP - new enemy types can be registered
 */

import { Enemy } from "./Enemy.js";
import { Demon } from "./Demon.js";
import { Zombie } from "./Zombie.js";
import { Ghost } from "./Ghost.js";
import { Brute } from "./Brute.js";
import { GameConfig } from "../config/GameConfig.js";
import { ChaseState } from "../ai/ChaseState.js";
import { PatrolState } from "../ai/PatrolState.js";
import { SearchState } from "../ai/SearchState.js";

export class EnemyFactory {
  static _enemyTypes = new Map();
  static _aiStates = new Map();

  /** Maps type string → entity class (each class groups logic + mesh). */
  static _entityClasses = new Map([
    ["demon", Demon],
    ["zombie", Zombie],
    ["ghost", Ghost],
    ["brute", Brute],
  ]);

  /**
   * Initialize default enemy types and AI states
   */
  static init() {
    // Register enemy types
    Object.entries(GameConfig.ENEMY.TYPES).forEach(([_key, config]) => {
      this.registerType(config.type, config);
    });

    // Register AI states
    this.registerAIState(GameConfig.ENEMY.AI_STATES.CHASE, new ChaseState());
    this.registerAIState(GameConfig.ENEMY.AI_STATES.PATROL, new PatrolState());
    this.registerAIState(GameConfig.ENEMY.AI_STATES.SEARCH, new SearchState());
  }

  /**
   * Register a new enemy type
   * @param {string} type - Enemy type identifier
   * @param {Object} config - Enemy configuration
   */
  static registerType(type, config) {
    this._enemyTypes.set(type.toLowerCase(), config);
  }

  /**
   * Register an AI state
   * @param {string} name - State name
   * @param {AIBehavior} stateObject - State behavior object
   */
  static registerAIState(name, stateObject) {
    this._aiStates.set(name.toLowerCase(), stateObject);
  }

  /**
   * Create an enemy instance
   * @param {string} type - Enemy type ('demon', 'zombie', 'ghost', 'brute')
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} initialState - Initial AI state (default: 'patrol')
   * @returns {Enemy} Enemy instance
   * @example
   * const demon = EnemyFactory.create('demon', 10, 10);
   * const zombie = EnemyFactory.create('zombie', 15, 15, 'chase');
   */
  static create(type, x, y, initialState = GameConfig.ENEMY.AI_STATES.PATROL) {
    const config = this._enemyTypes.get(type.toLowerCase());

    if (!config) {
      throw new Error(`Unknown enemy type: ${type}`);
    }

    const EntityClass = this._entityClasses.get(type.toLowerCase()) ?? Enemy;
    const enemy =
      EntityClass === Enemy
        ? new Enemy(type, x, y, config)
        : new EntityClass(x, y, config);

    // Set initial AI state
    const stateObject = this._aiStates.get(initialState.toLowerCase());
    if (stateObject) {
      enemy.setState(stateObject);
    } else {
      enemy.setState(this._aiStates.get(GameConfig.ENEMY.AI_STATES.PATROL));
    }

    // Override setState to use factory states
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
   * Get all registered enemy types
   * @returns {Array<string>} Array of enemy type names
   */
  static getTypes() {
    return Array.from(this._enemyTypes.keys());
  }

  /**
   * Check if enemy type is registered
   * @param {string} type - Enemy type to check
   * @returns {boolean} True if type is registered
   */
  static hasType(type) {
    return this._enemyTypes.has(type.toLowerCase());
  }

  /**
   * Get enemy type configuration
   * @param {string} type - Enemy type
   * @returns {Object|null} Enemy configuration
   */
  static getConfig(type) {
    return this._enemyTypes.get(type.toLowerCase()) || null;
  }
}

// Initialize default enemies and states
EnemyFactory.init();

export default EnemyFactory;
