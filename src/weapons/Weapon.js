/**
 * Base Weapon Class
 * All weapons extend this base class (OCP principle)
 * Following LSP - all weapons are substitutable
 */

import { GameConfig } from "../config/GameConfig.js";

export class Weapon {
  constructor(name, stats) {
    if (new.target === Weapon) {
      throw new Error(
        "Weapon is an abstract class and cannot be instantiated directly",
      );
    }

    this.name = name;
    this.damage = stats.damage;
    this.magazineSize = stats.magazineSize;
    this.reserveAmmo = stats.reserveAmmo;
    this.currentMagazine = stats.magazineSize;
    this.fireRate = stats.fireRate;
    this.spread = stats.spread;
    this.reloadTime = stats.reloadTime;
    this.penetration = stats.penetration || 1;
    this.bulletSpeed = stats.bulletSpeed || 50;
    this.muzzleFlashIntensity = stats.muzzleFlashIntensity || 1.0;
    this.recoil = stats.recoil || 20;
    this.screenShake = stats.screenShake || 5;
    this.pellets = stats.pellets || 1;
    this.render = stats.render || {};
    this.audio = stats.audio || {};
    this.shell = stats.shell ?? null;

    // Raycast & falloff config — sourced from per-weapon defaults and GameConfig falloff constants
    this.maxDistance = stats.maxDistance ?? 50;
    this.raycastStep = stats.raycastStep ?? 0.1;
    this.falloffRange = stats.falloffRange ?? GameConfig.COMBAT.DAMAGE_FALLOFF_RANGE;
    this.falloffMin = stats.falloffMin ?? GameConfig.COMBAT.DAMAGE_FALLOFF_MIN;
    this.falloffScale = stats.falloffScale ?? 1;
    this.wallPenetrationCost = stats.wallPenetrationCost ?? Infinity;

    this.lastFireTime = 0;
    this.isReloading = false;
    this.reloadStartTime = 0;
  }

  /**
   * Build the first-person weapon mesh.
   * @param {Object} builder - { addBox, addCyl, mat, THREE }
   */
  buildModel(builder) {
    const { addBox, mat } = builder;
    addBox(0.08, 0.05, 0.30, mat.metal, 0, 0, -0.08);
  }

  /**
   * Fire the weapon (must be implemented by subclasses)
   * @param {Object} target - Target to shoot at
   * @abstract
   */
  fire(_target) {
    throw new Error("fire() must be implemented by subclass");
  }

