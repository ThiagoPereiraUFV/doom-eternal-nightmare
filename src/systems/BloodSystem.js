import * as THREE from "three";
import { spliceByIndices } from "../utils/MathUtils.js";

/**
 * BloodSystem — spawns and animates blood particles, pools, and wall splatters.
 */
export class BloodSystem {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this._scene = scene;
    this._bloodParticles = [];
    this._bloodPoolGroup = new THREE.Group();
    scene.add(this._bloodPoolGroup);

    this._bloodMat = new THREE.MeshBasicMaterial({
      color: 0x880000,
      side: THREE.FrontSide,
    });
    this._bloodDarkMat = new THREE.MeshBasicMaterial({
      color: 0x440000,
      side: THREE.FrontSide,
    });
  }

  spawnBlood(wx, wy, intensity = 1) {
    const count = Math.round(8 * intensity + Math.random() * 6 * intensity);
    for (let i = 0; i < count; i++) {
      const size = 0.04 + Math.random() * 0.08 * intensity;
      const geo =
        Math.random() < 0.5
          ? new THREE.SphereGeometry(size, 4, 4)
          : new THREE.BoxGeometry(size, size * 0.4, size);
      const mat = Math.random() < 0.6 ? this._bloodMat : this._bloodDarkMat;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        wx + (Math.random() - 0.5) * 0.3,
        0.45 + Math.random() * 0.3,
        wy + (Math.random() - 0.5) * 0.3,
      );
      const speed = 0.04 + Math.random() * 0.12 * intensity;
      const hAngle = Math.random() * Math.PI * 2;
      const vAngle = Math.PI * 0.2 + Math.random() * Math.PI * 0.6;
      this._scene.add(mesh);
      this._bloodParticles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(hAngle) * Math.sin(vAngle) * speed,
          Math.cos(vAngle) * speed * 0.8,
          Math.sin(hAngle) * Math.sin(vAngle) * speed,
        ),
        life: 0,
        maxLife: 1.5 + Math.random() * 1.5,
        stuck: false,
      });
    }

    this._spawnBloodPool(wx, wy, intensity);

    if (intensity >= 2) {
      this._spawnWallSplatter(wx, wy, intensity);
    }
  }

  _spawnBloodPool(wx, wy, intensity) {
    const geo = new THREE.CircleGeometry(
      0.1 + Math.random() * 0.15 * intensity,
      8,
    );
    const pool = new THREE.Mesh(geo, this._bloodDarkMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(
      wx + (Math.random() - 0.5) * 0.4,
      0.01,
      wy + (Math.random() - 0.5) * 0.4,
    );
    this._bloodPoolGroup.add(pool);
    pool.userData.targetScale = 0.8 + intensity * 0.6;
    pool.scale.set(0.1, 0.1, 0.1);
  }

  _spawnWallSplatter(wx, wy, intensity) {
    const count = Math.round(4 * intensity);
    for (let i = 0; i < count; i++) {
      const geo = new THREE.PlaneGeometry(
        0.08 + Math.random() * 0.12,
        0.06 + Math.random() * 0.1,
      );
      const splat = new THREE.Mesh(geo, this._bloodMat);
      const side = Math.floor(Math.random() * 4);
      const offsets = [
        [0.5, 0, 0],
        [-0.5, 0, 0],
        [0, 0, 0.5],
        [0, 0, -0.5],
      ];
      const rotations = [
        [0, Math.PI / 2, 0],
        [0, -Math.PI / 2, 0],
        [0, 0, 0],
        [0, Math.PI, 0],
      ];
      const [ox, , oz] = offsets[side];
      const [rx, ry, rz] = rotations[side];
      splat.position.set(wx + ox, 0.2 + Math.random() * 0.6, wy + oz);
      splat.rotation.set(rx, ry, rz);
      this._bloodPoolGroup.add(splat);
    }
  }

  /** @param {number} dt */
  update(dt) {
    const gravity = -0.25;
    const toRemove = [];

    for (let i = 0; i < this._bloodParticles.length; i++) {
      const p = this._bloodParticles[i];
      p.life += dt;

      if (p.stuck) {
        if (p.mesh.userData.growPool) {
          p.mesh.scale.multiplyScalar(1 + dt * 0.5);
          if (p.mesh.scale.x > p.mesh.userData.maxScale) {
            p.mesh.userData.growPool = false;
          }
        }
        if (p.life > p.maxLife) {
          toRemove.push(i);
          this._scene.remove(p.mesh);
        }
        continue;
      }

      p.vel.y += gravity * dt;
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt * 60));

      if (p.mesh.position.y <= 0.01) {
        p.mesh.position.y = 0.01;
        p.mesh.rotation.x = -Math.PI / 2;
        p.stuck = true;
        p.life = 0;
        p.maxLife = 8 + Math.random() * 10;
        p.mesh.userData.growPool = true;
        p.mesh.userData.maxScale = 2 + Math.random();
      }
    }

    spliceByIndices(this._bloodParticles, toRemove);

    for (const child of this._bloodPoolGroup.children) {
      if (
        child.userData.targetScale &&
        child.scale.x < child.userData.targetScale
      ) {
        const s = child.scale.x + dt * 0.4;
        child.scale.set(
          Math.min(s, child.userData.targetScale),
          Math.min(s, child.userData.targetScale),
          1,
        );
      }
    }

    if (this._bloodParticles.length > 200) {
      const excess = this._bloodParticles.splice(
        0,
        this._bloodParticles.length - 200,
      );
      for (const p of excess) {
        this._scene.remove(p.mesh);
      }
    }
  }
}
