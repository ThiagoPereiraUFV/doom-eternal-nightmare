/**
 * Rifle - Concrete Weapon Implementation
 * High damage, high fire rate, low spread
 */

import { Weapon } from "../Weapon.js";

const RIFLE_CONFIG = {
  maxDistance: 60,
  falloffMin: 0.5,
  falloffScale: 2,
  damage: 30,
  magazineSize: 30,
  reserveAmmo: 90,
  fireRate: 150,
  spread: 0.02,
  reloadTime: 2000,
  fireType: "auto",
  penetration: 2,
  bulletSpeed: 70,
  muzzleFlashIntensity: 1.0,
  recoil: 12,
  recoilDecay: 0.3,
  screenShake: 3,
  shell: {
    size: { radius: 0.011, height: 0.055 },
    speed: 0.09,
    variance: 0.045,
    material: "spent",
    offsetDistance: 0.22,
  },
  audio: {
    shoot: [
      {
        action: "noiseBurst",
        freq: 55,
        q: 0.5,
        filterType: "lowpass",
        vol: 0.55,
        attack: 0,
        decay: 0.18,
        dur: 0.22,
      },
      {
        action: "noiseBurst",
        freq: 220,
        q: 1.8,
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
        freq: 160,
        q: 3,
        filterType: "bandpass",
        vol: 0.28,
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
    basePosition: [0.19, -0.155, -0.34],
    baseRotationY: -0.09,
    adsOffset: [-0.19, 0.05, 0],
    adsRotation: 0.0,
    adsFOV: 22,
    scale: 3.0,
    muzzleFlash: { intensity: 5.0 },
  },
};

export class Rifle extends Weapon {
  constructor() {
    super("RIFLE", RIFLE_CONFIG);
  }

  /**
   * Build the rifle mesh.
   * @param {Object} builder
   */
  buildModel({ addBox, addCyl, mat }) {
    addCyl(0.018, 0.016, 0.56, mat.bright, 0, 0.01, -0.43, Math.PI / 2);
    addCyl(0.022, 0.018, 0.06, mat.bright, 0, 0.01, -0.18, Math.PI / 2);
    addCyl(0.024, 0.024, 0.044, mat.metal, 0, 0.01, -0.685, Math.PI / 2);
    addBox(0.006, 0.05, 0.044, mat.dark, 0, 0.01, -0.685);
    addBox(0.058, 0.058, 0.3, mat.dark, 0, 0.01, -0.27);
    addBox(0.062, 0.014, 0.3, mat.metal, 0, 0.042, -0.27);
    addBox(0.062, 0.014, 0.3, mat.dark, 0, -0.042, -0.27);
    addBox(0.064, 0.01, 0.03, mat.metal, 0, 0.01, -0.2);
    addBox(0.064, 0.01, 0.03, mat.metal, 0, 0.01, -0.31);
    addBox(0.068, 0.062, 0.2, mat.dark, 0, 0.01, 0.0);
    addBox(0.072, 0.012, 0.2, mat.metal, 0, 0.048, 0.0);
    addBox(0.042, 0.016, 0.02, mat.metal, 0, 0.05, 0.09);
    addBox(0.008, 0.032, 0.008, mat.metal, 0, 0.058, 0.09);
    addBox(0.03, 0.03, 0.032, mat.metal, 0, 0.072, -0.005);
    addBox(0.006, 0.012, 0.005, mat.steel, 0, 0.09, -0.005);
    addBox(0.068, 0.058, 0.16, mat.dark, 0, -0.026, 0.025);
    addBox(0.06, 0.007, 0.08, mat.metal, 0, -0.062, 0.055);
    addBox(0.06, 0.024, 0.007, mat.metal, 0, -0.052, 0.019);
    addBox(0.046, 0.11, 0.072, mat.rubber, 0, -0.096, 0.072, 0.2);
    addBox(0.05, 0.14, 0.072, mat.dark, 0, -0.096, -0.018, -0.05);
    addBox(0.052, 0.01, 0.064, mat.metal, 0, -0.168, -0.018, -0.05);
    addBox(0.044, 0.044, 0.2, mat.metal, 0, -0.008, 0.135);
    addBox(0.072, 0.072, 0.12, mat.dark, 0, -0.006, 0.23);
    addBox(0.076, 0.014, 0.12, mat.rubber, 0, -0.038, 0.23);
    addBox(0.018, 0.018, 0.018, mat.metal, 0, 0.01, -0.42);
    addBox(0.006, 0.016, 0.005, mat.steel, 0, 0.025, -0.42);
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
    const shotPitch = this._getShotPitch(player);

    // Perform raycast with penetration
    const hits = this._penetratingRaycast(
      player.x,
      player.y,
      shotAngle,
      map,
      enemies,
      shotPitch,
    );

    // Emit fire event
    eventManager?.emit("weaponFired", {
      weapon: this,
      angle: shotAngle,
      pitch: shotPitch,
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
