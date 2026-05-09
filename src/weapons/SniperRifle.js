/**
 * SniperRifle - Long-range precision weapon
 * Very high damage, low fire rate, high penetration, scope zoom
 */

import { Weapon } from "./Weapon.js";
import { GameConfig } from "../config/GameConfig.js";

export class SniperRifle extends Weapon {
  constructor() {
    super("SNIPER", GameConfig.WEAPONS.SNIPER);
  }

  fire(context) {
    if (!this.canFire()) {
      return { success: false, reason: "cannot_fire" };
    }

    const { player, enemies, map, audioSystem, eventManager } = context;
    this.consumeAmmo();
    audioSystem?.playSound("shoot", { weaponName: "sniper" });

    const shotAngle = player.angle + (Math.random() - 0.5) * this.spread;
    // Sniper penetrates multiple enemies
    const allHits = this._performPenetratingRaycast(player.x, player.y, shotAngle, map, enemies);

    eventManager?.emit("weaponFired", { weapon: this, angle: shotAngle, hits: allHits });
    eventManager?.emit("shellEjected", { x: player.x, y: player.y, angle: player.angle, type: "rifle" });

    return { success: true, hits: allHits, hit: allHits[0] ?? { type: "miss" }, recoil: this.recoil, screenShake: this.screenShake };
  }

  _performPenetratingRaycast(x, y, angle, map, enemies) {
    const maxDistance = 80;
    const step = 0.05;
    let distance = 0;
    let iterations = 0;
    const hits = [];
    const hitEnemies = new Set();
    let penetrationLeft = this.penetration;

    if (!map || !map.length || !map[0]) return [{ type: "miss", distance: maxDistance }];

    while (distance < maxDistance && iterations < 1600 && penetrationLeft > 0) {
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
        break;
      }

      for (const enemy of enemies) {
        if (!enemy.isDead && !hitEnemies.has(enemy.id)) {
          const dx = enemy.x - testX, dy = enemy.y - testY;
          if (dx * dx + dy * dy < 0.09) {
            hitEnemies.add(enemy.id);
            hits.push({ type: "enemy", enemy, distance, damage: this.damage, x: testX, y: testY });
            penetrationLeft--;
            break;
          }
        }
      }
    }

    return hits.length ? hits : [{ type: "miss", distance: maxDistance }];
  }
}

export default SniperRifle;
