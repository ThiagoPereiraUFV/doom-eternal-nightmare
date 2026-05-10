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

    const { player, enemies, map, eventManager } = context;

    // Consume ammo
    this.consumeAmmo();

    const hits = [];

    // Fire multiple pellets
    for (let i = 0; i < this.pellets; i++) {
      const spreadAngle = (Math.random() - 0.5) * this.spread;
      const shotAngle = player.angle + spreadAngle;

      const hit = this._raycast(
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
}

export default Shotgun;
