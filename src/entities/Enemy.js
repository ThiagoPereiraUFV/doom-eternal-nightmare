/**
 * Enemy Entity
 * Handles enemy state and AI behavior
 * Following SRP - only enemy logic
 */

import { GameConfig } from "../config/GameConfig.js";
import { Entity } from "./Entity.js";

export class Enemy extends Entity {
  static _nextId = 0;

  constructor(type, x, y, config) {
    super(x, y);
    this.id = ++Enemy._nextId;
    this.type = type;
    this.spawnX = x;
    this.spawnY = y;

    // Stats from config
    this.health = config.health;
    this.maxHealth = config.health;
    this.speed = config.speed;
    this.color = config.color;
    this.targetHeight = config.targetHeight ?? 1;
    this.targetCenterHeight =
      config.targetCenterHeight ?? this.targetHeight / 2;

    // AI state
    this.currentState = null;
    this.stateObject = null;
    this.lastAttackTime = 0;
    this.stuckCounter = 0;
    this.patrolTarget = null;
    this.searchTarget = null;
    this.lastKnownPlayerPosition = null;
    this.lastSawPlayerTime = 0;

    // Visual state
    this.isDead = false;
    this.deathTime = 0;

    // 3D mesh — owned by this entity; set by spawnMesh()
    this.mesh = null;
    this.hitFlashTimer = 0;
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
   * @param {FriendlyBot[]} bots - Living allied bots
   */
  update(player, map, deltaTime, bots = []) {
    if (this.isDead) {
      return;
    }

    if (this.stateObject && typeof this.stateObject.execute === "function") {
      this.stateObject.execute(this, player, map, deltaTime, bots);
    }
  }

  /**
   * Take damage
   * @param {number} amount - Damage amount
   * @param {EventManager} eventManager - Event manager for notifications
   * @param {Object} [source] - Optional source position {x, y}
   */
  takeDamage(amount, eventManager, source) {
    if (this.isDead) {
      return;
    }

    if (source && source.x !== null && source.y !== null) {
      this.lastKnownPlayerPosition = { x: source.x, y: source.y };
      this.lastSawPlayerTime = Date.now();
      this.searchTarget = { x: source.x, y: source.y };
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

  // ─── 3D Mesh Lifecycle ─────────────────────────────────────────────────────

  /**
   * Sync position, billboard rotation, animation and hit flash each frame.
   * @param {number} cameraX
   * @param {number} cameraZ
   * @param {number} t - time in seconds
   */
  updateMesh(cameraX, cameraZ, t) {
    if (!this.mesh) {
      return;
    }
    this.mesh.position.set(this.x, 0, this.y);
    this.mesh.lookAt(cameraX, 0, cameraZ);
    if (this.mesh.userData.animate) {
      this.mesh.userData.animate(t);
    }
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= 0.016;
      const intensity = Math.min(1, this.hitFlashTimer * 5);
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissive.setRGB(intensity * 0.8, 0, 0);
        }
      });
    } else if (this.hitFlashTimer < 0) {
      this.hitFlashTimer = 0;
      this.mesh.traverse((child) => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissive.setRGB(0, 0, 0);
        }
      });
    }
  }

  /** Start a brief red hit-flash on the mesh. */
  triggerHitFlash() {
    this.hitFlashTimer = 0.25;
  }
}

export default Enemy;
