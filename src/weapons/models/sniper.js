/**
 * SniperRifle - Long-range precision weapon
 * Very high damage, low fire rate, high penetration, scope zoom
 */

import { Weapon } from "./Weapon.js";

const SNIPER_CONFIG = {
  maxDistance: 80,
  raycastStep: 0.05,
  falloffMin: 1.0,
  damage: 120,
  magazineSize: 5,
  reserveAmmo: 20,
  fireRate: 1200,
  spread: 0.002,
  reloadTime: 3000,
  penetration: 5,
  bulletSpeed: 200,
  muzzleFlashIntensity: 2.0,
  recoil: 60,
  screenShake: 12,
  audio: {
    shoot: [
      { action: "noiseBurst", freq: 50, q: 0.4, filterType: "lowpass", vol: 1.0, attack: 0, decay: 0.22, dur: 0.28 },
      { action: "noiseBurst", freq: 3500, q: 0.5, filterType: "highpass", vol: 0.5, attack: 0, decay: 0.04, dur: 0.06 },
      { action: "noiseBurst", freq: 120, q: 2, filterType: "bandpass", vol: 0.65, attack: 0.01, decay: 0.55, dur: 0.65 },
      { action: "toneBurst", type: "sine", freq: 38, freqEnd: 18, vol: 0.40, decay: 0.30, dur: 0.36 },
      { action: "noiseBurst", freq: 80, q: 1, filterType: "lowpass", vol: 0.22, attack: 0, decay: 0.30, dur: 0.38, offset: 0.14 },
      { action: "noiseBurst", freq: 70, q: 1, filterType: "lowpass", vol: 0.10, attack: 0, decay: 0.25, dur: 0.32, offset: 0.30 },
    ],
  },
  render: {
    basePosition: [0.22, -0.16, -0.38],
    baseRotationY: -0.09,
    adsOffset: [-0.22, 0.09, -0.10],
    adsRotation: 0.0,
    scale: 3.0,
    muzzleFlash: { intensity: 8.0 },
  },
};

export class SniperRifle extends Weapon {
  constructor() {
    super("SNIPER", SNIPER_CONFIG);
  }

  /**
   * Build the sniper mesh.
   * @param {Object} builder
   */
  buildModel({ addBox, addCyl, mat }) {
    addCyl(0.018, 0.015, 0.720, mat.bright, 0,  0.014, -0.520, Math.PI / 2);
    addCyl(0.024, 0.020, 0.080, mat.bright, 0,  0.014, -0.180, Math.PI / 2);
    addCyl(0.026, 0.026, 0.050, mat.metal,  0,  0.014, -0.876, Math.PI / 2);
    addBox(0.006, 0.036, 0.050, mat.dark,   0,  0.014, -0.876);
    for (let fi = 0; fi < 5; fi++) {
      addBox(0.006, 0.022, 0.560, mat.metal, 0, 0.014 + Math.sin(fi * 1.26) * 0.012, -0.460);
    }
    addBox(0.078, 0.082, 0.240, mat.dark,   0,  0.016,  0.010);
    addBox(0.082, 0.012, 0.240, mat.metal,  0,  0.064,  0.010);
    addBox(0.090, 0.018, 0.036, mat.metal,  0,  0.074, -0.050);
    addBox(0.090, 0.018, 0.036, mat.metal,  0,  0.074,  0.060);
    addCyl(0.030, 0.030, 0.310, mat.dark,   0,  0.100,  0.005, Math.PI / 2);
    addCyl(0.024, 0.024, 0.120, mat.dark,   0,  0.100, -0.190, Math.PI / 2);
    addCyl(0.034, 0.034, 0.080, mat.dark,   0,  0.100, -0.240, Math.PI / 2);
    addCyl(0.024, 0.024, 0.080, mat.dark,   0,  0.100,  0.200, Math.PI / 2);
    addCyl(0.028, 0.028, 0.036, mat.dark,   0,  0.100,  0.245, Math.PI / 2);
    addCyl(0.012, 0.012, 0.032, mat.metal,  0,  0.130,  0.002, 0);
    addCyl(0.012, 0.012, 0.032, mat.metal,  0,  0.100,  0.002, 0, Math.PI / 2);
    addBox(0.010, 0.062, 0.010, mat.metal,  0.044, 0.048,  0.030);
    addCyl(0.016, 0.016, 0.020, mat.metal,  0.044, 0.014,  0.030);
    addBox(0.062, 0.008, 0.090, mat.metal,  0, -0.050,  0.060);
    addBox(0.062, 0.026, 0.008, mat.metal,  0, -0.040,  0.022);
    addBox(0.008, 0.026, 0.010, mat.bright, 0, -0.046,  0.054);
    addBox(0.068, 0.072, 0.340, mat.wood,   0, -0.010,  0.250, -0.04);
    addBox(0.060, 0.100, 0.100, mat.wood,   0, -0.066,  0.092,  0.14);
    addBox(0.066, 0.040, 0.180, mat.wood,   0,  0.024,  0.310, -0.03);
    addBox(0.070, 0.082, 0.018, mat.rubber, 0, -0.010,  0.424, -0.04);
    addBox(0.058, 0.058, 0.220, mat.wood,   0, -0.008, -0.260);
    addBox(0.010, 0.020, 0.010, mat.metal,  0, -0.038, -0.120);
    addBox(0.010, 0.020, 0.010, mat.metal,  0, -0.040,  0.180);
    addBox(0.020, 0.022, 0.010, mat.metal,  0,  0.080, -0.840);
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
