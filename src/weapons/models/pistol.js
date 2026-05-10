/**
 * Pistol - Concrete Weapon Implementation
 * Balanced weapon with moderate damage and fire rate
 */

import { Weapon } from "../Weapon.js";

const PISTOL_CONFIG = {
  maxDistance: 50,
  damage: 20,
  magazineSize: 12,
  reserveAmmo: 48,
  fireRate: 250,
  spread: 0.05,
  reloadTime: 1500,
  fireType: "semi",
  penetration: 1,
  bulletSpeed: 50,
  muzzleFlashIntensity: 0.8,
  recoil: 25,
  recoilDecay: 0.78,
  screenShake: 5,
  shell: {
    size: { radius: 0.011, height: 0.04 },
    speed: 0.08,
    variance: 0.04,
    material: "spent",
    offsetDistance: 0.2,
  },
  audio: {
    shoot: [
      {
        action: "noiseBurst",
        freq: 55,
        q: 0.5,
        filterType: "lowpass",
        vol: 0.7,
        attack: 0,
        decay: 0.18,
        dur: 0.22,
      },
      {
        action: "noiseBurst",
        freq: 160,
        q: 1.2,
        filterType: "bandpass",
        vol: 0.5,
        attack: 0,
        decay: 0.08,
        dur: 0.12,
      },
      {
        action: "noiseBurst",
        freq: 2800,
        q: 0.6,
        filterType: "highpass",
        vol: 0.35,
        attack: 0,
        decay: 0.025,
        dur: 0.04,
      },
      {
        action: "noiseBurst",
        freq: 110,
        q: 3,
        filterType: "bandpass",
        vol: 0.38,
        attack: 0.01,
        decay: 0.35,
        dur: 0.45,
      },
      {
        action: "toneBurst",
        type: "sine",
        freq: 42,
        freqEnd: 22,
        vol: 0.3,
        decay: 0.18,
        dur: 0.22,
      },
    ],
  },
  render: {
    basePosition: [0.14, -0.14, -0.33],
    baseRotationY: -0.08,
    adsOffset: [-0.12, 0.06, -0.08],
    adsRotation: -0.02,
    scale: 3.0,
    muzzleFlash: { intensity: 5.0 },
  },
};

export class Pistol extends Weapon {
  constructor() {
    super("PISTOL", PISTOL_CONFIG);
  }

  /**
   * Build the pistol mesh.
   * @param {Object} builder
   */
  buildModel({ addBox, addCyl, mat }) {
    addBox(0.072, 0.052, 0.31, mat.metal, 0, 0.006, -0.018);
    addBox(0.076, 0.056, 0.004, mat.dark, 0, 0.006, 0.085);
    addBox(0.076, 0.056, 0.004, mat.dark, 0, 0.006, 0.065);
    addBox(0.076, 0.056, 0.004, mat.dark, 0, 0.006, 0.045);
    addCyl(0.019, 0.019, 0.095, mat.steel, 0, 0.003, -0.218, Math.PI / 2);
    addCyl(0.026, 0.026, 0.009, mat.bright, 0, 0.003, -0.176, Math.PI / 2);
    addBox(0.062, 0.036, 0.26, mat.dark, 0, -0.034, -0.005);
    addBox(0.06, 0.024, 0.044, mat.dark, 0, -0.034, -0.14);
    addBox(0.058, 0.007, 0.082, mat.dark, 0, -0.057, 0.018);
    addBox(0.058, 0.024, 0.007, mat.dark, 0, -0.047, -0.022);
    addBox(0.008, 0.022, 0.013, mat.bright, 0, -0.048, 0.013);
    addBox(0.058, 0.116, 0.09, mat.rubber, 0, -0.111, 0.091, 0.2);
    addBox(0.052, 0.008, 0.072, mat.metal, 0, -0.172, 0.086, 0.2);
    addBox(0.006, 0.013, 0.005, mat.steel, 0, 0.038, -0.175);
    addBox(0.024, 0.009, 0.005, mat.steel, 0, 0.036, 0.085);
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
    const hit = this._raycast(player.x, player.y, shotAngle, map, enemies);

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
