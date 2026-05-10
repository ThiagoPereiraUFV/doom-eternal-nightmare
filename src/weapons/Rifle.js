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

    const { player, enemies, map, eventManager } = context;

    // Consume ammo
    this.consumeAmmo();

    // Calculate shot direction with minimal spread
    const spreadAngle = (Math.random() - 0.5) * this.spread;
    const shotAngle = player.angle + spreadAngle;

    // Perform raycast with penetration
    const hits = this._penetratingRaycast(
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
}

export default Rifle;
