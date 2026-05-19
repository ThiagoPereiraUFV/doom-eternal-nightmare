/**
 * Zombie — enemy entity + mesh in one class.
 * Extends Enemy for game logic; MeshBuilderMixin adds geometry helpers.
 * Call createMesh(group, mat) to populate a THREE.Group with the zombie model.
 */
import { Enemy } from "./Enemy.js";
import { MeshBuilderMixin } from "../utils/MeshBuilder.js";

export class Zombie extends MeshBuilderMixin(Enemy) {
  static config = {
    type: "zombie",
    health: 80,
    speed: 0.015,
    color: { r: 120, g: 150 },
    targetHeight: 1.1,
    targetCenterHeight: 0.55,
  };

  constructor(x, y, config) {
    super("zombie", x, y, config ?? Zombie.config);
  }

  /**
   * Build the zombie mesh into the provided group.
   * @param {THREE.Group} group
   * @param {{ body, head, eye, horn }} mat
   */
  createMesh(group, mat) {
    this.g = group;
    this.mat = mat;
    const { body: bM, head: hM, eye: eM, horn: hornM } = mat;

    // ── Legs ──────────────────────────────────────────────────────────────
    const lL = this.box(0.15, 0.52, 0.15, bM, -0.12, 0.26, 0);
    const lR = this.box(0.15, 0.52, 0.15, bM, 0.12, 0.26, 0);
    // Knee joints
    this.sphere(0.09, bM, -0.12, 0.22, 0, 12);
    this.sphere(0.09, bM, 0.12, 0.22, 0, 12);
    // Lower legs
    this.box(0.13, 0.3, 0.13, bM, -0.12, 0.07, 0);
    this.box(0.13, 0.3, 0.13, bM, 0.12, 0.07, 0);
    // Feet — tattered shoes
    this.box(0.14, 0.07, 0.24, bM, -0.12, 0.01, -0.04);
    this.box(0.14, 0.07, 0.24, bM, 0.12, 0.01, -0.04);
    // Exposed toe bones
    this.cone(0.022, 0.07, hornM, -0.12, 0.04, -0.16, -0.25);
    this.cone(0.022, 0.07, hornM, 0.12, 0.04, -0.16, -0.25);

    // ── Torso — tattered clothing ─────────────────────────────────────────
    // Waist / pelvis
    this.box(0.34, 0.14, 0.22, bM, 0, 0.3, 0);
    this.sphere(0.18, bM, 0, 0.34, 0, 12); // pelvis bulge
    // Belt remnant
    this.box(0.36, 0.06, 0.24, hornM, 0, 0.4, 0);
    // Main torso — tattered shirt
    this.box(0.34, 0.44, 0.22, bM, 0, 0.6, 0);
    // Shirt collar/lapels
    this.box(0.28, 0.12, 0.16, hM, 0, 0.79, 0.03);
    // Wound — gaping dark cavity with rib hints
    this.box(0.15, 0.12, 0.06, hornM, -0.06, 0.62, -0.11);
    this.box(0.04, 0.08, 0.04, hornM, -0.12, 0.66, -0.13);
    this.box(0.04, 0.08, 0.04, hornM, -0.03, 0.66, -0.13);
    // Spine vertebrae visible at back
    for (let i = 0; i < 4; i++) {
      this.sphere(0.04, hornM, 0, 0.44 + i * 0.1, -0.12, 8);
    }

    // ── Shoulders (hunched, asymmetric) ───────────────────────────────────
    this.sphere(0.11, bM, -0.24, 0.82, 0, 12);
    this.sphere(0.12, bM, 0.24, 0.82, 0, 12);

    // ── Neck (thin, stretched) ────────────────────────────────────────────
    this.cyl(0.07, 0.1, 0.16, bM, 0, 0.89, 0);
    this.box(0.05, 0.14, 0.05, hornM, -0.07, 0.9, 0.04); // neck tendon
    this.box(0.05, 0.14, 0.05, hornM, 0.07, 0.9, 0.04);

    // ── Head ─────────────────────────────────────────────────────────────
    // Skull — slightly elongated, decayed
    this.sphere(0.23, hM, 0, 1.09, 0, 18);
    // Temporal hollows (sunken cheeks)
    this.sphere(0.09, bM, -0.19, 1.07, 0.1, 10);
    this.sphere(0.09, bM, 0.19, 1.07, 0.1, 10);
    // Forehead wrinkles / brow
    this.box(0.24, 0.05, 0.08, hornM, 0, 1.22, 0.18);
    // Nose — partially decomposed
    this.box(0.05, 0.06, 0.08, hornM, 0, 1.1, 0.22);
    // Jaw — lower face
    this.box(0.17, 0.08, 0.16, hornM, 0, 0.93, 0.16);
    // Exposed upper teeth
    for (let i = 0; i < 3; i++) {
      this.cone(0.02, 0.05, hornM, -0.06 + i * 0.06, 1.0, 0.28, -0.25);
    }
    // Exposed jawbone lower
    for (let i = 0; i < 3; i++) {
      this.cone(0.02, 0.05, hornM, -0.06 + i * 0.06, 0.9, 0.25, 0.3);
    }
    // Glowing eyes — bloodshot, sunken
    this.sphere(0.056, eM, -0.09, 1.12, 0.19, 14);
    this.sphere(0.056, eM, 0.09, 1.12, 0.19, 14);
    // Skull patches — exposed bone on scalp
    this.sphere(0.06, hornM, -0.16, 1.24, -0.06, 8);
    this.sphere(0.05, hornM, 0.18, 1.26, -0.03, 8);
    this.sphere(0.04, hornM, 0.04, 1.3, -0.08, 7);

    // ── Arms: one outstretched (shamble), one partly raised ───────────────
    const aUpperL = this.box(
      0.13,
      0.5,
      0.13,
      bM,
      -0.26,
      0.65,
      0.1,
      -0.88,
      0,
      0,
    );
    const aForeL = this.box(
      0.11,
      0.42,
      0.11,
      bM,
      -0.28,
      0.96,
      0.36,
      -0.93,
      0,
      0.05,
    );
    // Wrist bone
    this.sphere(0.08, bM, -0.28, 1.18, 0.5, 10);
    // Hand — skeletal fingers
    for (let i = 0; i < 3; i++) {
      this.cone(0.018, 0.09, hornM, -0.24 + i * 0.04, 1.22, 0.56, -0.3);
    }

    const aUpperR = this.box(
      0.13,
      0.5,
      0.13,
      bM,
      0.26,
      0.62,
      0.04,
      0.15,
      0,
      0.04,
    );
    const aForeR = this.box(0.11, 0.42, 0.11, bM, 0.27, 0.22, 0.04, 0.08, 0, 0);
    this.sphere(0.08, bM, 0.27, 0.0, 0.04, 10);
    // Dangling hand fingers
    for (let i = 0; i < 3; i++) {
      this.cone(0.018, 0.08, hornM, 0.23 + i * 0.04, -0.08, 0.05, 0.2);
    }

    this.g.userData.animate = (t) => {
      lL.rotation.x = Math.sin(t * 2.8) * 0.32;
      lR.rotation.x = Math.sin(t * 2.8 + Math.PI) * 0.32;
      aUpperL.rotation.x = -0.88 + Math.sin(t * 2.8) * 0.25;
      aForeL.rotation.x = -0.93 + Math.sin(t * 2.8 + 0.4) * 0.2;
      aUpperR.rotation.x = 0.15 + Math.sin(t * 2.8 + Math.PI) * 0.1;
      aForeR.rotation.x = 0.08 + Math.sin(t * 2.8 + Math.PI + 0.3) * 0.08;
    };
  }
}
