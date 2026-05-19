/**
 * FriendlyBot Entity
 * Allied AI companion that assists the player.
 * All entity features — AI state, mesh geometry, and combat — grouped in one class.
 */

import * as THREE from "three";
import { GameConfig } from "../config/GameConfig.js";
import { MeshBuilderMixin } from "../utils/MeshBuilder.js";
import { Entity } from "./Entity.js";

export class FriendlyBot extends MeshBuilderMixin(Entity) {
  static _nextId = 0;

  constructor(x, y) {
    super(x, y);
    this.id = `bot_${++FriendlyBot._nextId}`;

    this.health = GameConfig.BOT.HEALTH;
    this.maxHealth = GameConfig.BOT.HEALTH;
    this.speed = GameConfig.BOT.SPEED;

    this.isDead = false;
    this.deathTime = 0;

    // Current high-level command
    this.command = GameConfig.BOT.COMMANDS.FOLLOW;

    // Active behavior state object
    this.stateObject = null;
    this.currentState = null;

    // Movement helpers shared by states
    this.stuckCounter = 0;
    this.searchWanderTarget = null;
    this.searchWanderTime = 0;

    // Combat state
    this.lastAttackTime = 0;
    this.currentTarget = null;

    // Current weapon type chosen by attack range: 'shotgun' | 'pistol' | 'sniper'
    this.weaponType = "pistol";

    // Injected by Game._updateBots — give states access without changing execute signature
    this.eventManager = null;
    this.audioSystem = null;

    // 3D mesh — owned by this entity; set by spawnMesh()
    this.mesh = null;
  }

  /**
   * Assign a new command and its associated behavior state.
   * @param {string} command - One of GameConfig.BOT.COMMANDS
   * @param {BotBehavior} stateObject - Behavior implementing execute()
   */
  setCommand(command, stateObject) {
    if (this.stateObject && typeof this.stateObject.exit === "function") {
      this.stateObject.exit(this);
    }
    this.command = command;
    this.stateObject = stateObject;
    this.currentState = command;
    if (stateObject && typeof stateObject.enter === "function") {
      stateObject.enter(this);
    }
  }

  /**
   * Tick the bot's AI behavior.
   * @param {Player} player
   * @param {Enemy[]} enemies
   * @param {number[][]} map
   * @param {number} deltaTime
   */
  update(player, enemies, map, deltaTime) {
    if (this.isDead) {
      return;
    }
    if (this.stateObject && typeof this.stateObject.execute === "function") {
      this.stateObject.execute(this, player, enemies, map, deltaTime);
    }
  }

