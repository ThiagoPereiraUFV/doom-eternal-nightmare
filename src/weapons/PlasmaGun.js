/**
 * PlasmaGun - Energy weapon
 * High penetration, sci-fi feel, moderate fire rate, no falloff damage
 */

import { Weapon } from "./Weapon.js";
import { GameConfig } from "../config/GameConfig.js";

export class PlasmaGun extends Weapon {
  constructor() {
    super("PLASMA", GameConfig.WEAPONS.PLASMA);
  }

  fire(context) {
    if (!this.canFire()) {
      return { success: false, reason: "cannot_fire" };
    }

    const { player, enemies, map, eventManager } = context;
    this.consumeAmmo();

    const shotAngle = player.angle + (Math.random() - 0.5) * this.spread;
    const allHits = this._penetratingRaycast(player.x, player.y, shotAngle, map, enemies);

    eventManager?.emit("weaponFired", { weapon: this, angle: shotAngle, hits: allHits });
    // No shell ejection — energy weapon

    return { success: true, hits: allHits, hit: allHits[0] ?? { type: "miss" }, recoil: this.recoil, screenShake: this.screenShake };
  }
}

export default PlasmaGun;
