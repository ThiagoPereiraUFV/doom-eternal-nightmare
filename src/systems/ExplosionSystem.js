import * as THREE from "three";
import { spliceByIndices } from "../utils/MathUtils.js";

/**
 * ExplosionSystem — spawns and animates explosion particle effects.
 */
export class ExplosionSystem {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this._scene = scene;
    this._explosionParticles = [];
  }

  spawnExplosion(wx, wy) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const size = 0.08 + Math.random() * 0.18;
      const geo = new THREE.SphereGeometry(size, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: i < count / 2 ? 0xff6600 : 0xffcc00,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        wx + (Math.random() - 0.5) * 0.5,
        0.3 + Math.random() * 0.6,
        wy + (Math.random() - 0.5) * 0.5,
      );
      const speed = 0.08 + Math.random() * 0.15;
      const ang = Math.random() * Math.PI * 2;
      this._scene.add(mesh);
      this._explosionParticles.push({
        mesh,
        mat,
        vel: new THREE.Vector3(
          Math.cos(ang) * speed,
          0.05 + Math.random() * 0.1,
          Math.sin(ang) * speed,
        ),
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
      });
    }
    // Large flash point light
    const flash = new THREE.PointLight(0xff8800, 8, 12);
    flash.position.set(wx, 0.5, wy);
    this._scene.add(flash);
    setTimeout(() => this._scene.remove(flash), 200);
  }

  /** @param {number} dt */
  update(dt) {
    const toRemove = [];
    for (let i = 0; i < this._explosionParticles.length; i++) {
      const p = this._explosionParticles[i];
      p.life += dt;
      const ratio = p.life / p.maxLife;
      p.vel.y -= 0.15 * dt;
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt * 60));
      p.mat.opacity = Math.max(0, 0.9 - ratio * 0.9);
      if (p.life >= p.maxLife) {
        toRemove.push(i);
        this._scene.remove(p.mesh);
      }
    }
    spliceByIndices(this._explosionParticles, toRemove);
  }
}
