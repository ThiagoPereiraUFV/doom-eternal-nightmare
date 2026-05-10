/**
 * Pistol - Concrete Weapon Implementation
 * Balanced weapon with moderate damage and fire rate
 */

import { Weapon } from "./Weapon.js";
import { GameConfig } from "../config/GameConfig.js";

export class Pistol extends Weapon {
  constructor() {
    super("PISTOL", GameConfig.WEAPONS.PISTOL);
  }

  /**
   * Fire the pistol
   * @param {Object} context - Shooting context {player, enemies, map, audioSystem, eventManager}
   * @returns {Object} Fire result
   */
  fire(context) {
    if (!this.canFire()) {
      return { success: false, reason: "cannot_fire" };
    }

    const { player, enemies, map, eventManager } = context;

    // Consume ammo
    this.consumeAmmo();

    // Calculate shot direction with spread
    const spreadAngle = (Math.random() - 0.5) * this.spread;
    const shotAngle = player.angle + spreadAngle;

    // Perform raycast to find hit
    const hit = this._raycast(
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
      hit,
    });

    return {
      success: true,
      hit,
      recoil: this.recoil,
      screenShake: this.screenShake,
    };
  }
}

export default Pistol;