  /**
   * Apply damage to this bot.
   * @param {number} amount
   */
  takeDamage(amount) {
    if (this.isDead) {
      return;
    }
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.deathTime = Date.now();
    }
  }

  /**
   * Build the bot mesh into the provided group.
   * Stores weapon sub-group refs in group.userData.weapons for runtime switching.
   * @param {THREE.Group} group
   * @param {{ armor, suit, visor, detail }} mat
   */
  createMesh(group, mat) {
    this.g = group;
    this.mat = mat;
    const { armor, suit, visor, detail } = mat;

    // ── Legs ──────────────────────────────────────────────────────────────
    const legL = this.box(0.13, 0.4, 0.13, suit, -0.12, 0.2, 0);
    const legR = this.box(0.13, 0.4, 0.13, suit, 0.12, 0.2, 0);
    // Knee pads
    this.box(0.14, 0.09, 0.1, armor, -0.12, 0.22, -0.07);
    this.box(0.14, 0.09, 0.1, armor, 0.12, 0.22, -0.07);
    // Boots
    this.box(0.15, 0.1, 0.2, armor, -0.12, 0.02, -0.02);
    this.box(0.15, 0.1, 0.2, armor, 0.12, 0.02, -0.02);
    // Boot sole ridge
    this.box(0.16, 0.03, 0.22, detail, -0.12, -0.02, -0.02);
    this.box(0.16, 0.03, 0.22, detail, 0.12, -0.02, -0.02);

    // ── Torso ─────────────────────────────────────────────────────────────
    // Abdomen (suit)
    this.box(0.28, 0.16, 0.2, suit, 0, 0.42, 0);
    // Belt / ammo pouches
    this.box(0.3, 0.07, 0.22, detail, 0, 0.37, 0);
    this.box(0.07, 0.07, 0.06, detail, -0.12, 0.37, -0.1);
    this.box(0.07, 0.07, 0.06, detail, 0.0, 0.37, -0.11);
    // Main armour plate (chest)
    this.box(0.34, 0.38, 0.22, armor, 0, 0.6, 0);
    // Chest detail — central plate with ridge
    this.box(0.14, 0.28, 0.04, detail, 0, 0.62, -0.12);
    // Side armour panels
    this.box(0.06, 0.3, 0.16, detail, -0.2, 0.6, 0);
    this.box(0.06, 0.3, 0.16, detail, 0.2, 0.6, 0);
    // Upper chest / collar
    this.box(0.3, 0.12, 0.2, armor, 0, 0.79, 0);

    // ── Shoulder pads ────────────────────────────────────────────────────
    this.box(0.15, 0.14, 0.16, detail, -0.27, 0.77, 0);
    this.box(0.15, 0.14, 0.16, detail, 0.27, 0.77, 0);
    // Shoulder bolt details
    this.sphere(0.025, detail, -0.31, 0.8, -0.06, 6);
    this.sphere(0.025, detail, 0.31, 0.8, -0.06, 6);

    // ── Neck ─────────────────────────────────────────────────────────────
    this.cyl(0.07, 0.09, 0.12, suit, 0, 0.9, 0);

    // ── Helmet ────────────────────────────────────────────────────────────
    this.sphere(0.22, armor, 0, 1.06, 0, 16);
    // Helmet ridge (top)
    this.box(0.06, 0.06, 0.32, detail, 0, 1.24, 0);
    // Chin guard
    this.box(0.2, 0.07, 0.08, armor, 0, 0.88, 0.18);
    // Visor slit — emissive glow
    this.box(0.26, 0.07, 0.04, visor, 0, 1.06, -0.21);
    // Side vents
    this.box(0.04, 0.08, 0.1, detail, -0.2, 1.06, -0.1);
    this.box(0.04, 0.08, 0.1, detail, 0.2, 1.06, -0.1);

    // ── Arms ──────────────────────────────────────────────────────────────
    const armL = this.box(0.11, 0.36, 0.11, suit, -0.27, 0.57, 0);
    const armR = this.box(0.11, 0.36, 0.11, suit, 0.27, 0.57, 0);
    // Elbow pads
    this.sphere(0.07, armor, -0.27, 0.42, 0, 10);
    this.sphere(0.07, armor, 0.27, 0.42, 0, 10);
    // Forearms
    this.box(0.1, 0.26, 0.1, suit, -0.27, 0.3, 0);
    this.box(0.1, 0.26, 0.1, suit, 0.27, 0.3, 0);
    // Gloves
    this.sphere(0.08, detail, -0.27, 0.17, 0, 10);
    this.sphere(0.08, detail, 0.27, 0.17, 0, 10);

    // ── Weapon meshes (right hand, only one visible at a time) ─────────────
    // Pistol — compact tactical handgun
    const gunPistol = new THREE.Group();
    const pistolBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.065, 0.19),
      new THREE.MeshStandardMaterial({
        color: 0x444455,
        roughness: 0.55,
        metalness: 0.7,
      }),
    );
    pistolBody.position.set(0, 0, -0.09);
    const pistolGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.11, 0.055),
      new THREE.MeshStandardMaterial({
        color: 0x222230,
        roughness: 0.9,
        metalness: 0.1,
      }),
    );
    pistolGrip.position.set(0, -0.08, 0.02);
    const pistolBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.08, 8),
      new THREE.MeshStandardMaterial({
        color: 0x888899,
        roughness: 0.25,
        metalness: 0.9,
      }),
    );
    pistolBarrel.rotation.x = Math.PI / 2;
    pistolBarrel.position.set(0, 0.012, -0.2);
    gunPistol.add(pistolBody, pistolGrip, pistolBarrel);
    gunPistol.position.set(0.27, 0.17, -0.12);
    group.add(gunPistol);

    // Shotgun — pump-action
    const gunShotgun = new THREE.Group();
    const sgBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.07, 0.28),
      new THREE.MeshStandardMaterial({
        color: 0x3a2810,
        roughness: 0.9,
        metalness: 0.05,
      }),
    );
    sgBody.position.set(0, 0, -0.14);
    const sgBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.027, 0.027, 0.24, 8),
      new THREE.MeshStandardMaterial({
        color: 0x555566,
        roughness: 0.35,
        metalness: 0.75,
      }),
    );
    sgBarrel.rotation.x = Math.PI / 2;
    sgBarrel.position.set(0, 0.04, -0.15);
    const sgPump = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.05, 0.09),
      new THREE.MeshStandardMaterial({
        color: 0x5a3a18,
        roughness: 0.88,
        metalness: 0.0,
      }),
    );
    sgPump.position.set(0, -0.02, -0.08);
    gunShotgun.add(sgBody, sgBarrel, sgPump);
    gunShotgun.position.set(0.27, 0.17, -0.12);
    gunShotgun.visible = false;
    group.add(gunShotgun);

    // Sniper — long precision rifle
    const gunSniper = new THREE.Group();
    const snBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.058, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a2a,
        roughness: 0.7,
        metalness: 0.4,
      }),
    );
    snBody.position.set(0, 0, -0.2);
    const snBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.34, 8),
      new THREE.MeshStandardMaterial({
        color: 0x444455,
        roughness: 0.28,
        metalness: 0.85,
      }),
    );
    snBarrel.rotation.x = Math.PI / 2;
    snBarrel.position.set(0, 0.034, -0.24);
    const snScope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.1, 8),
      new THREE.MeshStandardMaterial({
        color: 0x080810,
        roughness: 0.4,
        metalness: 0.6,
      }),
    );
    snScope.rotation.x = Math.PI / 2;
    snScope.position.set(0, 0.042, -0.1);
    const snScopeLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 8),
      new THREE.MeshStandardMaterial({
        color: 0x334488,
        roughness: 0.05,
        metalness: 0.2,
        transparent: true,
        opacity: 0.7,
        emissive: new THREE.Color(0x112244),
        emissiveIntensity: 0.5,
      }),
    );
    snScopeLens.position.set(0, 0.042, -0.052);
    gunSniper.add(snBody, snBarrel, snScope, snScopeLens);
    gunSniper.position.set(0.27, 0.17, -0.12);
    gunSniper.visible = false;
    group.add(gunSniper);

    // ── Walk animation ────────────────────────────────────────────────────
    group.userData.animate = (t) => {
      const swing = Math.sin(t * 3) * 0.3;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.5;
      armR.rotation.x = swing * 0.5;
    };

    // Weapon refs for runtime switching
    group.userData.weapons = {
      pistol: gunPistol,
      shotgun: gunShotgun,
      sniper: gunSniper,
    };

    // Tiny light marker above the head so bots are visible in dark areas
    const indicator = new THREE.PointLight(0x00ff88, 0.6, 1.5);
    indicator.position.set(0, 1.4, 0);
    group.add(indicator);
  }

  // ─── 3D Mesh Lifecycle ────────────────────────────────────────────────────

  /**
   * Build and add this bot's 3D mesh to the given group.
   * @param {THREE.Group} group
   * @param {Object} mat - Material palette
   */
  spawnMesh(group, mat) {
    const g = new THREE.Group();
    this.createMesh(g, mat);
    this.mesh = g;
    group.add(g);
  }

  /**
   * Sync position, rotation, animation and weapon visibility each frame.
   * @param {number} t - time in seconds
   */
  updateMesh(t) {
    if (!this.mesh) {
      return;
    }
    this.mesh.position.set(this.x, 0, this.y);
    this.mesh.rotation.y = -Math.PI / 2 - this.angle;
    if (this.mesh.userData.animate) {
      this.mesh.userData.animate(t);
    }
    if (this.mesh.userData.weapons) {
      const wt = this.weaponType ?? "pistol";
      for (const [key, wMesh] of Object.entries(this.mesh.userData.weapons)) {
        wMesh.visible = key === wt;
      }
    }
  }

  /**
   * Remove this bot's mesh from the group and clear the reference.
   * @param {THREE.Group} group
   */
  removeMesh(group) {
    if (this.mesh) {
      group.remove(this.mesh);
      this.mesh = null;
    }
  }
}

export default FriendlyBot;
