/**
 * Brute — enemy entity + mesh in one class.
 * Extends Enemy for game logic; MeshBuilderMixin adds geometry helpers.
 * Call createMesh(group, mat) to populate a THREE.Group with the brute model.
 */
import { Enemy } from "./Enemy.js";
import { MeshBuilderMixin } from "../utils/MeshBuilder.js";

export class Brute extends MeshBuilderMixin(Enemy) {
  constructor(x, y, config) {
    super("brute", x, y, config);
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

    // Torso - multi-part for muscle definition
    this.box(0.7, 0.45, 0.48, bM, 0, 0.68, 0); // lower torso
    this.box(0.64, 0.42, 0.44, bM, 0, 1.04, 0); // upper torso
    this.box(0.58, 0.22, 0.4, hM, 0, 1.36, 0); // neck/trap area
    // Pecs
    this.box(0.3, 0.16, 0.18, bM, -0.2, 1.08, -0.22);
    this.box(0.3, 0.16, 0.18, bM, 0.2, 1.08, -0.22);
    // Head - massive and brutish
    this.sphere(0.26, hM, 0, 1.68, 0, 12);
    this.sphere(0.18, hM, 0, 1.55, 0.18, 10); // jaw protrusion
    // Eyes deep set
    this.sphere(0.07, eM, -0.12, 1.72, 0.2, 8);
    this.sphere(0.07, eM, 0.12, 1.72, 0.2, 8);
    // Brow ridge
    this.box(0.38, 0.06, 0.08, hornM, 0, 1.8, 0.16);
    // Horns - curved with multiple segments
    this.cone(0.06, 0.28, hornM, -0.22, 1.92, 0.04, 0, 0, -0.35);
    this.cone(0.04, 0.14, hornM, -0.34, 2.08, 0.02, 0, 0, -0.55);
    this.cone(0.06, 0.28, hornM, 0.22, 1.92, 0.04, 0, 0, 0.35);
    this.cone(0.04, 0.14, hornM, 0.34, 2.08, 0.02, 0, 0, 0.55);
    // Arms - massive, angled outward
    const aUpperL = this.box(0.28, 0.55, 0.28, bM, -0.56, 0.96, 0, 0, 0, 0.28);
    const aForeL = this.box(0.24, 0.48, 0.24, bM, -0.7, 0.52, 0, 0, 0, 0.15);
    const handL = this.sphere(0.16, bM, -0.78, 0.24, 0, 7);
    const aUpperR = this.box(0.28, 0.55, 0.28, bM, 0.56, 0.96, 0, 0, 0, -0.28);
    const aForeR = this.box(0.24, 0.48, 0.24, bM, 0.7, 0.52, 0, 0, 0, -0.15);
    const handR = this.sphere(0.16, bM, 0.78, 0.24, 0, 7);
    // Legs - thick, short
    const lL = this.box(0.3, 0.52, 0.3, bM, -0.24, 0.26, 0);
    const lR = this.box(0.3, 0.52, 0.3, bM, 0.24, 0.26, 0);
    // Feet
    this.box(0.3, 0.1, 0.38, bM, -0.24, 0.02, -0.06);
    this.box(0.3, 0.1, 0.38, bM, 0.24, 0.02, -0.06);
    // Spinal ridge bumps
    for (let i = 0; i < 5; i++) {
      this.sphere(0.05, hornM, 0, 0.7 + i * 0.14, -0.24, 6);
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
