/**
 * Zombie — enemy entity + mesh in one class.
 * Extends Enemy for game logic; MeshBuilderMixin adds geometry helpers.
 * Call createMesh(group, mat) to populate a THREE.Group with the zombie model.
 */
import { Enemy } from "./Enemy.js";
import { MeshBuilderMixin } from "../utils/MeshBuilder.js";

export class Zombie extends MeshBuilderMixin(Enemy) {
  constructor(x, y, config) {
    super("zombie", x, y, config);
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

    // Torso: tattered clothing layered look
    this.box(0.36, 0.62, 0.24, bM, 0, 0.5, 0); // main body
    this.box(0.3, 0.2, 0.18, hM, 0, 0.82, 0.02); // shirt collar area
    this.box(0.38, 0.12, 0.26, bM, 0, 0.32, 0); // belt/waist
    // Wound detail (darker patch)
    this.box(0.14, 0.1, 0.04, hornM, -0.08, 0.58, -0.12);
    // Head with rotted features
    this.sphere(0.22, hM, 0, 0.95, 0, 10);
    this.sphere(0.15, bM, 0, 0.85, 0.14, 8); // sunken cheek
    // Jaw detail
    this.box(0.18, 0.07, 0.14, hornM, 0, 0.78, 0.16);
    // Eyes sunken
    this.sphere(0.048, eM, -0.09, 0.98, 0.18, 7);
    this.sphere(0.048, eM, 0.09, 0.98, 0.18, 7);
    // Exposed skull patches
    this.sphere(0.05, hornM, -0.16, 1.04, -0.06, 5);
    this.sphere(0.04, hornM, 0.18, 1.06, -0.04, 5);
    // Arms: one outstretched, one hanging
    const aUpperL = this.box(
      0.14,
      0.52,
      0.14,
      bM,
      -0.28,
      0.62,
      0.14,
      -0.9,
      0,
      0,
    );
    const aForeL = this.box(
      0.12,
      0.45,
      0.12,
      bM,
      -0.28,
      0.98,
      0.38,
      -0.95,
      0,
      0.05,
    );
    this.sphere(0.09, bM, -0.28, 1.2, 0.52, 6);
    const aUpperR = this.box(
      0.14,
      0.52,
      0.14,
      bM,
      0.28,
      0.58,
      0.04,
      0.12,
      0,
      0.05,
    );
    const aForeR = this.box(0.12, 0.45, 0.12, bM, 0.28, 0.18, 0.04, 0.06, 0, 0);
    this.sphere(0.09, bM, 0.28, -0.06, 0.04, 6);
    // Legs: lopsided
    const lL = this.box(0.16, 0.5, 0.16, bM, -0.12, 0.25, 0);
    const lR = this.box(0.16, 0.5, 0.16, bM, 0.12, 0.25, 0);
    // Feet with visible bones
    this.box(0.14, 0.06, 0.22, bM, -0.12, 0.01, -0.04);
    this.box(0.14, 0.06, 0.22, bM, 0.12, 0.01, -0.04);
    this.sphere(0.045, hornM, -0.12, 0.06, -0.14, 5); // toe bone
    this.sphere(0.045, hornM, 0.12, 0.06, -0.14, 5);

    this.g.userData.animate = (t) => {
      lL.rotation.x = Math.sin(t * 2.8) * 0.32;
      lR.rotation.x = Math.sin(t * 2.8 + Math.PI) * 0.32;
      aUpperL.rotation.x = -0.9 + Math.sin(t * 2.8) * 0.25;
      aForeL.rotation.x = -0.95 + Math.sin(t * 2.8 + 0.4) * 0.2;
      aUpperR.rotation.x = 0.12 + Math.sin(t * 2.8 + Math.PI) * 0.1;
      aForeR.rotation.x = 0.06 + Math.sin(t * 2.8 + Math.PI + 0.3) * 0.08;
    };
  }
}
