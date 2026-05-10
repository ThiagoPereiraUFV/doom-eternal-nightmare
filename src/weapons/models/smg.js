/**
 * SMG - Submachine Gun
 * High fire rate, moderate damage, large magazine
 */

import { Weapon } from "../Weapon.js";

const SMG_CONFIG = {
  maxDistance: 45,
  raycastStep: 0.08,
  damage: 14,
  magazineSize: 35,
  reserveAmmo: 140,
  fireRate: 80,
  spread: 0.08,
  reloadTime: 1800,
  penetration: 0.8,
  bulletSpeed: 55,
  muzzleFlashIntensity: 0.7,
  recoil: 10,
  screenShake: 2,
  shell: {
    size: { radius: 0.011, height: 0.04 },
    speed: 0.085,
    variance: 0.05,
    material: "spent",
    offsetDistance: 0.2,
  },
  audio: {
    shoot: [
      { action: "noiseBurst", freq: 55, q: 0.5, filterType: "lowpass", vol: 0.40, attack: 0, decay: 0.18, dur: 0.22 },
      { action: "noiseBurst", freq: 240, q: 2.0, filterType: "bandpass", vol: 0.5, attack: 0, decay: 0.08, dur: 0.12 },
      { action: "noiseBurst", freq: 2800, q: 0.6, filterType: "highpass", vol: 0.35, attack: 0, decay: 0.025, dur: 0.04 },
      { action: "noiseBurst", freq: 180, q: 3, filterType: "bandpass", vol: 0.20, attack: 0.01, decay: 0.35, dur: 0.45 },
      { action: "toneBurst", type: "sine", freq: 42, freqEnd: 22, vol: 0.3, decay: 0.18, dur: 0.22 },
    ],
  },
  render: {
    basePosition: [0.13, -0.14, -0.30],
    baseRotationY: -0.08,
    adsOffset: [-0.11, 0.07, -0.08],
    adsRotation: -0.02,
    scale: 3.0,
    muzzleFlash: { intensity: 5.0 },
  },
};

export class SMG extends Weapon {
  constructor() {
    super("SMG", SMG_CONFIG);
  }

  /**
   * Build the SMG mesh.
   * @param {Object} builder
   */
  buildModel({ addBox, addCyl, mat }) {
    addCyl(0.014, 0.014, 0.220, mat.bright, 0,  0.006, -0.220, Math.PI / 2);
    addCyl(0.018, 0.018, 0.022, mat.metal,  0,  0.006, -0.332, Math.PI / 2);
    addBox(0.058, 0.058, 0.230, mat.dark,   0,  0.012,  0.000);
    addBox(0.062, 0.010, 0.230, mat.metal,  0,  0.044,  0.000);
    addBox(0.016, 0.016, 0.020, mat.metal,  0,  0.052,  0.055);
    addBox(0.010, 0.032, 0.012, mat.metal,  0,  0.044, -0.210);
    addBox(0.004, 0.010, 0.004, mat.steel,  0,  0.060, -0.210);
    addBox(0.022, 0.014, 0.010, mat.metal,  0,  0.044,  0.090);
    addBox(0.056, 0.044, 0.200, mat.dark,   0, -0.020,  0.010);
    addBox(0.052, 0.008, 0.070, mat.metal,  0, -0.050,  0.042);
    addBox(0.010, 0.022, 0.010, mat.bright, 0, -0.044,  0.034);
    addBox(0.048, 0.048, 0.140, mat.dark,   0, -0.008, -0.140);
    addBox(0.050, 0.010, 0.140, mat.metal,  0,  0.028, -0.140);
    addBox(0.044, 0.130, 0.058, mat.dark,   0, -0.074, -0.044, -0.08);
    addBox(0.046, 0.008, 0.050, mat.metal,  0, -0.136, -0.044, -0.08);
    addBox(0.040, 0.040, 0.180, mat.dark,   0, -0.005,  0.170);
    addBox(0.042, 0.038, 0.060, mat.rubber, 0, -0.005,  0.270);
    addBox(0.044, 0.095, 0.066, mat.rubber, 0, -0.072,  0.068,  0.18);
    addBox(0.046, 0.008, 0.058, mat.metal,  0, -0.120,  0.064,  0.18);
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

    return { success: true, hit, recoil: this.recoil, screenShake: this.screenShake };
  }
}

export default SMG;
