import * as THREE from "three";

/**
 * MeshBuilderMixin — adds Three.js geometry-building helpers to any class via mixin.
 *
 * Consumers must assign `this.g` (THREE.Group) and `this.mat` before calling any
 * geometry method (typically at the start of buildModel / createMesh).
 *
 * Usage:
 *   class MyEntity extends MeshBuilderMixin(BaseClass) {
 *     buildMesh(group, mat) {
 *       this.g = group;
 *       this.mat = mat;
 *       this.box(0.3, 0.6, 0.3, mat.body, 0, 0.5, 0);
 *     }
 *   }
 */
export const MeshBuilderMixin = (Base) =>
  class extends Base {
    box(w, h, d, mat, px, py, pz, rx = 0, ry = 0, rz = 0) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(px, py, pz);
      m.rotation.set(rx, ry, rz);
      this.g.add(m);
      return m;
    }

    sphere(r, mat, px, py, pz, segs = 10) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), mat);
      m.position.set(px, py, pz);
      this.g.add(m);
      return m;
    }

    cone(r, h, mat, px, py, pz, rx = 0, ry = 0, rz = 0) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mat);
      m.position.set(px, py, pz);
      m.rotation.set(rx, ry, rz);
      this.g.add(m);
      return m;
    }

    /** Cylinder — rx rotates barrel to horizontal (Math.PI / 2). */
    cyl(rt, rb, h, mat, px, py, pz, rx = 0, openEnded = false) {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(rt, rb, h, 12, 1, openEnded),
        mat,
      );
      m.position.set(px, py, pz);
      m.rotation.x = rx;
      this.g.add(m);
      return m;
    }

    torus(radius, tube, mat, px, py, pz, rx = 0, ry = 0, rz = 0) {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tube, 10, 24),
        mat,
      );
      m.position.set(px, py, pz);
      m.rotation.set(rx, ry, rz);
      this.g.add(m);
      return m;
    }

    ring(outerRadius, innerRadius, mat, px, py, pz, rx = 0, ry = 0, rz = 0) {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(innerRadius, outerRadius, 24),
        mat,
      );
      m.position.set(px, py, pz);
      m.rotation.set(rx, ry, rz);
      this.g.add(m);
      return m;
    }

    /**
     * Hollow open-ended tube with inner face and flat ring end-caps.
     * Useful for barrel scopes, pipes, and cylindrical housings.
     */
    addTube(outerRadius, innerRadius, length, material, px, py, pz) {
      const innerMat = material.clone();
      innerMat.side = THREE.BackSide;
      const capMat = material.clone();
      capMat.side = THREE.DoubleSide;
      this.addCyl(outerRadius, outerRadius, length, material, px, py, pz, Math.PI / 2, true);
      this.addCyl(innerRadius, innerRadius, length, innerMat, px, py, pz, Math.PI / 2, true);
      this.addRing(outerRadius, innerRadius, capMat, px, py, pz - length / 2);
      this.addRing(outerRadius, innerRadius, capMat, px, py, pz + length / 2);
    }

    // Weapon-model aliases
    addBox(...a) {
      return this.box(...a);
    }
    addCyl(...a) {
      return this.cyl(...a);
    }
    addTorus(...a) {
      return this.torus(...a);
    }
    addRing(...a) {
      return this.ring(...a);
    }
  };

/**
 * Standalone mesh builder — use when building meshes outside an entity/weapon class.
 *   const b = new MeshBuilder(group, mat);
 *   b.box(...)
 */
export class MeshBuilder extends MeshBuilderMixin(class {}) {
  /**
   * @param {THREE.Group} group
   * @param {object}      mat   - Material palette
   */
  constructor(group, mat = {}) {
    super();
    this.g = group;
    this.mat = mat;
  }
}
