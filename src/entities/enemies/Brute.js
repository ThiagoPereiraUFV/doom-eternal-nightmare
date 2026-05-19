/**
 * Brute — enemy entity + mesh in one class.
 * Extends Enemy for game logic; MeshBuilderMixin adds geometry helpers.
 * Call createMesh(group, mat) to populate a THREE.Group with the brute model.
 */
import { Enemy } from "./Enemy.js";
import { MeshBuilderMixin } from "../../utils/MeshBuilder.js";

export class Brute extends MeshBuilderMixin(Enemy) {
  static config = {
    type: "brute",
    health: 120,
    speed: 0.01,
    color: { r: 140, g: 60 },
    targetHeight: 2.2,
    targetCenterHeight: 1.1,
  };

  constructor(x, y, config) {
    super("brute", x, y, config ?? Brute.config);
  }

  /**
   * Build the brute mesh into the provided group.
   * @param {THREE.Group} group
   * @param {{ body, head, eye, horn }} mat
   */
  createMesh(group, mat) {
    this.g = group;
    this.mat = mat;
    const { body: bM, head: hM, eye: eM, horn: hornM } = mat;

    // ── Legs — thick pillars ──────────────────────────────────────────────
    const lL = this.box(0.3, 0.56, 0.32, bM, -0.26, 0.28, 0);
    const lR = this.box(0.3, 0.56, 0.32, bM, 0.26, 0.28, 0);
    // Knee caps (prominent)
    this.sphere(0.14, bM, -0.26, 0.24, -0.04, 14);
    this.sphere(0.14, bM, 0.26, 0.24, -0.04, 14);
    // Lower legs — tapering slightly
    this.box(0.26, 0.36, 0.28, bM, -0.26, 0.06, 0.02);
    this.box(0.26, 0.36, 0.28, bM, 0.26, 0.06, 0.02);
    // Feet — massive, flat
    this.box(0.3, 0.12, 0.46, bM, -0.26, 0.02, -0.1);
    this.box(0.3, 0.12, 0.46, bM, 0.26, 0.02, -0.1);
    // Toe bone spurs
    this.cone(0.04, 0.1, hornM, -0.32, 0.06, -0.3, -0.4, 0, 0.2);
    this.cone(0.04, 0.1, hornM, 0.32, 0.06, -0.3, -0.4, 0, -0.2);

    // ── Pelvis / lower torso ──────────────────────────────────────────────
    this.sphere(0.36, bM, 0, 0.58, 0, 16);
    this.box(0.72, 0.3, 0.52, bM, 0, 0.6, 0);

    // ── Torso — layered muscle groups ────────────────────────────────────
    this.box(0.7, 0.44, 0.5, bM, 0, 0.82, 0);
    // Abdominal muscles
    for (let i = 0; i < 3; i++) {
      this.box(0.2, 0.1, 0.08, hM, -0.16, 0.66 + i * 0.12, -0.24);
      this.box(0.2, 0.1, 0.08, hM, 0.16, 0.66 + i * 0.12, -0.24);
    }
    // Upper chest — very wide
    this.box(0.68, 0.4, 0.46, bM, 0, 1.16, 0);
    // Pectoral slabs
    this.sphere(0.2, bM, -0.24, 1.16, -0.18, 14);
    this.sphere(0.2, bM, 0.24, 1.16, -0.18, 14);
    // Sternum ridge
    this.box(0.06, 0.34, 0.08, hornM, 0, 1.16, -0.24);
    // Trap muscles into neck
    this.box(0.62, 0.2, 0.42, hM, 0, 1.44, 0);

    // ── Spinal ridge ─────────────────────────────────────────────────────
    for (let i = 0; i < 6; i++) {
      this.sphere(0.06, hornM, 0, 0.64 + i * 0.14, -0.26, 10);
    }
    // Shoulder blade protrusions
    this.box(0.16, 0.24, 0.08, hornM, -0.3, 1.0, -0.26);
    this.box(0.16, 0.24, 0.08, hornM, 0.3, 1.0, -0.26);

    // ── Shoulders — boulder-sized ────────────────────────────────────────
    this.sphere(0.22, bM, -0.62, 1.1, 0, 16);
    this.sphere(0.22, bM, 0.62, 1.1, 0, 16);

    // ── Neck — thick and powerful ─────────────────────────────────────────
    this.cyl(0.18, 0.22, 0.24, bM, 0, 1.56, 0);
    // Neck muscle cords
    this.box(0.08, 0.22, 0.08, hM, -0.14, 1.57, 0.08);
    this.box(0.08, 0.22, 0.08, hM, 0.14, 1.57, 0.08);

    // ── Head ─────────────────────────────────────────────────────────────
    this.sphere(0.3, hM, 0, 1.88, 0, 20);
    // Cranial ridge — brutish forward slope
    this.box(0.22, 0.1, 0.28, hM, 0, 2.0, -0.04);
    // Heavy brow ridge
    this.box(0.44, 0.1, 0.12, hornM, 0, 1.98, 0.22);
    // Cheekbones — wide and prominent
    this.sphere(0.1, hM, -0.26, 1.84, 0.14, 12);
    this.sphere(0.1, hM, 0.26, 1.84, 0.14, 12);
    // Massive jaw / chin
    this.sphere(0.22, hM, 0, 1.7, 0.2, 14);
    this.box(0.26, 0.1, 0.18, hM, 0, 1.66, 0.26);
    // Teeth — large brutish fangs
    this.cone(0.04, 0.1, hornM, -0.1, 1.74, 0.38, -0.3);
    this.cone(0.04, 0.1, hornM, 0.0, 1.72, 0.4, -0.28);
    this.cone(0.04, 0.1, hornM, 0.1, 1.74, 0.38, -0.3);
    this.cone(0.03, 0.08, hornM, -0.08, 1.62, 0.36, 0.28);
    this.cone(0.03, 0.08, hornM, 0.08, 1.62, 0.36, 0.28);
    // Burning deep-set eyes
    this.sphere(0.08, eM, -0.14, 1.92, 0.24, 14);
    this.sphere(0.08, eM, 0.14, 1.92, 0.24, 14);

    // ── Horns — curved, segmented ─────────────────────────────────────────
    this.cone(0.07, 0.3, hornM, -0.24, 2.1, 0.04, 0, 0, -0.38);
    this.cone(0.05, 0.18, hornM, -0.38, 2.26, 0.02, 0, 0, -0.58);
    this.cone(0.03, 0.1, hornM, -0.48, 2.38, 0.0, 0, 0, -0.72);
    this.cone(0.07, 0.3, hornM, 0.24, 2.1, 0.04, 0, 0, 0.38);
    this.cone(0.05, 0.18, hornM, 0.38, 2.26, 0.02, 0, 0, 0.58);
    this.cone(0.03, 0.1, hornM, 0.48, 2.38, 0.0, 0, 0, 0.72);

    // ── Arms — massive, slightly hunched ─────────────────────────────────
    const aUpperL = this.box(0.3, 0.58, 0.3, bM, -0.62, 1.02, 0, 0, 0, 0.26);
    this.sphere(0.17, bM, -0.74, 0.74, 0, 14); // elbow
    const aForeL = this.box(0.26, 0.5, 0.26, bM, -0.78, 0.5, 0, 0, 0, 0.12);
    const handL = this.sphere(0.18, bM, -0.88, 0.24, 0, 12);
    // Knuckles
    for (let i = 0; i < 3; i++) {
      this.sphere(0.04, hornM, -0.82 + i * 0.04, 0.12, -0.12 + i * 0.03, 8);
    }
    const aUpperR = this.box(0.3, 0.58, 0.3, bM, 0.62, 1.02, 0, 0, 0, -0.26);
    this.sphere(0.17, bM, 0.74, 0.74, 0, 14);
    const aForeR = this.box(0.26, 0.5, 0.26, bM, 0.78, 0.5, 0, 0, 0, -0.12);
    const handR = this.sphere(0.18, bM, 0.88, 0.24, 0, 12);
    for (let i = 0; i < 3; i++) {
      this.sphere(0.04, hornM, 0.82 + i * 0.04, 0.12, -0.12 + i * 0.03, 8);
    }

    this.g.userData.animate = (t) => {
      lL.rotation.x = Math.sin(t * 2.8) * 0.38;
      lR.rotation.x = Math.sin(t * 2.8 + Math.PI) * 0.38;
      aUpperL.rotation.x = Math.sin(t * 2.8 + Math.PI) * 0.22;
      aUpperR.rotation.x = Math.sin(t * 2.8) * 0.22;
      aForeL.rotation.x = Math.sin(t * 2.8) * 0.18;
      aForeR.rotation.x = Math.sin(t * 2.8 + Math.PI) * 0.18;
      handL.position.y = 0.24 + Math.sin(t * 2.8 + 0.5) * 0.04;
      handR.position.y = 0.24 + Math.sin(t * 2.8 + Math.PI + 0.5) * 0.04;
    };
  }
}
