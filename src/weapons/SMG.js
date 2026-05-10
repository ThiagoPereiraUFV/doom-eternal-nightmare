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

    const { player, enemies, map, eventManager } = context;
    this.consumeAmmo();

    const spreadAngle = (Math.random() - 0.5) * this.spread;
    const shotAngle = player.angle + spreadAngle;

    const hit = this._raycast(player.x, player.y, shotAngle, map, enemies);

    eventManager?.emit("weaponFired", { weapon: this, angle: shotAngle, hit });
    eventManager?.emit("shellEjected", { x: player.x, y: player.y, angle: player.angle, type: "pistol" });

    return { success: true, hit, recoil: this.recoil, screenShake: this.screenShake };
  }
}

export default SMG;
