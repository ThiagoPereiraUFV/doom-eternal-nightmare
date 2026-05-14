/**
 * Demon — enemy entity + mesh in one class.
 * Extends Enemy for game logic; MeshBuilderMixin adds geometry helpers.
 * Call createMesh(group, mat) to populate a THREE.Group with the demon model.
 */
import { Enemy } from "./Enemy.js";
import { MeshBuilderMixin } from "../utils/MeshBuilder.js";

export class Demon extends MeshBuilderMixin(Enemy) {
  static config = {
    type: "demon",
    health: 50,
    speed: 0.025,
    color: { r: 180, g: 40 },
    targetHeight: 1.45,
    targetCenterHeight: 0.72,
  };

  constructor(x, y, config) {
    super("demon", x, y, config ?? Demon.config);
  }

  /**
   * Build the demon mesh into the provided group.
   * @param {THREE.Group} group
   * @param {{ body, head, eye, horn }} mat
   */
  createMesh(group, mat) {
    this.g = group;
    this.mat = mat;
    const { body: bM, head: hM, eye: eM, horn: hornM } = mat;

    // Abdomen
    this.box(0.42, 0.3, 0.32, bM, 0, 0.32, 0);
    // Main torso - wider at chest
    this.box(0.48, 0.42, 0.36, bM, 0, 0.6, 0);
    // Chest muscle definition
    this.box(0.2, 0.18, 0.14, bM, -0.16, 0.66, -0.18);
    this.box(0.2, 0.18, 0.14, bM, 0.16, 0.66, -0.18);
    // Shoulders - wide and spiked
    this.sphere(0.16, bM, -0.36, 0.84, 0, 8);
    this.sphere(0.16, bM, 0.36, 0.84, 0, 8);
    // Shoulder spikes
    this.cone(0.05, 0.18, hornM, -0.4, 0.98, 0, 0, 0, -0.4);
    this.cone(0.05, 0.18, hornM, 0.4, 0.98, 0, 0, 0, 0.4);
    // Head - angular and demonic
    this.sphere(0.22, hM, 0, 1.06, 0, 10);
    this.box(0.26, 0.1, 0.22, hM, 0, 0.92, 0.1); // heavy jaw
    // Snout
    this.box(0.16, 0.1, 0.14, hM, 0, 0.94, 0.2);
    // Eyes - glowing with orbital ridge
    this.box(0.2, 0.04, 0.06, hornM, 0, 1.12, 0.18); // brow ridge
    this.sphere(0.055, eM, -0.09, 1.08, 0.21, 8);
    this.sphere(0.055, eM, 0.09, 1.08, 0.21, 8);
    // Horns - branched
    this.cone(0.05, 0.22, hornM, -0.14, 1.22, 0, 0, 0, -0.4);
    this.cone(0.04, 0.12, hornM, -0.22, 1.36, 0, 0, 0, -0.6);
    this.cone(0.05, 0.22, hornM, 0.14, 1.22, 0, 0, 0, 0.4);
    this.cone(0.04, 0.12, hornM, 0.22, 1.36, 0, 0, 0, 0.6);
    // Spine ridge
    for (let i = 0; i < 4; i++) {
      this.cone(0.04, 0.12, hornM, 0, 0.4 + i * 0.16, -0.18, -0.4);
    }
    // Arms with forearm + hand
    const aUpperL = this.box(0.18, 0.44, 0.18, bM, -0.36, 0.64, 0);
    const aForeL = this.box(0.16, 0.38, 0.16, bM, -0.36, 0.28, 0);
    const clawL1 = this.box(0.04, 0.14, 0.04, hornM, -0.3, 0.06, -0.06, -0.3);
    const clawL2 = this.box(0.04, 0.14, 0.04, hornM, -0.36, 0.05, -0.08, -0.3);
    const clawL3 = this.box(0.04, 0.14, 0.04, hornM, -0.42, 0.06, -0.06, -0.3);
    const aUpperR = this.box(0.18, 0.44, 0.18, bM, 0.36, 0.64, 0);
    const aForeR = this.box(0.16, 0.38, 0.16, bM, 0.36, 0.28, 0);
    const clawR1 = this.box(0.04, 0.14, 0.04, hornM, 0.3, 0.06, -0.06, -0.3);
    const clawR2 = this.box(0.04, 0.14, 0.04, hornM, 0.36, 0.05, -0.08, -0.3);
    const clawR3 = this.box(0.04, 0.14, 0.04, hornM, 0.42, 0.06, -0.06, -0.3);
    // Legs with digitigrade stance
    const lL = this.box(0.2, 0.44, 0.2, bM, -0.18, 0.28, 0.04);
    const lR = this.box(0.2, 0.44, 0.2, bM, 0.18, 0.28, 0.04);
    // Lower legs angled back
    const llL = this.box(0.16, 0.3, 0.16, bM, -0.18, 0.06, 0.1, 0.5);
    const llR = this.box(0.16, 0.3, 0.16, bM, 0.18, 0.06, 0.1, 0.5);
    // Feet/claws
    this.box(0.18, 0.05, 0.28, bM, -0.18, -0.04, 0.04);
    this.box(0.18, 0.05, 0.28, bM, 0.18, -0.04, 0.04);

    this.g.userData.animate = (t) => {
      lL.rotation.x = Math.sin(t * 4.5) * 0.44;
      lR.rotation.x = Math.sin(t * 4.5 + Math.PI) * 0.44;
      llL.rotation.x = 0.5 + Math.sin(t * 4.5) * 0.22;
      llR.rotation.x = 0.5 + Math.sin(t * 4.5 + Math.PI) * 0.22;
      aUpperL.rotation.x = Math.sin(t * 4.5 + Math.PI) * 0.32;
      aUpperR.rotation.x = Math.sin(t * 4.5) * 0.32;
      aForeL.rotation.x = Math.sin(t * 4.5 + 0.5) * 0.2;
      aForeR.rotation.x = Math.sin(t * 4.5 + Math.PI + 0.5) * 0.2;
      const clawSwing = Math.sin(t * 9) * 0.08;
      clawL1.rotation.x = -0.3 + clawSwing;
      clawL2.rotation.x = -0.3 + clawSwing * 0.8;
      clawL3.rotation.x = -0.3 + clawSwing * 1.2;
      clawR1.rotation.x = -0.3 - clawSwing;
      clawR2.rotation.x = -0.3 - clawSwing * 0.8;
      clawR3.rotation.x = -0.3 - clawSwing * 1.2;
    };
  }
}
