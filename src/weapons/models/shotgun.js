/**
 * Shotgun - Concrete Weapon Implementation
 * High damage, low fire rate, fires multiple pellets
 */

import { Weapon } from "../Weapon.js";

const SHOTGUN_CONFIG = {
  maxDistance: 30,
  falloffRange: 10,
  falloffMin: 0.2,
  damage: 15,
  magazineSize: 8,
  reserveAmmo: 24,
  fireRate: 800,
  spread: 0.3,
  fireType: "semi",
  pellets: 8,
  reloadTime: 2500,
  penetration: 0.5,
  bulletSpeed: 40,
  muzzleFlashIntensity: 1.5,
  recoil: 40,
  recoilDecay: 0.72,
  screenShake: 8,
  shell: {
    size: { radius: 0.018, height: 0.07 },
    speed: 0.1,
    variance: 0.06,
    material: "spent",
    offsetDistance: 0.26,
  },
  audio: {
    shoot: [
      {
        action: "noiseBurst",
        freq: 55,
        q: 0.5,
        filterType: "lowpass",
        vol: 0.9,
        attack: 0,
        decay: 0.18,
        dur: 0.22,
      },
      {
        action: "noiseBurst",
        freq: 100,
        q: 0.8,
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
        freq: 90,
        q: 3,
        filterType: "bandpass",
        vol: 0.55,
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
    basePosition: [0.17, -0.18, -0.34],
    baseRotationY: -0.09,
    adsOffset: [-0.17, 0.05, 0],
    adsRotation: -0.03,
    scale: 3.0,
    muzzleFlash: { intensity: 5.0 },
  },
};

export class Shotgun extends Weapon {
  constructor() {
    super("SHOTGUN", SHOTGUN_CONFIG);
  }

  /**
   * Build the shotgun mesh.
   * @param {Object} builder
   */
  buildModel({ addBox, addCyl, mat }) {
    addCyl(0.034, 0.034, 0.64, mat.bright, 0, 0.04, -0.26, Math.PI / 2);
    addBox(0.012, 0.006, 0.64, mat.steel, 0, 0.074, -0.26);
    addBox(0.012, 0.012, 0.012, mat.steel, 0, 0.082, -0.58);
    addCyl(0.022, 0.022, 0.53, mat.metal, 0, 0.006, -0.205, Math.PI / 2);
    addCyl(0.03, 0.03, 0.13, mat.wood, 0, 0.006, -0.31, Math.PI / 2);
    addBox(0.064, 0.03, 0.12, mat.wood, 0, 0.005, -0.31);
    addBox(0.1, 0.096, 0.2, mat.dark, 0, 0.01, 0.03);
    addBox(0.006, 0.038, 0.09, mat.bright, 0.052, 0.022, 0.018);
    addBox(0.018, 0.01, 0.018, mat.metal, 0, 0.062, 0.01);
    addBox(0.076, 0.076, 0.31, mat.wood, 0, 0.006, 0.235, -0.07);
    addBox(0.078, 0.082, 0.014, mat.rubber, 0, 0.005, 0.394, -0.07);
    addBox(0.06, 0.008, 0.09, mat.metal, 0, -0.046, 0.05);
    addBox(0.01, 0.026, 0.012, mat.metal, 0, -0.04, 0.042);
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

      const hit = this._raycast(player.x, player.y, shotAngle, map, enemies);
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
