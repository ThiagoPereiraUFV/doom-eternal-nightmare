/**
 * Ghost — enemy entity + mesh in one class.
 * Extends Enemy for game logic; MeshBuilderMixin adds geometry helpers.
 * Call createMesh(group, mat) to populate a THREE.Group with the ghost model.
 */
import { Enemy } from "./Enemy.js";
import { MeshBuilderMixin } from "../utils/MeshBuilder.js";

export class Ghost extends MeshBuilderMixin(Enemy) {
  static config = {
    type: "ghost",
    health: 30,
    speed: 0.03,
    color: { r: 200, g: 200 },
    targetHeight: 0.95,
    targetCenterHeight: 0.52,
  };

  constructor(x, y, config) {
    super("ghost", x, y, config ?? Ghost.config);
  }

  /**
   * Build the ghost mesh into the provided group.
   * @param {THREE.Group} group
   * @param {{ body, eye }} mat
   */
  createMesh(group, mat) {
    this.g = group;
    this.mat = mat;
    const { body: bM, eye: eM } = mat;

    // ── Ethereal core — main body orb ─────────────────────────────────────
    const body = this.sphere(0.28, bM, 0, 0.66, 0, 18);

    // ── Face features ─────────────────────────────────────────────────────
    // Eyes — large, hollow, menacing
    this.sphere(0.075, eM, -0.11, 0.72, 0.24, 14);
    this.sphere(0.075, eM, 0.11, 0.72, 0.24, 14);
    // Inner eye glow cores (brighter centre)
    this.sphere(0.04, eM, -0.11, 0.72, 0.26, 10);
    this.sphere(0.04, eM, 0.11, 0.72, 0.26, 10);
    // Mouth — ragged scream expression
    this.sphere(0.038, eM, -0.05, 0.64, 0.27, 10);
    this.sphere(0.038, eM, 0.0, 0.63, 0.28, 10);
    this.sphere(0.038, eM, 0.05, 0.64, 0.27, 10);
    // Brow ridges (faint indentations via mat)
    this.box(0.16, 0.03, 0.04, bM, -0.05, 0.78, 0.25);
    this.box(0.16, 0.03, 0.04, bM, 0.05, 0.78, 0.25);

    // ── Ectoplasmic torso — tapered toward base ───────────────────────────
    const seg1 = this.sphere(0.22, bM, 0, 0.44, 0, 14);
    const seg2 = this.sphere(0.17, bM, 0, 0.27, 0, 12);
    const seg3 = this.sphere(0.12, bM, 0, 0.14, 0, 10);
    const seg4 = this.sphere(0.07, bM, 0, 0.05, 0, 8);

    // ── Arm wisps — fluid, extended ───────────────────────────────────────
    const wL  = this.sphere(0.11, bM, -0.36, 0.56, 0.06, 12);
    const wR  = this.sphere(0.11, bM, 0.36, 0.56, 0.06, 12);
    const wL2 = this.sphere(0.08, bM, -0.48, 0.5, 0.1, 10);
    const wR2 = this.sphere(0.08, bM, 0.48, 0.5, 0.1, 10);
    const wL3 = this.sphere(0.05, bM, -0.58, 0.46, 0.12, 8);
    const wR3 = this.sphere(0.05, bM, 0.58, 0.46, 0.12, 8);
    // Wisp fingertip glow
    this.sphere(0.04, eM, -0.64, 0.44, 0.13, 8);
    this.sphere(0.04, eM, 0.64, 0.44, 0.13, 8);

    // ── Trailing energy wisps below body ─────────────────────────────────
    const trail1 = this.sphere(0.06, bM, -0.1, 0.02, 0.02, 8);
    const trail2 = this.sphere(0.05, bM, 0.1, -0.02, 0.0, 8);
    const trail3 = this.sphere(0.04, bM, 0.0, -0.06, 0.04, 7);

    this.g.userData.animate = (t) => {
      const bob = Math.sin(t * 1.8);
      body.position.y  = 0.66 + bob * 0.1;
      seg1.position.y  = 0.44 + Math.sin(t * 1.8 + 0.25) * 0.09;
      seg2.position.y  = 0.27 + Math.sin(t * 1.8 + 0.5) * 0.07;
      seg3.position.y  = 0.14 + Math.sin(t * 1.8 + 0.75) * 0.05;
      seg4.position.y  = 0.05 + Math.sin(t * 1.8 + 1.0) * 0.04;
      // Arm sway
      const sw = Math.sin(t * 2.2);
      wL.position.set(-0.36 + sw * 0.08,  0.56 + Math.cos(t * 2.2) * 0.06, 0.06);
      wR.position.set( 0.36 + Math.sin(t * 2.2 + 1.1) * 0.08, 0.56 + Math.cos(t * 2.2 + 1.1) * 0.06, 0.06);
      wL2.position.set(-0.48 + Math.sin(t * 2.5) * 0.1,  0.5 + Math.cos(t * 2.5) * 0.08, 0.1);
      wR2.position.set( 0.48 + Math.sin(t * 2.5 + 1.2) * 0.1, 0.5 + Math.cos(t * 2.5 + 1.2) * 0.08, 0.1);
      wL3.position.set(-0.58 + Math.sin(t * 2.9) * 0.12, 0.46 + Math.cos(t * 2.9) * 0.09, 0.12);
      wR3.position.set( 0.58 + Math.sin(t * 2.9 + 1.3) * 0.12, 0.46 + Math.cos(t * 2.9 + 1.3) * 0.09, 0.12);
      // Trailing wisps drift
      trail1.position.set(-0.1 + Math.sin(t * 3.1) * 0.06, 0.02 + bob * 0.04, 0.02);
      trail2.position.set( 0.1 + Math.sin(t * 3.4 + 1) * 0.06, -0.02 + bob * 0.03, 0.0);
      trail3.position.set( 0.0 + Math.sin(t * 2.7 + 2) * 0.05, -0.06 + bob * 0.03, 0.04);
      // Pulsing opacity
      if (bM.transparent) {
        bM.opacity = 0.48 + Math.sin(t * 2.2) * 0.16;
      }
    };
  }
}