  /**
   * Ray march — returns first wall or enemy hit
   * @protected
   */
  _raycast(x, y, angle, map, enemies) {
    const { maxDistance, raycastStep: step } = this;
    const maxIterations = Math.ceil(maxDistance / step) + 200;
    const hitRadiusSq = GameConfig.COMBAT.ENEMY_HIT_RADIUS_SQ;

    if (!map || !map.length || !map[0]) {
      return { type: "miss", distance: maxDistance };
    }

    let distance = 0;
    let iterations = 0;
    while (distance < maxDistance && iterations < maxIterations) {
      iterations++;
      distance += step;
      const testX = x + Math.cos(angle) * distance;
      const testY = y + Math.sin(angle) * distance;
      const mapX = Math.floor(testX);
      const mapY = Math.floor(testY);

      if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length) {
        return { type: "wall", distance };
      }
      if (map[mapY][mapX] > 0) {
        return { type: "wall", distance, wallType: map[mapY][mapX] };
      }

      for (const enemy of enemies) {
        if (!enemy.isDead) {
          const dx = enemy.x - testX;
          const dy = enemy.y - testY;
          if (dx * dx + dy * dy < hitRadiusSq) {
            return { type: "enemy", enemy, distance, damage: this._calcFalloffDamage(distance), x: testX, y: testY };
          }
        }
      }
    }
    return { type: "miss", distance: maxDistance };
  }

  /**
   * Penetrating ray march — returns all hits, supports wall pass-through
   * @protected
   */
  _penetratingRaycast(x, y, angle, map, enemies) {
    const { maxDistance, raycastStep: step, penetration, wallPenetrationCost } = this;
    const maxIterations = Math.ceil(maxDistance / step) + 200;
    const hitRadiusSq = GameConfig.COMBAT.ENEMY_HIT_RADIUS_SQ;

    if (!map || !map.length || !map[0]) {
      return [{ type: "miss", distance: maxDistance }];
    }

    const hits = [];
    const hitEnemies = new Set();
    let penetrationLeft = penetration;
    let distance = 0;
    let iterations = 0;

    while (distance < maxDistance && iterations < maxIterations && penetrationLeft > 0) {
      iterations++;
      distance += step;
      const testX = x + Math.cos(angle) * distance;
      const testY = y + Math.sin(angle) * distance;
      const mapX = Math.floor(testX);
      const mapY = Math.floor(testY);

      if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length) {
        hits.push({ type: "wall", distance });
        break;
      }
      if (map[mapY][mapX] > 0) {
        hits.push({ type: "wall", distance, wallType: map[mapY][mapX] });
        if (!isFinite(wallPenetrationCost)) { break; }
        penetrationLeft -= wallPenetrationCost;
        if (penetrationLeft <= 0) { break; }
        continue;
      }

      for (const enemy of enemies) {
        if (!enemy.isDead && !hitEnemies.has(enemy.id)) {
          const dx = enemy.x - testX;
          const dy = enemy.y - testY;
          if (dx * dx + dy * dy < hitRadiusSq) {
            hitEnemies.add(enemy.id);
            hits.push({ type: "enemy", enemy, distance, damage: this._calcFalloffDamage(distance), x: testX, y: testY });
            penetrationLeft--;
            break;
          }
        }
      }
    }

    return hits.length ? hits : [{ type: "miss", distance: maxDistance }];
  }

  /**
   * Distance-based damage falloff using per-weapon config
   * @protected
   */
  _calcFalloffDamage(distance) {
    const { falloffRange, falloffMin, falloffScale, damage } = this;
    if (distance < falloffRange) { return damage; }
    const min = damage * falloffMin;
    const falloff = Math.max(0, 1 - (distance - falloffRange) / (falloffRange * falloffScale));
    return min + (damage - min) * falloff;
  }

  /**
   * Check if weapon can fire
   * @returns {boolean} True if weapon can fire
   */
  canFire() {
    const currentTime = Date.now();
    return (
      !this.isReloading &&
      this.currentMagazine > 0 &&
      currentTime - this.lastFireTime >= this.fireRate
    );
  }

  /**
   * Start reload
   * @returns {boolean} True if reload started
   */
  startReload() {
    if (
      this.isReloading ||
      this.currentMagazine === this.magazineSize ||
      this.reserveAmmo === 0
    ) {
      return false;
    }

    this.isReloading = true;
    this.reloadStartTime = Date.now();
    return true;
  }

  /**
   * Update reload status
   * @returns {boolean} True if reload completed
   */
  updateReload() {
    if (!this.isReloading) { return false; }

    const currentTime = Date.now();
    if (currentTime - this.reloadStartTime >= this.reloadTime) {
      this.completeReload();
      return true;
    }
    return false;
  }

  /**
   * Complete reload
   */
  completeReload() {
    const ammoNeeded = this.magazineSize - this.currentMagazine;
    const ammoToReload = Math.min(ammoNeeded, this.reserveAmmo);

    this.currentMagazine += ammoToReload;
    this.reserveAmmo -= ammoToReload;
    this.isReloading = false;
  }

  /**
   * Consume ammo
   * @param {number} amount - Amount of ammo to consume
   */
  consumeAmmo(amount = 1) {
    this.currentMagazine = Math.max(0, this.currentMagazine - amount);
    this.lastFireTime = Date.now();
  }

  /**
   * Add reserve ammo
   * @param {number} amount - Amount to add
   */
  addAmmo(amount) {
    this.reserveAmmo += amount;
  }

  /**
   * Get weapon status
   * @returns {Object} Weapon status
   */
  getStatus() {
    return {
      name: this.name,
      currentMagazine: this.currentMagazine,
      reserveAmmo: this.reserveAmmo,
      isReloading: this.isReloading,
      reloadProgress: this.isReloading
        ? Math.min(1, (Date.now() - this.reloadStartTime) / this.reloadTime)
        : 0,
    };
  }
}

export default Weapon;
