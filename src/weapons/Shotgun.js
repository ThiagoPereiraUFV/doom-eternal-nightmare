/**
 * Shotgun - Concrete Weapon Implementation
 * High damage, low fire rate, fires multiple pellets
 */

import { Weapon } from "./Weapon.js";
import { GameConfig } from "../config/GameConfig.js";

export class Shotgun extends Weapon {
  constructor() {
    super("SHOTGUN", GameConfig.WEAPONS.SHOTGUN);
  }

  /**
   * Fire the shotgun
   * @param {Object} context - Shooting context
   * @returns {Object} Fire result
   */
  fire(context) {
    if (!this.canFire()) {
      return { success: false, reason: "cannot_fire" };
    }

    const { player, enemies, map, audioSystem, eventManager } = context;

    // Consume ammo
    this.consumeAmmo();

    // Play shoot sound
    audioSystem?.playSound("shoot");

    const hits = [];

    // Fire multiple pellets
    for (let i = 0; i < this.pellets; i++) {
      const spreadAngle = (Math.random() - 0.5) * this.spread;
      const shotAngle = player.angle + spreadAngle;

      const hit = this._performRaycast(
        player.x,
        player.y,
        shotAngle,
        map,
        enemies,
      );
      if (hit.type !== "miss") {
        hits.push(hit);
      }
    }

    // Emit fire event
    eventManager?.emit("weaponFired", {
      weapon: this,
      hits,
    });

    return {
      success: true,
      hits,
      recoil: this.recoil,
      screenShake: this.screenShake,
    };
  }

  /**
   * Perform raycast for single pellet
   * @private
   */
  _performRaycast(x, y, angle, map, enemies) {
    const maxDistance = 30;
    const step = 0.1;
    let distance = 0;

    while (distance < maxDistance) {
      distance += step;
      const testX = x + Math.cos(angle) * distance;
      const testY = y + Math.sin(angle) * distance;

      const mapX = Math.floor(testX);
      const mapY = Math.floor(testY);

      // Check wall collision
      if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length) {
        return { type: "wall", distance };
      }
      if (map[mapY][mapX] > 0) {
        return { type: "wall", distance, wallType: map[mapY][mapX] };
      }

      // Check enemy collision
      for (const enemy of enemies) {
        if (!enemy.isDead) {
          const enemyDist = Math.sqrt(
            Math.pow(enemy.x - testX, 2) + Math.pow(enemy.y - testY, 2),
          );
          if (enemyDist < 0.3) {
            const damage = this._calculateDamage(distance);
            return {
              type: "enemy",
              enemy,
              distance,
              damage,
              x: testX,
              y: testY,
            };
          }
        }
      }
    }

    return { type: "miss", distance: maxDistance };
  }

  /**
   * Calculate damage with heavy falloff
   * @private
   */
  _calculateDamage(distance) {
    const falloffRange = 10; // Shotgun has shorter effective range
    const minDamage = this.damage * 0.2;

    if (distance < falloffRange) {
      return this.damage;
    }

    const falloff = Math.max(0, 1 - (distance - falloffRange) / falloffRange);
    return minDamage + (this.damage - minDamage) * falloff;
  }
}

export default Shotgun;
