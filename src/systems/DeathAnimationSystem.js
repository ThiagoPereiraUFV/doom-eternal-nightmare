import { spliceByIndices } from "../utils/MathUtils.js";

/**
 * DeathAnimationSystem — plays fall-over animations for dying enemies.
 */
export class DeathAnimationSystem {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this._scene = scene;
    this._dyingEnemies = [];
  }

  /**
   * Start a death animation for a mesh.
   * @param {import("three").Group} mesh
   */
  start(mesh) {
    if (!mesh) {
      return;
    }
    // Re-add to scene so the fall-over animation is visible after the mesh
    // has been removed from its parent group.
    this._scene.add(mesh);
    this._dyingEnemies.push({
      mesh,
      startTime: performance.now() / 1000,
      duration: 1.2,
      startY: mesh.position.y,
      rotDir: Math.random() < 0.5 ? 1 : -1,
      rotAxis: Math.random() < 0.5 ? "x" : "z",
    });
  }

  /**
   * Immediately cancel all in-progress death animations and remove their meshes.
   */
  clear() {
    for (const d of this._dyingEnemies) {
      this._scene.remove(d.mesh);
    }
    this._dyingEnemies = [];
  }

  /**
   * Update all in-progress death animations.
   * @param {number} t — current time in seconds
   */
  update(t) {
    const toRemove = [];
    for (let i = 0; i < this._dyingEnemies.length; i++) {
      const d = this._dyingEnemies[i];
      const elapsed = t - d.startTime;
      const progress = Math.min(elapsed / d.duration, 1.0);
      const ease = progress * progress;

      d.mesh.position.y = d.startY - ease * 0.55;
      d.mesh.rotation[d.rotAxis] = d.rotDir * ease * (Math.PI / 2);
      if (progress >= 1.0) {
        toRemove.push(i);
        this._scene.remove(d.mesh);
      }
    }
    spliceByIndices(this._dyingEnemies, toRemove);
  }
}
