/**
 * Enemy Factory - Factory Pattern
 * Creates enemy instances with proper AI states
 * Following OCP - new enemy types can be registered
 */

import { Enemy } from "./Enemy.js";
import { GameConfig } from "../config/GameConfig.js";
import { ChaseState } from "../ai/ChaseState.js";
import { PatrolState } from "../ai/PatrolState.js";
import { SearchState } from "../ai/SearchState.js";

export class EnemyFactory {
  static _enemyTypes = new Map();
  static _aiStates = new Map();

  /**
   * Initialize default enemy types and AI states
   */
  static init() {
    // Register enemy types
    Object.entries(GameConfig.ENEMY.TYPES).forEach(([key, config]) => {
      this.registerType(config.type, config);
    });

    // Register AI states
    this.registerAIState("chase", new ChaseState());
    this.registerAIState("patrol", new PatrolState());
    this.registerAIState("search", new SearchState());
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
  static create(type, x, y, initialState = "patrol") {
    const config = this._enemyTypes.get(type.toLowerCase());

    if (!config) {
      throw new Error(`Unknown enemy type: ${type}`);
    }

    const enemy = new Enemy(type, x, y, config);

    // Set initial AI state
    const stateObject = this._aiStates.get(initialState.toLowerCase());
    if (stateObject) {
      enemy.setState(stateObject);
    } else {
      enemy.setState(this._aiStates.get("patrol"));
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
