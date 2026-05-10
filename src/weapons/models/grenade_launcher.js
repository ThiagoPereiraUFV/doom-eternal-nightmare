/**
 * GrenadeL - Grenade Launcher
 * Explosive area damage, low fire rate, affects multiple enemies in blast radius
 */

import { Weapon } from "../Weapon.js";

const GRENADE_CONFIG = {
  maxDistance: 20,
  damage: 80,
  magazineSize: 6,
  reserveAmmo: 24,
  fireRate: 900,
  spread: 0.01,
  fireType: "manual",
  reloadTime: 2800,
  penetration: 3,
  bulletSpeed: 25,
  muzzleFlashIntensity: 2.5,
  recoil: 50,
  recoilDecay: 0.70,
  screenShake: 15,
  shell: {
    size: { radius: 0.018, height: 0.06 },
    speed: 0.075,
    variance: 0.05,
    material: "spent",
    offsetDistance: 0.24,
  },
  splashRadius: 2.5,
  audio: {
    shoot: [
      { action: "noiseBurst", freq: 35, q: 0.4, filterType: "lowpass", vol: 1.0, attack: 0, decay: 0.30, dur: 0.36 },
      { action: "toneBurst", type: "sine", freq: 55, freqEnd: 28, vol: 0.45, attack: 0.01, decay: 0.28, dur: 0.34 },
      { action: "noiseBurst", freq: 120, q: 1.5, filterType: "bandpass", vol: 0.40, attack: 0, decay: 0.20, dur: 0.28 },
    ],
  },
  render: {
    basePosition: [0.18, -0.18, -0.36],
    baseRotationY: -0.09,
    adsOffset: [-0.16, 0.08, -0.09],
    adsRotation: -0.02,
    scale: 3.0,
    muzzleFlash: { intensity: 7.0 },
  },
};

export class GrenadeL extends Weapon {
  constructor() {
    super("GRENADE_LAUNCHER", GRENADE_CONFIG);
    this.splashRadius = GRENADE_CONFIG.splashRadius;
  }

  /**
   * Build the grenade launcher mesh.
   * @param {Object} builder
   */
  buildModel({ addBox, addCyl, mat, THREE }) {
    addCyl(0.040, 0.038, 0.480, mat.bright, 0,  0.020, -0.310, Math.PI / 2);
    addBox(0.010, 0.008, 0.480, mat.steel,  0,  0.062, -0.310);
    addCyl(0.046, 0.040, 0.020, mat.bright, 0,  0.020, -0.550, Math.PI / 2);
    addBox(0.100, 0.100, 0.200, mat.dark,   0,  0.020,  0.042);
    addCyl(0.010, 0.010, 0.106, mat.metal,  0,  0.020, -0.062, 0, Math.PI / 2);
    addBox(0.040, 0.024, 0.024, mat.metal,  0,  0.066, -0.040);
    addBox(0.020, 0.060, 0.010, mat.metal,  0,  0.082, -0.280);
    addBox(0.006, 0.014, 0.005, mat.steel,  0,  0.098, -0.280);
    addBox(0.068, 0.008, 0.090, mat.metal,  0, -0.044,  0.052);
    addBox(0.068, 0.026, 0.008, mat.metal,  0, -0.034,  0.018);
    addBox(0.010, 0.030, 0.010, mat.bright, 0, -0.040,  0.044);
    addBox(0.078, 0.084, 0.290, mat.wood,   0,  0.014,  0.242, -0.06);
    addBox(0.080, 0.084, 0.018, mat.rubber, 0,  0.014,  0.397, -0.06);
    addBox(0.058, 0.120, 0.086, mat.rubber, 0, -0.076,  0.078,  0.24);
    addBox(0.060, 0.010, 0.078, mat.metal,  0, -0.138,  0.076,  0.24);
    addBox(0.070, 0.080, 0.160, mat.wood,   0,  0.020, -0.210);
    addCyl(0.038, 0.038, 0.060, new THREE.MeshLambertMaterial({ color: 0x556633 }), 0, 0.020, -0.040, Math.PI / 2);
  }

  fire(context) {
    if (!this.canFire()) {
      return { success: false, reason: "cannot_fire" };
    }

    const { player, enemies, map, audioSystem, eventManager } = context;
    this.consumeAmmo();
    // shoot sound played by Player.shoot(); play explosion after landing

    const shotAngle = player.angle + (Math.random() - 0.5) * this.spread;
    // Find where the grenade lands (wall or max range)
    const landing = this._findLandingPoint(player.x, player.y, shotAngle, map);

    // Apply splash damage to all enemies in radius
    const hits = [];
    for (const enemy of enemies) {
      if (!enemy.isDead) {
        const dx = enemy.x - landing.x;
        const dy = enemy.y - landing.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.splashRadius) {
          const falloff = 1 - dist / this.splashRadius;
          const damage = Math.round(this.damage * falloff);
          hits.push({ type: "enemy", enemy, distance: landing.distance, damage, x: landing.x, y: landing.y });
        }
      }
    }

    audioSystem?.playSound("explosion");
    eventManager?.emit("weaponFired", { weapon: this, angle: shotAngle, hits, explosion: landing });
    eventManager?.emit("explosion", { x: landing.x, y: landing.y, radius: this.splashRadius });

    return { success: true, hits, hit: hits[0] ?? { type: "explosion", ...landing }, recoil: this.recoil, screenShake: this.screenShake };
  }

  _findLandingPoint(x, y, angle, map) {
    const maxDistance = this.maxDistance;
    const step = this.raycastStep;
    let distance = 0;
    let iterations = 0;

    if (!map || !map.length || !map[0]) { return { x: x + Math.cos(angle) * maxDistance, y: y + Math.sin(angle) * maxDistance, distance: maxDistance }; }

    while (distance < maxDistance && iterations < 300) {
      iterations++;
      distance += step;
      const testX = x + Math.cos(angle) * distance;
      const testY = y + Math.sin(angle) * distance;
      const mapX = Math.floor(testX);
      const mapY = Math.floor(testY);

      if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length)
        { return { x: testX, y: testY, distance }; }
      if (map[mapY][mapX] > 0)
        { return { x: testX - Math.cos(angle) * step, y: testY - Math.sin(angle) * step, distance }; }
    }
    return { x: x + Math.cos(angle) * maxDistance, y: y + Math.sin(angle) * maxDistance, distance: maxDistance };
  }
}

export default GrenadeL;
