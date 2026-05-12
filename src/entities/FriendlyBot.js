/**
 * FriendlyBot Entity
 * Allied AI companion that assists the player.
 * Following SRP — only bot state and identity; behavior delegated to BotBehavior states.
 */

import { GameConfig } from "../config/GameConfig.js";

export class FriendlyBot {
  static _nextId = 0;

  constructor(x, y) {
    this.id = `bot_${++FriendlyBot._nextId}`;
    this.x = x;
    this.y = y;

    this.health = GameConfig.BOT.HEALTH;
    this.maxHealth = GameConfig.BOT.HEALTH;
    this.speed = GameConfig.BOT.SPEED;

    this.isDead = false;
    this.deathTime = 0;

    // Current high-level command
    this.command = GameConfig.BOT.COMMANDS.FOLLOW;

    // Active behavior state object
    this.stateObject = null;
    this.currentState = null;

    // Movement helpers shared by states
    this.stuckCounter = 0;
    this.searchWanderTarget = null;
    this.searchWanderTime = 0;

    // Combat state
    this.lastAttackTime = 0;
    this.currentTarget = null;

    // Current weapon type chosen by attack range: 'shotgun' | 'pistol' | 'sniper'
    this.weaponType = "pistol";

    // Injected by Game._updateBots — give states access without changing execute signature
    this.eventManager = null;
    this.audioSystem = null;

    // Facing angle (radians) — used by renderer
    this.angle = 0;
  }

  /**
   * Assign a new command and its associated behavior state.
   * @param {string} command - One of GameConfig.BOT.COMMANDS
   * @param {BotBehavior} stateObject - Behavior implementing execute()
   */
  setCommand(command, stateObject) {
    if (this.stateObject && typeof this.stateObject.exit === "function") {
      this.stateObject.exit(this);
    }
    this.command = command;
    this.stateObject = stateObject;
    this.currentState = command;
    if (stateObject && typeof stateObject.enter === "function") {
      stateObject.enter(this);
    }
  }

  /**
   * Tick the bot's AI behavior.
   * @param {Player} player
   * @param {Enemy[]} enemies
   * @param {number[][]} map
   * @param {number} deltaTime
   */
  update(player, enemies, map, deltaTime) {
    if (this.isDead) {
      return;
    }
    if (this.stateObject && typeof this.stateObject.execute === "function") {
      this.stateObject.execute(this, player, enemies, map, deltaTime);
    }
  }

  /**
   * Apply damage to this bot.
   * @param {number} amount
   */
  takeDamage(amount) {
    if (this.isDead) {
      return;
    }
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.deathTime = Date.now();
    }
  }

  distanceTo(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  angleTo(x, y) {
    return Math.atan2(y - this.y, x - this.x);
  }

  isAlive() {
    return !this.isDead;
  }
}

export default FriendlyBot;
