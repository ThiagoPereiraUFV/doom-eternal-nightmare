import * as THREE from "three";
import { spliceByIndices } from "../utils/MathUtils.js";

/**
 * ShellSystem — spawns and animates ejected shell casings.
 */
export class ShellSystem {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this._scene = scene;
    this._shells = [];

    this._shellMat = new THREE.MeshStandardMaterial({
      color: 0xd4a020,
      roughness: 0.28,
      metalness: 0.88,
    });
    this._shellSpentMat = new THREE.MeshStandardMaterial({
      color: 0x8a6010,
      roughness: 0.38,
      metalness: 0.8,
    });
  }

  spawnShell(px, py, angle, shellConfig = {}) {
    if (typeof shellConfig === "string") {
      shellConfig = { type: shellConfig };
    }

    const size = shellConfig.size || {};
    const r = size.radius ?? 0.011;
    const h = size.height ?? 0.04;
    const geo = new THREE.CylinderGeometry(r, r * 0.85, h, 8);

    let mat;
    if (shellConfig.material instanceof THREE.Material) {
      mat = shellConfig.material;
    } else if (shellConfig.material === "spent") {
      mat = this._shellSpentMat;
    } else {
      mat = this._shellMat;
    }

    const mesh = new THREE.Mesh(geo, mat);

    const ejAngle = angle + (shellConfig.angleOffset ?? Math.PI / 2);
    mesh.position.set(
      px + Math.cos(ejAngle) * (shellConfig.offsetDistance ?? 0.2),
      shellConfig.spawnY ?? 0.5,
      py + Math.sin(ejAngle) * (shellConfig.offsetDistance ?? 0.2),
    );

    const speed = shellConfig.speed ?? 0.08;
    const variance = shellConfig.variance ?? 0.06;
    const up = shellConfig.upVelocity ?? 0.06;
    const meshSpeed = speed + Math.random() * variance;

    this._scene.add(mesh);
    this._shells.push({
      mesh,
      vel: new THREE.Vector3(
        Math.cos(ejAngle) * meshSpeed + (Math.random() - 0.5) * 0.03,
        up + Math.random() * 0.04,
        Math.sin(ejAngle) * meshSpeed + (Math.random() - 0.5) * 0.03,
      ),
      angVel: new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 15,
      ),
      life: 0,
      maxLife: shellConfig.maxLife ?? 4 + Math.random() * 3,
      bounces: 0,
      bounced: false,
    });
  }

  /** @param {number} dt */
  update(dt) {
    const gravity = -0.4;
    const toRemove = [];

    for (let i = 0; i < this._shells.length; i++) {
      const s = this._shells[i];
      s.life += dt;

      if (s.bounced && s.vel.length() < 0.005) {
        if (s.life > s.maxLife) {
          toRemove.push(i);
          this._scene.remove(s.mesh);
        }
        continue;
      }

      s.vel.y += gravity * dt;
      s.mesh.position.add(s.vel.clone().multiplyScalar(dt * 60));
      s.mesh.rotation.x += s.angVel.x * dt;
      s.mesh.rotation.y += s.angVel.y * dt;
      s.mesh.rotation.z += s.angVel.z * dt;

      if (s.mesh.position.y <= 0.015) {
        s.mesh.position.y = 0.015;
        if (s.bounces < 3) {
          s.vel.y = Math.abs(s.vel.y) * (0.3 + Math.random() * 0.25);
          s.vel.x *= 0.6;
          s.vel.z *= 0.6;
          s.angVel.multiplyScalar(0.5);
          s.bounces++;
          s.bounced = true;
        } else {
          s.vel.set(0, 0, 0);
          s.bounced = true;
        }
      }
    }

    spliceByIndices(this._shells, toRemove);

    if (this._shells.length > 60) {
      const excess = this._shells.splice(0, this._shells.length - 60);
      for (const s of excess) {
        this._scene.remove(s.mesh);
      }
    }
  }
}
