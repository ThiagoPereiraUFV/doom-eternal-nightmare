/**
 * GrenadeL - Grenade Launcher
 * Explosive area damage, low fire rate, affects multiple enemies in blast radius
 */
import * as THREE from "three";

import { Weapon } from "../Weapon.js";
import {
  EntityRegistry,
  ENTITY_CATEGORIES,
} from "../../registry/EntityRegistry.js";
import { isInBounds } from "../../utils/MathUtils.js";

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
  recoilDecay: 0.7,
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
      {
        action: "noiseBurst",
        freq: 35,
        q: 0.4,
        filterType: "lowpass",
        vol: 1.0,
        attack: 0,
        decay: 0.3,
        dur: 0.36,
      },
      {
        action: "toneBurst",
        type: "sine",
        freq: 55,
        freqEnd: 28,
        vol: 0.45,
        attack: 0.01,
        decay: 0.28,
        dur: 0.34,
      },
      {
        action: "noiseBurst",
        freq: 120,
        q: 1.5,
        filterType: "bandpass",
        vol: 0.4,
        attack: 0,
        decay: 0.2,
        dur: 0.28,
      },
    ],
  },
  render: {
    basePosition: [0.18, -0.18, -0.36],
    baseRotationY: -0.09,
    adsOffset: [-0.18, 0.05, 0],
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
  buildModel(group, mat) {
    this.g = group;
    this.mat = mat;
    this.addCyl(0.04, 0.038, 0.48, mat.bright, 0, 0.02, -0.31, Math.PI / 2);
    this.addBox(0.01, 0.008, 0.48, mat.steel, 0, 0.062, -0.31);
    this.addCyl(0.046, 0.04, 0.02, mat.bright, 0, 0.02, -0.55, Math.PI / 2);
    this.addBox(0.1, 0.1, 0.2, mat.dark, 0, 0.02, 0.042);
    this.addCyl(0.01, 0.01, 0.106, mat.metal, 0, 0.02, -0.062, 0, Math.PI / 2);
    this.addBox(0.04, 0.024, 0.024, mat.metal, 0, 0.066, -0.04);
    this.addBox(0.02, 0.06, 0.01, mat.metal, 0, 0.082, -0.28);
    this.addBox(0.006, 0.014, 0.005, mat.steel, 0, 0.098, -0.28);
    this.addBox(0.068, 0.008, 0.09, mat.metal, 0, -0.044, 0.052);
    this.addBox(0.068, 0.026, 0.008, mat.metal, 0, -0.034, 0.018);
    this.addBox(0.01, 0.03, 0.01, mat.bright, 0, -0.04, 0.044);
    this.addBox(0.078, 0.084, 0.29, mat.wood, 0, 0.014, 0.242, -0.06);
    this.addBox(0.08, 0.084, 0.018, mat.rubber, 0, 0.014, 0.397, -0.06);
    this.addBox(0.058, 0.12, 0.086, mat.rubber, 0, -0.076, 0.078, 0.24);
    this.addBox(0.06, 0.01, 0.078, mat.metal, 0, -0.138, 0.076, 0.24);
    this.addBox(0.07, 0.08, 0.16, mat.wood, 0, 0.02, -0.21);
    this.addCyl(
      0.038,
      0.038,
      0.06,
      new THREE.MeshLambertMaterial({ color: 0x556633 }),
      0,
      0.02,
      -0.04,
      Math.PI / 2,
    );
  }

  fire(context) {
    if (!this.canFire()) {
      return { success: false, reason: "cannot_fire" };
    }

    const { player, enemies, map, audioSystem, eventManager } = context;
    this.consumeAmmo();
    // shoot sound played by Player.shoot(); play explosion after landing

    const shotAngle = player.angle + (Math.random() - 0.5) * this.spread;
    const shotPitch = this._getShotPitch(player);
    // Find where the grenade lands (wall or max range)
    const landing = this._findLandingPoint(
      player.x,
      player.y,
      shotAngle,
      shotPitch,
      map,
    );

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
          hits.push({
            type: "enemy",
            enemy,
            distance: landing.distance,
            damage,
            x: landing.x,
            y: landing.y,
          });
        }
      }
    }

    audioSystem?.playSound("explosion");
    eventManager?.emit("weaponFired", {
      weapon: this,
      angle: shotAngle,
      pitch: shotPitch,
      hits,
      explosion: landing,
    });
    eventManager?.emit("explosion", {
      x: landing.x,
      y: landing.y,
      radius: this.splashRadius,
    });

    return {
      success: true,
      hits,
      hit: hits[0] ?? { type: "explosion", ...landing },
      recoil: this.recoil,
      screenShake: this.screenShake,
    };
  }

  _findLandingPoint(x, y, angle, pitch, map) {
    const rangeScale = Math.max(0.05, Math.cos(Math.abs(pitch)));
    const maxDistance = this.maxDistance * rangeScale;
    const step = this.raycastStep * rangeScale;
    let distance = 0;
    let iterations = 0;

    if (!map || !map.length || !map[0]) {
      return {
        x: x + Math.cos(angle) * maxDistance,
        y: y + Math.sin(angle) * maxDistance,
        distance: maxDistance,
      };
    }

    while (distance < maxDistance && iterations < 300) {
      iterations++;
      distance += step;
      const testX = x + Math.cos(angle) * distance;
      const testY = y + Math.sin(angle) * distance;
      const mapX = Math.floor(testX);
      const mapY = Math.floor(testY);

      if (!isInBounds(map, mapX, mapY)) {
        return { x: testX, y: testY, distance };
      }
      if (map[mapY][mapX] > 0) {
        return {
          x: testX - Math.cos(angle) * step,
          y: testY - Math.sin(angle) * step,
          distance,
        };
      }
    }
    return {
      x: x + Math.cos(angle) * maxDistance,
      y: y + Math.sin(angle) * maxDistance,
      distance: maxDistance,
    };
  }
}

GrenadeL.config = { type: "grenade_launcher", ...GRENADE_CONFIG };
EntityRegistry.register(ENTITY_CATEGORIES.WEAPON, GrenadeL.config, GrenadeL);

export default GrenadeL;
