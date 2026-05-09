/**
 * SMG - Submachine Gun
 * High fire rate, moderate damage, large magazine
 */

import { Weapon } from "./Weapon.js";
import { GameConfig } from "../config/GameConfig.js";

export class SMG extends Weapon {
  constructor() {
    super("SMG", GameConfig.WEAPONS.SMG);
  }

  fire(context) {
    if (!this.canFire()) {
      return { success: false, reason: "cannot_fire" };
    }

    const { player, enemies, map, audioSystem, eventManager } = context;
    this.consumeAmmo();
    audioSystem?.playSound("shoot", { weaponName: "smg" });

    const spreadAngle = (Math.random() - 0.5) * this.spread;
    const shotAngle = player.angle + spreadAngle;

    const hit = this._performRaycast(player.x, player.y, shotAngle, map, enemies);

    eventManager?.emit("weaponFired", { weapon: this, angle: shotAngle, hit });
    eventManager?.emit("shellEjected", { x: player.x, y: player.y, angle: player.angle, type: "pistol" });

    return { success: true, hit, recoil: this.recoil, screenShake: this.screenShake };
  }

  _performRaycast(x, y, angle, map, enemies) {
    const maxDistance = 45;
    const step = 0.08;
    let distance = 0;
    let iterations = 0;

    if (!map || !map.length || !map[0]) return { type: "miss", distance: maxDistance };

    while (distance < maxDistance && iterations < 800) {
      iterations++;
      distance += step;
      const testX = x + Math.cos(angle) * distance;
      const testY = y + Math.sin(angle) * distance;
      const mapX = Math.floor(testX);
      const mapY = Math.floor(testY);

      if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length)
        return { type: "wall", distance };
      if (map[mapY][mapX] > 0)
        return { type: "wall", distance, wallType: map[mapY][mapX] };

      for (const enemy of enemies) {
        if (!enemy.isDead) {
          const dx = enemy.x - testX, dy = enemy.y - testY;
          if (dx * dx + dy * dy < 0.09) {
            return { type: "enemy", enemy, distance, damage: this._calcDamage(distance), x: testX, y: testY };
          }
        }
      }
    }
    return { type: "miss", distance: maxDistance };
  }

  _calcDamage(distance) {
    const falloff = GameConfig.COMBAT.DAMAGE_FALLOFF_RANGE;
    const min = this.damage * GameConfig.COMBAT.DAMAGE_FALLOFF_MIN;
    if (distance < falloff) return this.damage;
    const f = Math.max(0, 1 - (distance - falloff) / falloff);
    return min + (this.damage - min) * f;
  }
}

export default SMG;
