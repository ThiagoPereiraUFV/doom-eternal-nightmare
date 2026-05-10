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

    const { player, enemies, map, eventManager } = context;
    this.consumeAmmo();

    const shotAngle = player.angle + (Math.random() - 0.5) * this.spread;
    // Sniper penetrates multiple enemies
    const allHits = this._penetratingRaycast(player.x, player.y, shotAngle, map, enemies);

    eventManager?.emit("weaponFired", { weapon: this, angle: shotAngle, hits: allHits });
    eventManager?.emit("shellEjected", { x: player.x, y: player.y, angle: player.angle, type: "rifle" });

    return { success: true, hits: allHits, hit: allHits[0] ?? { type: "miss" }, recoil: this.recoil, screenShake: this.screenShake };
  }
}

export default SniperRifle;
