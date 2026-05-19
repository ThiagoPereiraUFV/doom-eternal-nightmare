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

    // ── Legs: digitigrade (bent-knee) stance ──────────────────────────────
    const lL = this.box(0.2, 0.46, 0.2, bM, -0.19, 0.3, 0.03);
    const lR = this.box(0.2, 0.46, 0.2, bM, 0.19, 0.3, 0.03);
    // Knee bulge
    this.sphere(0.12, bM, -0.19, 0.24, 0.0, 12);
    this.sphere(0.12, bM, 0.19, 0.24, 0.0, 12);
    // Lower legs angled backward
    const llL = this.box(0.15, 0.32, 0.15, bM, -0.19, 0.07, 0.1, 0.55);
    const llR = this.box(0.15, 0.32, 0.15, bM, 0.19, 0.07, 0.1, 0.55);
    // Cloven hooves
    this.box(0.1, 0.06, 0.2, hornM, -0.23, -0.05, 0.05);
    this.box(0.1, 0.06, 0.2, hornM, -0.14, -0.05, 0.05);
    this.box(0.1, 0.06, 0.2, hornM, 0.14, -0.05, 0.05);
    this.box(0.1, 0.06, 0.2, hornM, 0.23, -0.05, 0.05);
    // Ankle spurs
    this.cone(0.03, 0.1, hornM, -0.24, 0.0, 0.02, 0, 0, 0.5);
    this.cone(0.03, 0.1, hornM, 0.24, 0.0, 0.02, 0, 0, -0.5);

    // ── Pelvis / abdomen ──────────────────────────────────────────────────
    this.sphere(0.24, bM, 0, 0.36, 0, 14);
    this.box(0.42, 0.28, 0.32, bM, 0, 0.34, 0);

    // ── Torso ─────────────────────────────────────────────────────────────
    // Lower torso
    this.box(0.44, 0.2, 0.34, bM, 0, 0.5, 0);
    // Mid torso with rib cage suggestion
    this.box(0.5, 0.32, 0.36, bM, 0, 0.64, 0);
    // Rib ridges (left / right)
    for (let i = 0; i < 3; i++) {
      this.box(0.28, 0.04, 0.06, hornM, -0.22, 0.54 + i * 0.08, -0.16);
      this.box(0.28, 0.04, 0.06, hornM, 0.22, 0.54 + i * 0.08, -0.16);
    }
    // Upper chest — wider, powerful
    this.box(0.52, 0.26, 0.38, bM, 0, 0.82, 0);
    // Pectoral muscles
    this.sphere(0.14, bM, -0.18, 0.84, -0.14, 12);
    this.sphere(0.14, bM, 0.18, 0.84, -0.14, 12);

    // ── Shoulders ────────────────────────────────────────────────────────
    this.sphere(0.17, bM, -0.38, 0.9, 0, 14);
    this.sphere(0.17, bM, 0.38, 0.9, 0, 14);
    // Shoulder armor spikes
    this.cone(0.06, 0.2, hornM, -0.44, 1.04, -0.04, 0, 0, -0.45);
    this.cone(0.06, 0.2, hornM, 0.44, 1.04, -0.04, 0, 0, 0.45);
    this.cone(0.04, 0.14, hornM, -0.5, 1.14, -0.02, 0, 0, -0.65);
    this.cone(0.04, 0.14, hornM, 0.5, 1.14, -0.02, 0, 0, 0.65);

    // ── Neck ─────────────────────────────────────────────────────────────
    this.cyl(0.12, 0.16, 0.18, bM, 0, 1.03, 0);
    // Neck muscle cords
    this.box(0.06, 0.16, 0.06, bM, -0.1, 1.04, 0.02);
    this.box(0.06, 0.16, 0.06, bM, 0.1, 1.04, 0.02);

    // ── Head ─────────────────────────────────────────────────────────────
    this.sphere(0.24, hM, 0, 1.22, 0, 18);
    // Cranial ridge — more angular skull shape
    this.box(0.18, 0.08, 0.26, hM, 0, 1.34, -0.04);
    // Heavy brow ridge
    this.box(0.3, 0.07, 0.1, hornM, 0, 1.32, 0.19);
    // Cheek bones
    this.sphere(0.07, hM, -0.2, 1.18, 0.12, 10);
    this.sphere(0.07, hM, 0.2, 1.18, 0.12, 10);
    // Snout / muzzle
    this.box(0.2, 0.12, 0.2, hM, 0, 1.1, 0.22);
    this.box(0.16, 0.08, 0.14, hM, 0, 1.06, 0.32);
    // Teeth — upper & lower rows
    for (let i = 0; i < 4; i++) {
      const tx = -0.09 + i * 0.06;
      this.cone(0.02, 0.06, hornM, tx, 1.04, 0.38, -0.3); // upper fangs
      this.cone(0.02, 0.05, hornM, tx + 0.01, 1.02, 0.36, 0.3); // lower fangs
    }
    // Glowing eyes
    this.sphere(0.065, eM, -0.1, 1.22, 0.22, 14);
    this.sphere(0.065, eM, 0.1, 1.22, 0.22, 14);
    // Eye socket recesses
    this.sphere(0.08, hM, -0.11, 1.22, 0.17, 10);
    this.sphere(0.08, hM, 0.11, 1.22, 0.17, 10);

    // ── Horns (multi-segment, curved) ─────────────────────────────────────
    this.cone(0.06, 0.26, hornM, -0.16, 1.42, 0, 0, 0, -0.42);
    this.cone(0.04, 0.15, hornM, -0.26, 1.56, 0, 0, 0, -0.65);
    this.cone(0.02, 0.08, hornM, -0.34, 1.65, 0, 0, 0, -0.82);
    this.cone(0.06, 0.26, hornM, 0.16, 1.42, 0, 0, 0, 0.42);
    this.cone(0.04, 0.15, hornM, 0.26, 1.56, 0, 0, 0, 0.65);
    this.cone(0.02, 0.08, hornM, 0.34, 1.65, 0, 0, 0, 0.82);

    // ── Spine ridge (dorsal spikes) ───────────────────────────────────────
    for (let i = 0; i < 5; i++) {
      this.cone(0.04, 0.14, hornM, 0, 0.38 + i * 0.14, -0.2, -0.44);
    }

    // ── Arms ──────────────────────────────────────────────────────────────
    // Upper arm — thick deltoid into bicep
    const aUpperL = this.box(0.19, 0.46, 0.19, bM, -0.38, 0.7, 0);
    this.sphere(0.13, bM, -0.38, 0.74, 0, 12); // elbow joint
    const aForeL = this.box(0.17, 0.4, 0.17, bM, -0.38, 0.36, 0);
    // Wrist
    this.sphere(0.1, bM, -0.38, 0.14, 0, 10);
    // Hand / claw base
    this.box(0.15, 0.08, 0.13, bM, -0.38, 0.06, 0);
    // Three talons
    const clawL1 = this.cone(0.025, 0.16, hornM, -0.3, 0.0, -0.05, -0.28);
    const clawL2 = this.cone(0.025, 0.17, hornM, -0.38, -0.02, -0.06, -0.32);
    const clawL3 = this.cone(0.025, 0.16, hornM, -0.46, 0.0, -0.05, -0.28);

    const aUpperR = this.box(0.19, 0.46, 0.19, bM, 0.38, 0.7, 0);
    this.sphere(0.13, bM, 0.38, 0.74, 0, 12);
    const aForeR = this.box(0.17, 0.4, 0.17, bM, 0.38, 0.36, 0);
    this.sphere(0.1, bM, 0.38, 0.14, 0, 10);
    this.box(0.15, 0.08, 0.13, bM, 0.38, 0.06, 0);
    const clawR1 = this.cone(0.025, 0.16, hornM, 0.3, 0.0, -0.05, -0.28);
    const clawR2 = this.cone(0.025, 0.17, hornM, 0.38, -0.02, -0.06, -0.32);
    const clawR3 = this.cone(0.025, 0.16, hornM, 0.46, 0.0, -0.05, -0.28);

    // ── Tail (bonus detail) ───────────────────────────────────────────────
    this.sphere(0.09, bM, 0.04, 0.3, -0.2, 10);
    this.sphere(0.07, bM, 0.08, 0.22, -0.3, 8);
    this.sphere(0.05, bM, 0.13, 0.14, -0.36, 8);
    this.cone(0.04, 0.14, hornM, 0.17, 0.08, -0.42, -0.5, 0, 0.3);

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
      clawL1.rotation.x = -0.28 + clawSwing;
      clawL2.rotation.x = -0.32 + clawSwing * 0.8;
      clawL3.rotation.x = -0.28 + clawSwing * 1.2;
      clawR1.rotation.x = -0.28 - clawSwing;
      clawR2.rotation.x = -0.32 - clawSwing * 0.8;
      clawR3.rotation.x = -0.28 - clawSwing * 1.2;
    };
  }
}
