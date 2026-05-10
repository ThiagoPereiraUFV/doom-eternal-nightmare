/**
 * PlasmaGun - Energy weapon
 * High penetration, sci-fi feel, moderate fire rate, no falloff damage
 */

import { Weapon } from "../Weapon.js";

const PLASMA_CONFIG = {
  maxDistance: 60,
  raycastStep: 0.08,
  falloffMin: 1.0,
  wallPenetrationCost: 2,
  damage: 45,
  magazineSize: 40,
  reserveAmmo: 160,
  fireRate: 120,
  spread: 0.03,
  reloadTime: 2200,
  penetration: 4,
  bulletSpeed: 80,
  muzzleFlashIntensity: 1.8,
  recoil: 5,
  recoilDecay: 0.3,
  screenShake: 2,
  fireType: "auto",
  audio: {
    shoot: [
      {
        action: "toneBurst",
        type: "sawtooth",
        freq: 440,
        freqEnd: 180,
        vol: 0.35,
        attack: 0,
        decay: 0.12,
        dur: 0.16,
      },
      {
        action: "noiseBurst",
        freq: 3200,
        q: 4,
        filterType: "bandpass",
        vol: 0.25,
        attack: 0,
        decay: 0.06,
        dur: 0.1,
      },
      {
        action: "toneBurst",
        type: "sine",
        freq: 880,
        freqEnd: 220,
        vol: 0.2,
        attack: 0,
        decay: 0.18,
        dur: 0.22,
      },
    ],
  },
  render: {
    basePosition: [0.15, -0.145, -0.32],
    baseRotationY: -0.08,
    adsOffset: [-0.15, 0.05, 0],
    adsRotation: -0.02,
    scale: 3.0,
    muzzleFlash: { intensity: 6.0, color: 0x00aaff, duration: 0.08 },
  },
};

export class PlasmaGun extends Weapon {
  constructor() {
    super("PLASMA", PLASMA_CONFIG);
  }

  /**
   * Build the plasma gun mesh.
   * @param {Object} builder
   */
  buildModel({ addBox, addCyl, THREE, mat }) {
    addBox(0.09, 0.08, 0.38, mat.dark, 0, 0.004, 0.0);
    addBox(
      0.01,
      0.068,
      0.28,
      new THREE.MeshLambertMaterial({ color: 0x001133 }),
      -0.05,
      0.004,
      -0.04,
    );
    addBox(
      0.01,
      0.068,
      0.28,
      new THREE.MeshLambertMaterial({ color: 0x001133 }),
      0.05,
      0.004,
      -0.04,
    );
    addCyl(0.03, 0.026, 0.2, mat.dark, 0, 0.004, -0.29, Math.PI / 2);
    addCyl(0.034, 0.034, 0.02, mat.dark, 0, 0.004, -0.392, Math.PI / 2);
    const plasmaRingMat = new THREE.MeshBasicMaterial({ color: 0x00aaff });
    for (let ri = 0; ri < 4; ri++) {
      addCyl(
        0.036,
        0.036,
        0.006,
        plasmaRingMat,
        0,
        0.004,
        -0.2 - ri * 0.04,
        Math.PI / 2,
      );
    }
    addBox(
      0.07,
      0.06,
      0.1,
      new THREE.MeshLambertMaterial({ color: 0x003366 }),
      0,
      0.004,
      0.06,
    );
    addCyl(
      0.028,
      0.028,
      0.08,
      new THREE.MeshLambertMaterial({ color: 0x0044aa }),
      0,
      0.004,
      0.05,
      0,
    );
    addBox(0.01, 0.012, 0.36, mat.metal, 0, 0.048, 0.0);
    addBox(0.03, 0.014, 0.008, mat.metal, 0, 0.048, 0.168);
    addBox(0.05, 0.11, 0.072, mat.rubber, 0, -0.072, 0.09, 0.16);
    addBox(0.052, 0.01, 0.064, mat.dark, 0, -0.128, 0.088, 0.16);
    addBox(0.058, 0.008, 0.084, mat.dark, 0, -0.046, 0.058);
    addBox(
      0.01,
      0.026,
      0.01,
      new THREE.MeshBasicMaterial({ color: 0x0088ff }),
      0,
      -0.044,
      0.05,
    );
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    addBox(0.004, 0.008, 0.008, ledMat, -0.046, 0.028, 0.1);
    addBox(0.004, 0.008, 0.008, ledMat, -0.046, 0.028, 0.06);
    addBox(0.004, 0.008, 0.008, ledMat, -0.046, 0.028, 0.02);
    addBox(
      0.004,
      0.008,
      0.008,
      new THREE.MeshBasicMaterial({ color: 0xff4400 }),
      -0.046,
      0.028,
      -0.02,
    );
  }

  fire(context) {
    if (!this.canFire()) {
      return { success: false, reason: "cannot_fire" };
    }

    const { player, enemies, map, eventManager } = context;
    this.consumeAmmo();

    const shotAngle = player.angle + (Math.random() - 0.5) * this.spread;
    const allHits = this._penetratingRaycast(
      player.x,
      player.y,
      shotAngle,
      map,
      enemies,
    );

    eventManager?.emit("weaponFired", {
      weapon: this,
      angle: shotAngle,
      hits: allHits,
    });
    // No shell ejection — energy weapon

    return {
      success: true,
      hits: allHits,
      hit: allHits[0] ?? { type: "miss" },
      recoil: this.recoil,
      screenShake: this.screenShake,
    };
  }
}

export default PlasmaGun;
