/**
 * Enemy Entity
 * Handles enemy state and AI behavior
 * Following SRP - only enemy logic
 */

import { GameConfig } from "../config/GameConfig.js";

export class Enemy {
  static _nextId = 0;

  constructor(type, x, y, config) {
    this.id = ++Enemy._nextId;
    this.type = type;
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;

    // Stats from config
    this.health = config.health;
    this.maxHealth = config.health;
    this.speed = config.speed;
    this.color = config.color;

    // AI state
    this.currentState = null;
    this.stateObject = null;
    this.lastAttackTime = 0;
    this.stuckCounter = 0;
    this.patrolTarget = null;
    this.searchTarget = null;

    // Visual state
    this.isDead = false;
    this.deathTime = 0;
  }

  /**
   * Set AI behavior state
   * @param {string|AIBehavior} state - State name or state object
   */
  setState(state) {
    if (this.stateObject && typeof this.stateObject.exit === "function") {
      this.stateObject.exit(this);
    }

    if (typeof state === "string") {
      this.currentState = state;
    } else {
      this.stateObject = state;
      this.currentState = state.name;

      if (typeof state.enter === "function") {
        state.enter(this);
      }
    }
  }

  /**
   * Update enemy AI
   * @param {Player} player - Player reference
   * @param {Array} map - Game map
   * @param {number} deltaTime - Time since last frame
   */
  update(player, map, deltaTime) {
    if (this.isDead) {
      return;
    }

    if (this.stateObject && typeof this.stateObject.execute === "function") {
      this.stateObject.execute(this, player, map, deltaTime);
    }
  }

  /**
   * Take damage
   * @param {number} amount - Damage amount
   * @param {EventManager} eventManager - Event manager for notifications
   */
  takeDamage(amount, eventManager) {
    if (this.isDead) {
      return;
    }

    this.health -= amount;

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.deathTime = Date.now();

      if (eventManager) {
        eventManager.emit("enemyKilled", this);
      }
    } else {
      // Switch to chase state when damaged
      if (this.currentState !== GameConfig.ENEMY.AI_STATES.CHASE) {
        this.setState(GameConfig.ENEMY.AI_STATES.CHASE);
      }

      if (eventManager) {
        eventManager.emit("enemyDamaged", { enemy: this, amount });
      }
    }
  }

  /**
   * Get distance to target
   * @param {number} x - Target X
   * @param {number} y - Target Y
   * @returns {number} Distance
   */
  distanceTo(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get angle to target
   * @param {number} x - Target X
   * @param {number} y - Target Y
   * @returns {number} Angle in radians
   */
  angleTo(x, y) {
    return Math.atan2(y - this.y, x - this.x);
  }

  /**
   * Check if enemy is alive
   * @returns {boolean} True if alive
   */
  isAlive() {
    return !this.isDead;
  }

  /**
   * Get enemy status
   * @returns {Object} Enemy status
   */
  getStatus() {
    return {
      type: this.type,
      health: this.health,
      maxHealth: this.maxHealth,
      state: this.currentState,
      isDead: this.isDead,
      position: { x: this.x, y: this.y },
    };
  }
}

export default Enemy;
