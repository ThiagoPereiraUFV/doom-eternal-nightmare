/**
 * Ghost — enemy entity + mesh in one class.
 * Extends Enemy for game logic; MeshBuilderMixin adds geometry helpers.
 * Call createMesh(group, mat) to populate a THREE.Group with the ghost model.
 */
import { Enemy } from "./Enemy.js";
import { MeshBuilderMixin } from "../utils/MeshBuilder.js";

export class Ghost extends MeshBuilderMixin(Enemy) {
  constructor(x, y, config) {
    super("ghost", x, y, config);
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

    // Ethereal form with trailing wisp tails
    const body = this.sphere(0.26, bM, 0, 0.65, 0, 12);
    // Face features
    this.sphere(0.07, eM, -0.1, 0.7, 0.22);
    this.sphere(0.07, eM, 0.1, 0.7, 0.22);
    this.sphere(0.04, eM, -0.05, 0.63, 0.24);
    this.sphere(0.04, eM, 0.05, 0.63, 0.24);
    this.sphere(0.03, eM, 0.0, 0.63, 0.25); // mouth
    // Trailing body segments
    const seg1 = this.sphere(0.2, bM, 0, 0.42, 0, 10);
    const seg2 = this.sphere(0.14, bM, 0, 0.24, 0, 8);
    const seg3 = this.sphere(0.08, bM, 0, 0.11, 0, 6);
    // Arm wisps
    const wL = this.sphere(0.1, bM, -0.34, 0.55, 0.05, 7);
    const wR = this.sphere(0.1, bM, 0.34, 0.55, 0.05, 7);
    const wL2 = this.sphere(0.07, bM, -0.44, 0.5, 0.08, 6);
    const wR2 = this.sphere(0.07, bM, 0.44, 0.5, 0.08, 6);

    this.g.userData.animate = (t) => {
      body.position.y = 0.65 + Math.sin(t * 1.8) * 0.1;
      seg1.position.y = 0.42 + Math.sin(t * 1.8 + 0.3) * 0.08;
      seg2.position.y = 0.24 + Math.sin(t * 1.8 + 0.6) * 0.06;
      seg3.position.y = 0.11 + Math.sin(t * 1.8 + 0.9) * 0.04;
      wL.position.set(
        -0.34 + Math.sin(t * 2.2) * 0.08,
        0.55 + Math.cos(t * 2.2) * 0.06,
        0.05,
      );
      wR.position.set(
        0.34 + Math.sin(t * 2.2 + 1) * 0.08,
        0.55 + Math.cos(t * 2.2 + 1) * 0.06,
        0.05,
      );
      wL2.position.set(
        -0.44 + Math.sin(t * 2.6) * 0.1,
        0.5 + Math.cos(t * 2.6) * 0.08,
        0.08,
      );
      wR2.position.set(
        0.44 + Math.sin(t * 2.6 + 1) * 0.1,
        0.5 + Math.cos(t * 2.6 + 1) * 0.08,
        0.08,
      );
      // Pulsing opacity
      if (bM.transparent) {
        bM.opacity = 0.5 + Math.sin(t * 2.2) * 0.15;
      }
    };
  }
}
