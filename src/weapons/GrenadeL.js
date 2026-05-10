/**
 * GrenadeL - Grenade Launcher
 * Explosive area damage, low fire rate, affects multiple enemies in blast radius
 */

import { Weapon } from "./Weapon.js";
import { GameConfig } from "../config/GameConfig.js";

export class GrenadeL extends Weapon {
  constructor() {
    super("GRENADE_LAUNCHER", GameConfig.WEAPONS.GRENADE_LAUNCHER);
    this.splashRadius = GameConfig.WEAPONS.GRENADE_LAUNCHER.splashRadius ?? 2.5;
  }

  fire(context) {
    if (!this.canFire()) {
      return { success: false, reason: "cannot_fire" };
    }

    const { player, enemies, map, audioSystem, eventManager } = context;
    this.consumeAmmo();
    // shoot sound played by Player.shoot(); play explosion after landing

    const shotAngle = player.angle + (Math.random() - 0.5) * this.spread;
    // Find where the grenade lands (wall or max range)
    const landing = this._findLandingPoint(player.x, player.y, shotAngle, map);

    // Apply splash damage to all enemies in radius
    const hits = [];
    for (const enemy of enemies) {
      if (!enemy.isDead) {
        const dx = enemy.x - landing.x;
        const dy = enemy.y - landing.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.splashRadius) {
          const falloff = 1 - dist / this.splashRadius;
          const damage = Math.round(this.damage * falloff);
          hits.push({ type: "enemy", enemy, distance: landing.distance, damage, x: landing.x, y: landing.y });
        }
      }
    }

    audioSystem?.playSound("explosion");
    eventManager?.emit("weaponFired", { weapon: this, angle: shotAngle, hits, explosion: landing });
    eventManager?.emit("explosion", { x: landing.x, y: landing.y, radius: this.splashRadius });

    return { success: true, hits, hit: hits[0] ?? { type: "explosion", ...landing }, recoil: this.recoil, screenShake: this.screenShake };
  }

  _findLandingPoint(x, y, angle, map) {
    const maxDistance = this.maxDistance;
    const step = this.raycastStep;
    let distance = 0;
    let iterations = 0;

    if (!map || !map.length || !map[0]) return { x: x + Math.cos(angle) * maxDistance, y: y + Math.sin(angle) * maxDistance, distance: maxDistance };

    while (distance < maxDistance && iterations < 300) {
      iterations++;
      distance += step;
      const testX = x + Math.cos(angle) * distance;
      const testY = y + Math.sin(angle) * distance;
      const mapX = Math.floor(testX);
      const mapY = Math.floor(testY);

      if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length)
        return { x: testX, y: testY, distance };
      if (map[mapY][mapX] > 0)
        return { x: testX - Math.cos(angle) * step, y: testY - Math.sin(angle) * step, distance };
    }
    return { x: x + Math.cos(angle) * maxDistance, y: y + Math.sin(angle) * maxDistance, distance: maxDistance };
  }
}

export default GrenadeL;
