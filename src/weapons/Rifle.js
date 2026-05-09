/**
 * Rifle - Concrete Weapon Implementation
 * High damage, high fire rate, low spread
 */

import { Weapon } from "./Weapon.js";
import { GameConfig } from "../config/GameConfig.js";

export class Rifle extends Weapon {
  constructor() {
    super("RIFLE", GameConfig.WEAPONS.RIFLE);
    this.isAutoFire = true; // fires continuously while shoot is held
  }

  /**
   * Fire the rifle
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

    // Calculate shot direction with minimal spread
    const spreadAngle = (Math.random() - 0.5) * this.spread;
    const shotAngle = player.angle + spreadAngle;

    // Perform raycast with penetration
    const hits = this._performPenetratingRaycast(
      player.x,
      player.y,
      shotAngle,
      map,
      enemies,
    );

    // Emit fire event
    eventManager?.emit("weaponFired", {
      weapon: this,
      angle: shotAngle,
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
   * Perform raycast with penetration (can hit multiple enemies)
   * @private
   */
  _performPenetratingRaycast(x, y, angle, map, enemies) {
    const maxDistance = 60;
    const step = 0.1;
    let distance = 0;
    const hits = [];
    let penetrationRemaining = this.penetration;
    const hitEnemies = new Set();
    let iterations = 0;
    const maxIterations = 1000; // Safety limit

    // Validate map
    if (!map || !map.length || !map[0]) {
      return [];
    }

    while (
      distance < maxDistance &&
      penetrationRemaining > 0 &&
      iterations < maxIterations
    ) {
      iterations++;
      distance += step;
      const testX = x + Math.cos(angle) * distance;
      const testY = y + Math.sin(angle) * distance;

      const mapX = Math.floor(testX);
      const mapY = Math.floor(testY);

      // Check wall collision (stops penetration)
      if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length) {
        hits.push({ type: "wall", distance });
        break;
      }
      if (map[mapY][mapX] > 0) {
        hits.push({ type: "wall", distance, wallType: map[mapY][mapX] });
        break;
      }

      // Check enemy collision
      for (const enemy of enemies) {
        if (!enemy.isDead && !hitEnemies.has(enemy)) {
          const enemyDist = Math.sqrt(
            Math.pow(enemy.x - testX, 2) + Math.pow(enemy.y - testY, 2),
          );
          if (enemyDist < 0.3) {
            const damage = this._calculateDamage(distance);
            hits.push({
              type: "enemy",
              enemy,
              distance,
              damage,
              x: testX,
              y: testY,
            });
            hitEnemies.add(enemy);
            penetrationRemaining--;

            if (penetrationRemaining <= 0) {
              return hits;
            }
          }
        }
      }
    }

    if (hits.length === 0) {
      hits.push({ type: "miss", distance: maxDistance });
    }

    return hits;
  }

  /**
   * Calculate damage with minimal falloff
   * @private
   */
  _calculateDamage(distance) {
    const falloffRange = GameConfig.COMBAT.DAMAGE_FALLOFF_RANGE;
    const minDamage = this.damage * 0.5; // Rifle maintains damage better at range

    if (distance < falloffRange) {
      return this.damage;
    }

    const falloff = Math.max(
      0,
      1 - (distance - falloffRange) / (falloffRange * 2),
    );
    return minDamage + (this.damage - minDamage) * falloff;
  }
}

export default Rifle;
