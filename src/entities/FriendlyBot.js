/**
 * FriendlyBot Entity
 * Allied AI companion that assists the player.
 * All entity features — AI state, mesh geometry, and combat — grouped in one class.
 */

import * as THREE from "three";
import { GameConfig } from "../config/GameConfig.js";
import { MeshBuilderMixin } from "../utils/MeshBuilder.js";

export class FriendlyBot extends MeshBuilderMixin(class {}) {
  static _nextId = 0;

  constructor(x, y) {
    super();
    this.id = `bot_${++FriendlyBot._nextId}`;
    this.x = x;
    this.y = y;

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

    // Facing angle (radians) — used by renderer
    this.angle = 0;

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

  distanceTo(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  angleTo(x, y) {
    return Math.atan2(y - this.y, x - this.x);
  }

  isAlive() {
    return !this.isDead;
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

    // Torso (armored)
    this.box(0.32, 0.42, 0.22, armor, 0, 0.56, 0);
    // Shoulder pads
    this.box(0.14, 0.12, 0.14, detail, -0.26, 0.74, 0);
    this.box(0.14, 0.12, 0.14, detail, 0.26, 0.74, 0);
    // Helmet
    this.sphere(0.2, armor, 0, 1.0, 0, 10);
    // Visor slit
    this.box(0.24, 0.06, 0.04, visor, 0, 1.01, -0.18);
    // Arms
    const armL = this.box(0.11, 0.34, 0.11, suit, -0.26, 0.53, 0);
    const armR = this.box(0.11, 0.34, 0.11, suit, 0.26, 0.53, 0);
    // Hands
    this.sphere(0.08, detail, -0.26, 0.35, 0, 6);
    this.sphere(0.08, detail, 0.26, 0.35, 0, 6);

    // ── Weapon meshes (right hand, only one visible at a time) ──
    // Pistol — compact gray block
    const gunPistol = new THREE.Group();
    const pistolBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.18),
      new THREE.MeshLambertMaterial({ color: 0x555566 }),
    );
    pistolBody.position.set(0, 0, -0.09);
    const pistolGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.1, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x333344 }),
    );
    pistolGrip.position.set(0, -0.07, 0);
    gunPistol.add(pistolBody, pistolGrip);
    gunPistol.position.set(0.26, 0.34, -0.14);
    group.add(gunPistol);

    // Shotgun — wide short barrel
    const gunShotgun = new THREE.Group();
    const sgBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.07, 0.26),
      new THREE.MeshLambertMaterial({ color: 0x4a3520 }),
    );
    sgBody.position.set(0, 0, -0.13);
    const sgBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6),
      new THREE.MeshLambertMaterial({ color: 0x666666 }),
    );
    sgBarrel.rotation.x = Math.PI / 2;
    sgBarrel.position.set(0, 0.04, -0.14);
    gunShotgun.add(sgBody, sgBarrel);
    gunShotgun.position.set(0.26, 0.34, -0.14);
    gunShotgun.visible = false;
    group.add(gunShotgun);

    // Sniper — long dark barrel
    const gunSniper = new THREE.Group();
    const snBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.055, 0.38),
      new THREE.MeshLambertMaterial({ color: 0x222233 }),
    );
    snBody.position.set(0, 0, -0.19);
    const snBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.32, 6),
      new THREE.MeshLambertMaterial({ color: 0x444444 }),
    );
    snBarrel.rotation.x = Math.PI / 2;
    snBarrel.position.set(0, 0.035, -0.22);
    const snScope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.08, 6),
      new THREE.MeshLambertMaterial({ color: 0x111111 }),
    );
    snScope.rotation.x = Math.PI / 2;
    snScope.position.set(0, 0.04, -0.1);
    gunSniper.add(snBody, snBarrel, snScope);
    gunSniper.position.set(0.26, 0.34, -0.14);
    gunSniper.visible = false;
    group.add(gunSniper);

    // Legs
    const legL = this.box(0.13, 0.38, 0.13, suit, -0.12, 0.19, 0);
    const legR = this.box(0.13, 0.38, 0.13, suit, 0.12, 0.19, 0);
    // Boots
    this.box(0.14, 0.08, 0.18, armor, -0.12, 0.02, -0.02);
    this.box(0.14, 0.08, 0.18, armor, 0.12, 0.02, -0.02);
    // Belt detail
    this.box(0.32, 0.05, 0.22, detail, 0, 0.37, 0);

    // Walk animation
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
