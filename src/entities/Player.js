/**
 * Player Entity
 * Handles player state, movement, and actions
 * Following SRP - only player logic
 */

import { GameConfig } from "../config/GameConfig.js";

export class Player {
  constructor(x, y, eventManager, audioSystem) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.eventManager = eventManager;
    this.audioSystem = audioSystem;

    // Health and stamina
    this.health = GameConfig.PLAYER.MAX_HEALTH;
    this.maxHealth = GameConfig.PLAYER.MAX_HEALTH;
    this.stamina = GameConfig.PLAYER.MAX_STAMINA;
    this.maxStamina = GameConfig.PLAYER.MAX_STAMINA;

    // Movement state
    this.isSprinting = false;
    this.isAiming = false;
    this.headBob = 0;

    // Weapon system
    this.currentWeapon = null;
    this.weapons = [];
    this.currentWeaponIndex = 0;

    // Effects
    this.recoilOffset = 0;
    this.screenShake = { x: 0, y: 0 };
    this.bloodLoss = 0;

    // Audio timing
    this.lastFootstepTime = 0;
  }

  /**
   * Add weapon to inventory
   * @param {Weapon} weapon - Weapon to add
   */
  addWeapon(weapon) {
    this.weapons.push(weapon);
    if (!this.currentWeapon) {
      this.currentWeapon = weapon;
      this.currentWeaponIndex = 0;
    }
  }

  /**
   * Switch to next weapon
   */
  nextWeapon() {
    if (this.weapons.length === 0) { return; }

    this.currentWeaponIndex =
      (this.currentWeaponIndex + 1) % this.weapons.length;
    this.currentWeapon = this.weapons[this.currentWeaponIndex];
    this.eventManager.emit("weaponChanged", this.currentWeapon);
  }

  /**
   * Switch to previous weapon
   */
  previousWeapon() {
    if (this.weapons.length === 0) { return; }

    this.currentWeaponIndex =
      (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
    this.currentWeapon = this.weapons[this.currentWeaponIndex];
    this.eventManager.emit("weaponChanged", this.currentWeapon);
  }

  /**
   * Switch to specific weapon
   * @param {number} index - Weapon index
   */
  switchWeapon(index) {
    if (index >= 0 && index < this.weapons.length) {
      this.currentWeaponIndex = index;
      this.currentWeapon = this.weapons[index];
      this.eventManager.emit("weaponChanged", this.currentWeapon);
    }
  }

  /**
   * Move player
   * @param {number} forward - Forward movement (-1 to 1)
   * @param {number} strafe - Strafe movement (-1 to 1)
   * @param {Array} map - Game map
   * @param {number} deltaTime - Time since last frame
   */
  move(forward, strafe, map, _deltaTime) {
    // Calculate movement speed
    let speed = GameConfig.PLAYER.MOVE_SPEED;

    if (this.isSprinting && this.stamina > 0 && forward > 0) {
      speed *= GameConfig.PLAYER.SPRINT_MULTIPLIER;
      this.stamina -= GameConfig.PLAYER.STAMINA_DRAIN;

      // Play sprint footsteps
      this._playFootstep(GameConfig.AUDIO.FOOTSTEP_INTERVAL_SPRINT);
    } else {
      // Recover stamina
      this.stamina = Math.min(
        this.maxStamina,
        this.stamina + GameConfig.PLAYER.STAMINA_RECOVERY,
      );

      // Play normal footsteps
      if (forward !== 0 || strafe !== 0) {
        this._playFootstep(GameConfig.AUDIO.FOOTSTEP_INTERVAL);
      }
    }

    // Calculate movement direction
    const moveX =
      Math.cos(this.angle) * forward +
      Math.cos(this.angle + Math.PI / 2) * strafe;
    const moveY =
      Math.sin(this.angle) * forward +
      Math.sin(this.angle + Math.PI / 2) * strafe;

    // Normalize diagonal movement
    const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
    const normalizedX = moveLength > 0 ? moveX / moveLength : 0;
    const normalizedY = moveLength > 0 ? moveY / moveLength : 0;

    // Apply movement
    const newX = this.x + normalizedX * speed;
    const newY = this.y + normalizedY * speed;

    // Check collision with bounds checking
    const mapY = Math.floor(newY);
    const mapX = Math.floor(newX);

    if (
      mapY >= 0 &&
      mapY < map.length &&
      mapX >= 0 &&
      mapX < map[0].length &&
      map[mapY][mapX] === 0
    ) {
      this.x = newX;
      this.y = newY;

      // Update head bob
      if (forward !== 0 || strafe !== 0) {
        this.headBob += 0.15;
      }
    }

    // Clamp stamina
    this.stamina = Math.max(0, Math.min(this.maxStamina, this.stamina));
  }

  /**
   * Rotate player
   * @param {number} angle - Rotation amount
   */
  rotate(angle) {
    this.angle += angle * GameConfig.PLAYER.ROTATION_SPEED;
  }

  /**
   * Shoot current weapon
   * @param {Object} context - Shooting context
   * @returns {Object} Shoot result
   */
  shoot(context) {
    if (!this.currentWeapon) {
      return { success: false, reason: "no_weapon" };
    }

    const result = this.currentWeapon.fire({ ...context, player: this });

    if (result.success) {
      // Play weapon-specific gunshot sound
      this.audioSystem.playSound("shoot", { weapon: this.currentWeapon });

      // Apply recoil
      this.recoilOffset += result.recoil || 0;

      // Apply screen shake
      this.screenShake.x = (Math.random() - 0.5) * (result.screenShake || 0);
      this.screenShake.y = (Math.random() - 0.5) * (result.screenShake || 0);

      // Process hits
      if (result.hit) {
        this._processHit(result.hit);
      } else if (result.hits) {
        result.hits.forEach((hit) => this._processHit(hit));
      }
    } else if (
      result.reason === "cannot_fire" &&
      this.currentWeapon.currentMagazine === 0
    ) {
      this.audioSystem.playSound("empty");
    }

    return result;
  }

  /**
   * Process weapon hit
   * @private
   */
  _processHit(hit) {
    if (hit.type === "enemy" && hit.enemy) {
      hit.enemy.takeDamage(hit.damage, this.eventManager);
      this.audioSystem.playSound("hit");

      // Emit hit event for visual effects
      this.eventManager.emit("enemyHit", {
        enemy: hit.enemy,
        damage: hit.damage,
        x: hit.x,
        y: hit.y,
      });
    }
  }

  /**
   * Reload current weapon
   */
  reload() {
    if (this.currentWeapon && this.currentWeapon.startReload()) {
      this.audioSystem.playSound("reload", { weapon: this.currentWeapon });
      this.eventManager.emit("reloadStarted", this.currentWeapon);
    }
  }

  /**
   * Take damage
   * @param {number} amount - Damage amount
   */
  takeDamage(amount) {
    this.health -= amount;
    this.bloodLoss = Math.min(1, this.bloodLoss + amount / 100);

    this.eventManager.emit("playerDamaged", {
      amount,
      currentHealth: this.health,
    });

    if (this.health <= 0) {
      this.health = 0;
      this.eventManager.emit("playerDied");
    }
  }

  /**
   * Heal player
   * @param {number} amount - Heal amount
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.bloodLoss = Math.max(0, this.bloodLoss - amount / 100);
    this.eventManager.emit("playerHealed", {
      amount,
      currentHealth: this.health,
    });
  }

  /**
   * Update player state
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Update weapon reload
    if (this.currentWeapon) {
      if (this.currentWeapon.updateReload()) {
        this.audioSystem.playSound("reload_end", { weapon: this.currentWeapon });
        this.eventManager.emit("reloadCompleted", this.currentWeapon);
      }
    }

    const frameFactor = Math.max(0, Math.min(10, deltaTime * 60));
    const recoilDecay = Math.pow(
      this.currentWeapon?.recoilDecay ?? GameConfig.WEAPON_3D.RECOIL_DECAY,
      frameFactor,
    );
    this.recoilOffset *= recoilDecay;
    if (Math.abs(this.recoilOffset) < 0.02) { this.recoilOffset = 0; }

    const shakeDecay = Math.pow(GameConfig.PLAYER.SCREEN_SHAKE_DECAY, frameFactor);
    this.screenShake.x *= shakeDecay;
    this.screenShake.y *= shakeDecay;
    if (Math.abs(this.screenShake.x) < 0.01) { this.screenShake.x = 0; }
    if (Math.abs(this.screenShake.y) < 0.01) { this.screenShake.y = 0; }
  }

  /**
   * Play footstep sound
   * @private
   */
  _playFootstep(interval) {
    const currentTime = Date.now();
    if (currentTime - this.lastFootstepTime > interval) {
      this.audioSystem.playSound("footstep");
      this.lastFootstepTime = currentTime;
    }
  }

  /**
   * Get player status
   * @returns {Object} Player status
   */
  getStatus() {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      weapon: this.currentWeapon ? this.currentWeapon.getStatus() : null,
      position: { x: this.x, y: this.y },
      angle: this.angle,
    };
  }

  /**
   * Check if player is alive
   * @returns {boolean} True if alive
   */
  isAlive() {
    return this.health > 0;
  }
}

export default Player;
